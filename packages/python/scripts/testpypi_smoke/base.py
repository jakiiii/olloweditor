from __future__ import annotations

from pathlib import Path

from common import (
    emit,
    ensure_installed_package,
    require_distribution_absent,
    venv_prefix,
)

from olloweditor.resources import asset_exists, get_asset_path, get_static_root


def main() -> None:
    package_info = ensure_installed_package()

    for distribution in ("django", "djangorestframework", "flask", "fastapi"):
        require_distribution_absent(distribution)

    static_root = get_static_root()
    browser_asset = get_asset_path("olloweditor.browser.js")
    css_asset = get_asset_path("olloweditor.css")
    init_asset = get_asset_path("olloweditor-init.js")

    browser_text = browser_asset.read_text(encoding="utf8")
    css_text = css_asset.read_text(encoding="utf8")
    init_text = init_asset.read_text(encoding="utf8")

    missing_error = None
    traversal_error = None
    try:
        get_asset_path("missing.js")
    except FileNotFoundError as exc:
        missing_error = str(exc)

    try:
        get_asset_path("../secret")
    except ValueError as exc:
        traversal_error = str(exc)

    emit(
        {
            "asset_exists": {
                "browser": asset_exists("olloweditor.browser.js"),
                "css": asset_exists("olloweditor.css"),
                "init": asset_exists("olloweditor-init.js"),
            },
            "assets": {
                "browser": {
                    "name": Path(browser_asset.name).name,
                    "size": len(browser_text.encode("utf8")),
                },
                "css": {
                    "name": Path(css_asset.name).name,
                    "size": len(css_text.encode("utf8")),
                },
                "init": {
                    "name": Path(init_asset.name).name,
                    "size": len(init_text.encode("utf8")),
                },
            },
            "checks": {
                "browser_global": "OllowEditor" in browser_text,
                "css_non_empty": bool(css_text.strip()),
                "initializer_contains_boot_helper": "bootOllowEditor" in init_text,
                "missing_asset_error": missing_error,
                "path_traversal_error": traversal_error,
            },
            "package": package_info,
            "static_root": str(static_root),
            "venv_prefix": venv_prefix(),
        }
    )


if __name__ == "__main__":
    main()
