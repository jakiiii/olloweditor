from __future__ import annotations

try:
    from .fields import OllowEditorHTMLField
except ModuleNotFoundError as exc:
    if exc.name and exc.name.split(".")[0] == "rest_framework":
        raise ImportError(
            "The OllowEditor DRF integration requires Django REST Framework. "
            'Install it with `pip install "olloweditor[drf]"`.'
        ) from exc
    raise

__all__ = [
    "OllowEditorAttachmentUploadView",
    "OllowEditorGalleryUploadView",
    "OllowEditorHTMLField",
    "OllowEditorImageUploadView",
]


def __getattr__(name: str):
    if name in {
        "OllowEditorAttachmentUploadView",
        "OllowEditorGalleryUploadView",
        "OllowEditorImageUploadView",
    }:
        from .views import (
            OllowEditorAttachmentUploadView,
            OllowEditorGalleryUploadView,
            OllowEditorImageUploadView,
        )

        return {
            "OllowEditorAttachmentUploadView": OllowEditorAttachmentUploadView,
            "OllowEditorGalleryUploadView": OllowEditorGalleryUploadView,
            "OllowEditorImageUploadView": OllowEditorImageUploadView,
        }[name]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
