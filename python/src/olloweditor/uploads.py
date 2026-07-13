from __future__ import annotations

import contextlib
import os
import shutil
import warnings
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path, PurePosixPath
from typing import IO, BinaryIO, Protocol
from urllib.parse import urlparse
from uuid import uuid4

_DEFAULT_ALLOWED_IMAGE_EXTENSIONS = ("jpg", "jpeg", "png", "gif", "webp")
_DEFAULT_ALLOWED_ATTACHMENT_EXTENSIONS = (
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "zip",
)
_DANGEROUS_ATTACHMENT_EXTENSIONS = {
    "bat",
    "cmd",
    "dll",
    "exe",
    "htm",
    "html",
    "jar",
    "js",
    "mjs",
    "php",
    "py",
    "sh",
    "svg",
}
_IMAGE_FORMAT_EXTENSIONS = {
    "gif": "GIF",
    "jpg": "JPEG",
    "jpeg": "JPEG",
    "png": "PNG",
    "webp": "WEBP",
}


class UploadStorageProtocol(Protocol):
    def save(
        self,
        *,
        file: IO[bytes],
        path: str,
        content_type: str | None,
    ) -> str: ...

    def delete(self, path: str) -> None: ...


class UploadConfigProtocol(Protocol):
    @property
    def max_image_size(self) -> int: ...

    @property
    def max_gallery_files(self) -> int: ...

    @property
    def max_attachment_size(self) -> int: ...

    @property
    def max_image_pixels(self) -> int: ...

    @property
    def allowed_image_extensions(self) -> tuple[str, ...]: ...

    @property
    def allowed_attachment_extensions(self) -> tuple[str, ...]: ...

    def build_storage_name(self, setting_name: str, extension: str) -> str: ...


@dataclass(frozen=True)
class GenericUploadSettings:
    image_upload_path: str = "olloweditor/images/%Y/%m/"
    gallery_upload_path: str = "olloweditor/gallery/%Y/%m/"
    attachment_upload_path: str = "olloweditor/attachments/%Y/%m/"
    max_image_size: int = 10 * 1024 * 1024
    max_gallery_files: int = 20
    max_attachment_size: int = 25 * 1024 * 1024
    max_image_pixels: int = 40_000_000
    allowed_image_extensions: tuple[str, ...] = _DEFAULT_ALLOWED_IMAGE_EXTENSIONS
    allowed_attachment_extensions: tuple[str, ...] = (
        _DEFAULT_ALLOWED_ATTACHMENT_EXTENSIONS
    )

    def build_storage_name(self, setting_name: str, extension: str) -> str:
        directory = self.resolve_storage_directory(setting_name)
        return str(PurePosixPath(directory, f"{uuid4().hex}.{extension.lower()}"))

    def resolve_storage_directory(self, setting_name: str) -> str:
        template = {
            "attachment": self.attachment_upload_path,
            "gallery": self.gallery_upload_path,
            "image": self.image_upload_path,
        }[setting_name]
        rendered = datetime.now().astimezone().strftime(template)
        return validate_relative_upload_path(rendered)


@dataclass(frozen=True)
class ValidatedUpload:
    content_type: str | None
    extension: str
    file_obj: IO[bytes]
    file_size: int
    name: str


@dataclass(frozen=True)
class StoredUpload:
    name: str
    size: int
    storage_path: str
    url: str


class UploadValidationError(Exception):
    def __init__(self, code: str, message: str, *, status: int = 400) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


class LocalFilesystemUploadStorage:
    def __init__(self, *, root_dir: str | os.PathLike[str], base_url: str) -> None:
        self.root_dir = Path(root_dir).expanduser().resolve()
        self.base_url = _normalize_public_base_url(base_url)

    def save(
        self,
        *,
        file: BinaryIO,
        path: str,
        content_type: str | None,
    ) -> str:
        del content_type
        relative_path = validate_relative_upload_path(path)
        destination = self.root_dir / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        file.seek(0)
        with destination.open("wb") as output:
            shutil.copyfileobj(file, output)
        return _join_public_url(self.base_url, relative_path)

    def delete(self, path: str) -> None:
        relative_path = validate_relative_upload_path(path)
        destination = self.root_dir / relative_path
        with contextlib.suppress(FileNotFoundError):
            destination.unlink()


