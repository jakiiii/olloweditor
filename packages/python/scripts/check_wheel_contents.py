from __future__ import annotations

import sys
import zipfile
from pathlib import Path

REQUIRED = {
    "olloweditor/static/olloweditor/olloweditor.browser.js",
    "olloweditor/static/olloweditor/olloweditor.css",
    "olloweditor/static/olloweditor/olloweditor-init.js",
}


def check_wheel(path: Path) -> int:
    if not path.exists():
        print(f"Missing wheel: {path}", file=sys.stderr)
        return 1

    with zipfile.ZipFile(path) as wheel:
        names = set(wheel.namelist())
        missing = sorted(REQUIRED - names)
        if missing:
            print(f"{path}: missing required assets", file=sys.stderr)
            for item in missing:
                print(f"  - {item}", file=sys.stderr)
            return 1

        print(f"{path}: OK")
        for item in sorted(REQUIRED):
            size = wheel.getinfo(item).file_size
            if size <= 0:
                print(f"{path}: empty required asset {item}", file=sys.stderr)
                return 1
            print(f"  - {item} ({size} bytes)")
        return 0


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(
            "Usage: python scripts/check_wheel_contents.py dist/*.whl", file=sys.stderr
        )
        return 1

    status = 0
    for arg in argv[1:]:
        status |= check_wheel(Path(arg))
    return status


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
