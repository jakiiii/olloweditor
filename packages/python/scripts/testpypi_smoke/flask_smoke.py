from __future__ import annotations

from common import (
    emit,
    ensure_installed_package,
    require_distribution_present,
    venv_prefix,
)
from flask import Flask, render_template_string, request

from olloweditor.integrations.flask import OllowEditor


def create_app(*, prefix: str | None = None) -> Flask:
    app = Flask(__name__)
    if prefix is not None:
        app.config["OLLOWEDITOR_URL_PREFIX"] = prefix
    return app


def main() -> None:
    package_info = ensure_installed_package()
    flask_version = require_distribution_present("flask")

    direct_app = create_app()
    direct_extension = OllowEditor(direct_app)

    delayed_app = create_app(prefix="/assets/editor")
    delayed_extension = OllowEditor()
    delayed_extension.init_app(delayed_app)

    @direct_app.post("/submit")
    def submit() -> str:
        return request.form["content"]

    client = direct_app.test_client()
    css = client.get("/olloweditor/olloweditor.css")
    browser = client.get("/olloweditor/olloweditor.browser.js")
    initializer = client.get("/olloweditor/olloweditor-init.js")
    submitted = client.post(
        "/submit", data={"content": "<p>TestPyPI Flask content</p>"}
    )

    with direct_app.test_request_context("/"):
        assets_html = str(direct_app.jinja_env.globals["olloweditor_assets"]())
        textarea_html = str(
            direct_app.jinja_env.globals["olloweditor_textarea"](
                "content",
                "<p>Escaped</p>",
                options={"theme": "auto"},
                attrs={"class": "editor"},
            )
        )
        rendered_helper = render_template_string("{{ olloweditor_assets() }}")

    with delayed_app.test_request_context("/"):
        delayed_assets_html = str(delayed_app.jinja_env.globals["olloweditor_assets"]())

    emit(
        {
            "checks": {
                "asset_blueprint_registered": "olloweditor" in direct_app.blueprints,
                "assets_helper_html": assets_html,
                "browser_response": {
                    "status": browser.status_code,
                    "content_type": browser.mimetype,
                    "contains_global": "OllowEditor" in browser.get_data(as_text=True),
                },
                "css_response": {
                    "status": css.status_code,
                    "content_type": css.mimetype,
                    "non_empty": bool(css.get_data(as_text=True).strip()),
                },
                "delayed_assets_helper_html": delayed_assets_html,
                "direct_extension_registered": direct_app.extensions["olloweditor"]
                is direct_extension,
                "initializer_response": {
                    "status": initializer.status_code,
                    "content_type": initializer.mimetype,
                    "contains_boot_helper": "bootOllowEditor"
                    in initializer.get_data(as_text=True),
                },
                "request_form_value": submitted.get_data(as_text=True),
                "template_helper_available": "/olloweditor/olloweditor.css"
                in rendered_helper,
                "textarea_helper": textarea_html,
            },
            "flask_version": flask_version,
            "package": package_info,
            "venv_prefix": venv_prefix(),
        }
    )


if __name__ == "__main__":
    main()
