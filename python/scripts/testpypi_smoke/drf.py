from __future__ import annotations

from common import (
    emit,
    ensure_installed_package,
    require_distribution_present,
    venv_prefix,
)


def main() -> None:
    package_info = ensure_installed_package()
    django_version = require_distribution_present("django")
    drf_version = require_distribution_present("djangorestframework")

    from django.conf import settings

    if not settings.configured:
        settings.configure(
            SECRET_KEY="testpypi-drf-smoke",
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

    class Article(models.Model):
        title = models.CharField(max_length=255)
        content = models.TextField(blank=True)

        class Meta:
            app_label = "testpypi_drf"

    class ArticleSerializer(serializers.Serializer):
        title = serializers.CharField()
        content = OllowEditorHTMLField(allow_blank=True, required=False)

    class ArticleModelSerializer(serializers.ModelSerializer):
        content = OllowEditorHTMLField(allow_blank=True, required=False)

        class Meta:
            model = Article
            fields = ["title", "content"]

    payload = {
        "title": "TestPyPI article",
        "content": "<p><strong>DRF content</strong></p>",
    }
    serializer = ArticleSerializer(data=payload)
    if not serializer.is_valid():
        raise AssertionError(serializer.errors)

    whitespace_serializer = ArticleSerializer(
        data={"title": "Whitespace", "content": "  <p>Keep me</p>  "}
    )
    if not whitespace_serializer.is_valid():
        raise AssertionError(whitespace_serializer.errors)

    sanitizer_calls: list[str] = []

    def sanitizer(value: str) -> str:
        sanitizer_calls.append(value)
        return value.replace("<script>", "").replace("</script>", "")

    class SanitizedSerializer(serializers.Serializer):
        content = OllowEditorHTMLField(sanitizer=sanitizer)

    sanitized = SanitizedSerializer(data={"content": "<p>safe</p><script>x</script>"})
    if not sanitized.is_valid():
        raise AssertionError(sanitized.errors)

    def broken_sanitizer(_value: str) -> str:
        raise RuntimeError("broken sanitizer")

    class BrokenSerializer(serializers.Serializer):
        content = OllowEditorHTMLField(sanitizer=broken_sanitizer)

    broken = BrokenSerializer(data={"content": "<p>bad</p>"})

    model_serializer = ArticleModelSerializer(data=payload)
    if not model_serializer.is_valid():
        raise AssertionError(model_serializer.errors)

    emit(
        {
            "checks": {
                "allow_blank": ArticleSerializer(
                    data={"title": "Blank", "content": ""}
                ).is_valid(),
                "broken_sanitizer_errors": broken.errors
                if not broken.is_valid()
                else {},
                "model_serializer_valid": model_serializer.is_valid(),
                "serializer_output": ArticleSerializer(instance=payload).data,
                "serializer_style": OllowEditorHTMLField().style,
                "valid_payload": serializer.validated_data,
                "whitespace_preserved": whitespace_serializer.validated_data["content"],
                "sanitizer_calls": sanitizer_calls,
                "sanitized_output": sanitized.validated_data["content"],
            },
            "django_version": django_version,
            "drf_version": drf_version,
            "package": package_info,
            "venv_prefix": venv_prefix(),
        }
    )


urlpatterns: list[object] = []


if __name__ == "__main__":
    main()
