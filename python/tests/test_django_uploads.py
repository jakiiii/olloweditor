# ruff: noqa: E402

from __future__ import annotations

import io
import json
import re
from html import unescape
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import default_storage
from django.core.management import call_command
from django.forms import modelform_factory
from django.test import Client, override_settings
from django.test.utils import override_script_prefix
from django.urls import reverse
from PIL import Image

from olloweditor.integrations.django.settings import get_olloweditor_upload_settings
from olloweditor.integrations.django.widgets import OllowEditorWidget
from tests.django_testapp.models import Article
from tests.django_testapp.storage import InMemoryStorage

_DB_READY = False
_PNG_URL_RE = re.compile(r"^/media/olloweditor/images/\d{4}/\d{2}/[0-9a-f]{32}\.png$")
_OPTIONS_RE = re.compile(r'data-olloweditor-options="([^"]+)"')


def _ensure_db_ready() -> None:
    global _DB_READY
    if _DB_READY:
        return
    call_command("migrate", run_syncdb=True, verbosity=0)
    _DB_READY = True


def _get_user(*, with_permission: str | None = None) -> object:
    _ensure_db_ready()
    User = get_user_model()
    user, created = User.objects.get_or_create(
        username="uploader",
        defaults={"email": "uploader@example.com", "is_staff": True},
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


def _get_client(
    *,
    login: bool = True,
    csrf: bool = False,
    with_permission: str | None = None,
) -> Client:
    user = _get_user(with_permission=with_permission)
    client = Client(enforce_csrf_checks=csrf)
    if login:
        client.force_login(user)
    return client


def _make_image(
    *,
    fmt: str = "PNG",
    name: str = "image.png",
    size: tuple[int, int] = (8, 8),
    color: tuple[int, int, int] = (10, 20, 30),
) -> tuple[str, bytes]:
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format=fmt)
    return name, buffer.getvalue()


def _simple_uploaded_file(name: str, content: bytes, content_type: str) -> object:
    from django.core.files.uploadedfile import SimpleUploadedFile

    return SimpleUploadedFile(name, content, content_type=content_type)


def _media_settings(tmpdir: str) -> dict[str, object]:
    return {
        "MEDIA_ROOT": tmpdir,
        "MEDIA_URL": "/media/",
        "OLLOWEDITOR": {
            "UPLOADS_ENABLED": True,
        },
        "STORAGES": {
            "default": {
                "BACKEND": "django.core.files.storage.FileSystemStorage",
            },
            "staticfiles": {
                "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
            },
        },
    }


def _csrf_headers(client: Client) -> dict[str, str]:
    response = client.get("/admin/", follow=True)
    assert response.status_code == 200
    csrf_token = client.cookies["csrftoken"].value
    return {"HTTP_X_CSRFTOKEN": csrf_token}


def _extract_options(html: str) -> dict[str, object]:
    match = _OPTIONS_RE.search(html)
    assert match is not None
    return json.loads(unescape(match.group(1)))


@override_settings(OLLOWEDITOR={"UPLOADS_ENABLED": True})
def test_widget_includes_upload_configuration_when_enabled() -> None:
    form_class = modelform_factory(Article, fields=("content",))
    form = form_class()
    html = str(form["content"])
    assert "/olloweditor/upload/image/" in html
    assert "/olloweditor/upload/gallery/" in html
    assert "/olloweditor/upload/attachment/" in html
    options = _extract_options(html)
    assert options["upload"]["allowBase64"] is False


def test_unauthenticated_upload_is_rejected_by_default() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        file_name, content = _make_image()
        client = _get_client(login=False)
        response = client.post(
            reverse("olloweditor:upload_image"),
            {"file": _simple_uploaded_file(file_name, content, "image/png")},
        )
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "authentication_required"


def test_get_upload_is_rejected() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        client = _get_client()
        response = client.get(reverse("olloweditor:upload_image"))
        assert response.status_code == 405
        assert response.json()["error"]["code"] == "method_not_allowed"


