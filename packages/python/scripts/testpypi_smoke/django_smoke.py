from __future__ import annotations

import json
import re
from html import unescape

from common import (
    emit,
    ensure_installed_package,
    require_distribution_present,
    venv_prefix,
)

DATA_OPTIONS_RE = re.compile(r'data-olloweditor-options="([^"]+)"')


def _extract_options(html: str) -> dict[str, object]:
    match = DATA_OPTIONS_RE.search(html)
    if match is None:
        raise AssertionError("Missing data-olloweditor-options attribute")
    return json.loads(unescape(match.group(1)))


def main() -> None:
    package_info = ensure_installed_package()
    django_version = require_distribution_present("django")

    from django.conf import settings

    if not settings.configured:
        settings.configure(
            SECRET_KEY="testpypi-django-smoke",
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
    from django.contrib.admin import ModelAdmin
    from django.contrib.admin.sites import AdminSite
    from django.contrib.staticfiles import finders
    from django.db import connection, models
    from django.test import RequestFactory

    from olloweditor.apps import OllowEditorConfig
    from olloweditor.integrations.django import OllowEditorField, OllowEditorWidget

    class Article(models.Model):
        title = models.CharField(max_length=255)
        content = OllowEditorField()

        class Meta:
            app_label = "testpypi_django"

    class ArticleForm(forms.ModelForm):
        class Meta:
            model = Article
            fields = ["title", "content"]

    class ExistingFieldForm(forms.ModelForm):
        content = forms.CharField(
            widget=OllowEditorWidget(
                attrs={"class": "alpha beta"},
                options={"theme": "auto"},
            )
        )

        class Meta:
            model = Article
            fields = ["title", "content"]

    class ArticleAdmin(ModelAdmin):
        pass

    widget = OllowEditorWidget(
        attrs={"class": "alpha beta", "rows": 12},
        options={"theme": "auto"},
    )
    widget_html = widget.render(
        "content", "<p>Value</p>", attrs={"class": "beta gamma"}
    )
    submitted_html = "<p><strong>TestPyPI Django content</strong></p>"
    bound_form = ArticleForm(data={"title": "Example", "content": submitted_html})
    if not bound_form.is_valid():
        raise AssertionError(bound_form.errors.as_json())

    first = OllowEditorWidget(options={"theme": "light"}).render("content", "")
    second = OllowEditorWidget(options={"theme": "dark"}).render("content", "")

    admin_form = ArticleAdmin(Article, AdminSite()).get_form(RequestFactory().get("/"))
    admin_widget = admin_form.base_fields["content"].widget.__class__.__name__

    static_assets = {
        "css": bool(finders.find("olloweditor/olloweditor.css")),
        "browser": bool(finders.find("olloweditor/olloweditor.browser.js")),
        "init": bool(finders.find("olloweditor/olloweditor-init.js")),
    }

    emit(
        {
            "checks": {
                "app_config": OllowEditorConfig.name,
                "admin_widget": admin_widget,
                "bound_form_valid": bound_form.is_valid(),
                "cleaned_content": bound_form.cleaned_data["content"],
                "data_attribute_present": 'data-olloweditor="true"' in widget_html,
                "field_db_type": Article._meta.get_field("content").db_type(connection),
                "formfield_widget": Article._meta.get_field("content")
                .formfield()
                .widget.__class__.__name__,
                "media_css": widget.media._css["all"],
                "media_js": widget.media._js,
                "options": _extract_options(widget_html),
                "rows_present": 'rows="12"' in widget_html,
                "static_assets": static_assets,
                "two_widgets_independent": first != second,
            },
            "django_version": django_version,
            "package": package_info,
            "venv_prefix": venv_prefix(),
        }
    )


urlpatterns: list[object] = []


if __name__ == "__main__":
    main()
