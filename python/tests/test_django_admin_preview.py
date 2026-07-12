# ruff: noqa: E402

from __future__ import annotations

from django.test import override_settings

from olloweditor.integrations.django.admin import (
    _get_safe_media_thumbnail_url,
    _summarize_olloweditor_html,
    render_olloweditor_admin_preview,
)


def test_summary_extracts_plain_text_and_normalizes_whitespace() -> None:
    summary = _summarize_olloweditor_html(
        "<h2>Article&nbsp;heading</h2><p>This is <strong>formatted</strong> text.</p>"
    )
    assert summary.plain_text() == "Article heading This is formatted text."


def test_summary_handles_nested_tags_and_malformed_html() -> None:
    summary = _summarize_olloweditor_html(
        "<p><strong>Nested <em>text</p><p>still works"
    )
    assert summary.plain_text() == "Nested text still works"


def test_render_truncates_long_text() -> None:
    html = render_olloweditor_admin_preview(
        "<p>" + ("alpha " * 50) + "</p>",
        text_length=60,
    )
    assert "alpha alpha" in html
    assert "…" in html


def test_render_returns_dash_for_empty_content() -> None:
    assert render_olloweditor_admin_preview("") == "—"
    assert render_olloweditor_admin_preview(None) == "—"


@override_settings(MEDIA_URL="/media/")
def test_relative_media_url_is_previewable() -> None:
    assert _get_safe_media_thumbnail_url(
        "/media/olloweditor/images/2026/07/example.jpg"
    )


@override_settings(MEDIA_URL="https://cdn.example.com/media/")
def test_absolute_media_url_is_previewable() -> None:
    assert (
        _get_safe_media_thumbnail_url(
            "https://cdn.example.com/media/olloweditor/images/2026/07/example.jpg"
        )
        == "https://cdn.example.com/media/olloweditor/images/2026/07/example.jpg"
    )


@override_settings(MEDIA_URL="/media/")
def test_unsafe_thumbnail_urls_are_rejected() -> None:
    assert _get_safe_media_thumbnail_url("data:image/png;base64,AAAA") == ""
    assert _get_safe_media_thumbnail_url("blob:https://example.com/demo") == ""
    assert _get_safe_media_thumbnail_url("javascript:alert(1)") == ""
    assert _get_safe_media_thumbnail_url("//cdn.example.com/media/demo.jpg") == ""
    assert _get_safe_media_thumbnail_url("https://example.com/media/demo.jpg") == ""


@override_settings(MEDIA_URL="/media/")
def test_image_preview_renders_safe_thumbnail_and_caption() -> None:
    html = render_olloweditor_admin_preview(
        """
        <figure class="olloweditor-image" data-type="image">
            <img src="/media/olloweditor/images/2026/07/example.jpg" alt="Example">
            <figcaption>Example image</figcaption>
        </figure>
        """
    )
    assert "Image" in html
    assert "Example image" in html
    assert 'src="/media/olloweditor/images/2026/07/example.jpg"' in html


@override_settings(MEDIA_URL="/media/")
def test_gallery_preview_reports_count_and_uses_first_safe_image() -> None:
    html = render_olloweditor_admin_preview(
        """
        <section class="ollow-media ollow-gallery" data-type="gallery">
            <div class="ollow-gallery-grid">
                <figure>
                    <img src="/media/olloweditor/gallery/2026/07/one.jpg" alt="">
                </figure>
                <figure><img src="data:image/png;base64,AAAA" alt=""></figure>
                <figure>
                    <img src="/media/olloweditor/gallery/2026/07/two.jpg" alt="">
                </figure>
            </div>
        </section>
        """
    )
    assert "Gallery · 3 images" in html
    assert 'src="/media/olloweditor/gallery/2026/07/one.jpg"' in html
    assert "data:image" not in html


@override_settings(MEDIA_URL="/media/")
def test_gallery_with_only_legacy_images_hides_base64_payload() -> None:
    payload = "A" * 4000
    html = render_olloweditor_admin_preview(
        f"""
        <section class="ollow-media ollow-gallery" data-type="gallery">
            <div class="ollow-gallery-grid">
                <figure><img src="data:image/png;base64,{payload}" alt=""></figure>
                <figure><img src="data:image/png;base64,{payload}" alt=""></figure>
            </div>
        </section>
        """
    )
    assert "Gallery · 2 images" in html
    assert "Legacy embedded image" in html
    assert "data:image" not in html
    assert ";base64," not in html
    assert len(html) < 1200


def test_attachment_preview_uses_link_text() -> None:
    html = render_olloweditor_admin_preview(
        '<a data-type="attachment" data-olloweditor-attachment="true" '
        'href="/media/olloweditor/attachments/2026/07/report.pdf">report.pdf</a>'
    )
    assert "Attachment · report.pdf" in html
    assert "href=" not in html


def test_attachment_preview_falls_back_to_filename_from_url() -> None:
    html = render_olloweditor_admin_preview(
        '<a data-type="attachment" data-olloweditor-attachment="true" '
        'href="/media/olloweditor/attachments/2026/07/report.pdf"></a>'
    )
    assert "Attachment · report.pdf" in html


def test_malicious_html_does_not_render_scripts_or_attributes() -> None:
    html = render_olloweditor_admin_preview(
        """
        <script>alert(1)</script>
        <img src="javascript:alert(1)" onerror="alert(1)">
        <p onclick="alert(1)">Safe visible text</p>
        """
    )
    assert "Safe visible text" in html
    assert "<script" not in html
    assert "onclick" not in html
    assert "onerror" not in html
    assert "javascript:" not in html


def test_legacy_single_image_uses_warning_without_payload() -> None:
    payload = "B" * 8000
    html = render_olloweditor_admin_preview(
        '<figure data-type="image"><img src="data:image/png;base64,'
        + payload
        + '"></figure>'
    )
    assert "Legacy embedded image" in html
    assert "data:image" not in html
    assert ";base64," not in html
    assert len(html) < 1200
