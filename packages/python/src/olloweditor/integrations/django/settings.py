from __future__ import annotations

from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import Any
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.urls import NoReverseMatch, reverse
from django.utils import timezone

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

_DEFAULTS: dict[str, Any] = {
    "UPLOADS_ENABLED": False,
    "UPLOAD_REQUIRE_LOGIN": True,
    "UPLOAD_PERMISSION": None,
    "IMAGE_UPLOAD_PATH": "olloweditor/images/%Y/%m/",
    "GALLERY_UPLOAD_PATH": "olloweditor/gallery/%Y/%m/",
    "ATTACHMENT_UPLOAD_PATH": "olloweditor/attachments/%Y/%m/",
    "MAX_IMAGE_SIZE": 10 * 1024 * 1024,
    "MAX_GALLERY_FILES": 20,
    "MAX_ATTACHMENT_SIZE": 25 * 1024 * 1024,
    "MAX_IMAGE_PIXELS": 40_000_000,
    "ALLOWED_IMAGE_EXTENSIONS": [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
    ],
    "ALLOWED_ATTACHMENT_EXTENSIONS": [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "zip",
    ],
    "ALLOW_BASE64_UPLOADS": False,
}


@dataclass(frozen=True)
class OllowEditorUploadSettings:
    uploads_enabled: bool
    upload_require_login: bool
    upload_permission: str | None
    image_upload_path: str
    gallery_upload_path: str
    attachment_upload_path: str
    max_image_size: int
    max_gallery_files: int
    max_attachment_size: int
    max_image_pixels: int
    allowed_image_extensions: tuple[str, ...]
    allowed_attachment_extensions: tuple[str, ...]
    allow_base64_uploads: bool

    def resolve_storage_directory(self, setting_name: str) -> str:
        template = {
            "attachment": self.attachment_upload_path,
            "gallery": self.gallery_upload_path,
            "image": self.image_upload_path,
        }[setting_name]
        rendered = timezone.localtime(timezone.now()).strftime(template)
        return _validate_relative_path(rendered, f"{setting_name.upper()}_UPLOAD_PATH")

    def build_storage_name(self, setting_name: str, extension: str) -> str:
        directory = self.resolve_storage_directory(setting_name)
        filename = f"{uuid4().hex}.{extension.lower()}"
        return str(PurePosixPath(directory, filename))

    def build_widget_upload_options(self) -> dict[str, object]:
        if not self.uploads_enabled:
            return {}
        try:
            return {
                "upload": {
                    "allowBase64": self.allow_base64_uploads,
                    "allowFallback": False,
                    "attachmentUrl": reverse("olloweditor:upload_attachment"),
                    "galleryUrl": reverse("olloweditor:upload_gallery"),
                    "imageUrl": reverse("olloweditor:upload_image"),
                }
            }
        except NoReverseMatch as exc:
            raise ImproperlyConfigured(
                "OllowEditor uploads are enabled but the package URLs are not "
                'included. Add `path("olloweditor/", '
                'include("olloweditor.integrations.django.urls"))` to your '
                "project URLconf."
            ) from exc


