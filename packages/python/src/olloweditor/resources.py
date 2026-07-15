from __future__ import annotations

from importlib import resources
from importlib.resources.abc import Traversable
from pathlib import PurePosixPath

_PACKAGE = "olloweditor"
_STATIC_SUBDIR = ("static", "olloweditor")


def _validate_filename(filename: str) -> PurePosixPath:
    if not isinstance(filename, str):
        raise TypeError("Asset filename must be a string.")
    if not filename:
        raise ValueError("Asset filename must not be empty.")

    candidate = PurePosixPath(filename)
    if candidate.is_absolute():
        raise ValueError(f"Asset filename must be relative: {filename!r}")
    if candidate.name in {"", ".", ".."}:
        raise ValueError(f"Asset filename is invalid: {filename!r}")
    if any(part in {"", ".", ".."} for part in candidate.parts):
        raise ValueError(
            f"Asset filename must not contain path traversal: {filename!r}"
        )

    return candidate


def get_static_root() -> Traversable:
    root = resources.files(_PACKAGE)
    for part in _STATIC_SUBDIR:
        root = root.joinpath(part)
    return root


def get_asset_path(filename: str) -> Traversable:
    relative = _validate_filename(filename)
    asset = get_static_root()
    for part in relative.parts:
        asset = asset.joinpath(part)

    if not asset.is_file():
        raise FileNotFoundError(f"OllowEditor asset not found: {filename}")

    return asset


def asset_exists(filename: str) -> bool:
    relative = _validate_filename(filename)
    asset = get_static_root()
    for part in relative.parts:
        asset = asset.joinpath(part)
    return asset.is_file()
