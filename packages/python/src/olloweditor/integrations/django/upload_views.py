from __future__ import annotations

import contextlib
from typing import Any

from django.core.files.storage import default_storage
from django.http import HttpRequest, HttpResponse, JsonResponse

from olloweditor.uploads import (
    UploadValidationError,
    error_payload,
    gallery_payload,
    save_gallery_uploads,
    save_validated_upload,
    single_file_payload,
    validate_attachment_upload,
    validate_gallery_count,
    validate_image_upload,
)

from .settings import get_olloweditor_upload_settings


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
    try:
        validate_gallery_count(len(files), config.max_gallery_files)
        validated_files = [
            validate_image_upload(
                uploaded_file,
                filename=str(getattr(uploaded_file, "name", "")),
                file_size=int(getattr(uploaded_file, "size", 0)),
                content_type=getattr(uploaded_file, "content_type", None),
                config=config,
            )
            for uploaded_file in files
        ]
    except UploadValidationError as exc:
        return _error_response(exc.code, exc.message, status=exc.status)

    try:
        uploads = save_gallery_uploads(
            validated_files,
            config=config,
            storage=_DjangoUploadStorage(),
        )
    except UploadValidationError as exc:
        return _error_response(exc.code, exc.message, status=exc.status)

    return JsonResponse(gallery_payload(uploads))


def upload_attachment_view(request: HttpRequest) -> HttpResponse:
    return _handle_single_upload(request, upload_type="attachment", file_key="file")


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
            validated = validate_attachment_upload(
                uploaded_file,
                filename=str(getattr(uploaded_file, "name", "")),
                file_size=int(getattr(uploaded_file, "size", 0)),
                content_type=getattr(uploaded_file, "content_type", None),
                config=config,
            )
        else:
            validated = validate_image_upload(
                uploaded_file,
                filename=str(getattr(uploaded_file, "name", "")),
                file_size=int(getattr(uploaded_file, "size", 0)),
                content_type=getattr(uploaded_file, "content_type", None),
                config=config,
            )
    except UploadValidationError as exc:
        return _error_response(exc.code, exc.message, status=exc.status)

    try:
        upload = save_validated_upload(
            validated,
            upload_type=upload_type,
            config=config,
            storage=_DjangoUploadStorage(),
        )
    except UploadValidationError as exc:
        return _error_response(exc.code, exc.message, status=exc.status)

    return JsonResponse(single_file_payload(upload_type, upload))


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


def _error_response(code: str, message: str, *, status: int) -> JsonResponse:
    return JsonResponse(error_payload(code, message), status=status)


class _DjangoUploadStorage:
    def save(
        self,
        *,
        file: Any,
        path: str,
        content_type: str | None,
    ) -> str:
        del content_type
        saved_name = default_storage.save(path, file)
        return default_storage.url(saved_name)

    def delete(self, path: str) -> None:
        with contextlib.suppress(Exception):
            default_storage.delete(path)
