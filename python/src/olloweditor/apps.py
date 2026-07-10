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
        """Register admin widget defaults for OllowEditorField."""
        from django.contrib.admin import options as admin_options

        from .integrations.django.fields import OllowEditorField
        from .integrations.django.widgets import OllowEditorWidget

        existing = admin_options.FORMFIELD_FOR_DBFIELD_DEFAULTS.get(OllowEditorField, {})
        merged = {"widget": OllowEditorWidget}
        merged.update(existing)
        admin_options.FORMFIELD_FOR_DBFIELD_DEFAULTS[OllowEditorField] = merged
