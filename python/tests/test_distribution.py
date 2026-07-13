from __future__ import annotations

import json
import os
import subprocess
import sys
import venv
import zipfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
DIST_REQUIRED = {
    "olloweditor/static/olloweditor/olloweditor.browser.js",
    "olloweditor/static/olloweditor/olloweditor.css",
    "olloweditor/static/olloweditor/olloweditor-init.js",
}


def _venv_python(path: Path) -> Path:
    if sys.platform == "win32":
        return path / "Scripts" / "python.exe"
    return path / "bin" / "python"


def _run(
    command: list[str], *, cwd: Path | None = None, env: dict[str, str] | None = None
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd or ROOT,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )


def _create_venv(path: Path) -> Path:
    venv.EnvBuilder(with_pip=True, clear=True).create(path)
    python = _venv_python(path)
    _run([str(python), "-m", "pip", "install", "--upgrade", "pip"])
    return python


def _check_installation(
    python: Path,
    requirement: str,
    *,
    expected_present: set[str],
    expected_absent: set[str],
) -> None:
    _run([str(python), "-m", "pip", "install", requirement])
    result = _run(
        [
            str(python),
            "-c",
            (
                "import importlib.util, json, olloweditor; "
                "modules = {"
                "name: importlib.util.find_spec(name) is not None for name in "
                "['django', 'rest_framework', 'flask', 'fastapi']}; "
                "print(json.dumps(modules, sort_keys=True))"
            ),
        ]
    )
    installed = json.loads(result.stdout)
    for module_name in expected_present:
        assert installed[module_name] is True
    for module_name in expected_absent:
        assert installed[module_name] is False


@pytest.fixture(scope="session")
def built_distributions(tmp_path_factory: pytest.TempPathFactory) -> tuple[Path, Path]:
    out_dir = tmp_path_factory.mktemp("dist")
    env = os.environ.copy()
    pythonpath = str(ROOT / "src")
    env["PYTHONPATH"] = (
        f"{pythonpath}{os.pathsep}{env['PYTHONPATH']}"
        if env.get("PYTHONPATH")
        else pythonpath
    )
    _run([sys.executable, "-m", "build", "--outdir", str(out_dir)], env=env)
    wheel = next(out_dir.glob("*.whl"))
    sdist = next(out_dir.glob("*.tar.gz"))
    return wheel, sdist


def test_wheel_contains_required_assets(built_distributions: tuple[Path, Path]) -> None:
    wheel, _ = built_distributions
    with zipfile.ZipFile(wheel) as archive:
        names = set(archive.namelist())
        assert DIST_REQUIRED.issubset(names)
        for filename in DIST_REQUIRED:
            assert archive.getinfo(filename).file_size > 0


def test_base_wheel_installation_is_framework_isolated(
    built_distributions: tuple[Path, Path], tmp_path: Path
) -> None:
    wheel, _ = built_distributions
    python = _create_venv(tmp_path / "base-wheel")
    _check_installation(
        python,
        str(wheel),
        expected_present=set(),
        expected_absent={"django", "rest_framework", "flask", "fastapi"},
    )


@pytest.mark.parametrize(
    ("extra", "expected_present", "expected_absent"),
    [
        ("django", {"django"}, {"rest_framework", "flask", "fastapi"}),
        ("drf", {"django", "rest_framework"}, {"flask", "fastapi"}),
        ("flask", {"flask"}, {"django", "rest_framework", "fastapi"}),
        ("fastapi", {"fastapi"}, {"django", "rest_framework", "flask"}),
        ("all", {"django", "rest_framework", "flask", "fastapi"}, set()),
    ],
)
def test_optional_extras_install_independently(
    built_distributions: tuple[Path, Path],
    tmp_path: Path,
    extra: str,
    expected_present: set[str],
    expected_absent: set[str],
) -> None:
    wheel, _ = built_distributions
    python = _create_venv(tmp_path / f"extra-{extra}")
    _check_installation(
        python,
        f"olloweditor[{extra}] @ {wheel.as_uri()}",
        expected_present=expected_present,
        expected_absent=expected_absent,
    )


def test_source_distribution_installation_works(
    built_distributions: tuple[Path, Path], tmp_path: Path
) -> None:
    _, sdist = built_distributions
    python = _create_venv(tmp_path / "base-sdist")
    _check_installation(
        python,
        str(sdist),
        expected_present=set(),
        expected_absent={"django", "rest_framework", "flask", "fastapi"},
    )
