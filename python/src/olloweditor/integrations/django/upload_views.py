from __future__ import annotations

import contextlib
import warnings
from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import Any

from django.core.files.storage import default_storage
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.text import get_valid_filename
from PIL import Image, UnidentifiedImageError

from .settings import get_allowed_image_formats, get_olloweditor_upload_settings


@dataclass(frozen=True)
class ValidatedUpload:
    extension: str
    file_size: int
    file_obj: Any
    name: str


def upload_image_view(request: HttpRequest) -> HttpResponse:
    return _handle_single_upload(request, upload_type="image", file_key="file")


def upload_gallery_view(request: HttpRequest) -> HttpResponse:
    if request.method != "POST":
        return _error_response(
            "method_not_allowed",
            "Only POST requests are allowed.",
            status=405,
        )

    config = get_olloweditor_upload_settings()
    if not config.uploads_enabled:
        return _error_response(
            "uploads_disabled",
            "OllowEditor uploads are disabled.",
            status=403,
        )

    auth_error = _authorize_request(
        request,
        config.upload_require_login,
        config.upload_permission,
    )
    if auth_error is not None:
        return auth_error

    files = request.FILES.getlist("files")
    if not files:
        return _error_response(
            "missing_file",
            "Select at least one image.",
            status=400,
        )
    if len(files) > config.max_gallery_files:
        return _error_response(
            "too_many_files",
            f"You can upload at most {config.max_gallery_files} images at once.",
            status=400,
        )

    try:
        validated_files = [
            _validate_image_upload(uploaded_file, config) for uploaded_file in files
        ]
    except UploadValidationError as exc:
        return _error_response(exc.code, exc.message, status=exc.status)

    saved_names: list[str] = []
    response_files: list[dict[str, object]] = []
    try:
        for validated in validated_files:
            saved_name = _save_validated_upload(validated, "gallery", config)
            saved_names.append(saved_name)
            response_files.append(
                {
                    "name": validated.name,
                    "size": validated.file_size,
                    "url": default_storage.url(saved_name),
                }
            )
    except Exception:
        _cleanup_saved_files(saved_names)
        return _error_response(
            "storage_failure",
            "The uploaded files could not be stored.",
            status=500,
        )

    return JsonResponse(
        {
            "success": True,
            "type": "gallery",
            "files": response_files,
        }
    )


def upload_attachment_view(request: HttpRequest) -> HttpResponse:
    return _handle_single_upload(request, upload_type="attachment", file_key="file")


class UploadValidationError(Exception):
    def __init__(self, code: str, message: str, *, status: int = 400) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


def _handle_single_upload(
    request: HttpRequest,
    *,
    upload_type: str,
    file_key: str,
) -> HttpResponse:
    if request.method != "POST":
        return _error_response(
            "method_not_allowed",
            "Only POST requests are allowed.",
            status=405,
        )

    config = get_olloweditor_upload_settings()
    if not config.uploads_enabled:
        return _error_response(
            "uploads_disabled",
            "OllowEditor uploads are disabled.",
            status=403,
        )

    auth_error = _authorize_request(
        request, config.upload_require_login, config.upload_permission
    )
    if auth_error is not None:
        return auth_error

    uploaded_file = request.FILES.get(file_key)
    if upload_type == "image" and uploaded_file is None:
        uploaded_file = request.FILES.get("image")
    if uploaded_file is None:
        return _error_response(
            "missing_file",
            "A file is required.",
            status=400,
        )

    try:
        if upload_type == "attachment":
            validated = _validate_attachment_upload(uploaded_file, config)
        else:
            validated = _validate_image_upload(uploaded_file, config)
    except UploadValidationError as exc:
        return _error_response(exc.code, exc.message, status=exc.status)

    try:
        saved_name = _save_validated_upload(validated, upload_type, config)
        file_url = default_storage.url(saved_name)
    except Exception:
        return _error_response(
            "storage_failure",
            "The uploaded file could not be stored.",
            status=500,
        )

    return JsonResponse(
        {
            "success": True,
            "type": upload_type,
            "url": file_url,
            "name": validated.name,
            "size": validated.file_size,
        }
    )


def _authorize_request(
    request: HttpRequest, require_login: bool, permission: str | None
) -> HttpResponse | None:
    user = request.user
    if require_login and not user.is_authenticated:
        return _error_response(
            "authentication_required",
            "You must be logged in to upload files.",
            status=401,
        )
    if permission and not user.has_perm(permission):
        return _error_response(
            "permission_denied",
            "You do not have permission to upload files.",
            status=403,
        )
    return None


