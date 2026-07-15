# ruff: noqa: E402

from __future__ import annotations

from django.conf import settings

if not settings.configured:
    settings.configure(
        SECRET_KEY="test-secret-key",
        INSTALLED_APPS=[
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "rest_framework",
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
        USE_TZ=True,
    )

import django

django.setup()

from django.db import models
from rest_framework import serializers

from olloweditor.integrations.drf import OllowEditorHTMLField

urlpatterns: list[object] = []


class APIArticle(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)

    class Meta:
        app_label = "drf_tests"


class ArticleSerializer(serializers.Serializer):
    title = serializers.CharField()
    content = OllowEditorHTMLField(allow_blank=True, required=False)


class ArticleModelSerializer(serializers.ModelSerializer):
    content = OllowEditorHTMLField(allow_blank=True, required=False)

    class Meta:
        model = APIArticle
        fields = ["title", "content"]


def test_valid_html_string_input() -> None:
    serializer = ArticleSerializer(data={"title": "Hello", "content": "<p>Article</p>"})
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["content"] == "<p>Article</p>"


def test_blank_content_when_allowed() -> None:
    serializer = ArticleSerializer(data={"title": "Hello", "content": ""})
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["content"] == ""


def test_blank_content_rejection_when_not_allowed() -> None:
    class StrictSerializer(serializers.Serializer):
        content = OllowEditorHTMLField()

    serializer = StrictSerializer(data={"content": ""})
    assert serializer.is_valid() is False
    assert "content" in serializer.errors


def test_required_behavior() -> None:
    serializer = ArticleSerializer(data={"title": "Hello"})
    assert serializer.is_valid(), serializer.errors

    class RequiredSerializer(serializers.Serializer):
        content = OllowEditorHTMLField(required=True)

    required = RequiredSerializer(data={})
    assert required.is_valid() is False
    assert "content" in required.errors


def test_maximum_length() -> None:
    class LimitedSerializer(serializers.Serializer):
        content = OllowEditorHTMLField(max_length=5)

    serializer = LimitedSerializer(data={"content": "123456"})
    assert serializer.is_valid() is False
    assert "content" in serializer.errors


def test_whitespace_preservation() -> None:
    class WhitespaceSerializer(serializers.Serializer):
        content = OllowEditorHTMLField()

    serializer = WhitespaceSerializer(data={"content": "  <p>Keep me</p>  "})
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["content"] == "  <p>Keep me</p>  "


def test_sanitizer_invocation_and_transformed_output() -> None:
    calls: list[str] = []

    def sanitizer(value: str) -> str:
        calls.append(value)
        return value.replace("<script>", "").replace("</script>", "")

    class SanitizedSerializer(serializers.Serializer):
        content = OllowEditorHTMLField(sanitizer=sanitizer)

    serializer = SanitizedSerializer(
        data={"content": "<p>safe</p><script>alert(1)</script>"}
    )
    assert serializer.is_valid(), serializer.errors
    assert calls == ["<p>safe</p><script>alert(1)</script>"]
    assert serializer.validated_data["content"] == "<p>safe</p>alert(1)"


def test_sanitizer_failure_becomes_validation_error() -> None:
    def sanitizer(_value: str) -> str:
        raise RuntimeError("broken sanitizer")

    class SanitizedSerializer(serializers.Serializer):
        content = OllowEditorHTMLField(sanitizer=sanitizer)

    serializer = SanitizedSerializer(data={"content": "<p>safe</p>"})
    assert serializer.is_valid() is False
    assert "content" in serializer.errors
    assert "HTML sanitizer failed" in str(serializer.errors["content"][0])


def test_standard_drf_validators() -> None:
    def forbid_script(value: str) -> None:
        if "<script" in value:
            raise serializers.ValidationError("script tags are not allowed")

    class ValidatedSerializer(serializers.Serializer):
        content = OllowEditorHTMLField(validators=[forbid_script])

    serializer = ValidatedSerializer(data={"content": "<script>alert(1)</script>"})
    assert serializer.is_valid() is False
    assert "script tags are not allowed" in str(serializer.errors["content"][0])


def test_style_uses_textarea_presentation() -> None:
    field = OllowEditorHTMLField()
    assert field.style["base_template"] == "textarea.html"


def test_serialization_output() -> None:
    serializer = ArticleSerializer(
        instance={"title": "Hello", "content": "<p>Article</p>"}
    )
    assert serializer.data == {"title": "Hello", "content": "<p>Article</p>"}


def test_modelserializer_usage() -> None:
    serializer = ArticleModelSerializer(
        data={"title": "Hello", "content": "<p>Article</p>"}
    )
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["content"] == "<p>Article</p>"


def test_allow_null_when_enabled() -> None:
    class NullableSerializer(serializers.Serializer):
        content = OllowEditorHTMLField(allow_null=True, required=False)

    serializer = NullableSerializer(data={"content": None})
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["content"] is None
