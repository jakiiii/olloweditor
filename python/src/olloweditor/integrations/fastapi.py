from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

from markupsafe import Markup, escape

try:
    from fastapi import FastAPI
    from starlette.routing import Mount
    from starlette.staticfiles import StaticFiles
except ModuleNotFoundError as exc:  # pragma: no cover - exercised via import isolation test
    if exc.name and exc.name.split(".")[0] in {"fastapi", "starlette"}:
        raise ImportError(
            "The OllowEditor FastAPI integration requires FastAPI and Starlette. "
            'Install it with `pip install "olloweditor[fastapi]"`.'
        ) from exc
    raise


def _normalize_mount_path(path: str) -> str:
    if not isinstance(path, str):
        raise TypeError("Mount path must be a string.")

    normalized = path.strip()
    if not normalized:
        raise ValueError("Mount path must not be empty.")
    if not normalized.startswith("/"):
        raise ValueError(f"Mount path must start with '/': {path!r}")
    if normalized == "/":
        raise ValueError("Mount path must not be the application root.")

    normalized = normalized.rstrip("/") or "/"
    if "//" in normalized:
        raise ValueError(f"Mount path must not contain empty path segments: {path!r}")

    return normalized


def mount_olloweditor(
    app: FastAPI,
    path: str = "/olloweditor/static",
    name: str = "olloweditor_static",
) -> str:
    """Mount packaged OllowEditor assets on a FastAPI application."""
    mount_path = _normalize_mount_path(path)

    for route in app.router.routes:
        if isinstance(route, Mount):
            if route.path == mount_path and route.name == name:
                return mount_path
            if route.path == mount_path:
                raise ValueError(
                    f"Mount path {mount_path!r} is already registered with name {route.name!r}."
                )
            if route.name == name:
                raise ValueError(
                    f"Mount name {name!r} is already registered for path {route.path!r}."
                )

    app.mount(
        mount_path,
        StaticFiles(packages=[("olloweditor", "static/olloweditor")], check_dir=False),
        name=name,
    )
    return mount_path


def olloweditor_assets(path: str = "/olloweditor/static") -> Markup:
    """Render HTML tags for the packaged OllowEditor browser assets."""
    mount_path = _normalize_mount_path(path)
    html = (
        f'<link rel="stylesheet" href="{escape(f"{mount_path}/olloweditor.css")}">\n'
        f'<script src="{escape(f"{mount_path}/olloweditor.browser.js")}"></script>\n'
        f'<script src="{escape(f"{mount_path}/olloweditor-init.js")}"></script>'
    )
    return Markup(html)


def olloweditor_textarea(
    name: str,
    value: str = "",
    *,
    id: str | None = None,
    options: Mapping[str, Any] | None = None,
    attrs: Mapping[str, Any] | None = None,
) -> Markup:
    """Render a textarea configured for shared OllowEditor auto-initialization."""
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
