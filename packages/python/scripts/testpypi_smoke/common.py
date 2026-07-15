from __future__ import annotations

import importlib.metadata
import json
import os
import sys
from pathlib import Path
from typing import Any


def emit(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, indent=2, sort_keys=True))


def ensure_installed_package(package: str = "olloweditor") -> dict[str, str]:
    module = __import__(package)
    package_file = Path(module.__file__).resolve()
    repo_root = os.environ.get("OLLOWEDITOR_REPO_ROOT", "")
    if repo_root and str(package_file).startswith(str(Path(repo_root).resolve())):
        raise AssertionError(
            f"{package} imported from repository source instead of site-packages: "
            f"{package_file}"
        )
    if "site-packages" not in str(package_file):
        raise AssertionError(
            f"{package} did not import from site-packages: {package_file}"
        )
    return {
        "module_file": str(package_file),
        "version": getattr(module, "__version__", "<missing>"),
    }


def installed_distributions() -> dict[str, str]:
    distributions: dict[str, str] = {}
    for dist in importlib.metadata.distributions():
        name = dist.metadata.get("Name")
        if not name:
            continue
        distributions[name.lower()] = dist.version
    return distributions


def require_distribution_absent(name: str) -> None:
    normalized = name.lower()
    if normalized in installed_distributions():
        raise AssertionError(f"Distribution unexpectedly installed: {name}")


def require_distribution_present(name: str) -> str:
    normalized = name.lower()
    distributions = installed_distributions()
    if normalized not in distributions:
        raise AssertionError(f"Distribution not installed: {name}")
    return distributions[normalized]


def venv_prefix() -> str:
    return sys.prefix
