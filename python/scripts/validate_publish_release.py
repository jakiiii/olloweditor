from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from check_pypi_status import PYPI_JSON_URL, check_index

ROOT = Path(__file__).resolve().parents[2]
PYTHON_ROOT = ROOT / "python"
PYPROJECT_PATH = PYTHON_ROOT / "pyproject.toml"
PACKAGE_JSON_PATH = ROOT / "package.json"
PACKAGE_NAME = "olloweditor"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate release tag, version alignment, and PyPI availability.",
    )
    parser.add_argument(
        "--release-tag",
        required=True,
        help="Release tag to validate, for example v0.1.0.",
    )
    parser.add_argument(
        "--skip-git-check",
        action="store_true",
        help="Skip the exact-match git tag check. Useful for local dry runs.",
    )
    parser.add_argument(
        "--skip-pypi-check",
        action="store_true",
        help="Skip the PyPI version availability check.",
    )
    return parser.parse_args()


def read_pyproject_version() -> str:
    import tomllib

    with PYPROJECT_PATH.open("rb") as handle:
        payload = tomllib.load(handle)
    return str(payload["project"]["version"])


def read_package_json_version() -> str:
    payload = json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf8"))
    return str(payload["version"])


def require_exact_git_tag(tag_name: str) -> None:
    tag_ref = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", f"refs/tags/{tag_name}"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if tag_ref.returncode != 0:
        raise SystemExit(f"Git tag {tag_name!r} does not exist in this checkout.")

    exact_tag = subprocess.run(
        ["git", "describe", "--tags", "--exact-match", "HEAD"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if exact_tag.returncode != 0:
        raise SystemExit("HEAD is not checked out at an exact git tag.")

    current_tag = exact_tag.stdout.strip()
    if current_tag != tag_name:
        raise SystemExit(
            f"Checked out tag mismatch: expected {tag_name!r}, found {current_tag!r}.",
        )


def validate_tag_format(tag_name: str) -> str:
    if not tag_name.startswith("v") or len(tag_name) < 2:
        raise SystemExit(
            f"Release tag {tag_name!r} is invalid. Expected format like 'v0.1.0'.",
        )
    version = tag_name[1:]
    if any(char.isspace() for char in version):
        raise SystemExit(f"Release tag {tag_name!r} contains invalid whitespace.")
    return version


def validate_versions(
    tag_version: str,
    pyproject_version: str,
    package_version: str,
) -> None:
    if pyproject_version != tag_version:
        raise SystemExit(
            "Python package version mismatch: "
            f"tag={tag_version!r}, pyproject.toml={pyproject_version!r}."
        )
    if package_version != tag_version:
        raise SystemExit(
            "Frontend package version mismatch: "
            f"tag={tag_version!r}, package.json={package_version!r}."
        )


def validate_pypi_availability(version: str) -> None:
    status = check_index("PyPI", PYPI_JSON_URL, PACKAGE_NAME, version)
    if status.version_exists:
        raise SystemExit(
            f"PyPI already has {PACKAGE_NAME} version {version}. "
            "Published versions cannot be overwritten."
        )


def main() -> int:
    args = parse_args()
    tag_version = validate_tag_format(args.release_tag)
    pyproject_version = read_pyproject_version()
    package_version = read_package_json_version()

    validate_versions(tag_version, pyproject_version, package_version)

    if not args.skip_git_check:
        require_exact_git_tag(args.release_tag)

    if not args.skip_pypi_check:
        validate_pypi_availability(tag_version)

    print(
        "Release metadata verified:",
        f"tag={args.release_tag}",
        f"python={pyproject_version}",
        f"npm={package_version}",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
