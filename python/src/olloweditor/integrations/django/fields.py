from __future__ import annotations

from typing import Any

from django.db import models

from .widgets import OllowEditorWidget


class OllowEditorField(models.TextField):
    """TextField that uses OllowEditorWidget in generated ModelForms."""

    description = "Rich text"

    def formfield(self, **kwargs: Any) -> Any:
        defaults = {"widget": OllowEditorWidget}
        defaults.update(kwargs)
        return super().formfield(**defaults)
