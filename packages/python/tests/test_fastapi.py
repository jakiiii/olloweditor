from __future__ import annotations

import json
import re
from html import unescape
from io import BytesIO

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.templating import Jinja2Templates
from fastapi.testclient import TestClient
from jinja2 import DictLoader

from olloweditor.integrations.fastapi import (
    OllowEditorFastAPI,
    mount_olloweditor,
    olloweditor_assets,
    olloweditor_textarea,
)
from olloweditor.previews import extract_olloweditor_text

DATA_OPTIONS_RE = re.compile(r'data-olloweditor-options="([^"]+)"')


def create_app(
    *, path: str = "/olloweditor/static", name: str = "olloweditor_static"
) -> FastAPI:
    app = FastAPI()
    mount_olloweditor(app, path=path, name=name)
    return app


def _extract_options(html: str) -> dict[str, object]:
    match = DATA_OPTIONS_RE.search(html)
    assert match is not None
    return json.loads(unescape(match.group(1)))


def test_asset_mount() -> None:
    app = create_app()
    assert mount_olloweditor(app) == "/olloweditor/static"


def test_css_response() -> None:
    client = TestClient(create_app())
    response = client.get("/olloweditor/static/olloweditor.css")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/css")
    assert ".nw-editor" in response.text


def test_javascript_responses() -> None:
    client = TestClient(create_app())

    browser = client.get("/olloweditor/static/olloweditor.browser.js")
    init = client.get("/olloweditor/static/olloweditor-init.js")

    assert browser.status_code == 200
    assert "javascript" in browser.headers["content-type"]
    assert "OllowEditor" in browser.text
    assert init.status_code == 200
    assert "javascript" in init.headers["content-type"]
    assert "bootOllowEditor" in init.text


def test_missing_asset() -> None:
    client = TestClient(create_app())
    response = client.get("/olloweditor/static/missing.js")
    assert response.status_code == 404


def test_custom_mount_path() -> None:
    client = TestClient(create_app(path="/assets/editor"))
    response = client.get("/assets/editor/olloweditor.css")
    assert response.status_code == 200


def test_generated_asset_tags() -> None:
    html = str(olloweditor_assets())
    assert "/olloweditor/static/olloweditor.css" in html
    assert "/olloweditor/static/olloweditor.browser.js" in html
    assert "/olloweditor/static/olloweditor-init.js" in html
    assert (
        html.index("olloweditor.css")
        < html.index("olloweditor.browser.js")
        < html.index("olloweditor-init.js")
    )


def test_trailing_slash_normalization() -> None:
    app = FastAPI()
    mount_path = mount_olloweditor(app, path="/assets/editor/")
    assert mount_path == "/assets/editor"
    client = TestClient(app)
    response = client.get("/assets/editor/olloweditor.css")
    assert response.status_code == 200
    assert "/assets/editor/olloweditor.browser.js" in str(
        olloweditor_assets("/assets/editor/")
    )


def test_duplicate_mount_behavior_returns_existing_mount() -> None:
    app = FastAPI()
    first = mount_olloweditor(app)
    second = mount_olloweditor(app)
    assert first == second == "/olloweditor/static"


def test_duplicate_mount_conflicts_raise() -> None:
    app = FastAPI()
    mount_olloweditor(app, path="/assets/editor", name="editor_assets")

    try:
        mount_olloweditor(app, path="/assets/editor", name="other_name")
    except ValueError as exc:
        assert "already registered" in str(exc)
    else:
        raise AssertionError("Expected duplicate mount path to fail.")

    try:
        mount_olloweditor(app, path="/other/assets", name="editor_assets")
    except ValueError as exc:
        assert "already registered" in str(exc)
    else:
        raise AssertionError("Expected duplicate mount name to fail.")


def test_jinja_rendering() -> None:
    app = create_app()
    templates = Jinja2Templates(directory=".")
    templates.env.globals["olloweditor_assets"] = olloweditor_assets
    templates.env.loader = DictLoader({"inline.html": "{{ olloweditor_assets() }}"})

    @app.get("/", response_class=HTMLResponse)
    def index(request: Request) -> HTMLResponse:
        return templates.TemplateResponse(
            request,
            "inline.html",
            {"request": request},
        )

    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert "/olloweditor/static/olloweditor.css" in response.text


def test_multiple_application_instances() -> None:
    first = TestClient(create_app(path="/first/assets", name="first_assets"))
    second = TestClient(create_app(path="/second/assets", name="second_assets"))
    assert first.get("/first/assets/olloweditor.css").status_code == 200
    assert second.get("/second/assets/olloweditor.css").status_code == 200


