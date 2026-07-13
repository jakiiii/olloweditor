# ruff: noqa: E402

from __future__ import annotations

import io
from pathlib import Path
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.management import call_command
from django.test import override_settings
from django.urls import path
from PIL import Image
from rest_framework import serializers
from rest_framework.test import APIClient

from olloweditor.integrations.drf import (
    OllowEditorAttachmentUploadView,
    OllowEditorGalleryUploadView,
    OllowEditorHTMLField,
    OllowEditorImageUploadView,
)
from olloweditor.previews import extract_olloweditor_text

urlpatterns = [
    path("api/olloweditor/upload/image/", OllowEditorImageUploadView.as_view()),
    path("api/olloweditor/upload/gallery/", OllowEditorGalleryUploadView.as_view()),
    path(
        "api/olloweditor/upload/attachment/",
        OllowEditorAttachmentUploadView.as_view(),
    ),
]

_DB_READY = False


def _ensure_db_ready() -> None:
    global _DB_READY
    if _DB_READY:
        return
    call_command("migrate", run_syncdb=True, verbosity=0)
    _DB_READY = True


def _user(*, with_permission: str | None = None):
    _ensure_db_ready()
    User = get_user_model()
    user, created = User.objects.get_or_create(
        username="drf-uploader",
        defaults={"email": "drf@example.com"},
    )
    if created:
        user.set_password("pass")
        user.save(update_fields=["password"])
    if with_permission:
        app_label, codename = with_permission.split(".", 1)
        permission = Permission.objects.get(
            content_type__app_label=app_label,
            codename=codename,
        )
        user.user_permissions.add(permission)
    return user


def _client(*, user=None) -> APIClient:
    client = APIClient()
    if user is not None:
        client.force_authenticate(user=user)
    return client


def _media_settings(tmpdir: str) -> dict[str, object]:
    return {
        "MEDIA_ROOT": tmpdir,
        "MEDIA_URL": "/media/",
        "OLLOWEDITOR": {
            "UPLOADS_ENABLED": True,
        },
        "ROOT_URLCONF": __name__,
        "STORAGES": {
            "default": {
                "BACKEND": "django.core.files.storage.FileSystemStorage",
            },
            "staticfiles": {
                "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
            },
        },
    }


def _image_file(name: str = "image.png", *, fmt: str = "PNG") -> io.BytesIO:
    buffer = io.BytesIO()
    Image.new("RGB", (8, 8), (10, 20, 30)).save(buffer, format=fmt)
    buffer.seek(0)
    buffer.name = name
    return buffer


def test_drf_upload_requires_authentication_by_default() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        response = _client().post(
            "/api/olloweditor/upload/image/",
            {"file": _image_file()},
            format="multipart",
        )
        assert response.status_code in {401, 403}


def test_drf_permission_setting_is_enforced() -> None:
    with TemporaryDirectory() as tmpdir:
        settings_dict = _media_settings(tmpdir)
        settings_dict["OLLOWEDITOR"] = {
            "UPLOADS_ENABLED": True,
            "UPLOAD_PERMISSION": "auth.view_user",
        }
        with override_settings(**settings_dict):
            denied = _client(user=_user()).post(
                "/api/olloweditor/upload/image/",
                {"file": _image_file()},
                format="multipart",
            )
            assert denied.status_code == 403
            allowed = _client(user=_user(with_permission="auth.view_user")).post(
                "/api/olloweditor/upload/image/",
                {"file": _image_file()},
                format="multipart",
            )
            assert allowed.status_code == 200


def test_drf_image_upload_returns_storage_backed_url() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        response = _client(user=_user()).post(
            "/api/olloweditor/upload/image/",
            {"file": _image_file()},
            format="multipart",
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is True
        assert payload["type"] == "image"
        assert payload["url"].startswith("/media/olloweditor/images/")
        assert "data:image" not in payload["url"]
        assert list(Path(tmpdir).rglob("*.png"))


def test_drf_gallery_upload_preserves_order() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        response = _client(user=_user()).post(
            "/api/olloweditor/upload/gallery/",
            {"files": [_image_file("one.png"), _image_file("two.png")]},
            format="multipart",
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["type"] == "gallery"
        assert [item["name"] for item in payload["files"]] == ["one.png", "two.png"]
        assert len(list(Path(tmpdir).rglob("*.png"))) == 2


def test_drf_attachment_upload_returns_metadata() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        attachment = io.BytesIO(b"%PDF-1.4 fake pdf")
        attachment.name = "report.pdf"
        response = _client(user=_user()).post(
            "/api/olloweditor/upload/attachment/",
            {"file": attachment},
            format="multipart",
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["type"] == "attachment"
        assert payload["name"] == "report.pdf"
        assert payload["url"].startswith("/media/olloweditor/attachments/")


def test_drf_preview_example_remains_plain_text() -> None:
    preview = extract_olloweditor_text(
        "<p>Preview <strong>text</strong> only.</p>",
        max_length=140,
    )
    assert preview == "Preview text only."


def test_drf_html_field_keeps_html_string_behavior() -> None:
    class PreviewSerializer(serializers.Serializer):
        content = OllowEditorHTMLField(allow_blank=True, required=False)

    serializer = PreviewSerializer(data={"content": "<p>Article</p>"})
    assert serializer.is_valid(), serializer.errors