def test_csrf_protection_remains_enabled_for_uploads() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        file_name, content = _make_image()
        client = _get_client(csrf=True)
        response = client.post(
            reverse("olloweditor:upload_image"),
            {"file": _simple_uploaded_file(file_name, content, "image/png")},
        )
        assert response.status_code == 403


def test_authenticated_image_upload_succeeds_with_csrf() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        file_name, content = _make_image()
        client = _get_client(csrf=True)
        response = client.post(
            reverse("olloweditor:upload_image"),
            {"file": _simple_uploaded_file(file_name, content, "image/png")},
            **_csrf_headers(client),
        )
        payload = response.json()
        assert response.status_code == 200
        assert payload["success"] is True
        assert payload["type"] == "image"
        assert payload["name"] == "image.png"
        assert _PNG_URL_RE.match(payload["url"])
        assert "/home/" not in payload["url"]
        files = list(Path(tmpdir).rglob("*.png"))
        assert len(files) == 1


def test_configured_permission_is_enforced() -> None:
    with TemporaryDirectory() as tmpdir:
        settings_dict = _media_settings(tmpdir)
        settings_dict["OLLOWEDITOR"] = {
            "UPLOADS_ENABLED": True,
            "UPLOAD_PERMISSION": "auth.view_user",
        }
        with override_settings(**settings_dict):
            file_name, content = _make_image()
            client = _get_client()
            denied = client.post(
                reverse("olloweditor:upload_image"),
                {"file": _simple_uploaded_file(file_name, content, "image/png")},
            )
            assert denied.status_code == 403
            assert denied.json()["error"]["code"] == "permission_denied"

            allowed_client = _get_client(with_permission="auth.view_user")
            allowed = allowed_client.post(
                reverse("olloweditor:upload_image"),
                {"file": _simple_uploaded_file(file_name, content, "image/png")},
            )
            assert allowed.status_code == 200


def test_valid_jpeg_upload_succeeds() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        file_name, content = _make_image(fmt="JPEG", name="photo.jpg")
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_image"),
            {"file": _simple_uploaded_file(file_name, content, "image/jpeg")},
        )
        assert response.status_code == 200
        assert response.json()["url"].endswith(".jpg")


