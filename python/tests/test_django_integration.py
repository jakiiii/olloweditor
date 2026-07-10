# ruff: noqa: E402

from __future__ import annotations

from django.conf import settings

if not settings.configured:
    settings.configure(
        SECRET_KEY="test-secret-key",
        INSTALLED_APPS=[
            "django.contrib.admin",
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "django.contrib.messages",
            "django.contrib.sessions",
            "django.contrib.staticfiles",
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
        STATIC_URL="/static/",
        TEMPLATES=[
            {
                "BACKEND": "django.template.backends.django.DjangoTemplates",
                "APP_DIRS": True,
                "OPTIONS": {
                    "context_processors": [
                        "django.template.context_processors.request",
                        "django.contrib.auth.context_processors.auth",
                        "django.contrib.messages.context_processors.messages",
                    ]
                },
            }
        ],
        USE_TZ=True,
    )

import django

django.setup()

from django import forms
from django.contrib import admin
from django.contrib.staticfiles import finders
from django.db import connection, models
from django.forms import modelform_factory

from django.apps import apps

from olloweditor.integrations.django import OllowEditorField, OllowEditorWidget

urlpatterns: list[object] = []


class Article(models.Model):
    title = models.CharField(max_length=255)
    content = OllowEditorField()
    summary = models.TextField(blank=True)

    class Meta:
        app_label = "tests"


class ArticleAdmin(admin.ModelAdmin):
    pass


class ExistingTextFieldForm(forms.ModelForm):
    content = forms.CharField(
        widget=OllowEditorWidget(
            attrs={"class": "field-content existing"},
            options={"theme": "auto"},
        )
    )

    class Meta:
        model = Article
        fields = ["content"]


def test_django_app_imports() -> None:
    config = apps.get_app_config("olloweditor")
    assert config.name == "olloweditor"


def test_static_files_are_discoverable() -> None:
    assert finders.find("olloweditor/olloweditor.css")
    assert finders.find("olloweditor/olloweditor.browser.js")
    assert finders.find("olloweditor/olloweditor-init.js")


def test_widget_adds_required_attributes() -> None:
    widget = OllowEditorWidget(attrs={"rows": 12, "id": "id_content"})
    html = widget.render("content", "Hello", attrs={"class": "editor"})
    assert 'data-olloweditor="true"' in html
    assert 'rows="12"' in html
    assert 'id="id_content"' in html
    assert 'class="editor"' in html


def test_existing_classes_are_preserved_without_duplication() -> None:
    widget = OllowEditorWidget(attrs={"class": "alpha beta alpha"})
    html = widget.render("content", "", attrs={"class": "beta gamma"})
    assert 'class="alpha beta gamma"' in html or 'class="beta gamma alpha"' in html
    assert "alpha alpha" not in html
    assert "beta beta" not in html


def test_options_are_json_encoded_and_escaped_safely() -> None:
    widget = OllowEditorWidget(
        options={
            "theme": "auto",
            "placeholder": '<script>alert("x")</script>&',
        }
    )
    html = widget.render("content", "")
    assert 'data-olloweditor-options="' in html
    assert "&quot;theme&quot;:&quot;auto&quot;" in html
    assert "<script>" not in html
    assert "&lt;script&gt;" in html
    assert "&amp;" in html


def test_media_contains_expected_assets_in_order() -> None:
    widget = OllowEditorWidget()
    assert widget.media._css["all"] == ["olloweditor/olloweditor.css"]
    assert widget.media._js == [
        "olloweditor/olloweditor.browser.js",
        "olloweditor/olloweditor-init.js",
    ]


def test_model_field_uses_textfield_database_type() -> None:
    field = Article._meta.get_field("content")
    text_type = models.TextField().db_parameters(connection)["type"]
    assert field.db_parameters(connection)["type"] == text_type


def test_model_field_formfield_uses_olloweditor_widget() -> None:
    field = Article._meta.get_field("content")
    form_field = field.formfield()
    assert isinstance(form_field.widget, OllowEditorWidget)


def test_model_field_migration_serialization_round_trips() -> None:
    field = OllowEditorField(blank=True)
    name, path, args, kwargs = field.deconstruct()
    assert name is None
    assert path == "olloweditor.integrations.django.fields.OllowEditorField"
    rebuilt = OllowEditorField(*args, **kwargs)
    assert rebuilt.blank is True


def test_widget_instances_render_independently() -> None:
    light = OllowEditorWidget(options={"theme": "light"})
    dark = OllowEditorWidget(options={"theme": "dark"})
    light_html = light.render("content", "")
    dark_html = dark.render("content", "")
    assert "&quot;light&quot;" in light_html
    assert "&quot;dark&quot;" in dark_html
    assert light_html != dark_html


def test_admin_form_uses_olloweditor_widget_for_field() -> None:
    model_admin = ArticleAdmin(Article, admin.sites.AdminSite())
    form_class = model_admin.get_form(request=None)
    assert isinstance(form_class.base_fields["content"].widget, OllowEditorWidget)


def test_existing_textfield_form_can_use_olloweditor_widget() -> None:
    form = ExistingTextFieldForm()
    assert isinstance(form.fields["content"].widget, OllowEditorWidget)
    rendered = str(form["content"])
    assert 'data-olloweditor="true"' in rendered


def test_modelform_factory_uses_olloweditor_field_widget() -> None:
    form_class = modelform_factory(Article, fields=("content",))
    form = form_class()
    assert isinstance(form.fields["content"].widget, OllowEditorWidget)
