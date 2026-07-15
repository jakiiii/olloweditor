from __future__ import annotations

from olloweditor.resources import asset_exists, get_asset_path, get_static_root


def test_static_root_resolves() -> None:
    root = get_static_root()
    assert root.is_dir()
    assert root.name == "olloweditor"


def test_expected_assets_exist() -> None:
    assert asset_exists("olloweditor.browser.js") is True
    assert asset_exists("olloweditor.css") is True
    assert asset_exists("olloweditor-init.js") is True


def test_asset_path_returns_traversable() -> None:
    asset = get_asset_path("olloweditor.browser.js")
    assert asset.is_file()
    assert asset.name == "olloweditor.browser.js"


def test_unsafe_path_is_rejected() -> None:
    try:
        get_asset_path("../secret")
    except ValueError as exc:
        assert "path traversal" in str(exc)
    else:
        raise AssertionError("Expected ValueError for unsafe asset path")


def test_empty_asset_name_is_rejected() -> None:
    try:
        get_asset_path("")
    except ValueError as exc:
        assert "must not be empty" in str(exc)
    else:
        raise AssertionError("Expected ValueError for empty asset path")


def test_missing_asset_reports_clearly() -> None:
    try:
        get_asset_path("missing.js")
    except FileNotFoundError as exc:
        assert "OllowEditor asset not found: missing.js" in str(exc)
    else:
        raise AssertionError("Expected FileNotFoundError for missing asset")
