from __future__ import annotations

from pathlib import Path

from django.apps import AppConfig


class OllowEditorConfig(AppConfig):
    """Django application configuration for OllowEditor static assets."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "olloweditor"
    path = str(Path(__file__).resolve().parent)
    verbose_name = "Ollow Editor"

    def ready(self) -> None:
        """Backfill admin widget defaults and register Django checks."""
        from .integrations.django import checks as _checks  # noqa: F401
        from .integrations.django.fields import _register_admin_widget_default

        _register_admin_widget_default()
