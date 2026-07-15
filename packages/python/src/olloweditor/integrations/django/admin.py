from __future__ import annotations

from urllib.parse import urlparse

from django.conf import settings
from django.utils.html import format_html
from django.utils.text import Truncator

from olloweditor.previews import (
    inspect_olloweditor_content,
    safe_filename_from_url,
)


class OllowEditorAdminPreviewMedia:
    class Media:
        css = {"all": ("olloweditor/olloweditor-admin.css",)}


def render_olloweditor_admin_preview(
    value: object,
    *,
    text_length: int = 140,
) -> str:
    content = str(value or "").strip()
    if not content:
        return "—"

    inspection = inspect_olloweditor_content(content)
    text_preview = Truncator(inspection.plain_text).chars(text_length)
    safe_thumbnail = _get_safe_media_thumbnail_url(inspection.first_image_url)

    if inspection.gallery_present:
        return _render_preview_markup(
            label=_gallery_label(inspection.gallery_image_count),
            text=text_preview,
            thumbnail_url=safe_thumbnail,
            warning="Legacy embedded image"
            if inspection.legacy_embedded_image and not safe_thumbnail
            else "",
        )

    if inspection.attachment_present:
        filename = inspection.attachment_filename or safe_filename_from_url(
            inspection.attachment_url
        )
        filename = filename or "Attachment"
        return _render_preview_markup(
            label=f"Attachment · {filename}",
            text=text_preview,
        )

    if inspection.legacy_embedded_image and not safe_thumbnail:
        return _render_preview_markup(
            label="Legacy embedded image",
            text=text_preview,
            warning="Legacy embedded image",
        )

    if inspection.first_image_url:
        return _render_preview_markup(
            label="Image",
            text=inspection.first_image_caption or text_preview,
            thumbnail_url=safe_thumbnail,
            warning="" if safe_thumbnail else "Image preview unavailable",
        )

    if text_preview:
        return _render_preview_markup(
            label="Text",
            text=text_preview,
        )

    return "—"


def _render_preview_markup(
    *,
    label: str,
    text: str,
    thumbnail_url: str = "",
    warning: str = "",
) -> str:
    thumbnail_html = ""
    if thumbnail_url:
        thumbnail_html = format_html(
            '<img class="olloweditor-admin-preview__thumbnail" src="{}" alt="">',
            thumbnail_url,
        )

    text_html = ""
    if text:
        text_html = format_html(
            '<div class="olloweditor-admin-preview__text">{}</div>',
            text,
        )

    warning_html = ""
    if warning:
        warning_html = format_html(
            '<div class="olloweditor-admin-preview__warning">{}</div>',
            warning,
        )

    return format_html(
        (
            '<div class="olloweditor-admin-preview">{}'
            '<div class="olloweditor-admin-preview__body">'
            '<div class="olloweditor-admin-preview__label">{}</div>'
            "{}{}"
            "</div>"
            "</div>"
        ),
        thumbnail_html,
        label,
        text_html,
        warning_html,
    )


def _gallery_label(image_count: int) -> str:
    if image_count == 1:
        return "Gallery · 1 image"
    if image_count > 1:
        return f"Gallery · {image_count} images"
    return "Gallery"


def _get_safe_media_thumbnail_url(url: str) -> str:
    candidate = url.strip()
    if not candidate:
        return ""

    parsed = urlparse(candidate)
    if candidate.startswith("//"):
        return ""
    if parsed.scheme in {"blob", "data", "javascript"}:
        return ""

    media_url = str(getattr(settings, "MEDIA_URL", "") or "").strip()
    if not media_url:
        return ""

    media_parsed = urlparse(media_url)
    if media_parsed.scheme or media_parsed.netloc:
        if parsed.scheme != media_parsed.scheme or parsed.netloc != media_parsed.netloc:
            return ""
        return candidate if parsed.path.startswith(media_parsed.path) else ""

    if parsed.scheme or parsed.netloc:
        return ""

    normalized_media_url = media_url if media_url.startswith("/") else f"/{media_url}"
    normalized_media_url = normalized_media_url.rstrip("/") + "/"
    path = parsed.path or ""
    return candidate if path.startswith(normalized_media_url) else ""
