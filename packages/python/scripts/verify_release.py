from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST_ROOT = ROOT / "python-dist"
STATIC_ROOT = ROOT / "src" / "olloweditor" / "static" / "olloweditor"
REQUIRED_ASSETS = (
    "olloweditor.browser.js",
    "olloweditor.css",
    "olloweditor-init.js",
)


def run(command: list[str]) -> None:
    print(f"+ {' '.join(command)}")
    subprocess.run(command, cwd=ROOT, check=True)


def verify_packaged_assets() -> None:
    manifest_path = STATIC_ROOT / ".asset-manifest.json"
    if not manifest_path.exists():
        raise SystemExit(f"Missing asset manifest: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf8"))
    manifest_files = set(manifest.get("files", []))
    for filename in REQUIRED_ASSETS:
        asset_path = STATIC_ROOT / filename
        if not asset_path.exists():
            raise SystemExit(f"Missing packaged asset: {asset_path}")
        if asset_path.stat().st_size <= 0:
            raise SystemExit(f"Packaged asset is empty: {asset_path}")

    for filename in manifest_files:
        asset_path = STATIC_ROOT / filename
        if not asset_path.exists():
            raise SystemExit(f"Manifest references missing asset: {asset_path}")


def main() -> int:
    try:
        verify_packaged_assets()
        run([sys.executable, "-m", "pytest"])
        run([sys.executable, "-m", "ruff", "check", "."])
        run([sys.executable, "-m", "ruff", "format", "--check", "."])
        run([sys.executable, "-m", "mypy", "src"])
        shutil.rmtree(DIST_ROOT, ignore_errors=True)
        run([sys.executable, "-m", "build", "--outdir", str(DIST_ROOT)])

        distributions = sorted(DIST_ROOT.glob("*"))
        if not distributions:
            raise SystemExit("No distributions were built.")

        run(
            [
                sys.executable,
                "-m",
                "twine",
                "check",
                *[str(path) for path in distributions],
            ]
        )

        wheels = sorted(DIST_ROOT.glob("*.whl"))
        if not wheels:
            raise SystemExit("No wheel found in python-dist/.")
        run(
            [
                sys.executable,
                str(ROOT / "scripts" / "check_wheel_contents.py"),
                *[str(path) for path in wheels],
            ]
        )
        run(
            [
                sys.executable,
                str(ROOT / "scripts" / "verify_wheel_installs.py"),
                str(wheels[0]),
            ]
        )
    except subprocess.CalledProcessError as exc:
        return exc.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
