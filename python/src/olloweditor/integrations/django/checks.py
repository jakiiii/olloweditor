from __future__ import annotations

from django.core.checks import Error, register
from django.core.exceptions import ImproperlyConfigured

from .settings import get_olloweditor_upload_settings


@register()
def check_olloweditor_django_configuration(*_: object, **__: object) -> list[Error]:
    errors: list[Error] = []

    try:
        config = get_olloweditor_upload_settings()
    except ImproperlyConfigured as exc:
        errors.append(
            Error(
                str(exc),
                id="olloweditor.E001",
            )
        )
        return errors

    if config.uploads_enabled:
        try:
            config.build_widget_upload_options()
        except ImproperlyConfigured as exc:
            errors.append(
                Error(
                    str(exc),
                    id="olloweditor.E002",
                )
            )

    return errors
