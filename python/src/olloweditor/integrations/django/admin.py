from __future__ import annotations

from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import PurePosixPath
from urllib.parse import urlparse

from django.conf import settings
from django.utils.html import format_html
from django.utils.text import Truncator


class OllowEditorAdminPreviewMedia:
    class Media:
        css = {"all": ("olloweditor/olloweditor-admin.css",)}


@dataclass
class _PreviewSummary:
    attachment_filename: str = ""
    attachment_url: str = ""
    attachment_present: bool = False
    first_image_caption: str = ""
    first_image_url: str = ""
    gallery_image_count: int = 0
    gallery_present: bool = False
    legacy_embedded_image: bool = False
    text_parts: list[str] = field(default_factory=list)

    def plain_text(self) -> str:
        return _normalize_whitespace(" ".join(self.text_parts))


class _OllowEditorPreviewParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.summary = _PreviewSummary()
        self._ignored_depth = 0
        self._gallery_depth = 0
        self._attachment_depth = 0
        self._capture_figcaption = False
        self._figcaption_parts: list[str] = []

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        attributes = {name.lower(): value or "" for name, value in attrs}
        tag_name = tag.lower()

        if tag_name in {"script", "style"}:
            self._ignored_depth += 1
            return

        if self._ignored_depth:
            return

        if self._is_gallery(tag_name, attributes):
            self.summary.gallery_present = True
            self._gallery_depth += 1

        if self._is_attachment(tag_name, attributes):
            self.summary.attachment_present = True
            self.summary.attachment_url = attributes.get("href", "").strip()
            self._attachment_depth += 1

        if tag_name == "img":
            self._handle_image(attributes)
            return

        if tag_name == "figcaption" and self.summary.first_image_url:
            self._capture_figcaption = True
            self._figcaption_parts = []

    def handle_endtag(self, tag: str) -> None:
        tag_name = tag.lower()
        if tag_name in {"script", "style"}:
            if self._ignored_depth:
                self._ignored_depth -= 1
            return

        if self._ignored_depth:
            return

        if self._capture_figcaption and tag_name == "figcaption":
            caption = _normalize_whitespace(" ".join(self._figcaption_parts))
            if caption and not self.summary.first_image_caption:
                self.summary.first_image_caption = caption
            self._capture_figcaption = False
            self._figcaption_parts = []

        if self._gallery_depth and tag_name == "section":
            self._gallery_depth -= 1

        if self._attachment_depth and tag_name == "a":
            self._attachment_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._ignored_depth:
            return

        if self._capture_figcaption:
            self._figcaption_parts.append(data)

        normalized = _normalize_whitespace(data)
        if not normalized:
            return

        self.summary.text_parts.append(normalized)
        if self._attachment_depth and not self.summary.attachment_filename:
            self.summary.attachment_filename = normalized

    def _handle_image(self, attributes: dict[str, str]) -> None:
        src = attributes.get("src", "").strip()
        if not src:
            return

        if self._gallery_depth:
            self.summary.gallery_image_count += 1

        if _is_legacy_embedded_image(src):
            self.summary.legacy_embedded_image = True
            return

        if not self.summary.first_image_url:
            self.summary.first_image_url = src

    @staticmethod
    def _is_attachment(tag_name: str, attributes: dict[str, str]) -> bool:
        return tag_name == "a" and (
            attributes.get("data-olloweditor-attachment") == "true"
            or attributes.get("data-type") == "attachment"
        )

    @staticmethod
    def _is_gallery(tag_name: str, attributes: dict[str, str]) -> bool:
        classes = set(attributes.get("class", "").split())
        return tag_name == "section" and (
            attributes.get("data-type") == "gallery" or "ollow-gallery" in classes
        )


def render_olloweditor_admin_preview(
    value: object,
    *,
    text_length: int = 140,
) -> str:
    content = str(value or "").strip()
    if not content:
        return "—"

    summary = _summarize_olloweditor_html(content)
    text_preview = Truncator(summary.plain_text()).chars(text_length)
    safe_thumbnail = _get_safe_media_thumbnail_url(summary.first_image_url)

    if summary.gallery_present:
        return _render_preview_markup(
            label=_gallery_label(summary.gallery_image_count),
            text=text_preview,
            thumbnail_url=safe_thumbnail,
            warning="Legacy embedded image"
            if summary.legacy_embedded_image and not safe_thumbnail
            else "",
        )

    if summary.attachment_present:
        filename = summary.attachment_filename or _filename_from_url(
            summary.attachment_url
        )
        filename = filename or "Attachment"
        return _render_preview_markup(
            label=f"Attachment · {filename}",
            text=text_preview,
        )

    if summary.legacy_embedded_image and not safe_thumbnail:
        return _render_preview_markup(
            label="Legacy embedded image",
            text=text_preview,
            warning="Legacy embedded image",
        )

    if summary.first_image_url:
        return _render_preview_markup(
            label="Image",
            text=summary.first_image_caption or text_preview,
            thumbnail_url=safe_thumbnail,
            warning="" if safe_thumbnail else "Image preview unavailable",
        )

    if text_preview:
        return _render_preview_markup(
            label="Text",
            text=text_preview,
        )

    return "—"


def _summarize_olloweditor_html(content: str) -> _PreviewSummary:
    parser = _OllowEditorPreviewParser()
    parser.feed(content)
    parser.close()
    return parser.summary


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


def _normalize_whitespace(value: str) -> str:
    return " ".join(value.split())


def _is_legacy_embedded_image(url: str) -> bool:
    return url.lower().startswith("data:image/")


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


def _filename_from_url(url: str) -> str:
    path = PurePosixPath(urlparse(url).path)
    return path.name
