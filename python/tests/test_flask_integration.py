from __future__ import annotations

from flask import Flask, render_template_string

from olloweditor.integrations.flask import OllowEditor


def create_app(*, prefix: str | None = None) -> Flask:
    app = Flask(__name__)
    if prefix is not None:
        app.config["OLLOWEDITOR_URL_PREFIX"] = prefix
    return app


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
    assert rendered.index("olloweditor.css") < rendered.index("olloweditor.browser.js") < rendered.index("olloweditor-init.js")


def test_css_response() -> None:
    app = create_app()
    OllowEditor(app)
    client = app.test_client()
    response = client.get("/olloweditor/olloweditor.css")
    assert response.status_code == 200
    assert b".nw-editor" in response.data


def test_javascript_responses() -> None:
    app = create_app()
    OllowEditor(app)
    client = app.test_client()
    browser = client.get("/olloweditor/olloweditor.browser.js")
    init = client.get("/olloweditor/olloweditor-init.js")
    assert browser.status_code == 200
    assert b"OllowEditor" in browser.data
    assert init.status_code == 200
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
        assert "/first/olloweditor.css" in str(first.jinja_env.globals["olloweditor_assets"]())
    with second.test_request_context("/"):
        assert "/second/olloweditor.css" in str(second.jinja_env.globals["olloweditor_assets"]())


def test_textarea_helper_escapes_content_and_attributes() -> None:
    app = create_app()
    OllowEditor(app)
    with app.test_request_context("/"):
        html = str(
            app.jinja_env.globals["olloweditor_textarea"](
                "content",
                '<script>alert("x")</script>',
                id='content"><svg',
                options={"theme": "auto", "label": '<bad>'},
                attrs={"class": "editor", "data-note": '"quoted" & special'},
            )
        )
    assert 'data-olloweditor="true"' in html
    assert "<script>" not in html
    assert "&lt;script&gt;" in html
    assert "&#34;" in html
    assert "&amp;" in html
    assert 'data-olloweditor-options="{&#34;theme&#34;:&#34;auto&#34;,&#34;label&#34;:&#34;&lt;bad&gt;&#34;}"' in html or 'data-olloweditor-options="{&#34;label&#34;:&#34;&lt;bad&gt;&#34;,&#34;theme&#34;:&#34;auto&#34;}"' in html


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
