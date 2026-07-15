from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

from django import forms

from .settings import get_olloweditor_upload_settings


def _merge_classes(*values: str | None) -> str | None:
    merged: list[str] = []
    for value in values:
        if not value:
            continue
        for item in value.split():
            if item and item not in merged:
                merged.append(item)
    return " ".join(merged)


class OllowEditorWidget(forms.Textarea):
    """Textarea widget that boots OllowEditor through data attributes."""

    def __init__(
        self,
        attrs: Mapping[str, Any] | None = None,
        options: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(attrs=dict(attrs) if attrs is not None else None)
        self.options = dict(options) if options is not None else {}

    def get_context(
        self,
        name: str,
        value: Any,
        attrs: dict[str, Any] | None,
    ) -> dict[str, Any]:
        """Inject OllowEditor data attributes into the rendered textarea."""
        default_options = self._build_render_options()
        context = super().get_context(name, value, attrs)
        widget_attrs = context["widget"]["attrs"]
        widget_attrs["data-olloweditor"] = "true"

        merged_classes = _merge_classes(
            self.attrs.get("class"),
            attrs.get("class") if attrs else None,
            widget_attrs.get("class"),
        )
        if merged_classes:
            widget_attrs["class"] = merged_classes

        if default_options:
            widget_attrs["data-olloweditor-options"] = json.dumps(
                default_options,
                ensure_ascii=True,
                separators=(",", ":"),
            )

        return context

    @property
    def media(self) -> forms.Media:
        """Static assets required by the widget."""
        return forms.Media(
            css={"all": ("olloweditor/olloweditor.css",)},
            js=(
                "olloweditor/olloweditor.browser.js",
                "olloweditor/olloweditor-init.js",
            ),
        )

    def _build_render_options(self) -> dict[str, Any]:
        options = dict(self.options)
        django_upload_options = (
            get_olloweditor_upload_settings().build_widget_upload_options()
        )
        if not django_upload_options:
            return options

        merged_upload_options: dict[str, Any] = {}

        django_upload = django_upload_options.get("upload")
        if isinstance(django_upload, Mapping):
            merged_upload_options.update(django_upload)

        user_upload = options.get("upload")
        if isinstance(user_upload, Mapping):
            merged_upload_options.update(user_upload)

        merged_options = dict(django_upload_options)
        merged_options.update(options)
        merged_options["upload"] = merged_upload_options
        return merged_options


class AdminOllowEditorWidget(OllowEditorWidget):
    """Admin-flavored widget that keeps the standard admin textarea class."""

    def __init__(
        self,
        attrs: Mapping[str, Any] | None = None,
        options: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(attrs=attrs, options=options)
        self.attrs["class"] = _merge_classes("vLargeTextField", self.attrs.get("class"))
