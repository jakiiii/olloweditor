from __future__ import annotations

import subprocess
import sys
from textwrap import dedent

import olloweditor


def _run_python(code: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-c", dedent(code)],
        check=True,
        capture_output=True,
        text=True,
    )


def test_import_package() -> None:
    assert olloweditor is not None


def test_base_import_does_not_import_optional_frameworks() -> None:
    result = _run_python(
        """
        import sys
        import olloweditor
        print(
            "django" in sys.modules,
            "rest_framework" in sys.modules,
            "flask" in sys.modules,
            "fastapi" in sys.modules,
        )
        """
    )
    assert result.stdout.strip() == "False False False False"


def test_version_available() -> None:
    assert isinstance(olloweditor.__version__, str)
    assert olloweditor.__version__


def test_framework_modules_raise_clear_import_errors_without_dependencies() -> None:
    cases = [
        (
            "olloweditor.integrations.django",
            {"django"},
            'Install it with `pip install "olloweditor[django]"`.',
        ),
        (
            "olloweditor.integrations.drf",
            {"rest_framework"},
            'Install it with `pip install "olloweditor[drf]"`.',
        ),
        (
            "olloweditor.integrations.flask",
            {"flask"},
            'Install it with `pip install "olloweditor[flask]"`.',
        ),
        (
            "olloweditor.integrations.fastapi",
            {"fastapi", "starlette"},
            'Install it with `pip install "olloweditor[fastapi]"`.',
        ),
    ]
    for module_name, blocked, expected in cases:
        result = _run_python(
            f"""
            import builtins
            import importlib

            blocked = {sorted(blocked)!r}
            real_import = builtins.__import__

            def fake_import(name, globals=None, locals=None, fromlist=(), level=0):
                if name.split(".")[0] in blocked:
                    error = ModuleNotFoundError(f"No module named '{{name}}'")
                    error.name = name
                    raise error
                return real_import(name, globals, locals, fromlist, level)

            builtins.__import__ = fake_import

            try:
                importlib.import_module({module_name!r})
            except ImportError as exc:
                print(str(exc))
            else:
                raise SystemExit("expected ImportError")
            """
        )
        assert expected in result.stdout.strip()