def test_textarea_helper_escapes_content_and_attributes() -> None:
    html = str(
        olloweditor_textarea(
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


def test_form_submission_example() -> None:
    app = create_app()

    @app.post("/submit")
    async def submit(request: Request) -> PlainTextResponse:
        form = await request.form()
        return PlainTextResponse(form["content"])

    client = TestClient(app)
    response = client.post("/submit", data={"content": "<p>Article</p>"})
    assert response.status_code == 200
    assert response.text == "<p>Article</p>"


def _image_file(name: str = "image.png") -> tuple[str, BytesIO, str]:
    from PIL import Image

    buffer = BytesIO()
    Image.new("RGB", (8, 8), (10, 20, 30)).save(buffer, format="PNG")
    buffer.seek(0)
    return ("file", buffer, name)


def test_fastapi_integration_installs_upload_routes_and_template_options() -> None:
    app = FastAPI()
    templates = Jinja2Templates(directory=".")
    integration = OllowEditorFastAPI(
        uploads_enabled=True,
        auth_required=False,
    )
    integration.init_app(app, templates=templates)
    html = str(templates.env.globals["olloweditor_textarea"]("content"))
    options = _extract_options(html)
    assert options["upload"]["imageUrl"] == "/olloweditor/upload/image/"
    assert options["upload"]["galleryUrl"] == "/olloweditor/upload/gallery/"
    assert options["upload"]["attachmentUrl"] == "/olloweditor/upload/attachment/"


def test_fastapi_upload_requires_auth_by_default() -> None:
    app = FastAPI()
    OllowEditorFastAPI(uploads_enabled=True).init_app(app)
    client = TestClient(app)
    _, buffer, name = _image_file()
    response = client.post(
        "/olloweditor/upload/image/",
        files={"file": (name, buffer, "image/png")},
    )
    assert response.status_code == 401


def test_fastapi_auth_and_permission_dependencies_are_enforced() -> None:
    state = {"auth": False, "perm": False}

    async def auth_dependency():
        return state["auth"]

    async def permission_dependency():
        return state["perm"]

    app = FastAPI()
    OllowEditorFastAPI(
        uploads_enabled=True,
        auth_required=True,
        auth_dependency=auth_dependency,
        permission_dependency=permission_dependency,
    ).init_app(app)
    client = TestClient(app)
    _, buffer, name = _image_file()
    denied = client.post(
        "/olloweditor/upload/image/",
        files={"file": (name, buffer, "image/png")},
    )
    assert denied.status_code == 401

    state["auth"] = True
    _, buffer, name = _image_file()
    forbidden = client.post(
        "/olloweditor/upload/image/",
        files={"file": (name, buffer, "image/png")},
    )
    assert forbidden.status_code == 403

    state["perm"] = True
    _, buffer, name = _image_file()
    allowed = client.post(
        "/olloweditor/upload/image/",
        files={"file": (name, buffer, "image/png")},
    )
    assert allowed.status_code == 200


def test_fastapi_image_gallery_and_attachment_uploads_return_urls() -> None:
    app = FastAPI()
    OllowEditorFastAPI(uploads_enabled=True, auth_required=False).init_app(app)
    client = TestClient(app)

    _, buffer, name = _image_file()
    image_response = client.post(
        "/olloweditor/upload/image/",
        files={"file": (name, buffer, "image/png")},
    )
    assert image_response.status_code == 200
    image_payload = image_response.json()
    assert image_payload["url"].startswith("/olloweditor/media/olloweditor/images/")

    _, first, first_name = _image_file("one.png")
    _, second, second_name = _image_file("two.png")
    gallery_response = client.post(
        "/olloweditor/upload/gallery/",
        files=[
            ("files", (first_name, first, "image/png")),
            ("files", (second_name, second, "image/png")),
        ],
    )
    assert gallery_response.status_code == 200
    gallery_payload = gallery_response.json()
    assert [item["name"] for item in gallery_payload["files"]] == [
        "one.png",
        "two.png",
    ]

    attachment = BytesIO(b"%PDF-1.4 fake pdf")
    attachment_response = client.post(
        "/olloweditor/upload/attachment/",
        files={"file": ("report.pdf", attachment, "application/pdf")},
    )
    assert attachment_response.status_code == 200
    assert attachment_response.json()["url"].startswith(
        "/olloweditor/media/olloweditor/attachments/"
    )


def test_fastapi_media_mount_serves_uploaded_file() -> None:
    app = FastAPI()
    OllowEditorFastAPI(uploads_enabled=True, auth_required=False).init_app(app)
    client = TestClient(app)
    _, buffer, name = _image_file()
    payload = client.post(
        "/olloweditor/upload/image/",
        files={"file": (name, buffer, "image/png")},
    ).json()
    response = client.get(payload["url"])
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/png")


def test_fastapi_extract_preview_helper_returns_plain_text() -> None:
    preview = extract_olloweditor_text(
        "<h2>Heading</h2><p>FastAPI <strong>preview</strong> text.</p>",
    )
    assert preview == "Heading FastAPI preview text."
