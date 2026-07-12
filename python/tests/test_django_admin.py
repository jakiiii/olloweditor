# ruff: noqa: E402

from __future__ import annotations

from django import forms
from django.apps import apps
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.core.management import call_command
from django.db import connection
from django.test import Client, override_settings
from django.test.utils import CaptureQueriesContext

from olloweditor.integrations.django import OllowEditorWidget
from olloweditor.integrations.django.widgets import AdminOllowEditorWidget
from tests.django_testapp.models import Article, DualArticle

_DB_READY = False


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


class DualArticleForm(forms.ModelForm):
    class Meta:
        model = DualArticle
        fields = ["title", "primary_content", "secondary_content"]


def _ensure_db_ready() -> None:
    global _DB_READY
    if _DB_READY:
        return
    call_command("migrate", run_syncdb=True, verbosity=0)
    _DB_READY = True


def _get_admin_client() -> Client:
    _ensure_db_ready()
    User = get_user_model()
    user, created = User.objects.get_or_create(
        username="admin",
        defaults={"email": "admin@example.com", "is_staff": True, "is_superuser": True},
    )
    if created:
        user.set_password("pass")
        user.save(update_fields=["password"])
    client = Client()
    assert client.login(username="admin", password="pass")
    return client


def test_django_app_imports() -> None:
    config = apps.get_app_config("olloweditor")
    assert config.name == "olloweditor"


def test_static_files_are_discoverable() -> None:
    assert finders.find("olloweditor/olloweditor.css")
    assert finders.find("olloweditor/olloweditor-admin.css")
    assert finders.find("olloweditor/olloweditor.browser.js")
    assert finders.find("olloweditor/olloweditor-init.js")


def test_admin_form_uses_olloweditor_widget_for_field() -> None:
    model_admin = admin.site._registry[Article]
    form_class = model_admin.get_form(request=None)
    widget = form_class.base_fields["content"].widget
    assert isinstance(widget, AdminOllowEditorWidget)
    assert isinstance(widget, OllowEditorWidget)


def test_existing_textfield_form_can_use_olloweditor_widget() -> None:
    form = ExistingTextFieldForm()
    assert isinstance(form.fields["content"].widget, OllowEditorWidget)
    rendered = str(form["content"])
    assert 'data-olloweditor="true"' in rendered


def test_admin_add_page_renders_olloweditor_media_and_admin_attrs() -> None:
    _ensure_db_ready()
    Article.objects.all().delete()
    client = _get_admin_client()
    response = client.get("/admin/django_testapp/article/add/")
    assert response.status_code == 200

    html = response.content.decode()
    assert 'data-olloweditor="true"' in html
    assert "vLargeTextField" in html
    assert "olloweditor/olloweditor.css" in html
    assert "olloweditor/olloweditor-admin.css" in html
    assert "olloweditor/olloweditor.browser.js" in html
    assert "olloweditor/olloweditor-init.js" in html
    assert (
        html.index("olloweditor/olloweditor-admin.css")
        < html.index("olloweditor/olloweditor.css")
        < html.index("olloweditor/olloweditor.browser.js")
        < html.index("olloweditor/olloweditor-init.js")
    )
    assert html.count("olloweditor/olloweditor-admin.css") == 1
    assert html.count("olloweditor/olloweditor.css") == 1
    assert html.count("olloweditor/olloweditor.browser.js") == 1
    assert html.count("olloweditor/olloweditor-init.js") == 1


@override_settings(OLLOWEDITOR={"UPLOADS_ENABLED": True})
def test_admin_add_page_includes_upload_endpoint_configuration() -> None:
    _ensure_db_ready()
    client = _get_admin_client()
    response = client.get("/admin/django_testapp/article/add/")
    assert response.status_code == 200

    html = response.content.decode()
    assert "/olloweditor/upload/image/" in html
    assert "/olloweditor/upload/gallery/" in html
    assert "/olloweditor/upload/attachment/" in html


def test_admin_change_page_loads_existing_html_into_widget() -> None:
    _ensure_db_ready()
    Article.objects.all().delete()
    article = Article.objects.create(
        title="Existing",
        content="<p><strong>Existing admin content</strong></p>",
    )
    client = _get_admin_client()
    response = client.get(f"/admin/django_testapp/article/{article.pk}/change/")
    assert response.status_code == 200

    html = response.content.decode()
    assert 'data-olloweditor="true"' in html
    assert (
        "&lt;p&gt;&lt;strong&gt;Existing admin content&lt;/strong&gt;&lt;/p&gt;" in html
    )
    assert "olloweditor/olloweditor.css" in html
    assert "olloweditor/olloweditor-admin.css" in html
    assert "olloweditor/olloweditor.browser.js" in html
    assert "olloweditor/olloweditor-init.js" in html


