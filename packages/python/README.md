# OllowEditor for Python

[![Python CI](https://github.com/CodeFortifyCloud/olloweditor/actions/workflows/python-ci.yml/badge.svg)](https://github.com/CodeFortifyCloud/olloweditor/actions/workflows/python-ci.yml)
[![PyPI](https://img.shields.io/pypi/v/olloweditor.svg)](https://pypi.org/project/olloweditor/)
[![Python versions](https://img.shields.io/pypi/pyversions/olloweditor.svg)](https://pypi.org/project/olloweditor/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/CodeFortifyCloud/olloweditor/blob/main/LICENSE)

OllowEditor for Python distributes the compiled OllowEditor browser assets and
provides integrations for Django, Django REST Framework, Flask, and FastAPI.

OllowEditor remains a JavaScript rich-text editor. The Python package does not
rewrite it in Python; it supplies the browser bundle, stylesheet, initializer,
widgets, serializer fields, upload endpoints, storage integration, and template
helpers needed by Python applications. The browser synchronizes generated HTML
into a `<textarea>`, and the application receives that HTML through its normal
form or API request path.

## Key features

- Packaged `olloweditor.browser.js`, `olloweditor.css`, and
  `olloweditor-init.js` assets
- Django `OllowEditorWidget` and `OllowEditorField`
- Automatic Django admin add and change form integration
- Controlled Django admin changelist previews for text and media summaries
- Django REST Framework `OllowEditorHTMLField` and multipart upload views
- Flask extension, asset Blueprint, Jinja helpers, and upload endpoints
- FastAPI static mounting, Jinja helpers, and upload router integration
- IMAGE, GALLERY, and ATTACHMENT uploads with URL-based rich-text content
- Django `default_storage` support and framework-neutral storage adapters
- Shared upload validation, UUID storage names, and actual image verification
- Safe plain-text preview helpers for API and dashboard list views
- Multiple independent editor instances and per-editor configuration
- Optional framework dependencies; the base package installs no web framework
- No base64 or `blob:` fallback after server-upload mode is configured

## Installation

Install the framework-independent package:

```bash
pip install olloweditor
```

Install only the integration your application uses:

```bash
pip install "olloweditor[django]"
pip install "olloweditor[drf]"
pip install "olloweditor[flask]"
pip install "olloweditor[fastapi]"
pip install "olloweditor[all]"
```

The `drf` extra includes Django. The `fastapi` extra includes Jinja2 and
`python-multipart` for templates and multipart uploads. Pillow is installed by
the framework extras because IMAGE and GALLERY uploads verify actual image
content. A plain `pip install olloweditor` does not install Django, DRF, Flask,
FastAPI, or Pillow.

## Supported environments

The package metadata declares these minimum versions:

| Component | Supported version |
| --- | --- |
| Python | `>=3.10` |
| Django | `>=4.2` |
| Django REST Framework | `>=3.15` |
| Flask | `>=3.0` |
| FastAPI | `>=0.110` |
| Pillow | `>=10.3` for upload-enabled framework extras |

## Framework capability matrix

| Capability | Django | DRF | Flask | FastAPI |
| --- | --- | --- | --- | --- |
| Editor integration | Widget and admin | Frontend-controlled | Jinja helper | Jinja helper |
| IMAGE upload | Yes | Yes | Yes | Yes |
| GALLERY upload | Yes | Yes | Yes | Yes |
| ATTACHMENT upload | Yes | Yes | Yes | Yes |
| Storage-backed URLs | Django storage | Django storage | Storage adapter | Storage adapter |
| Safe preview | Admin preview | Plain text | Plain text | Plain text |
| Base64 fallback in server mode | No | No | No | No |

DRF is an API integration. It validates HTML and serves upload APIs, but it does
not render or initialize the browser editor by itself.

## Django quick start

Install the Django extra and add the application:

```bash
pip install "olloweditor[django]"
```

```python
# settings.py

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

Use the model field:

```python
from django.db import models
from olloweditor.integrations.django import OllowEditorField


class Article(models.Model):
    title = models.CharField(max_length=255)
    content = OllowEditorField()
```

`OllowEditorField` automatically selects `OllowEditorWidget` for generated
`ModelForm` classes and standard Django admin forms. No custom admin form is
required for the normal case.

For a plain `models.TextField`, assign the widget explicitly:

```python
from django import forms
from olloweditor.integrations.django import OllowEditorWidget

from .models import Article


class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ["title", "content"]
        widgets = {
            "content": OllowEditorWidget(),
        }
```

Normal templates must render the widget media:

```django
<form method="post">
  {% csrf_token %}
  {{ form.media }}
  {{ form.as_p }}
  <button type="submit">Save article</button>
</form>
```

The media declaration loads, in order:

1. `olloweditor/olloweditor.css`
2. `olloweditor/olloweditor.browser.js`
3. `olloweditor/olloweditor-init.js`

Run `python manage.py collectstatic` for production static deployment.

### Django admin and safe previews

The add and change forms automatically use the full editor. For changelists,
do not place the raw rich-text field directly in `list_display`; that exposes
HTML source and can make legacy base64 rows extremely large.

Use the controlled preview helper:

```python
from django.contrib import admin

from olloweditor.integrations.django.admin import (
    OllowEditorAdminPreviewMedia,
    render_olloweditor_admin_preview,
)

from .models import Article


@admin.register(Article)
class ArticleAdmin(
    OllowEditorAdminPreviewMedia,
    admin.ModelAdmin,
):
    list_display = (
        "title",
        "content_preview",
    )
    search_fields = (
        "title",
        "content",
    )

    @admin.display(
        description="Content",
        ordering="content",
        empty_value="—",
    )
    def content_preview(self, obj: Article):
        return render_olloweditor_admin_preview(obj.content)
```

The helper converts rich text to a compact plain-text summary, labels
attachments and galleries, displays only validated media thumbnails, and
replaces legacy embedded images with `Legacy embedded image`. It does not
modify the database value. It is an admin summary, not a general-purpose HTML
sanitizer for public pages.

Do not use `mark_safe(article.content)` in Django admin unless the HTML has
already been processed by a trusted server-side sanitizer and the complete
rendering behavior is intentionally accepted.

Legacy rows containing `data:image/...;base64,...` remain unchanged. Migrating
them to storage-backed media URLs requires a separate, reviewed data migration.

## Django media uploads

Django uploads are disabled until configured. When enabled, IMAGE, GALLERY,
and ATTACHMENT requests are authenticated by default, files are stored through
Django `default_storage`, and the returned public URLs are inserted into the
editor HTML.

```python
# settings.py

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
    "MAX_IMAGE_PIXELS": 40_000_000,
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
    "ALLOW_BASE64_UPLOADS": False,
}
```

All `OLLOWEDITOR` settings and defaults are:

| Setting | Default |
| --- | --- |
| `UPLOADS_ENABLED` | `False` |
| `UPLOAD_REQUIRE_LOGIN` | `True` |
| `UPLOAD_PERMISSION` | `None` |
| `IMAGE_UPLOAD_PATH` | `"olloweditor/images/%Y/%m/"` |
| `GALLERY_UPLOAD_PATH` | `"olloweditor/gallery/%Y/%m/"` |
| `ATTACHMENT_UPLOAD_PATH` | `"olloweditor/attachments/%Y/%m/"` |
| `MAX_IMAGE_SIZE` | `10 * 1024 * 1024` |
| `MAX_GALLERY_FILES` | `20` |
| `MAX_ATTACHMENT_SIZE` | `25 * 1024 * 1024` |
| `MAX_IMAGE_PIXELS` | `40_000_000` |
| `ALLOWED_IMAGE_EXTENSIONS` | `jpg`, `jpeg`, `png`, `gif`, `webp` |
| `ALLOWED_ATTACHMENT_EXTENSIONS` | `pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `txt`, `zip` |
| `ALLOW_BASE64_UPLOADS` | `False` |

Include the package URLs. The prefix remains controlled by the host project:

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

The package exposes:

- `POST /olloweditor/upload/image/`
- `POST /olloweditor/upload/gallery/`
- `POST /olloweditor/upload/attachment/`

The `static(..., document_root=...)` helper serves development media only.
Production applications should use object storage, a CDN, Nginx, Apache, or
another appropriate media service.

Expected stored HTML contains a public URL:

```html
<img src="/media/olloweditor/images/2026/07/generated.png">
```

Configured server-upload mode does not save a base64 data URL:

```html
<img src="data:image/png;base64,...">
```

Cloud storage works through the configured Django storage backend. The upload
views call `default_storage.save(...)` and `default_storage.url(...)`; they do
not join paths onto `MEDIA_ROOT` or return physical filesystem paths.

## Django REST Framework

`OllowEditorHTMLField` accepts and validates the HTML string produced by a
separate OllowEditor frontend. DRF does not initialize the JavaScript editor.

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

The field accepts an optional `sanitizer` callable and an optional DRF
`validator` callable. A sanitizer must return a string.

Register the reusable multipart upload views:

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

The views use DRF `MultiPartParser` and `FormParser`, reuse the Django upload
settings and `default_storage`, and require authentication when
`UPLOAD_REQUIRE_LOGIN` is true. Set DRF authentication globally, or subclass a
view to set `authentication_classes` and `permission_classes`. Session
authentication retains Django CSRF checks; token and JWT authentication remain
host-application decisions.

Use plain text in API list responses:

```python
from rest_framework import serializers
from olloweditor.previews import extract_olloweditor_text


class ArticleSerializer(serializers.ModelSerializer):
    preview = serializers.SerializerMethodField()

    def get_preview(self, obj) -> str:
        return extract_olloweditor_text(
            obj.content,
            max_length=140,
        )
```

Do not return stored HTML as a trusted preview.

## Flask

The Flask extension registers packaged asset routes, upload endpoints, Jinja
helpers, and an optional development media route for local storage.

```python
from flask import Flask, g
from olloweditor.integrations.flask import OllowEditor


def upload_user_is_authenticated() -> bool:
    return getattr(g, "user", None) is not None


def upload_user_has_permission() -> bool:
    user = getattr(g, "user", None)
    return bool(user and user.can_upload)


app = Flask(__name__)
app.config.update(
    OLLOWEDITOR_UPLOADS_ENABLED=True,
    OLLOWEDITOR_UPLOAD_AUTH_REQUIRED=True,
    OLLOWEDITOR_AUTH_CHECK=upload_user_is_authenticated,
    OLLOWEDITOR_PERMISSION_CHECK=upload_user_has_permission,
    OLLOWEDITOR_UPLOAD_PERMISSION_REQUIRED=True,
    OLLOWEDITOR_UPLOAD_ROOT="./media",
    OLLOWEDITOR_MEDIA_URL="/media/",
)

olloweditor = OllowEditor(app)
```

The default URL prefix is `/olloweditor`. It serves the three upload endpoints
under `/olloweditor/upload/` and injects these Jinja globals:

- `olloweditor_assets()`
- `olloweditor_textarea(...)`
- `extract_olloweditor_text(...)`

```django
<!doctype html>
<html lang="en">
  <head>
    {{ olloweditor_assets() }}
  </head>
  <body>
    <form method="post">
      {{ olloweditor_textarea("content", article.content) }}
      <button type="submit">Save</button>
    </form>
  </body>
</html>
```

Configuration supports custom upload paths, extension lists, size and pixel
limits, `OLLOWEDITOR_CSRF_TOKEN_CALLBACK`, and
`OLLOWEDITOR_CSRF_HEADER_NAME`. Flask-WTF and Flask-Login are not mandatory;
connect their CSRF and authentication mechanisms through application callbacks.

Set `OLLOWEDITOR_STORAGE` to an object implementing
`UploadStorageProtocol.save(...)` and `delete(...)` for S3, Google Cloud
Storage, Azure Blob Storage, a CDN-backed service, or private application
storage. The default `LocalFilesystemUploadStorage` uses
`OLLOWEDITOR_UPLOAD_ROOT` and `OLLOWEDITOR_MEDIA_URL`.

Use `extract_olloweditor_text(article.content, max_length=140)` for list pages.
Do not render arbitrary stored content with Jinja `|safe`.

## FastAPI

`OllowEditorFastAPI` mounts the packaged static assets, installs upload routes,
adds template helpers, and can mount a development media directory for its
local storage adapter.

```python
from fastapi import FastAPI
from fastapi.templating import Jinja2Templates

from olloweditor.integrations.fastapi import OllowEditorFastAPI


async def require_user() -> bool:
    return True


async def require_upload_permission() -> bool:
    return True


app = FastAPI()
templates = Jinja2Templates(directory="templates")

olloweditor = OllowEditorFastAPI(
    uploads_enabled=True,
    upload_root="./media",
    media_url="/media/",
    auth_required=True,
    auth_dependency=require_user,
    permission_dependency=require_upload_permission,
)
olloweditor.init_app(app, templates=templates)
```

The default routes are:

- static assets: `/olloweditor/static/`
- IMAGE: `POST /olloweditor/upload/image/`
- GALLERY: `POST /olloweditor/upload/gallery/`
- ATTACHMENT: `POST /olloweditor/upload/attachment/`

The routes use FastAPI `UploadFile` and require `python-multipart`, which is
included in the `fastapi` extra. Authentication and permission callbacks may be
synchronous or asynchronous; the host application supplies its own identity
system.

Templates receive `olloweditor_assets()`, `olloweditor_textarea(...)`, and
`extract_olloweditor_text(...)`. A custom `storage` implementing
`UploadStorageProtocol` can replace local filesystem storage. The local media
mount is intended for development, not production delivery.

## Upload response contract

IMAGE success:

```json
{
  "success": true,
  "type": "image",
  "url": "/media/olloweditor/images/generated.png",
  "name": "original.png",
  "size": 12345
}
```

GALLERY success preserves selection order:

```json
{
  "success": true,
  "type": "gallery",
  "files": [
    {
      "url": "/media/olloweditor/gallery/one.png",
      "name": "one.png",
      "size": 12345
    },
    {
      "url": "/media/olloweditor/gallery/two.png",
      "name": "two.png",
      "size": 23456
    }
  ]
}
```

ATTACHMENT success:

```json
{
  "success": true,
  "type": "attachment",
  "url": "/media/olloweditor/attachments/generated.pdf",
  "name": "report.pdf",
  "size": 12345
}
```

Structured error payload:

```json
{
  "success": false,
  "error": {
    "code": "invalid_file_type",
    "message": "This file type is not allowed."
  }
}
```

FastAPI returns the same error object under its standard HTTP exception
`detail` key. Successful responses use the structures shown above.

Uploaded binaries are stored separately from rich text. Responses contain
public URLs from the configured storage backend, never physical filesystem
paths. Cloud and CDN adapters may return absolute public URLs.

## Security

OllowEditor produces HTML. Treat that HTML according to the trust boundary of
your application.

- Sanitize untrusted HTML on the server before public rendering.
- Do not pass arbitrary stored HTML to Django `mark_safe`, Jinja `|safe`,
  MarkupSafe `Markup`, or equivalent trusted-markup helpers.
- Require authentication and application permissions for upload endpoints.
- Keep Django CSRF protection enabled for session-authenticated requests.
- Integrate Flask CSRF checks through the host application.
- Apply size limits, extension allowlists, and image pixel limits.
- IMAGE and GALLERY uploads verify actual image content with Pillow and reject
  extension/format mismatches.
- SVG is excluded from the default image allowlist because it may contain
  active content.
- Storage names use generated UUIDs and never trust browser path components.
- Add malware scanning for attachments in sensitive environments.
- Apply rate limiting in the application or reverse proxy.
- Use suitable production media headers and content-disposition policies.
- Protect private media with application authorization or signed URLs.
- Define ownership, retention, and orphaned-upload cleanup policies.

The upload allowlist reduces risk; it does not make every attachment safe.

Safe preview helpers produce text or controlled metadata only. They are not a
substitute for sanitizing complete HTML before rendering it on a public site.

## Development and testing

From the repository root:

```bash
cd /path/to/olloweditor

npm ci
npm run build
npm run typecheck
npm test
npm run build:python-assets
npm run verify:python-assets
```

Then run Python checks:

```bash
cd packages/python

python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -e ".[all,dev,test]"

python -m pytest
python -m ruff check .
python -m ruff format --check .
python -m mypy src
```

Example applications are under
[`packages/python/examples/`](https://github.com/CodeFortifyCloud/olloweditor/tree/main/packages/python/examples).

## Building distributions

```bash
rm -rf build dist src/*.egg-info

python -m build
python -m twine check dist/*
```

Version `0.1.1` produces:

```text
dist/olloweditor-0.1.1-py3-none-any.whl
dist/olloweditor-0.1.1.tar.gz
```

Validate the wheel contents and isolated installs:

```bash
python scripts/check_wheel_contents.py dist/*.whl
python scripts/verify_wheel_installs.py dist/*.whl
```

## Troubleshooting

### Editor not appearing

Confirm the stylesheet, browser bundle, and initializer load in that order;
the textarea has `data-olloweditor="true"`; and the browser console has no
initialization error.

### Django admin shows a plain textarea

Use `OllowEditorField`, include `olloweditor.apps.OllowEditorConfig` in
`INSTALLED_APPS`, and confirm staticfiles can find the three packaged assets.

### Django changelist shows raw HTML

Replace the rich-text field in `list_display` with
`render_olloweditor_admin_preview(...)` and include
`OllowEditorAdminPreviewMedia` on the `ModelAdmin`.

### Uploads fall back to base64

Confirm uploads are enabled, upload endpoint URLs are present in
`data-olloweditor-options`, and the endpoint returns the documented JSON. A
configured server upload does not fall back after a failed request.

### Upload endpoint returns 403

Check the framework upload-enabled setting, authenticated user state,
permission hook or class, and any application-level authorization middleware.

### CSRF validation fails

For Django session authentication, render a CSRF token and allow the initializer
to send `X-CSRFToken`. For Flask, connect the configured token callback and
header name to the host CSRF extension.

### Media returns 404

Check the public media URL, storage backend, development media route, and
production media service. Django's development `static()` helper and the local
Flask/FastAPI media routes are not production servers.

### Invalid file type

The extension must be in the configured allowlist. Images must also decode as
the format implied by their extension; renaming another file to `.png` is not
accepted.

### Oversized upload

Increase the relevant byte or pixel limit only after considering application,
proxy, storage, memory, and decompression risks.

### Missing framework extra

Install the matching extra, for example:

```bash
pip install "olloweditor[fastapi]"
```

### Stale local wheel

Rebuilding the same version does not replace an installed wheel. Uninstall it,
then install the exact rebuilt file with `--no-cache-dir`.

## License and links

OllowEditor is released under the
[MIT License](https://github.com/CodeFortifyCloud/olloweditor/blob/main/LICENSE).

- Repository: <https://github.com/CodeFortifyCloud/olloweditor>
- Python package: <https://pypi.org/project/olloweditor/>
- Python documentation: <https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python>
- Issue tracker: <https://github.com/CodeFortifyCloud/olloweditor/issues>
- Release process: [docs/release.md](docs/release.md)
