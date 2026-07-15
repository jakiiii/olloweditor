from __future__ import annotations

import json
import re
from html import unescape
from io import BytesIO

from flask import Flask, render_template_string
from PIL import Image

from olloweditor.integrations.flask import OllowEditor
from olloweditor.previews import extract_olloweditor_text

DATA_OPTIONS_RE = re.compile(r'data-olloweditor-options="([^"]+)"')


def create_app(
    *,
    prefix: str | None = None,
    config: dict[str, object] | None = None,
) -> Flask:
    app = Flask(__name__)
    if prefix is not None:
        app.config["OLLOWEDITOR_URL_PREFIX"] = prefix
    if config:
        app.config.update(config)
    return app


def _extract_options(html: str) -> dict[str, object]:
    match = DATA_OPTIONS_RE.search(html)
    assert match is not None
    return json.loads(unescape(match.group(1)))


def test_direct_initialization_with_app() -> None:
    app = create_app()
    extension = OllowEditor(app)
    assert app.extensions["olloweditor"] is extension
    assert "olloweditor" in app.blueprints


def test_delayed_init_app() -> None:
    app = create_app()
    extension = OllowEditor()
    extension.init_app(app)
    assert app.extensions["olloweditor"] is extension


def test_application_factory_pattern() -> None:
    extension = OllowEditor()

    def factory() -> Flask:
        app = create_app()
        extension.init_app(app)
        return app

    app = factory()
    assert app.extensions["olloweditor"] is extension


def test_asset_urls_and_jinja_helper_availability() -> None:
    app = create_app()
    OllowEditor(app)
    with app.test_request_context("/"):
        html = app.jinja_env.globals["olloweditor_assets"]()
    rendered = str(html)
    assert "/olloweditor/olloweditor.css" in rendered
    assert "/olloweditor/olloweditor.browser.js" in rendered
    assert "/olloweditor/olloweditor-init.js" in rendered
    assert (
        rendered.index("olloweditor.css")
        < rendered.index("olloweditor.browser.js")
        < rendered.index("olloweditor-init.js")
    )


def test_css_response_includes_expected_mime_type() -> None:
    app = create_app()
    OllowEditor(app)
    client = app.test_client()
    response = client.get("/olloweditor/olloweditor.css")
    assert response.status_code == 200
    assert response.mimetype == "text/css"
    assert b".nw-editor" in response.data


def test_javascript_responses_include_expected_mime_type() -> None:
    app = create_app()
    OllowEditor(app)
    client = app.test_client()
    browser = client.get("/olloweditor/olloweditor.browser.js")
    init = client.get("/olloweditor/olloweditor-init.js")
    assert browser.status_code == 200
    assert browser.mimetype == "text/javascript"
    assert b"OllowEditor" in browser.data
    assert init.status_code == 200
    assert init.mimetype == "text/javascript"
    assert b"bootOllowEditor" in init.data


def test_missing_asset_response() -> None:
    app = create_app()
    OllowEditor(app)
    client = app.test_client()
    response = client.get("/olloweditor/missing.js")
    assert response.status_code == 404


def test_custom_url_prefix() -> None:
    app = create_app(prefix="/assets/editor")
    OllowEditor(app)
    with app.test_request_context("/"):
        html = str(app.jinja_env.globals["olloweditor_assets"]())
    assert "/assets/editor/olloweditor.css" in html


def test_duplicate_initialization_does_not_reregister() -> None:
    app = create_app()
    extension = OllowEditor(app)
    extension.init_app(app)
    assert len(app.blueprints) == 1
    assert app.extensions["olloweditor"] is extension


def test_multiple_app_instances() -> None:
    first = create_app(prefix="/first")
    second = create_app(prefix="/second")
    first_extension = OllowEditor(first)
    second_extension = OllowEditor(second)
    assert first.extensions["olloweditor"] is first_extension
    assert second.extensions["olloweditor"] is second_extension
    with first.test_request_context("/"):
        assert "/first/olloweditor.css" in str(
            first.jinja_env.globals["olloweditor_assets"]()
        )
    with second.test_request_context("/"):
        assert "/second/olloweditor.css" in str(
            second.jinja_env.globals["olloweditor_assets"]()
        )


def test_textarea_helper_escapes_content_and_attributes() -> None:
    app = create_app()
    OllowEditor(app)
    with app.test_request_context("/"):
        html = str(
            app.jinja_env.globals["olloweditor_textarea"](
                "content",
                '<script>alert("x")</script>',
                id='content"><svg',
                options={"theme": "auto", "label": "<bad>"},
                attrs={"class": "editor", "data-note": '"quoted" & special'},
            )
        )
    assert 'data-olloweditor="true"' in html
    assert "<script>" not in html
    assert "&lt;script&gt;" in html
    assert "&#34;" in html
    assert "&amp;" in html
    assert _extract_options(html) == {"theme": "auto", "label": "<bad>"}


def test_request_form_usage_example() -> None:
    app = create_app()
    OllowEditor(app)

    @app.post("/submit")
    def submit() -> str:
        from flask import request

        return request.form["content"]

    client = app.test_client()
    response = client.post("/submit", data={"content": "<p>Article</p>"})
    assert response.data == b"<p>Article</p>"


def test_helper_available_in_template() -> None:
    app = create_app()
    OllowEditor(app)
    with app.test_request_context("/"):
        rendered = render_template_string("{{ olloweditor_assets() }}")
    assert "/olloweditor/olloweditor.css" in rendered


