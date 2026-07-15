from __future__ import annotations

import importlib.util
import json
import sys
import zipfile
from pathlib import Path

import pytest

SCRIPT_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "verify_testpypi_release.py"
)
SPEC = importlib.util.spec_from_file_location("verify_testpypi_release", SCRIPT_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def test_validate_package_name_accepts_and_rejects_expected_values() -> None:
    assert MODULE.validate_package_name("olloweditor") == "olloweditor"
    with pytest.raises(ValueError):
        MODULE.validate_package_name("../olloweditor")


def test_validate_version_accepts_and_rejects_expected_values() -> None:
    assert MODULE.validate_version("0.1.0") == "0.1.0"
    with pytest.raises(ValueError):
        MODULE.validate_version("0.1.0 test")


def test_build_json_report_marks_failed_result() -> None:
    tests = {
        "metadata": MODULE.TestEntry("metadata", "Host", status="passed"),
        "wheel": MODULE.TestEntry("wheel", "Host", status="failed"),
    }
    report = MODULE.build_json_report(
        package="olloweditor",
        version="0.1.0",
        index="https://test.pypi.org/simple/",
        artifact={"filename": "olloweditor-0.1.0-py3-none-any.whl"},
        tests=tests,
        git_commit="deadbeef",
    )
    assert report["result"] == "failed"
    assert report["tests"]["wheel"]["status"] == "failed"


def test_build_markdown_report_contains_expected_decision_lines() -> None:
    tests = {
        key: {
            "name": key,
            "environment": "Host",
            "status": "passed",
            "notes": "",
            "details": {},
            "failure": None,
        }
        for key in (
            "metadata",
            "wheel",
            "base",
            "django",
            "drf",
            "flask",
            "fastapi",
            "all",
            "browser",
            "example_django",
            "example_drf",
            "example_flask",
            "example_fastapi",
            "readme",
        )
    }
    report = {
        "generated_at": "2026-07-11T00:00:00+00:00",
        "git_commit": "deadbeef",
        "package": "olloweditor",
        "version": "0.1.0",
        "index": "https://test.pypi.org/simple/",
        "python": "3.12.3",
        "platform": "linux",
        "artifact": {
            "filename": "olloweditor-0.1.0-py3-none-any.whl",
            "size": 123,
            "sha256": "abc",
            "download_url": "https://test-files.pythonhosted.org/example.whl",
            "sdist_filename": "olloweditor-0.1.0.tar.gz",
            "requires_python": ">=3.10",
            "extras": ["django", "drf", "flask", "fastapi", "all"],
            "asset_sizes": {
                "olloweditor/static/olloweditor/olloweditor.browser.js": 1,
                "olloweditor/static/olloweditor/olloweditor.css": 1,
                "olloweditor/static/olloweditor/olloweditor-init.js": 1,
            },
        },
        "tests": tests,
        "result": "passed",
    }
    markdown = MODULE.build_markdown_report(report)
    assert "GO — TestPyPI verification passed" in markdown
    assert "READY — Proceed to production PyPI" in markdown


def test_inspect_wheel_reads_required_assets_and_metadata(tmp_path: Path) -> None:
    wheel = tmp_path / "olloweditor-0.1.0-py3-none-any.whl"
    metadata = "\n".join(
        [
            "Metadata-Version: 2.1",
            "Name: olloweditor",
            "Version: 0.1.0",
            "Summary: Test package",
            "License: MIT",
            "Requires-Python: >=3.10",
            "Provides-Extra: django",
            "Provides-Extra: drf",
            "Provides-Extra: flask",
            "Provides-Extra: fastapi",
            "Provides-Extra: all",
            "",
        ]
    )
    with zipfile.ZipFile(wheel, "w") as archive:
        archive.writestr("olloweditor/__init__.py", "__version__ = '0.1.0'\n")
        archive.writestr(
            "olloweditor/static/olloweditor/olloweditor.browser.js",
            "window.OllowEditor = {};",
        )
        archive.writestr(
            "olloweditor/static/olloweditor/olloweditor.css",
            ".nw-editor { color: black; }",
        )
        archive.writestr(
            "olloweditor/static/olloweditor/olloweditor-init.js",
            'textarea[data-olloweditor="true"]; bootOllowEditor();',
        )
        archive.writestr("olloweditor-0.1.0.dist-info/METADATA", metadata)

    inspected = MODULE.inspect_wheel(wheel)
    assert inspected["metadata"]["name"] == "olloweditor"
    assert inspected["metadata"]["version"] == "0.1.0"
    assert inspected["bundle_has_global"] is True


def test_readme_report_json_round_trip_is_serializable() -> None:
    payload = MODULE.build_json_report(
        package="olloweditor",
        version="0.1.0",
        index="https://test.pypi.org/simple/",
        artifact={"filename": "olloweditor-0.1.0-py3-none-any.whl"},
        tests={"metadata": MODULE.TestEntry("metadata", "Host", status="passed")},
        git_commit="deadbeef",
    )
    serialized = json.dumps(payload)
    assert "olloweditor" in serialized
