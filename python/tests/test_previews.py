from __future__ import annotations

from olloweditor.previews import (
    extract_olloweditor_text,
    inspect_olloweditor_content,
    safe_filename_from_url,
)


def test_extract_olloweditor_text_normalizes_and_truncates() -> None:
    preview = extract_olloweditor_text(
        (
            "<h2>Heading</h2><p>Text with   extra whitespace and "
            "<strong>formatting</strong>.</p>"
        ),
        max_length=24,
    )
    assert preview == "Heading Text with…"


def test_inspect_olloweditor_content_tracks_gallery_attachment_and_base64() -> None:
    inspection = inspect_olloweditor_content(
        """
        <section class="ollow-media ollow-gallery" data-type="gallery">
            <figure><img src="/media/one.png"></figure>
            <figure><img src="data:image/png;base64,AAAA"></figure>
            <figure><img src="/media/two.png"></figure>
        </section>
        <a href="/media/docs/report.pdf" data-olloweditor-attachment="true">
            report.pdf
        </a>
        <script>alert("unsafe")</script>
        """
    )

    assert inspection.gallery_present is True
    assert inspection.gallery_image_count == 3
    assert inspection.first_image_url == "/media/one.png"
    assert inspection.attachment_present is True
    assert inspection.attachment_filename == "report.pdf"
    assert inspection.legacy_embedded_image is True
    assert "alert" not in inspection.plain_text


def test_safe_filename_from_url_uses_path_component_only() -> None:
    assert safe_filename_from_url("https://cdn.example.com/media/docs/report.pdf") == (
        "report.pdf"
    )
