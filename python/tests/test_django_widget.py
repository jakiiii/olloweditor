# ruff: noqa: E402

from __future__ import annotations

import json
import re
from html import unescape

from django.conf import settings
from django.test import override_settings

if not settings.configured:
    settings.configure(
        SECRET_KEY="test-secret-key",
        INSTALLED_APPS=[
            "django.contrib.admin",
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "django.contrib.messages",
            "django.contrib.sessions",
            "django.contrib.staticfiles",
            "olloweditor.apps.OllowEditorConfig",
        ],
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": ":memory:",
            }
        },
        MIDDLEWARE=[],
        ROOT_URLCONF=__name__,
        STATIC_URL="/static/",
        TEMPLATES=[
            {
                "BACKEND": "django.template.backends.django.DjangoTemplates",
                "APP_DIRS": True,
                "OPTIONS": {
                    "context_processors": [
                        "django.template.context_processors.request",
                        "django.contrib.auth.context_processors.auth",
                        "django.contrib.messages.context_processors.messages",
                    ]
                },
            }
        ],
        USE_TZ=True,
    )

import django

django.setup()

from olloweditor.integrations.django.widgets import (
    AdminOllowEditorWidget,
    OllowEditorWidget,
)

urlpatterns: list[object] = []

DATA_OPTIONS_RE = re.compile(r'data-olloweditor-options="([^"]+)"')


def _extract_options(html: str) -> dict[str, object]:
    match = DATA_OPTIONS_RE.search(html)
    assert match is not None
    return json.loads(unescape(match.group(1)))


def test_widget_adds_required_attributes() -> None:
    widget = OllowEditorWidget(attrs={"rows": 12, "id": "id_content"})
    html = widget.render("content", "Hello", attrs={"class": "editor"})
    assert 'data-olloweditor="true"' in html
    assert 'rows="12"' in html
    assert 'id="id_content"' in html
    assert 'class="editor"' in html


def test_existing_classes_are_preserved_without_duplication() -> None:
    widget = OllowEditorWidget(attrs={"class": "alpha beta alpha"})
    html = widget.render("content", "", attrs={"class": "beta gamma"})
    assert 'class="alpha beta gamma"' in html or 'class="beta gamma alpha"' in html
    assert "alpha alpha" not in html
    assert "beta beta" not in html


def test_options_are_json_encoded_and_escaped_safely() -> None:
    widget = OllowEditorWidget(
        options={
            "theme": "auto",
            "placeholder": '<script>alert("x")</script>&',
        }
    )
    html = widget.render("content", "")
    assert 'data-olloweditor-options="' in html
    assert "<script>" not in html
    assert "&lt;script&gt;" in html
    assert "&amp;" in html
    assert _extract_options(html) == {
        "theme": "auto",
        "placeholder": '<script>alert("x")</script>&',
    }


def test_media_contains_expected_assets_in_order() -> None:
    widget = OllowEditorWidget()
    assert widget.media._css["all"] == ["olloweditor/olloweditor.css"]
    assert widget.media._js == [
        "olloweditor/olloweditor.browser.js",
        "olloweditor/olloweditor-init.js",
    ]


def test_widget_instances_render_independently() -> None:
    light = OllowEditorWidget(options={"theme": "light"})
    dark = OllowEditorWidget(options={"theme": "dark"})
    light_html = light.render("content", "")
    dark_html = dark.render("content", "")
    assert _extract_options(light_html) == {"theme": "light"}
    assert _extract_options(dark_html) == {"theme": "dark"}
    assert light_html != dark_html


def test_admin_widget_preserves_admin_and_custom_attributes() -> None:
    widget = AdminOllowEditorWidget(
        attrs={"class": "content-field", "rows": 12, "aria-describedby": "hint"}
    )
    html = widget.render("content", "", attrs={"class": "extra", "required": True})
    assert 'data-olloweditor="true"' in html
    assert 'class="vLargeTextField content-field extra"' in html
    assert 'rows="12"' in html
    assert 'aria-describedby="hint"' in html
    assert "required" in html


@override_settings(
    OLLOWEDITOR={
        "UPLOADS_ENABLED": True,
    }
)
def test_widget_serializes_django_upload_endpoints_when_enabled() -> None:
    widget = OllowEditorWidget(options={"theme": "auto"})
    html = widget.render("content", "")
    options = _extract_options(html)
    assert options["theme"] == "auto"
    assert options["upload"]["imageUrl"] == "/olloweditor/upload/image/"
    assert options["upload"]["galleryUrl"] == "/olloweditor/upload/gallery/"
    assert options["upload"]["attachmentUrl"] == "/olloweditor/upload/attachment/"
    assert options["upload"]["allowBase64"] is False
    assert options["upload"]["allowFallback"] is False
