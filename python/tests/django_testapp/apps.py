from __future__ import annotations

from django.apps import AppConfig


class DjangoTestAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tests.django_testapp"
    label = "django_testapp"
