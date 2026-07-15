from __future__ import annotations

from typing import Any

from django.db import models

from .widgets import AdminOllowEditorWidget, OllowEditorWidget


def _register_admin_widget_default() -> None:
    from django.contrib.admin import options as admin_options
    from django.contrib.admin.sites import all_sites

    existing = admin_options.FORMFIELD_FOR_DBFIELD_DEFAULTS.get(OllowEditorField, {})
    if "widget" not in existing:
        admin_options.FORMFIELD_FOR_DBFIELD_DEFAULTS[OllowEditorField] = {
            **existing,
            "widget": AdminOllowEditorWidget,
        }

    for admin_site in all_sites:
        for model_admin in admin_site._registry.values():
            if OllowEditorField not in model_admin.formfield_overrides:
                model_admin.formfield_overrides[OllowEditorField] = {
                    "widget": AdminOllowEditorWidget
                }


class OllowEditorField(models.TextField):
    """TextField that uses OllowEditorWidget in generated ModelForms."""

    description = "Rich text"

    def formfield(self, **kwargs: Any) -> Any:
        defaults = {"widget": OllowEditorWidget}
        defaults.update(kwargs)
        return super().formfield(**defaults)


_register_admin_widget_default()