def validate_relative_upload_path(path: str) -> str:
    if not isinstance(path, str) or not path.strip():
        raise UploadValidationError(
            "invalid_path",
            "Upload paths must be non-empty strings.",
            status=500,
        )

    normalized = path.strip().replace("\\", "/").strip("/")
    candidate = PurePosixPath(normalized)
    if candidate.is_absolute() or any(
        part in {"", ".", ".."} for part in candidate.parts
    ):
        raise UploadValidationError(
            "invalid_path",
            "Upload paths must be relative and traversal-free.",
            status=500,
        )
    return normalized


def validate_gallery_count(file_count: int, max_gallery_files: int) -> None:
    if file_count <= 0:
        raise UploadValidationError(
            "missing_file",
            "Select at least one image.",
            status=400,
        )
    if file_count > max_gallery_files:
        raise UploadValidationError(
            "too_many_files",
            f"You can upload at most {max_gallery_files} images at once.",
            status=400,
        )


def validate_image_upload(
    file_obj: IO[bytes],
    *,
    filename: str,
    file_size: int,
    content_type: str | None,
    config: UploadConfigProtocol,
) -> ValidatedUpload:
    validate_non_empty_file(file_size)
    if file_size > config.max_image_size:
        raise UploadValidationError(
            "file_too_large",
            f"Images must be {config.max_image_size} bytes or smaller.",
            status=413,
        )

    extension = extract_extension(filename)
    if extension not in config.allowed_image_extensions:
        raise UploadValidationError(
            "invalid_file_type",
            "This image type is not allowed.",
            status=400,
        )

    expected_format = _IMAGE_FORMAT_EXTENSIONS[extension]
    Image, UnidentifiedImageError = _load_pillow()
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(file_obj) as image:
                image.verify()
        file_obj.seek(0)
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(file_obj) as image:
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
            file_obj.seek(0)

    return ValidatedUpload(
        content_type=content_type,
        extension=extension,
        file_obj=file_obj,
        file_size=file_size,
        name=build_safe_display_name(filename, extension),
    )


def validate_attachment_upload(
    file_obj: IO[bytes],
    *,
    filename: str,
    file_size: int,
    content_type: str | None,
    config: UploadConfigProtocol,
) -> ValidatedUpload:
    validate_non_empty_file(file_size)
    if file_size > config.max_attachment_size:
        raise UploadValidationError(
            "file_too_large",
            f"Attachments must be {config.max_attachment_size} bytes or smaller.",
            status=413,
        )

    extension = extract_extension(filename)
    if extension not in config.allowed_attachment_extensions:
        raise UploadValidationError(
            "invalid_file_type",
            "This file type is not allowed.",
            status=400,
        )

    return ValidatedUpload(
        content_type=content_type,
        extension=extension,
        file_obj=file_obj,
        file_size=file_size,
        name=build_safe_display_name(filename, extension),
    )


def save_validated_upload(
    validated: ValidatedUpload,
    *,
    upload_type: str,
    config: UploadConfigProtocol,
    storage: UploadStorageProtocol,
) -> StoredUpload:
    storage_path = config.build_storage_name(upload_type, validated.extension)
    validated.file_obj.seek(0)
    url = storage.save(
        file=validated.file_obj,
        path=storage_path,
        content_type=validated.content_type,
    )
    return StoredUpload(
        name=validated.name,
        size=validated.file_size,
        storage_path=storage_path,
        url=url,
    )


