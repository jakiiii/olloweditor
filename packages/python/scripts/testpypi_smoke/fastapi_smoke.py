from common import (
    emit,
    ensure_installed_package,
    require_distribution_present,
    venv_prefix,
)


def main() -> None:
    package_info = ensure_installed_package()
    fastapi_version = require_distribution_present("fastapi")
    httpx_version = require_distribution_present("httpx")
    multipart_version = require_distribution_present("python-multipart")

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

    app = FastAPI()
    mount_path = mount_olloweditor(app)
    templates = Jinja2Templates(directory=".")
    templates.env.globals["olloweditor_assets"] = olloweditor_assets
    templates.env.globals["olloweditor_textarea"] = olloweditor_textarea
    templates.env.loader = DictLoader(
        {
            "inline.html": "<!DOCTYPE html>\n"
            "<html><head>{{ olloweditor_assets() }}</head><body>\n"
            "{{ olloweditor_textarea('content', '', options={'theme': 'auto'}) }}\n"
            "</body></html>"
        }
    )

    rendered_template = templates.env.get_template("inline.html").render()

    @app.get("/", response_class=HTMLResponse)
    def index() -> HTMLResponse:
        return HTMLResponse(rendered_template)

    @app.post("/submit")
    async def submit(request: Request) -> PlainTextResponse:
        form = await request.form()
        return PlainTextResponse(str(form["content"]))

    client = TestClient(app)
    css = client.get(f"{mount_path}/olloweditor.css")
    browser = client.get(f"{mount_path}/olloweditor.browser.js")
    initializer = client.get(f"{mount_path}/olloweditor-init.js")
    home = client.get("/")
    submitted = client.post(
        "/submit", data={"content": "<p>TestPyPI FastAPI content</p>"}
    )

    template_rendered = (
        "olloweditor.css" in rendered_template
        and 'data-olloweditor="true"' in rendered_template
    )

    if css.status_code != 200 or not css.text.strip():
        raise AssertionError("FastAPI CSS asset did not load correctly.")
    if browser.status_code != 200 or "OllowEditor" not in browser.text:
        raise AssertionError("FastAPI browser bundle did not load correctly.")
    if initializer.status_code != 200 or "bootOllowEditor" not in initializer.text:
        raise AssertionError("FastAPI initializer did not load correctly.")
    if not template_rendered:
        raise AssertionError("FastAPI template helper did not render expected markup.")
    if home.status_code != 200:
        raise AssertionError(f"FastAPI index route failed: {home.status_code}")
    if submitted.status_code != 200:
        raise AssertionError(f"FastAPI form submission failed: {submitted.status_code}")
    if submitted.text != "<p>TestPyPI FastAPI content</p>":
        raise AssertionError(
            "FastAPI form submission did not preserve HTML content. "
            f"Received: {submitted.text!r}"
        )

    emit(
        {
            "checks": {
                "assets_helper_html": str(olloweditor_assets()),
                "browser_response": {
                    "status": browser.status_code,
                    "content_type": browser.headers.get("content-type", ""),
                    "contains_global": "OllowEditor" in browser.text,
                },
                "css_response": {
                    "status": css.status_code,
                    "content_type": css.headers.get("content-type", ""),
                    "non_empty": bool(css.text.strip()),
                },
                "initializer_response": {
                    "status": initializer.status_code,
                    "content_type": initializer.headers.get("content-type", ""),
                    "contains_boot_helper": "bootOllowEditor" in initializer.text,
                },
                "mount_path": mount_path,
                "request_form_value": submitted.text,
                "template_rendered": template_rendered,
            },
            "fastapi_version": fastapi_version,
            "httpx_version": httpx_version,
            "package": package_info,
            "python_multipart_version": multipart_version,
            "venv_prefix": venv_prefix(),
        }
    )


if __name__ == "__main__":
    main()
