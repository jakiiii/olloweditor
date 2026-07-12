# ruff: noqa: E402

from __future__ import annotations

from django.conf import settings

if not settings.configured:
    settings.configure(
        SECRET_KEY="test-secret-key",
        INSTALLED_APPS=[
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "olloweditor.apps.OllowEditorConfig",
        ],
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": ":memory:",
            }
        },
        MIDDLEWARE=[],
        ROOT_URLCONF=__name__,
        USE_TZ=True,
    )

import django

django.setup()

from django import forms
from django.db import connection, models
from django.forms import modelform_factory

from olloweditor.integrations.django import OllowEditorField, OllowEditorWidget

urlpatterns: list[object] = []


class FieldArticle(models.Model):
    title = models.CharField(max_length=255)
    content = OllowEditorField()

    class Meta:
        app_label = "tests_field"


def test_model_field_uses_textfield_database_type() -> None:
    field = FieldArticle._meta.get_field("content")
    text_type = models.TextField().db_parameters(connection)["type"]
    assert field.db_parameters(connection)["type"] == text_type


def test_model_field_formfield_uses_olloweditor_widget() -> None:
    field = FieldArticle._meta.get_field("content")
    form_field = field.formfield()
    assert isinstance(form_field.widget, OllowEditorWidget)


def test_model_field_formfield_respects_explicit_widget_override() -> None:
    field = FieldArticle._meta.get_field("content")
    form_field = field.formfield(widget=forms.Textarea)
    assert isinstance(form_field.widget, forms.Textarea)
    assert not isinstance(form_field.widget, OllowEditorWidget)


def test_model_field_migration_serialization_round_trips() -> None:
    field = OllowEditorField(blank=True)
    name, path, args, kwargs = field.deconstruct()
    assert name is None
    assert path == "olloweditor.integrations.django.fields.OllowEditorField"
    rebuilt = OllowEditorField(*args, **kwargs)
    assert rebuilt.blank is True


def test_modelform_factory_uses_olloweditor_field_widget() -> None:
    form_class = modelform_factory(FieldArticle, fields=("content",))
    form = form_class()
    assert isinstance(form.fields["content"].widget, OllowEditorWidget)
