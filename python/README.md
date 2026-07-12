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

| Framework | Main integration |
| --- | --- |
| Django | Form widget, model field, staticfiles integration, and admin support |
| Django REST Framework | Serializer field for OllowEditor-generated HTML |
| Flask | Extension, packaged asset blueprint, and Jinja helpers |
| FastAPI | Static asset mounting and template helpers |

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

## Django REST Framework quick start

Django REST Framework does not render the JavaScript editor for external API clients. It accepts the HTML string generated by an OllowEditor frontend.

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
olloweditor = OllowEditor(app)


@app.route("/", methods=["GET", "POST"])
def index():
    content = ""

    if request.method == "POST":
        content = request.form.get("content", "")

    return render_template("index.html", content=content)
```

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

from olloweditor.integrations.fastapi import (
    mount_olloweditor,
    olloweditor_assets,
)


app = FastAPI()
mount_olloweditor(app)

templates = Jinja2Templates(directory="templates")
templates.env.globals["olloweditor_assets"] = olloweditor_assets


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={},
    )
```

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

That package is not required just to serve OllowEditor assets.

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