def get_olloweditor_upload_settings() -> OllowEditorUploadSettings:
    raw = getattr(settings, "OLLOWEDITOR", {})
    if raw is None:
        raw = {}
    if not isinstance(raw, dict):
        raise ImproperlyConfigured("OLLOWEDITOR must be a dictionary when configured.")

    unknown = sorted(set(raw) - set(_DEFAULTS))
    if unknown:
        raise ImproperlyConfigured(
            "OLLOWEDITOR contains unsupported keys: "
            + ", ".join(repr(key) for key in unknown)
        )

    config = {**_DEFAULTS, **raw}

    uploads_enabled = _validate_bool(config["UPLOADS_ENABLED"], "UPLOADS_ENABLED")
    upload_require_login = _validate_bool(
        config["UPLOAD_REQUIRE_LOGIN"], "UPLOAD_REQUIRE_LOGIN"
    )
    upload_permission = _validate_optional_string(
        config["UPLOAD_PERMISSION"], "UPLOAD_PERMISSION"
    )
    image_upload_path = _validate_relative_path(
        config["IMAGE_UPLOAD_PATH"], "IMAGE_UPLOAD_PATH"
    )
    gallery_upload_path = _validate_relative_path(
        config["GALLERY_UPLOAD_PATH"], "GALLERY_UPLOAD_PATH"
    )
    attachment_upload_path = _validate_relative_path(
        config["ATTACHMENT_UPLOAD_PATH"], "ATTACHMENT_UPLOAD_PATH"
    )
    max_image_size = _validate_positive_int(config["MAX_IMAGE_SIZE"], "MAX_IMAGE_SIZE")
    max_gallery_files = _validate_positive_int(
        config["MAX_GALLERY_FILES"], "MAX_GALLERY_FILES"
    )
    max_attachment_size = _validate_positive_int(
        config["MAX_ATTACHMENT_SIZE"], "MAX_ATTACHMENT_SIZE"
    )
    max_image_pixels = _validate_positive_int(
        config["MAX_IMAGE_PIXELS"], "MAX_IMAGE_PIXELS"
    )
    allowed_image_extensions = _validate_extension_list(
        config["ALLOWED_IMAGE_EXTENSIONS"],
        "ALLOWED_IMAGE_EXTENSIONS",
        allowed_values=set(_IMAGE_FORMAT_EXTENSIONS),
        forbidden_values={"svg"},
    )
    allowed_attachment_extensions = _validate_extension_list(
        config["ALLOWED_ATTACHMENT_EXTENSIONS"],
        "ALLOWED_ATTACHMENT_EXTENSIONS",
        forbidden_values=_DANGEROUS_ATTACHMENT_EXTENSIONS,
    )
    allow_base64_uploads = _validate_bool(
        config["ALLOW_BASE64_UPLOADS"], "ALLOW_BASE64_UPLOADS"
    )

    return OllowEditorUploadSettings(
        uploads_enabled=uploads_enabled,
        upload_require_login=upload_require_login,
        upload_permission=upload_permission,
        image_upload_path=image_upload_path,
        gallery_upload_path=gallery_upload_path,
        attachment_upload_path=attachment_upload_path,
        max_image_size=max_image_size,
        max_gallery_files=max_gallery_files,
        max_attachment_size=max_attachment_size,
        max_image_pixels=max_image_pixels,
        allowed_image_extensions=allowed_image_extensions,
        allowed_attachment_extensions=allowed_attachment_extensions,
        allow_base64_uploads=allow_base64_uploads,
    )


def _validate_bool(value: Any, key: str) -> bool:
    if not isinstance(value, bool):
        raise ImproperlyConfigured(f"OLLOWEDITOR[{key!r}] must be a boolean.")
    return value


def _validate_optional_string(value: Any, key: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise ImproperlyConfigured(
            f"OLLOWEDITOR[{key!r}] must be None or a non-empty string."
        )
    return value.strip()


def _validate_positive_int(value: Any, key: str) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
        raise ImproperlyConfigured(f"OLLOWEDITOR[{key!r}] must be a positive integer.")
    return value


def _validate_relative_path(value: Any, key: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ImproperlyConfigured(f"OLLOWEDITOR[{key!r}] must be a non-empty string.")

    normalized = value.strip().replace("\\", "/").strip("/")
    if not normalized:
        raise ImproperlyConfigured(f"OLLOWEDITOR[{key!r}] must not be empty.")

    candidate = PurePosixPath(normalized)
    if candidate.is_absolute():
        raise ImproperlyConfigured(
            f"OLLOWEDITOR[{key!r}] must be a relative storage path."
        )
    if any(part in {"", ".", ".."} for part in candidate.parts):
        raise ImproperlyConfigured(
            f"OLLOWEDITOR[{key!r}] must not contain path traversal."
        )
    return normalized


def _validate_extension_list(
    value: Any,
    key: str,
    *,
    allowed_values: set[str] | None = None,
    forbidden_values: set[str] | None = None,
) -> tuple[str, ...]:
    if not isinstance(value, (list, tuple)) or not value:
        raise ImproperlyConfigured(
            f"OLLOWEDITOR[{key!r}] must be a non-empty list of extensions."
        )

    normalized: list[str] = []
    for item in value:
        if not isinstance(item, str):
            raise ImproperlyConfigured(
                f"OLLOWEDITOR[{key!r}] must contain only strings."
            )
        extension = item.strip().lower().lstrip(".")
        if not extension or not extension.isalnum():
            raise ImproperlyConfigured(
                f"OLLOWEDITOR[{key!r}] contains an invalid extension: {item!r}."
            )
        if allowed_values is not None and extension not in allowed_values:
            raise ImproperlyConfigured(
                f"OLLOWEDITOR[{key!r}] contains an unsupported extension: "
                f"{extension!r}."
            )
        if forbidden_values is not None and extension in forbidden_values:
            raise ImproperlyConfigured(
                f"OLLOWEDITOR[{key!r}] contains a blocked extension: {extension!r}."
            )
        if extension not in normalized:
            normalized.append(extension)

    return tuple(normalized)


def get_allowed_image_formats(
    settings_obj: OllowEditorUploadSettings,
) -> dict[str, str]:
    return {
        extension: _IMAGE_FORMAT_EXTENSIONS[extension]
        for extension in settings_obj.allowed_image_extensions
    }
