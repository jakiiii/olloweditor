# OllowEditor for Python

[![Python CI](https://github.com/CodeFortifyCloud/olloweditor/actions/workflows/python-ci.yml/badge.svg)](https://github.com/CodeFortifyCloud/olloweditor/actions/workflows/python-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)

OllowEditor for Python packages the compiled OllowEditor browser assets and provides integrations for Django, Django REST Framework, Flask, and FastAPI.

The editor itself remains a JavaScript and CSS application. This package does not reimplement the editor in Python. Instead, it distributes the browser bundle, stylesheet, and shared initialization script, then adds Python helpers for serving those assets and wiring the editor into forms, templates, and serializer fields.

OllowEditor runs in the browser, keeps a `<textarea>` synchronized with generated HTML, and submits that HTML through normal form posts or JSON payloads. If your application accepts untrusted HTML, you still need server-side validation and sanitization.

## Introduction

The `olloweditor` package is intended for Python applications that want to use the OllowEditor frontend without managing a separate npm-based asset pipeline. It ships the compiled assets inside the Python distribution and exposes framework-specific helpers where they reduce integration work.

Official integrations are included for:

- Django
- Django REST Framework
- Flask
- FastAPI

The base install remains framework-independent. Installing `olloweditor` alone gives you packaged assets and resource helpers without pulling in Django, Flask, FastAPI, or Django REST Framework.

## Key features

### Python integration features

- Packaged frontend assets:
  - `olloweditor.browser.js`
  - `olloweditor.css`
  - `olloweditor-init.js`
- Base install without framework dependencies
- Safe packaged-resource helpers:
  - `get_static_root()`
  - `get_asset_path(filename)`
  - `asset_exists(filename)`
- Django `OllowEditorWidget`
- Django `OllowEditorField`
- Django admin and staticfiles support
- Django REST Framework `OllowEditorHTMLField`
- Optional DRF sanitizer callback
- Flask `OllowEditor` extension
- Flask asset blueprint and Jinja helpers
- FastAPI static mount helper and template helpers
- Shared automatic initialization for marked textareas
- Support for multiple independent editor instances
- Per-editor configuration through widget options or `data-olloweditor-options`

### OllowEditor frontend capabilities

- Rich-text formatting and typography controls
- Lists, alignment, links, and bookmarks
- Images, galleries, tables, and code blocks
- YouTube embeds and editorial blocks
- Markdown import/export, HTML export, and PDF export
- Responsive editing UI and plugin API
- Textarea synchronization for normal backend form handling

The full frontend feature reference lives in the main project documentation:

- Main repository: <https://github.com/CodeFortifyCloud/olloweditor>
- Main project README: <https://github.com/CodeFortifyCloud/olloweditor/blob/pip/README.md>

## Supported environments

| Component | Supported version |
| --- | --- |
| Python | `>=3.10` |
| Django | `>=4.2` |
| Django REST Framework | `>=3.15` |
| Flask | `>=3.0` |
| FastAPI | `>=0.110` |

These are the package minimums declared in `python/pyproject.toml`. They are not a promise that every older dependency combination receives the same test coverage as the current CI matrix.

## Installation

### Base package

```bash
pip install olloweditor
```

This installs the packaged browser assets and framework-independent helpers only.

### Django

```bash
pip install "olloweditor[django]"
```

### Django REST Framework

```bash
pip install "olloweditor[drf]"
```

The `drf` extra also installs Django because Django REST Framework depends on it.

### Flask

```bash
pip install "olloweditor[flask]"
```

### FastAPI

```bash
pip install "olloweditor[fastapi]"
```

### All integrations

```bash
pip install "olloweditor[all]"
```

Most projects should install only the extra they actually use.

> Production PyPI publication has not been completed yet. Until that happens, install from a local wheel or editable checkout during development.

## Integration overview

| Capability | Django | Django REST Framework | Flask | FastAPI |
| --- | --- | --- | --- | --- |
| Editor form or template integration | Yes | Frontend-controlled | Yes | Yes |
| IMAGE upload | Yes | Yes | Yes | Yes |
| GALLERY upload | Yes | Yes | Yes | Yes |
| ATTACHMENT upload | Yes | Yes | Yes | Yes |
| Storage-backed URLs | Yes | Yes | Yes | Yes |
| Safe preview helper | Admin preview | Plain text | Plain text | Plain text |
| Base64 fallback in server mode | No | No | No | No |

## Framework integration guarantees

- Uploaded binaries are stored separately from the rich-text database column.
- Configured server-upload mode inserts returned public URLs only.
- Server-upload failures do not silently fall back to base64 or `blob:` URLs.
- Safe preview helpers are summaries only. They do not sanitize HTML for public rendering.
- Media ownership, retention, private-file access, and orphan cleanup remain application concerns.

## Django quick start

### Install

```bash
pip install "olloweditor[django]"
```

### Add the application

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "olloweditor.apps.OllowEditorConfig",
]
```

### Use the model field

```python
from django.db import models
from olloweditor.integrations.django import OllowEditorField


class Article(models.Model):
    title = models.CharField(max_length=255)
    content = OllowEditorField()
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

### Use the widget with an existing field

```python
from django import forms
from olloweditor.integrations.django import OllowEditorWidget

from .models import Article


class ArticleForm(forms.ModelForm):
    content = forms.CharField(
        widget=OllowEditorWidget(
            options={
                "theme": "auto",
            }
        )
    )

    class Meta:
        model = Article
        fields = ["title", "content"]
```

### Render the form

```django
<form method="post">
    {% csrf_token %}
    {{ form.media }}
    {{ form.as_p }}
    <button type="submit">Save article</button>
</form>
```

`{{ form.media }}` includes:

- `olloweditor/olloweditor.css`
- `olloweditor/olloweditor.browser.js`
- `olloweditor/olloweditor-init.js`

### Static files

```bash
python manage.py collectstatic
```

### Admin

`OllowEditorField` works in the standard Django admin without a custom `ModelForm`:

```python
from django.contrib import admin

from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title",)
```

With `olloweditor.apps.OllowEditorConfig` in `INSTALLED_APPS`, Django admin picks up the widget media automatically:

- `olloweditor/olloweditor.css`
- `olloweditor/olloweditor.browser.js`
- `olloweditor/olloweditor-init.js`

The admin add page and change page both render the editor interface, existing HTML loads back into the synchronized textarea, and normal admin saves persist the generated HTML.

Production deployments still need Django staticfiles configured correctly and must run `collectstatic`.

If you already have a plain `models.TextField`, use a custom admin form and attach the verified widget explicitly:

```python
from django import forms
from django.contrib import admin

from olloweditor.integrations.django import OllowEditorWidget

from .models import Article


class ArticleAdminForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = "__all__"
        widgets = {
            "content": OllowEditorWidget(),
        }


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    form = ArticleAdminForm
    list_display = ("title",)
```

### Safe content previews in Django admin

Using:

```python
list_display = ("title", "content")
```

is usually a poor fit for `OllowEditorField`. Django admin will display the raw
stored HTML source, which is noisy for normal rich text and can become
extremely large for older records that still contain legacy
`data:image/...;base64,...` values.

Use the package preview helper instead:

```python
from django.contrib import admin

from olloweditor.integrations.django.admin import (
    OllowEditorAdminPreviewMedia,
    render_olloweditor_admin_preview,
)

from .models import Article


@admin.register(Article)
class ArticleAdmin(OllowEditorAdminPreviewMedia, admin.ModelAdmin):
    list_display = ("title", "content_preview")
    search_fields = ("title", "content")

    @admin.display(
        description="Content",
        ordering="content",
        empty_value="—",
    )
    def content_preview(self, obj: Article) -> str:
        return render_olloweditor_admin_preview(obj.content)
```

The preview helper:

- does not modify stored content
- renders only a controlled admin summary
- converts normal rich text into plain text and truncates it
- can show a bounded thumbnail for safe media URLs under `MEDIA_URL`
- labels galleries and attachments without rendering the stored HTML directly
- hides legacy base64 payloads behind a concise warning

The full OllowEditor form interface remains available on the admin add and
change pages.

The helper is only for Django admin summaries. It does not make arbitrary
stored HTML safe for public templates, and it is not a substitute for your
application’s server-side sanitization policy.

Do not use `mark_safe(article.content)` in Django admin unless the HTML has
already been processed by a trusted server-side sanitizer and the complete
rendering behavior is intentionally accepted.

Legacy rows containing `data:image/...;base64,...` remain unchanged in the
database. The admin preview hides the payload and labels the row, but migrating
those records to storage-backed media URLs is a separate task.

## Django media uploads

Storing `data:image/...;base64,...` inside rich text makes database rows much
larger than they need to be. In Django mode, OllowEditor can upload IMAGE,
GALLERY, and ATTACHMENT files through authenticated Django endpoints, store the
binary content through Django storage, and keep only normal URLs inside the
saved HTML.

No second uploader application is required.

### Settings

```python
# settings.py

INSTALLED_APPS = [
    # ...
    "olloweditor.apps.OllowEditorConfig",
]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

OLLOWEDITOR = {
    "UPLOADS_ENABLED": True,
    "UPLOAD_REQUIRE_LOGIN": True,
    "UPLOAD_PERMISSION": None,
    "IMAGE_UPLOAD_PATH": "olloweditor/images/%Y/%m/",
    "GALLERY_UPLOAD_PATH": "olloweditor/gallery/%Y/%m/",
    "ATTACHMENT_UPLOAD_PATH": "olloweditor/attachments/%Y/%m/",
    "MAX_IMAGE_SIZE": 10 * 1024 * 1024,
    "MAX_GALLERY_FILES": 20,
    "MAX_ATTACHMENT_SIZE": 25 * 1024 * 1024,
    "ALLOWED_IMAGE_EXTENSIONS": [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
    ],
    "ALLOWED_ATTACHMENT_EXTENSIONS": [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "zip",
    ],
}
```

Supported `OLLOWEDITOR` settings and defaults:

- `UPLOADS_ENABLED`: `False`
- `UPLOAD_REQUIRE_LOGIN`: `True`
- `UPLOAD_PERMISSION`: `None`
- `IMAGE_UPLOAD_PATH`: `"olloweditor/images/%Y/%m/"`
- `GALLERY_UPLOAD_PATH`: `"olloweditor/gallery/%Y/%m/"`
- `ATTACHMENT_UPLOAD_PATH`: `"olloweditor/attachments/%Y/%m/"`
- `MAX_IMAGE_SIZE`: `10 * 1024 * 1024`
- `MAX_GALLERY_FILES`: `20`
- `MAX_ATTACHMENT_SIZE`: `25 * 1024 * 1024`
- `MAX_IMAGE_PIXELS`: `40_000_000`
- `ALLOWED_IMAGE_EXTENSIONS`: `["jpg", "jpeg", "png", "gif", "webp"]`
- `ALLOWED_ATTACHMENT_EXTENSIONS`: `["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip"]`
- `ALLOW_BASE64_UPLOADS`: `False`

### URLs

```python
# project/urls.py

from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path


urlpatterns = [
    path(
        "olloweditor/",
        include("olloweditor.integrations.django.urls"),
    ),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
```

The development `static(..., document_root=...)` helper is for local use only.
Production media should be served by Nginx, Apache, object storage, a CDN, or
another appropriate media pipeline.

### Behavior

- IMAGE uploads `POST` to `olloweditor:upload_image`
- GALLERY uploads `POST` to `olloweditor:upload_gallery`
- ATTACHMENT uploads `POST` to `olloweditor:upload_attachment`
- files are saved with Django `default_storage`
- saved HTML stores returned URLs only

Expected:

```html
<img src="/media/olloweditor/images/2026/07/generated.png">
```

Not expected:

```html
<img src="data:image/png;base64,...">
```

For a model field, the standard setup remains:

```python
from django.db import models
from olloweditor.integrations.django import OllowEditorField


class Article(models.Model):
    title = models.CharField(max_length=255)
    content = OllowEditorField()
```

### Admin and forms

`OllowEditorField` automatically passes the upload endpoint configuration into
the standard Django admin and generated `ModelForm` widgets. Existing custom
forms still work, and custom widget options can be merged on top of the Django
defaults.

### Security

- Uploads require authentication by default.
- CSRF protection remains enabled.
- `UPLOAD_PERMISSION` can require a Django permission in addition to login.
- image and attachment extensions use allowlists.
- uploaded images are verified with Pillow instead of trusting the browser MIME type.
- image size and pixel-count limits are enforced.
- attachment size limits are enforced.
- saved storage filenames are generated safely and do not reuse the original path.
- SVG is blocked by default for image uploads.
- the response returns a public URL, not a filesystem path.

For sensitive deployments, consider:

- private-file storage and signed URLs where appropriate
- malware scanning for uploaded attachments
- rate limiting in the host application or reverse proxy
- media response headers from your production file server
- orphaned upload cleanup when users remove embedded files from content later

## Django REST Framework quick start

Django REST Framework does not render the JavaScript editor for external API clients. It accepts the HTML string generated by an OllowEditor frontend and can expose reusable upload endpoints for that frontend.

### Install

```bash
pip install "olloweditor[drf]"
```

### Serializer example

```python
from rest_framework import serializers
from olloweditor.integrations.drf import OllowEditorHTMLField


class ArticleSerializer(serializers.Serializer):
    title = serializers.CharField()
    content = OllowEditorHTMLField(
        allow_blank=True,
        required=False,
    )
```

### JSON request example

```json
{
  "title": "Introducing OllowEditor",
  "content": "<p>Rich text generated by OllowEditor.</p>"
}
```

### Upload views

```python
from django.urls import path

from olloweditor.integrations.drf import (
    OllowEditorAttachmentUploadView,
    OllowEditorGalleryUploadView,
    OllowEditorImageUploadView,
)


urlpatterns = [
    path(
        "api/olloweditor/upload/image/",
        OllowEditorImageUploadView.as_view(),
    ),
    path(
        "api/olloweditor/upload/gallery/",
        OllowEditorGalleryUploadView.as_view(),
    ),
    path(
        "api/olloweditor/upload/attachment/",
        OllowEditorAttachmentUploadView.as_view(),
    ),
]
```

The DRF upload views:

- parse multipart uploads
- reuse Django `default_storage`
- return the same IMAGE, GALLERY, and ATTACHMENT response contract as Django
- honor `OLLOWEDITOR` upload settings
- use DRF authentication and permission classes

For session-authenticated browser clients, CSRF protection still applies. Token
or JWT authentication remains a host-project choice.

### Plain-text preview example

```python
from rest_framework import serializers

from olloweditor.integrations.drf import OllowEditorHTMLField
from olloweditor.previews import extract_olloweditor_text


class ArticleSerializer(serializers.Serializer):
    title = serializers.CharField()
    content = OllowEditorHTMLField()
    preview = serializers.SerializerMethodField()

    def get_preview(self, obj) -> str:
        return extract_olloweditor_text(obj.content, max_length=140)
```

Return plain text or structured metadata for list previews. Do not return
trusted HTML for preview use.

### Sanitizer callback

`OllowEditorHTMLField` accepts `sanitizer: Callable[[str], str]`.

```python
def sanitize_article_html(value: str) -> str:
    return trusted_html_sanitizer.clean(value)


class ArticleSerializer(serializers.Serializer):
    title = serializers.CharField()
    content = OllowEditorHTMLField(
        sanitizer=sanitize_article_html,
    )
```

`trusted_html_sanitizer` is your application’s sanitizer choice. The package does not bundle one automatically.

## Flask quick start

### Install

```bash
pip install "olloweditor[flask]"
```

### Application setup

```python
from flask import Flask, render_template, request
from olloweditor.integrations.flask import OllowEditor


app = Flask(__name__)
app.config["OLLOWEDITOR_UPLOADS_ENABLED"] = True
app.config["OLLOWEDITOR_UPLOAD_AUTH_REQUIRED"] = False
app.config["OLLOWEDITOR_MEDIA_URL"] = "/uploads/"
app.config["OLLOWEDITOR_UPLOAD_ROOT"] = "./media"

olloweditor = OllowEditor(app)


@app.route("/", methods=["GET", "POST"])
def index():
    content = ""

    if request.method == "POST":
        content = request.form.get("content", "")

    return render_template("index.html", content=content)
```

The Flask extension registers:

- packaged asset routes under `OLLOWEDITOR_URL_PREFIX`
- upload routes for IMAGE, GALLERY, and ATTACHMENT
- Jinja helpers for assets and textareas
- `extract_olloweditor_text(...)` for safe plain-text previews

For production, replace the local filesystem setup with your own storage adapter
and serve media through your normal media pipeline.

### Upload hooks

Optional application callbacks:

- `OLLOWEDITOR_AUTH_CHECK`
- `OLLOWEDITOR_PERMISSION_CHECK`
- `OLLOWEDITOR_CSRF_TOKEN_CALLBACK`

These let the host application integrate its own auth, permission, and CSRF
mechanisms without making Flask-Login or Flask-WTF mandatory dependencies.

### Template

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>OllowEditor with Flask</title>
    {{ olloweditor_assets() }}
  </head>
  <body>
    <form method="post">
      <textarea
        id="content"
        name="content"
        data-olloweditor="true"
      >{{ content }}</textarea>
      <button type="submit">Save article</button>
    </form>
  </body>
</html>
```

### Application factory

```python
from flask import Flask
from olloweditor.integrations.flask import OllowEditor


olloweditor = OllowEditor()


def create_app() -> Flask:
    app = Flask(__name__)
    olloweditor.init_app(app)
    return app
```

## FastAPI quick start

### Install

```bash
pip install "olloweditor[fastapi]"
```

### Application setup

```python
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates

from olloweditor.integrations.fastapi import OllowEditorFastAPI


app = FastAPI()
templates = Jinja2Templates(directory="templates")
integration = OllowEditorFastAPI(
    uploads_enabled=True,
    auth_required=False,
    upload_root="./media",
    media_url="/uploads/",
)
integration.init_app(app, templates=templates)


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={},
    )
