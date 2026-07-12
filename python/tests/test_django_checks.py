# ruff: noqa: E402

from __future__ import annotations

from django.core.checks import run_checks
from django.test import override_settings


def test_upload_checks_pass_with_default_settings() -> None:
    errors = run_checks(app_configs=None)
    assert not [error for error in errors if error.id.startswith("olloweditor.")]


@override_settings(OLLOWEDITOR={"UPLOADS_ENABLED": True, "UNKNOWN_KEY": True})
def test_invalid_olloweditor_settings_raise_system_check_error() -> None:
    errors = run_checks(app_configs=None)
    assert [error.id for error in errors if error.id == "olloweditor.E001"]


@override_settings(
    OLLOWEDITOR={"UPLOADS_ENABLED": True},
    ROOT_URLCONF="tests.empty_urls",
)
def test_enabled_uploads_require_package_urls() -> None:
    errors = run_checks(app_configs=None)
    assert [error.id for error in errors if error.id == "olloweditor.E002"]
