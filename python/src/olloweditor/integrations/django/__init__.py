from __future__ import annotations

try:
    from .fields import OllowEditorField
    from .widgets import OllowEditorWidget
except ModuleNotFoundError as exc:
    if exc.name and exc.name.split(".")[0] == "django":
        raise ImportError(
            'The OllowEditor Django integration requires Django. '
            'Install it with `pip install "olloweditor[django]"`.'
        ) from exc
    raise

__all__ = ["OllowEditorField", "OllowEditorWidget"]