def test_admin_post_saves_html_and_redirects() -> None:
    _ensure_db_ready()
    Article.objects.all().delete()
    client = _get_admin_client()
    payload = {
        "title": "Saved in admin",
        "content": "<p><strong>Saved from Django admin</strong></p>",
        "_save": "Save",
    }
    response = client.post("/admin/django_testapp/article/add/", payload, follow=False)
    assert response.status_code == 302

    article = Article.objects.get(title="Saved in admin")
    assert article.content == "<p><strong>Saved from Django admin</strong></p>"

    follow_up = client.get(response["Location"])
    assert follow_up.status_code == 200


def test_multiple_olloweditor_fields_share_media_without_duplicate_assets() -> None:
    form = DualArticleForm()
    rendered = form.as_p()
    media = str(form.media)

    assert rendered.count('data-olloweditor="true"') == 2
    assert rendered.count('id="id_primary_content"') == 1
    assert rendered.count('id="id_secondary_content"') == 1
    assert media.count("olloweditor/olloweditor.css") == 1
    assert media.count("olloweditor/olloweditor.browser.js") == 1
    assert media.count("olloweditor/olloweditor-init.js") == 1


@override_settings(MEDIA_URL="/media/")
def test_admin_changelist_uses_safe_content_previews() -> None:
    _ensure_db_ready()
    Article.objects.all().delete()
    payload = "A" * 6000
    Article.objects.bulk_create(
        [
            Article(
                title="Plain",
                content=(
                    "<h2>Article heading</h2>"
                    "<p>This is <strong>formatted article text</strong>.</p>"
                ),
            ),
            Article(
                title="Image",
                content=(
                    '<figure class="olloweditor-image" data-type="image">'
                    '<img src="/media/olloweditor/images/2026/07/example.jpg" '
                    'alt="Example">'
                    "<figcaption>Example image</figcaption>"
                    "</figure>"
                ),
            ),
            Article(
                title="Gallery",
                content=(
                    '<section class="ollow-media ollow-gallery" data-type="gallery">'
                    '<div class="ollow-gallery-grid">'
                    '<figure><img src="/media/olloweditor/gallery/2026/07/one.jpg" '
                    'alt=""></figure>'
                    '<figure><img src="/media/olloweditor/gallery/2026/07/two.jpg" '
                    'alt=""></figure>'
                    '<figure><img src="/media/olloweditor/gallery/2026/07/three.jpg" '
                    'alt=""></figure>'
                    "</div>"
                    "</section>"
                ),
            ),
            Article(
                title="Attachment",
                content=(
                    '<a href="/media/olloweditor/attachments/2026/07/report.pdf" '
                    'data-olloweditor-attachment="true">report.pdf</a>'
                ),
            ),
            Article(
                title="Legacy",
                content=(
                    '<figure class="olloweditor-image" data-type="image">'
                    f'<img src="data:image/png;base64,{payload}">'
                    "</figure>"
                ),
            ),
            Article(
                title="Unsafe",
                content=(
                    '<script>alert("unsafe")</script>'
                    '<img src="javascript:alert(1)" onerror="alert(1)">'
                    '<p onclick="alert(1)">Visible text</p>'
                ),
            ),
        ]
    )
    client = _get_admin_client()

    with CaptureQueriesContext(connection) as queries:
        response = client.get("/admin/django_testapp/article/")

    assert response.status_code == 200
    assert len(queries) < 20

    html = response.content.decode()
    assert "Article heading This is formatted article text" in html
    assert "Gallery · 3 images" in html
    assert "Attachment · report.pdf" in html
    assert "Legacy embedded image" in html
    assert 'src="/media/olloweditor/images/2026/07/example.jpg"' in html
    assert "<figure" not in html
    assert "&lt;figure" not in html
    assert "data:image" not in html
    assert ";base64," not in html
    assert "javascript:alert(1)" not in html
    assert "onerror" not in html
    assert "onclick" not in html
    assert 'alert("unsafe")' not in html
    assert "Visible text" in html