def _validate_image_upload(uploaded_file: Any, config: Any) -> ValidatedUpload:
    _validate_non_empty_file(uploaded_file)
    if uploaded_file.size > config.max_image_size:
        raise UploadValidationError(
            "file_too_large",
            f"Images must be {config.max_image_size} bytes or smaller.",
            status=413,
        )

    extension = _extract_extension(uploaded_file.name)
    if extension not in config.allowed_image_extensions:
        raise UploadValidationError(
            "invalid_file_type",
            "This image type is not allowed.",
            status=400,
        )

    expected_format = get_allowed_image_formats(config)[extension]
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(uploaded_file) as image:
                image.verify()
        uploaded_file.seek(0)
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(uploaded_file) as image:
                if image.format != expected_format:
                    raise UploadValidationError(
                        "invalid_file_type",
                        "The uploaded image content does not match its extension.",
                        status=400,
                    )
                width, height = image.size
                if width * height > config.max_image_pixels:
                    raise UploadValidationError(
                        "image_too_large",
                        "The uploaded image exceeds the maximum pixel count.",
                        status=413,
                    )
    except UploadValidationError:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise UploadValidationError(
            "image_too_large",
            "The uploaded image exceeds the maximum pixel count.",
            status=413,
        ) from None
    except (UnidentifiedImageError, OSError):
        raise UploadValidationError(
            "invalid_image",
            "The uploaded file is not a valid image.",
            status=400,
        ) from None
    finally:
        with contextlib.suppress(Exception):
            uploaded_file.seek(0)

    return ValidatedUpload(
        extension=extension,
        file_size=int(uploaded_file.size),
        file_obj=uploaded_file,
        name=_build_safe_display_name(uploaded_file.name, extension),
    )


def _validate_attachment_upload(uploaded_file: Any, config: Any) -> ValidatedUpload:
    _validate_non_empty_file(uploaded_file)
    if uploaded_file.size > config.max_attachment_size:
        raise UploadValidationError(
            "file_too_large",
            f"Attachments must be {config.max_attachment_size} bytes or smaller.",
            status=413,
        )

    extension = _extract_extension(uploaded_file.name)
    if extension not in config.allowed_attachment_extensions:
        raise UploadValidationError(
            "invalid_file_type",
            "This file type is not allowed.",
            status=400,
        )

    return ValidatedUpload(
        extension=extension,
        file_size=int(uploaded_file.size),
        file_obj=uploaded_file,
        name=_build_safe_display_name(uploaded_file.name, extension),
    )


def _validate_non_empty_file(uploaded_file: Any) -> None:
    if uploaded_file is None:
        raise UploadValidationError(
            "missing_file",
            "A file is required.",
            status=400,
        )
    if not getattr(uploaded_file, "size", 0):
        raise UploadValidationError(
            "empty_file",
            "The uploaded file is empty.",
            status=400,
        )


def _extract_extension(filename: str) -> str:
    name = PurePosixPath(str(filename).replace("\\", "/")).name
    suffix = PurePosixPath(name).suffix.lower().lstrip(".")
    if not suffix:
        raise UploadValidationError(
            "invalid_file_type",
            "This file type is not allowed.",
            status=400,
        )
    return suffix


def _build_safe_display_name(filename: str, extension: str) -> str:
    basename = PurePosixPath(str(filename).replace("\\", "/")).name
    stem = PurePosixPath(basename).stem or "file"
    safe_stem = get_valid_filename(stem) or "file"
    return f"{safe_stem}.{extension.lower()}"


def _save_validated_upload(
    validated: ValidatedUpload,
    upload_type: str,
    config: Any,
) -> str:
    validated.file_obj.seek(0)
    storage_name = config.build_storage_name(upload_type, validated.extension)
    return default_storage.save(storage_name, validated.file_obj)


def _cleanup_saved_files(saved_names: list[str]) -> None:
    for name in saved_names:
        with contextlib.suppress(Exception):
            default_storage.delete(name)


def _error_response(code: str, message: str, *, status: int) -> JsonResponse:
    return JsonResponse(
        {
            "success": False,
            "error": {
                "code": code,
                "message": message,
            },
        },
        status=status,
    )