def test_malformed_image_is_rejected() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_image"),
            {
                "file": _simple_uploaded_file(
                    "broken.png",
                    b"not-an-image",
                    "image/png",
                )
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "invalid_image"


def test_fake_image_extension_is_rejected() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        file_name, content = _make_image(fmt="JPEG", name="photo.png")
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_image"),
            {"file": _simple_uploaded_file(file_name, content, "image/png")},
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "invalid_file_type"


def test_unsupported_image_extension_is_rejected() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_image"),
            {
                "file": _simple_uploaded_file(
                    "icon.svg",
                    b"<svg></svg>",
                    "image/svg+xml",
                )
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "invalid_file_type"


def test_oversized_image_is_rejected() -> None:
    with TemporaryDirectory() as tmpdir:
        settings_dict = _media_settings(tmpdir)
        settings_dict["OLLOWEDITOR"] = {
            "UPLOADS_ENABLED": True,
            "MAX_IMAGE_SIZE": 10,
        }
        with override_settings(**settings_dict):
            file_name, content = _make_image()
            client = _get_client()
            response = client.post(
                reverse("olloweditor:upload_image"),
                {"file": _simple_uploaded_file(file_name, content, "image/png")},
            )
            assert response.status_code == 413
            assert response.json()["error"]["code"] == "file_too_large"


def test_multiple_gallery_upload_succeeds_in_selection_order() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        first_name, first = _make_image(name="one.png", color=(1, 2, 3))
        second_name, second = _make_image(name="two.png", color=(4, 5, 6))
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_gallery"),
            {
                "files": [
                    _simple_uploaded_file(first_name, first, "image/png"),
                    _simple_uploaded_file(second_name, second, "image/png"),
                ]
            },
        )
        payload = response.json()
        assert response.status_code == 200
        assert [item["name"] for item in payload["files"]] == ["one.png", "two.png"]
        assert len(payload["files"]) == 2
        assert len(list(Path(tmpdir).rglob("*.png"))) == 2


def test_empty_gallery_list_is_rejected() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        client = _get_client()
        response = client.post(reverse("olloweditor:upload_gallery"), {})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "missing_file"


def test_gallery_maximum_count_is_enforced() -> None:
    with TemporaryDirectory() as tmpdir:
        settings_dict = _media_settings(tmpdir)
        settings_dict["OLLOWEDITOR"] = {
            "UPLOADS_ENABLED": True,
            "MAX_GALLERY_FILES": 1,
        }
        with override_settings(**settings_dict):
            one_name, one = _make_image(name="one.png")
            two_name, two = _make_image(name="two.png")
            client = _get_client()
            response = client.post(
                reverse("olloweditor:upload_gallery"),
                {
                    "files": [
                        _simple_uploaded_file(one_name, one, "image/png"),
                        _simple_uploaded_file(two_name, two, "image/png"),
                    ]
                },
            )
            assert response.status_code == 400
            assert response.json()["error"]["code"] == "too_many_files"


def test_invalid_gallery_member_rejects_entire_request() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        one_name, one = _make_image(name="one.png")
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_gallery"),
            {
                "files": [
                    _simple_uploaded_file(one_name, one, "image/png"),
                    _simple_uploaded_file("broken.png", b"bad", "image/png"),
                ]
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "invalid_image"
        assert not list(Path(tmpdir).rglob("*.*"))


def test_partial_gallery_files_are_cleaned_up_after_storage_failure() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        one_name, one = _make_image(name="one.png")
        two_name, two = _make_image(name="two.png")
        client = _get_client()

        original_save = default_storage.save
        call_count = {"count": 0}

        def failing_save(name: str, content: object) -> str:
            call_count["count"] += 1
            if call_count["count"] == 2:
                raise OSError("boom")
            return original_save(name, content)

        with patch(
            "olloweditor.integrations.django.upload_views.default_storage.save",
            side_effect=failing_save,
        ):
            response = client.post(
                reverse("olloweditor:upload_gallery"),
                {
                    "files": [
                        _simple_uploaded_file(one_name, one, "image/png"),
                        _simple_uploaded_file(two_name, two, "image/png"),
                    ]
                },
            )
        assert response.status_code == 500
        assert response.json()["error"]["code"] == "storage_failure"
        assert not list(Path(tmpdir).rglob("*.*"))


def test_valid_attachment_upload_succeeds() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_attachment"),
            {
                "file": _simple_uploaded_file(
                    "report.pdf",
                    b"%PDF-1.4 fake pdf",
                    "application/pdf",
                )
            },
        )
        payload = response.json()
        assert response.status_code == 200
        assert payload["type"] == "attachment"
        assert payload["name"] == "report.pdf"
        assert payload["url"].startswith("/media/olloweditor/attachments/")
        assert "/home/" not in payload["url"]


def test_prohibited_attachment_extension_is_rejected() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_attachment"),
            {
                "file": _simple_uploaded_file(
                    "evil.js",
                    b"alert(1)",
                    "text/javascript",
                )
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "invalid_file_type"


def test_oversized_attachment_is_rejected() -> None:
    with TemporaryDirectory() as tmpdir:
        settings_dict = _media_settings(tmpdir)
        settings_dict["OLLOWEDITOR"] = {
            "UPLOADS_ENABLED": True,
            "MAX_ATTACHMENT_SIZE": 3,
        }
        with override_settings(**settings_dict):
            client = _get_client()
            response = client.post(
                reverse("olloweditor:upload_attachment"),
                {
                    "file": _simple_uploaded_file(
                        "report.pdf",
                        b"%PDF-1.4 fake pdf",
                        "application/pdf",
                    )
                },
            )
            assert response.status_code == 413
            assert response.json()["error"]["code"] == "file_too_large"


def test_attachment_path_traversal_name_is_sanitized() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_attachment"),
            {
                "file": _simple_uploaded_file(
                    "../../report.pdf",
                    b"%PDF-1.4 fake pdf",
                    "application/pdf",
                )
            },
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["name"] == "report.pdf"
        assert "../../" not in payload["url"]


def test_custom_directories_and_size_limits_work() -> None:
    with TemporaryDirectory() as tmpdir:
        settings_dict = _media_settings(tmpdir)
        settings_dict["OLLOWEDITOR"] = {
            "UPLOADS_ENABLED": True,
            "IMAGE_UPLOAD_PATH": "custom/images/%Y/%m/",
            "MAX_IMAGE_SIZE": 1024 * 1024,
        }
        with override_settings(**settings_dict):
            file_name, content = _make_image()
            client = _get_client()
            response = client.post(
                reverse("olloweditor:upload_image"),
                {"file": _simple_uploaded_file(file_name, content, "image/png")},
            )
            assert response.status_code == 200
            assert "/media/custom/images/" in response.json()["url"]


def test_invalid_settings_raise_clear_errors() -> None:
    with override_settings(OLLOWEDITOR={"UPLOADS_ENABLED": True, "UNKNOWN_KEY": True}):
        try:
            get_olloweditor_upload_settings()
        except ImproperlyConfigured as exc:
            assert "unsupported keys" in str(exc)
        else:
            raise AssertionError("Expected ImproperlyConfigured to be raised.")


def test_upload_disabled_mode_rejects_endpoint_and_widget_config() -> None:
    with override_settings(OLLOWEDITOR={"UPLOADS_ENABLED": False}):
        widget = OllowEditorWidget()
        html = widget.render("content", "")
        assert "/olloweditor/upload/image/" not in html
        client = _get_client()
        response = client.post(reverse("olloweditor:upload_image"), {})
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "uploads_disabled"


def test_upload_uses_default_storage() -> None:
    with TemporaryDirectory() as tmpdir, override_settings(**_media_settings(tmpdir)):
        file_name, content = _make_image()
        client = _get_client()
        with patch(
            "olloweditor.integrations.django.upload_views.default_storage.save",
            wraps=default_storage.save,
        ) as save_mock:
            response = client.post(
                reverse("olloweditor:upload_image"),
                {"file": _simple_uploaded_file(file_name, content, "image/png")},
            )
        assert response.status_code == 200
        assert save_mock.called


def test_upload_can_use_in_memory_storage() -> None:
    InMemoryStorage.reset()
    with override_settings(
        MEDIA_URL="/memory-media/",
        OLLOWEDITOR={"UPLOADS_ENABLED": True},
        STORAGES={
            "default": {
                "BACKEND": "tests.django_testapp.storage.InMemoryStorage",
            },
            "staticfiles": {
                "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
            },
        },
    ):
        file_name, content = _make_image()
        client = _get_client()
        response = client.post(
            reverse("olloweditor:upload_image"),
            {"file": _simple_uploaded_file(file_name, content, "image/png")},
        )
        assert response.status_code == 200
        assert InMemoryStorage.files


@override_settings(OLLOWEDITOR={"UPLOADS_ENABLED": True})
def test_upload_system_urls_are_reversible() -> None:
    with override_script_prefix("/"):
        assert reverse("olloweditor:upload_image") == "/olloweditor/upload/image/"
        assert reverse("olloweditor:upload_gallery") == "/olloweditor/upload/gallery/"
        assert (
            reverse("olloweditor:upload_attachment")
            == "/olloweditor/upload/attachment/"
        )
