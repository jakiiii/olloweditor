from __future__ import annotations

import json
import re
from pathlib import PurePosixPath

from olloweditor.resources import asset_exists, get_asset_path

CSS_URL_RE = re.compile(r"url\((?P<quote>['\"]?)(?P<path>[^)\"']+)(?P=quote)\)")


def test_browser_bundle_is_readable_and_contains_global() -> None:
    content = get_asset_path("olloweditor.browser.js").read_text(encoding="utf8")
    assert content
    assert "OllowEditor" in content
    assert "window.OllowEditor" in content


def test_css_bundle_is_readable_and_non_empty() -> None:
    content = get_asset_path("olloweditor.css").read_text(encoding="utf8")
    assert content
    assert ".nw-editor" in content


def test_initializer_bundle_is_readable_and_non_empty() -> None:
    content = get_asset_path("olloweditor-init.js").read_text(encoding="utf8")
    assert content
    assert "bootOllowEditor" in content


def test_css_asset_references_resolve_within_package() -> None:
    content = get_asset_path("olloweditor.css").read_text(encoding="utf8")
    for match in CSS_URL_RE.finditer(content):
        path = match.group("path").strip()
        if not path or path.startswith(("data:", "http:", "https:", "#")):
            continue
        normalized = PurePosixPath(path)
        assert ".." not in normalized.parts
        assert asset_exists(str(normalized)), f"Missing CSS asset reference: {path}"


def test_asset_manifest_matches_packaged_assets() -> None:
    manifest = json.loads(
        get_asset_path(".asset-manifest.json").read_text(encoding="utf8")
    )
    files = manifest["files"]
    assert "olloweditor.browser.js" in files
    assert "olloweditor.css" in files
    for filename in files:
        assert asset_exists(filename), f"Manifest references missing asset: {filename}"


def test_packaged_assets_are_non_empty() -> None:
    for filename in (
        "olloweditor.browser.js",
        "olloweditor.css",
        "olloweditor-init.js",
    ):
        asset = get_asset_path(filename)
        assert asset.read_bytes(), f"Expected non-empty asset: {filename}"
