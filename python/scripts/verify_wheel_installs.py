from __future__ import annotations

import subprocess
import sys
import tempfile
import venv
from pathlib import Path
from re import sub

ROOT = Path(__file__).resolve().parents[1]


def venv_python(path: Path) -> Path:
    if sys.platform == "win32":
        return path / "Scripts" / "python.exe"
    return path / "bin" / "python"


def run(command: list[str], *, cwd: Path | None = None) -> None:
    print(f"+ {' '.join(command)}")
    subprocess.run(command, cwd=cwd or ROOT, check=True)


def install_and_check(
    wheel: Path,
    requirement: str,
    import_target: str,
    *,
    label: str,
) -> None:
    prefix = f"olloweditor-{sub(r'[^A-Za-z0-9._-]+', '-', label)}-"
    with tempfile.TemporaryDirectory(prefix=prefix) as temp_dir:
        venv_dir = Path(temp_dir) / "venv"
        venv.EnvBuilder(with_pip=True, clear=True).create(venv_dir)
        python = venv_python(venv_dir)
        run([str(python), "-m", "pip", "install", "--upgrade", "pip"])
        run([str(python), "-m", "pip", "install", requirement])
        run([str(python), "-c", f"import {import_target}; print('ok')"])


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(
            "Usage: python scripts/verify_wheel_installs.py dist/<wheel>.whl",
            file=sys.stderr,
        )
        return 1

    wheel = Path(argv[1]).resolve()
    if not wheel.exists():
        print(f"Missing wheel: {wheel}", file=sys.stderr)
        return 1

    install_targets = [
        ("base", str(wheel), "olloweditor"),
        (
            "django",
            f"olloweditor[django] @ {wheel.as_uri()}",
            "olloweditor.integrations.django",
        ),
        (
            "drf",
            f"olloweditor[drf] @ {wheel.as_uri()}",
            "olloweditor.integrations.drf",
        ),
        (
            "flask",
            f"olloweditor[flask] @ {wheel.as_uri()}",
            "olloweditor.integrations.flask",
        ),
        (
            "fastapi",
            f"olloweditor[fastapi] @ {wheel.as_uri()}",
            "olloweditor.integrations.fastapi",
        ),
        ("all", f"olloweditor[all] @ {wheel.as_uri()}", "olloweditor"),
    ]

    for label, requirement, import_target in install_targets:
        install_and_check(wheel, requirement, import_target, label=label)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
