from __future__ import annotations

import json
import mimetypes
from collections.abc import Mapping
from importlib.resources import as_file
from typing import Any

from markupsafe import Markup, escape

from olloweditor.resources import get_asset_path

try:
    from flask import Blueprint, Flask, abort, current_app, url_for
    from flask.typing import ResponseReturnValue
except ModuleNotFoundError as exc:  # pragma: no cover - exercised via import isolation test
    if exc.name and exc.name.split(".")[0] == "flask":
        raise ImportError(
            'The OllowEditor Flask integration requires Flask. '
            'Install it with `pip install "olloweditor[flask]"`.'
        ) from exc
    raise


class OllowEditor:
    """Flask extension that serves OllowEditor assets and Jinja helpers."""

    def __init__(
        self,
        app: Flask | None = None,
        *,
        url_prefix: str = "/olloweditor",
    ) -> None:
        self.default_url_prefix = url_prefix
        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask) -> None:
        """Register the extension, blueprint, and Jinja helpers on a Flask app."""
        existing = app.extensions.get("olloweditor")
        if existing is not None:
            return

        config = {
            "url_prefix": app.config.get("OLLOWEDITOR_URL_PREFIX", self.default_url_prefix),
        }

        blueprint = Blueprint(
            "olloweditor",
            __name__,
            url_prefix=config["url_prefix"],
        )

        @blueprint.get("/<path:filename>")
        def asset(filename: str) -> ResponseReturnValue:
            try:
                traversable = get_asset_path(filename)
            except (FileNotFoundError, ValueError):
                abort(404)

            mimetype, _ = mimetypes.guess_type(filename)
            with as_file(traversable) as local_path:
                with open(local_path, "rb") as asset_file:
                    return current_app.response_class(
                        asset_file.read(),
                        mimetype=mimetype or "application/octet-stream",
                    )

        if blueprint.name not in app.blueprints:
            app.register_blueprint(blueprint)

        app.extensions["olloweditor"] = self
        app.extensions["olloweditor_config"] = config
        app.jinja_env.globals["olloweditor_assets"] = self._make_assets_helper()
        app.jinja_env.globals["olloweditor_textarea"] = self._make_textarea_helper()

    @staticmethod
    def _make_assets_helper():
        def olloweditor_assets() -> Markup:
            css_url = url_for("olloweditor.asset", filename="olloweditor.css")
            browser_url = url_for("olloweditor.asset", filename="olloweditor.browser.js")
            init_url = url_for("olloweditor.asset", filename="olloweditor-init.js")
            html = (
                f'<link rel="stylesheet" href="{escape(css_url)}">\n'
                f'<script src="{escape(browser_url)}"></script>\n'
                f'<script src="{escape(init_url)}"></script>'
            )
            return Markup(html)

        return olloweditor_assets

    @staticmethod
    def _make_textarea_helper():
        def olloweditor_textarea(
            name: str,
            value: str = "",
            *,
            id: str | None = None,
            options: Mapping[str, Any] | None = None,
            attrs: Mapping[str, Any] | None = None,
        ) -> Markup:
            attributes: dict[str, Any] = dict(attrs or {})
            attributes["name"] = name
            if id is not None:
                attributes["id"] = id
            attributes["data-olloweditor"] = "true"
            if options:
                attributes["data-olloweditor-options"] = json.dumps(
                    dict(options), ensure_ascii=True, separators=(",", ":")
                )

            rendered_attrs = " ".join(
                f'{escape(str(key))}="{escape(str(val))}"'
                for key, val in attributes.items()
                if val is not None
            )
            html = f"<textarea {rendered_attrs}>{escape(value)}</textarea>"
            return Markup(html)

        return olloweditor_textarea