```

`OllowEditorFastAPI` mounts static assets, can install upload routes for IMAGE,
GALLERY, and ATTACHMENT, and injects both textarea helpers and
`extract_olloweditor_text(...)` into Jinja templates.

### Template

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>OllowEditor with FastAPI</title>
    {{ olloweditor_assets() }}
  </head>
  <body>
    <form method="post">
      <textarea
        id="content"
        name="content"
        data-olloweditor="true"
      ></textarea>
      <button type="submit">Save article</button>
    </form>
  </body>
</html>
```

If your FastAPI application processes HTML form submissions, install:

```bash
pip install python-multipart
```

That package is not required just to serve OllowEditor assets. The
`fastapi` extra installs it because upload and form handling depend on
multipart parsing.

## Packaged frontend assets

Installing `olloweditor` gives you:

- `olloweditor.browser.js`
- `olloweditor.css`
- `olloweditor-init.js`

The shared initializer looks for:

```html
<textarea
  name="content"
  data-olloweditor="true"
  data-olloweditor-options='{"theme":"auto"}'
></textarea>
```

Framework behavior:

- Django serves assets through staticfiles
- Flask serves assets through the `OllowEditor` blueprint
- FastAPI serves assets through `StaticFiles`
- the base package exposes resource helpers through `olloweditor.resources`

