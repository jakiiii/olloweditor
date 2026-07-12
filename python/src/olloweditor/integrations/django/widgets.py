from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

from django import forms


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

        if self.options:
            widget_attrs["data-olloweditor-options"] = json.dumps(
                self.options,
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


class AdminOllowEditorWidget(OllowEditorWidget):
    """Admin-flavored widget that keeps the standard admin textarea class."""

    def __init__(
        self,
        attrs: Mapping[str, Any] | None = None,
        options: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(attrs=attrs, options=options)
        self.attrs["class"] = _merge_classes("vLargeTextField", self.attrs.get("class"))