def _image_file(name: str = "image.png") -> tuple[BytesIO, str]:
    buffer = BytesIO()
    Image.new("RGB", (8, 8), (10, 20, 30)).save(buffer, format="PNG")
    buffer.seek(0)
    return buffer, name


def test_upload_endpoints_are_injected_into_textarea_options() -> None:
    app = create_app(
        config={
            "OLLOWEDITOR_UPLOADS_ENABLED": True,
            "OLLOWEDITOR_UPLOAD_AUTH_REQUIRED": False,
        }
    )
    OllowEditor(app)
    with app.test_request_context("/"):
        html = str(app.jinja_env.globals["olloweditor_textarea"]("content"))
    options = _extract_options(html)
    assert options["upload"]["imageUrl"] == "/olloweditor/upload/image/"
    assert options["upload"]["galleryUrl"] == "/olloweditor/upload/gallery/"
    assert options["upload"]["attachmentUrl"] == "/olloweditor/upload/attachment/"
    assert options["upload"]["allowBase64"] is False
    assert options["upload"]["allowFallback"] is False


def test_upload_requires_auth_by_default() -> None:
    app = create_app(config={"OLLOWEDITOR_UPLOADS_ENABLED": True})
    OllowEditor(app)
    client = app.test_client()
    file_obj, name = _image_file()
    response = client.post(
        "/olloweditor/upload/image/",
        data={"file": (file_obj, name)},
        content_type="multipart/form-data",
    )
    assert response.status_code == 401


def test_upload_auth_and_permission_hooks_are_enforced() -> None:
    state = {"auth": False, "perm": False}
    app = create_app(
        config={
            "OLLOWEDITOR_UPLOADS_ENABLED": True,
            "OLLOWEDITOR_UPLOAD_AUTH_REQUIRED": True,
            "OLLOWEDITOR_UPLOAD_PERMISSION_REQUIRED": True,
            "OLLOWEDITOR_AUTH_CHECK": lambda: state["auth"],
            "OLLOWEDITOR_PERMISSION_CHECK": lambda: state["perm"],
        }
    )
    OllowEditor(app)
    client = app.test_client()
    file_obj, name = _image_file()
    denied = client.post(
        "/olloweditor/upload/image/",
        data={"file": (file_obj, name)},
        content_type="multipart/form-data",
    )
    assert denied.status_code == 401

    state["auth"] = True
    file_obj, name = _image_file()
    forbidden = client.post(
        "/olloweditor/upload/image/",
        data={"file": (file_obj, name)},
        content_type="multipart/form-data",
    )
    assert forbidden.status_code == 403

    state["perm"] = True
    file_obj, name = _image_file()
    allowed = client.post(
        "/olloweditor/upload/image/",
        data={"file": (file_obj, name)},
        content_type="multipart/form-data",
    )
    assert allowed.status_code == 200


def test_image_gallery_and_attachment_uploads_return_urls() -> None:
    app = create_app(
        config={
            "OLLOWEDITOR_UPLOADS_ENABLED": True,
            "OLLOWEDITOR_UPLOAD_AUTH_REQUIRED": False,
        }
    )
    OllowEditor(app)
    client = app.test_client()

    image_file, image_name = _image_file()
    image_response = client.post(
        "/olloweditor/upload/image/",
        data={"file": (image_file, image_name)},
        content_type="multipart/form-data",
    )
    assert image_response.status_code == 200
    image_payload = image_response.get_json()
    assert image_payload["url"].startswith("/olloweditor/media/olloweditor/images/")
    assert "data:image" not in image_payload["url"]

    gallery_one, gallery_one_name = _image_file("one.png")
    gallery_two, gallery_two_name = _image_file("two.png")
    gallery_response = client.post(
        "/olloweditor/upload/gallery/",
        data={
            "files": [
                (gallery_one, gallery_one_name),
                (gallery_two, gallery_two_name),
            ]
        },
        content_type="multipart/form-data",
    )
    assert gallery_response.status_code == 200
    gallery_payload = gallery_response.get_json()
    assert [item["name"] for item in gallery_payload["files"]] == [
        "one.png",
        "two.png",
    ]

    attachment = BytesIO(b"%PDF-1.4 fake pdf")
    attachment_response = client.post(
        "/olloweditor/upload/attachment/",
        data={"file": (attachment, "report.pdf")},
        content_type="multipart/form-data",
    )
    assert attachment_response.status_code == 200
    attachment_payload = attachment_response.get_json()
    assert attachment_payload["url"].startswith(
        "/olloweditor/media/olloweditor/attachments/"
    )


def test_media_route_serves_uploaded_file() -> None:
    app = create_app(
        config={
            "OLLOWEDITOR_UPLOADS_ENABLED": True,
            "OLLOWEDITOR_UPLOAD_AUTH_REQUIRED": False,
        }
    )
    OllowEditor(app)
    client = app.test_client()
    file_obj, name = _image_file()
    uploaded = client.post(
        "/olloweditor/upload/image/",
        data={"file": (file_obj, name)},
        content_type="multipart/form-data",
    ).get_json()
    response = client.get(uploaded["url"])
    assert response.status_code == 200
    assert response.mimetype == "image/png"


def test_extract_preview_helper_returns_plain_text() -> None:
    preview = extract_olloweditor_text(
        "<h2>Heading</h2><p>Flask <strong>preview</strong> text.</p>",
        max_length=140,
    )
    assert preview == "Heading Flask preview text."