## Per-editor configuration

Django widget example:

```python
from olloweditor.integrations.django import OllowEditorWidget


widget = OllowEditorWidget(
    options={
        "theme": "auto",
    }
)
```

HTML data-attribute example:

```html
<textarea
  name="content"
  data-olloweditor="true"
  data-olloweditor-options='{"theme":"auto"}'
></textarea>
```

For the full JavaScript option surface, use the main project documentation.

## Working with submitted content

OllowEditor keeps the original textarea value synchronized with HTML. Your backend receives that HTML through the normal request path.

### Django

```python
content = request.POST.get("content", "")
```

### Flask

```python
content = request.form.get("content", "")
```

### FastAPI

```python
from typing import Annotated

from fastapi import Form


def create_article(
    content: Annotated[str, Form()],
):
    return {"content": content}
```

### Django REST Framework

```json
{
  "content": "<p>Article content</p>"
}
```

Storage, validation, sanitization, and rendering remain the application’s responsibility.

## Security and HTML sanitization

OllowEditor generates HTML. That matters for your trust model.

- Client-side cleanup is not a complete security boundary.
- Untrusted HTML can still carry XSS and related risks.
- Server-side applications should validate and sanitize untrusted HTML before rendering it.
- Your application should define allowed tags, attributes, URL schemes, image sources, and embed providers.
- Upload endpoints need their own validation for authorization, CSRF, MIME type, extension, file size, storage destination, and rate limiting where appropriate.
- Django `safe`, Jinja `|safe`, `Markup`, or equivalent should only be used after content has been sanitized or otherwise explicitly trusted.

