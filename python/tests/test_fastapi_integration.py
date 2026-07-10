from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.templating import Jinja2Templates
from fastapi.testclient import TestClient
from jinja2 import DictLoader

from olloweditor.integrations.fastapi import (
    mount_olloweditor,
    olloweditor_assets,
    olloweditor_textarea,
)


def create_app(*, path: str = "/olloweditor/static", name: str = "olloweditor_static") -> FastAPI:
    app = FastAPI()
    mount_olloweditor(app, path=path, name=name)
    return app


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
    assert html.index("olloweditor.css") < html.index("olloweditor.browser.js") < html.index(
        "olloweditor-init.js"
    )


def test_trailing_slash_normalization() -> None:
    app = FastAPI()
    mount_path = mount_olloweditor(app, path="/assets/editor/")
    assert mount_path == "/assets/editor"
    client = TestClient(app)
    response = client.get("/assets/editor/olloweditor.css")
    assert response.status_code == 200
    assert "/assets/editor/olloweditor.browser.js" in str(olloweditor_assets("/assets/editor/"))


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
