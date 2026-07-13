from __future__ import annotations

from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import PurePosixPath
from urllib.parse import urlparse


@dataclass(frozen=True)
class OllowEditorContentInspection:
    attachment_filename: str
    attachment_present: bool
    attachment_url: str
    first_image_caption: str
    first_image_url: str
    gallery_image_count: int
    gallery_present: bool
    legacy_embedded_image: bool
    plain_text: str


@dataclass
class _MutableInspection:
    attachment_filename: str = ""
    attachment_present: bool = False
    attachment_url: str = ""
    first_image_caption: str = ""
    first_image_url: str = ""
    gallery_image_count: int = 0
    gallery_present: bool = False
    legacy_embedded_image: bool = False
    text_parts: list[str] = field(default_factory=list)

    def freeze(self) -> OllowEditorContentInspection:
        return OllowEditorContentInspection(
            attachment_filename=self.attachment_filename,
            attachment_present=self.attachment_present,
            attachment_url=self.attachment_url,
            first_image_caption=self.first_image_caption,
            first_image_url=self.first_image_url,
            gallery_image_count=self.gallery_image_count,
            gallery_present=self.gallery_present,
            legacy_embedded_image=self.legacy_embedded_image,
            plain_text=_normalize_whitespace(" ".join(self.text_parts)),
        )


class _OllowEditorPreviewParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.inspection = _MutableInspection()
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
            self.inspection.gallery_present = True
            self._gallery_depth += 1

        if self._is_attachment(tag_name, attributes):
            self.inspection.attachment_present = True
            self.inspection.attachment_url = attributes.get("href", "").strip()
            self._attachment_depth += 1

        if tag_name == "img":
            self._handle_image(attributes)
            return

        if tag_name == "figcaption" and self.inspection.first_image_url:
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
            if caption and not self.inspection.first_image_caption:
                self.inspection.first_image_caption = caption
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

        self.inspection.text_parts.append(normalized)
        if self._attachment_depth and not self.inspection.attachment_filename:
            self.inspection.attachment_filename = normalized

    def _handle_image(self, attributes: dict[str, str]) -> None:
        src = attributes.get("src", "").strip()
        if not src:
            return

        if self._gallery_depth:
            self.inspection.gallery_image_count += 1

        if is_legacy_embedded_image(src):
            self.inspection.legacy_embedded_image = True
            return

        if not self.inspection.first_image_url:
            self.inspection.first_image_url = src

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


def inspect_olloweditor_content(value: object) -> OllowEditorContentInspection:
    parser = _OllowEditorPreviewParser()
    parser.feed(str(value or ""))
    parser.close()
    return parser.inspection.freeze()


def extract_olloweditor_text(value: object, *, max_length: int = 140) -> str:
    text = inspect_olloweditor_content(value).plain_text
    return truncate_text(text, max_length=max_length)


def truncate_text(text: str, *, max_length: int = 140) -> str:
    normalized = _normalize_whitespace(text)
    if max_length <= 0 or len(normalized) <= max_length:
        return normalized
    trimmed = normalized[: max_length - 1].rstrip()
    if " " in trimmed:
        trimmed = trimmed.rsplit(" ", 1)[0]
    return f"{trimmed}…"


def safe_filename_from_url(url: str) -> str:
    path = PurePosixPath(urlparse(url).path)
    return path.name


def is_legacy_embedded_image(url: str) -> bool:
    return url.lower().startswith("data:image/")


def _normalize_whitespace(value: str) -> str:
    return " ".join(value.split())