The package does not claim that arbitrary HTML is safe automatically.

## Framework dependency isolation

The base install stays lightweight:

```bash
pip install olloweditor
```

That does not install Django, Django REST Framework, Flask, or FastAPI. Install only the extra you need:

```bash
pip install "olloweditor[django]"
```

This avoids unnecessary dependency conflicts in applications that only need one integration.

## Example applications

Examples are included under [`python/examples/`](https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/examples):

- [Django example](https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/examples/django_example) — form workflow, model field, admin, and staticfiles
- [DRF example](https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/examples/drf_example) — serializer field and JSON API workflow
- [Flask example](https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/examples/flask_example) — extension, asset blueprint, template helper, and form submission
- [FastAPI example](https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/examples/fastapi_example) — asset mount, template helper, and form submission

## Development

From the repository root:

```bash
npm ci
npm run build
npm run typecheck
npm test
npm run build:python-assets
npm run verify:python-assets
```

Then for Python work:

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[all,dev,test]"
```

## Testing

Run the Python checks from `python/`:

```bash
python -m pytest
python -m ruff check .
python -m ruff format --check .
python -m mypy src
```

The repository also includes:

- isolated wheel-install verification
- packaged-asset verification
- framework integration tests
- example smoke tests
- TestPyPI release verification tooling

## Building distributions

```bash
cd python
rm -rf build dist src/*.egg-info
python -m build
python -m twine check dist/*
```

Expected outputs:

- `dist/olloweditor-<version>-py3-none-any.whl`
- `dist/olloweditor-<version>.tar.gz`

## Local wheel verification

Prefer testing the built wheel, not only an editable install:

```bash
pip install dist/olloweditor-<version>-py3-none-any.whl
```

With an extra:

```bash
pip install "olloweditor[django] @ file:///path/to/dist/olloweditor-<version>-py3-none-any.whl"
```

The repository also includes:

```bash
python scripts/check_wheel_contents.py dist/*.whl
python scripts/verify_wheel_installs.py dist/*.whl
```

## Troubleshooting

### The editor does not appear

Check:

- the CSS and JavaScript assets are actually loaded
- the browser bundle loads before `olloweditor-init.js`
- the textarea includes `data-olloweditor="true"`
- the browser console does not show initialization errors

### Django assets return 404

Check:

- `django.contrib.staticfiles` is installed
- `olloweditor.apps.OllowEditorConfig` is in `INSTALLED_APPS`
- `collectstatic` has been run where required
- your production staticfiles serving is configured correctly

### `form.media` is missing

Render:

```django
{{ form.media }}
```

### Flask assets return 404

Check:

- `OllowEditor(app)` or `init_app(app)` was called
- the configured URL prefix is what your template expects
- `{{ olloweditor_assets() }}` renders the expected URLs

### FastAPI assets return 404

Check:

- `mount_olloweditor(app)` was called
- the mount path matches the helper output
- no conflicting route already uses that path

### ImportError for a framework integration

Install the matching extra:

```bash
pip install "olloweditor[fastapi]"
```

### Invalid editor options

`data-olloweditor-options` must contain valid JSON.

## Relationship to the npm package

The npm package is still the primary frontend distribution:

```bash
npm install @codefortify/olloweditor
```

Use the npm package when your project already has a frontend build pipeline and wants to consume the editor directly from JavaScript or TypeScript.

Use the Python package when you want:

- packaged browser assets inside Python distributions
- Django, DRF, Flask, or FastAPI integration helpers
- framework-specific form, template, or serializer support

## Contributing

If you want to contribute:

1. Fork the repository.
2. Create a branch for your change.
3. Add or update tests.
4. Run the frontend and Python verification commands.
5. Open a pull request.

## License

OllowEditor is released under the [MIT License](../LICENSE).

## Project links

- Repository: <https://github.com/CodeFortifyCloud/olloweditor>
- Python package docs: <https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python>
- Main project README: <https://github.com/CodeFortifyCloud/olloweditor/blob/main/README.md>
- npm package source: <https://github.com/CodeFortifyCloud/olloweditor>
- Issue tracker: <https://github.com/CodeFortifyCloud/olloweditor/issues>
- Release process notes: <https://github.com/CodeFortifyCloud/olloweditor/blob/pip/python/docs/release.md>
