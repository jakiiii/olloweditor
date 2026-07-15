from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

PYPI_JSON_URL = "https://pypi.org/pypi/{name}/json"
TESTPYPI_JSON_URL = "https://test.pypi.org/pypi/{name}/json"


@dataclass(frozen=True)
class IndexStatus:
    label: str
    package_exists: bool
    version_exists: bool


def fetch_releases(url_template: str, name: str) -> dict[str, object] | None:
    url = url_template.format(name=name)
    try:
        with urlopen(url, timeout=10) as response:  # noqa: S310
            return json.load(response)
    except HTTPError as exc:
        if exc.code == 404:
            return None
        raise
    except URLError as exc:
        raise SystemExit(f"Failed to reach {url}: {exc}") from exc


def check_index(label: str, url_template: str, name: str, version: str) -> IndexStatus:
    payload = fetch_releases(url_template, name)
    if payload is None:
        return IndexStatus(label=label, package_exists=False, version_exists=False)

    releases = payload.get("releases", {})
    return IndexStatus(
        label=label,
        package_exists=True,
        version_exists=version in releases,
    )


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(
            "Usage: python scripts/check_pypi_status.py <package-name> <version>",
            file=sys.stderr,
        )
        return 1

    package_name, version = argv[1], argv[2]
    statuses = [
        check_index("PyPI", PYPI_JSON_URL, package_name, version),
        check_index("TestPyPI", TESTPYPI_JSON_URL, package_name, version),
    ]

    for status in statuses:
        package_state = "exists" if status.package_exists else "available"
        version_state = "published" if status.version_exists else "not published"
        print(
            f"{status.label}: package {package_state}; "
            f"version {version} {version_state}"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