def save_gallery_uploads(
    validated_files: list[ValidatedUpload],
    *,
    config: UploadConfigProtocol,
    storage: UploadStorageProtocol,
) -> list[StoredUpload]:
    saved: list[StoredUpload] = []
    try:
        for validated in validated_files:
            saved.append(
                save_validated_upload(
                    validated,
                    upload_type="gallery",
                    config=config,
                    storage=storage,
                )
            )
    except Exception as exc:
        cleanup_stored_uploads(saved, storage=storage)
        if isinstance(exc, UploadValidationError):
            raise
        raise UploadValidationError(
            "storage_failure",
            "The uploaded files could not be stored.",
            status=500,
        ) from exc
    return saved


def cleanup_stored_uploads(
    uploads: list[StoredUpload],
    *,
    storage: UploadStorageProtocol,
) -> None:
    for upload in uploads:
        with contextlib.suppress(Exception):
            storage.delete(upload.storage_path)


def validate_non_empty_file(file_size: int) -> None:
    if file_size <= 0:
        raise UploadValidationError(
            "empty_file",
            "The uploaded file is empty.",
            status=400,
        )


def extract_extension(filename: str) -> str:
    name = PurePosixPath(str(filename).replace("\\", "/")).name
    suffix = PurePosixPath(name).suffix.lower().lstrip(".")
    if not suffix:
        raise UploadValidationError(
            "invalid_file_type",
            "This file type is not allowed.",
            status=400,
        )
    return suffix


def build_safe_display_name(filename: str, extension: str) -> str:
    basename = PurePosixPath(str(filename).replace("\\", "/")).name
    stem = PurePosixPath(basename).stem or "file"
    safe_stem = "".join(
        character
        for character in stem
        if character.isalnum() or character in {"-", "_", " "}
    ).strip()
    if not safe_stem:
        safe_stem = "file"
    return f"{safe_stem}.{extension.lower()}"


def build_upload_options(
    *,
    image_url: str,
    gallery_url: str,
    attachment_url: str,
    csrf_header_name: str = "X-CSRFToken",
    csrf_header_value: str | None = None,
) -> dict[str, object]:
    upload: dict[str, object] = {
        "allowBase64": False,
        "allowFallback": False,
        "attachmentUrl": attachment_url,
        "galleryUrl": gallery_url,
        "imageUrl": image_url,
    }
    if csrf_header_name:
        upload["csrfHeaderName"] = csrf_header_name
    if csrf_header_value:
        upload["csrfHeaderValue"] = csrf_header_value
    return {"upload": upload}


def error_payload(code: str, message: str) -> dict[str, object]:
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
    }


def single_file_payload(upload_type: str, upload: StoredUpload) -> dict[str, object]:
    return {
        "success": True,
        "type": upload_type,
        "url": upload.url,
        "name": upload.name,
        "size": upload.size,
    }


def gallery_payload(uploads: list[StoredUpload]) -> dict[str, object]:
    return {
        "success": True,
        "type": "gallery",
        "files": [
            {
                "url": upload.url,
                "name": upload.name,
                "size": upload.size,
            }
            for upload in uploads
        ],
    }


def _normalize_public_base_url(value: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Public media URL must be a non-empty string.")
    trimmed = value.strip()
    parsed = urlparse(trimmed)
    if parsed.scheme or parsed.netloc:
        return trimmed.rstrip("/") + "/"
    if not trimmed.startswith("/"):
        trimmed = f"/{trimmed}"
    return trimmed.rstrip("/") + "/"


def _join_public_url(base_url: str, relative_path: str) -> str:
    parsed = urlparse(base_url)
    normalized_path = relative_path.replace("\\", "/").lstrip("/")
    if parsed.scheme or parsed.netloc:
        return f"{base_url.rstrip('/')}/{normalized_path}"
    return f"{base_url}{normalized_path}"


def _load_pillow():
    try:
        from PIL import Image, UnidentifiedImageError
    except ModuleNotFoundError as exc:  # pragma: no cover
        raise RuntimeError(
            "Image validation requires Pillow. Install the relevant integration "
            'extra, such as `pip install "olloweditor[django]"`.'
        ) from exc
    return Image, UnidentifiedImageError
