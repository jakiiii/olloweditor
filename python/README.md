# OllowEditor for Python

[![Python CI](https://github.com/CodeFortifyCloud/olloweditor/actions/workflows/python-ci.yml/badge.svg)](https://github.com/CodeFortifyCloud/olloweditor/actions/workflows/python-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/CodeFortifyCloud/olloweditor/blob/pip/LICENSE)

A Python integration package for using OllowEditor with Django, Django REST Framework, Flask, and FastAPI.

OllowEditor for Python packages the compiled OllowEditor browser assets and exposes framework-specific helpers for serving those assets and wiring the editor into forms, templates, and APIs. The editor itself remains a JavaScript and CSS application. This package does not reimplement the editor in Python.

Official integrations are included for Django, Django REST Framework, Flask, and FastAPI. In all cases, OllowEditor runs in the browser, keeps a `<textarea>` synchronized with HTML, and your Python application receives that HTML string through normal form or API handling.

## Key features

### Python integration features

- Base installation without Django, Flask, FastAPI, or Django REST Framework dependencies
- Packaged browser assets:
  - `olloweditor.browser.js`
  - `olloweditor.css`
  - `olloweditor-init.js`
- Resource helpers for packaged assets:
  - `get_static_root()`
  - `get_asset_path(filename)`
  - `asset_exists(filename)`
- Django form widget, model field, staticfiles integration, and admin compatibility
- Django REST Framework serializer field for OllowEditor-generated HTML
- Optional server-side sanitizer callback for Django REST Framework
- Flask extension with a packaged asset blueprint and Jinja helpers
- FastAPI static asset mounting and template helpers
- Automatic initialization for multiple editor instances through shared data attributes
- Per-editor configuration through widget options or `data-olloweditor-options`

### OllowEditor frontend capabilities

- Rich-text formatting, typography controls, lists, and alignment
- Links, bookmarks, images, galleries, tables, and code blocks
- YouTube embeds and editorial content blocks
- Markdown import/export, HTML export, and PDF export
- DOCX import/export hooks
- Themes, responsive toolbar behavior, and textarea synchronization
- Browser plugin API for extending the editor

For the full editor feature set, configuration surface, and JavaScript integration details, see the main project README: <https://github.com/CodeFortifyCloud/olloweditor>.

## Supported environments

| Component | Supported version |
| --- | --- |
| Python | `>=3.10` |
| Django | `>=4.2` |
| Django REST Framework | `>=3.15` |
| Flask | `>=3.0` |
| FastAPI | `>=0.110` |

These are the package minimums defined in `pyproject.toml`. The automated test suite currently exercises supported integrations separately and validates packaged distributions, but minimum dependency versions and actively tested combinations are not the same guarantee.

## Installation

### Base package

```bash
pip install olloweditor
```

This installs the packaged OllowEditor assets and the framework-independent resource helpers. It does not install Django, Django REST Framework, Flask, or FastAPI.

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

Most applications should install only the extra they actually need.

> The package metadata is ready for PyPI, but the public release has not yet been published. During development, install from an editable checkout or a locally built wheel.

## Integration overview

| Framework | Main integration |
| --- | --- |
| Django | Form widget, model field, staticfiles integration, and admin support |
| Django REST Framework | Serializer field for OllowEditor-generated HTML |
| Flask | Extension, packaged asset blueprint, and Jinja helpers |
| FastAPI | StaticFiles mounting and template helpers |

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

Create and apply migrations:

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

    <button type="submit">
        Save article
    </button>
</form>
```

`{{ form.media }}` loads:

- `olloweditor/olloweditor.css`
- `olloweditor/olloweditor.browser.js`
- `olloweditor/olloweditor-init.js`

### Static files

```bash
python manage.py collectstatic
```

Configure Django staticfiles normally for production.

### Django admin

Models using `OllowEditorField` render with the editor in Django admin once `olloweditor.apps.OllowEditorConfig` is installed. For an existing `TextField`, use a custom form with `OllowEditorWidget` in the usual Django admin form override pattern.

## Django REST Framework quick start

Django REST Framework does not render the JavaScript editor for external API clients. It accepts and validates HTML generated by an OllowEditor frontend instance.

### Install

```bash
pip install "olloweditor[drf]"
```

### Serializer example

```python
from rest_framework import serializers
from olloweditor.integrations.drf import OllowEditorHTMLField

from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    content = OllowEditorHTMLField(
        allow_blank=True,
        required=False,
    )

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "content",
        ]
```

### JSON request example

```json
{
  "title": "Introducing OllowEditor",
  "content": "<p>Rich text generated by OllowEditor.</p>"
}
```

### Sanitizer callback

`OllowEditorHTMLField` accepts a sanitizer callable with the signature `Callable[[str], str]`.

```python
def sanitize_article_html(value: str) -> str:
    return trusted_html_sanitizer.clean(value)


class ArticleSerializer(serializers.ModelSerializer):
    content = OllowEditorHTMLField(
        sanitizer=sanitize_article_html,
    )
```

`trusted_html_sanitizer` is intentionally application-chosen. This package does not bundle a server-side HTML sanitizer.

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

    return render_template(
        "index.html",
        content=content,
    )
```

### Jinja template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
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

        <button type="submit">
            Save article
        </button>
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

The Flask integration also exposes an optional `olloweditor_textarea()` Jinja helper for library-generated textarea markup.

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

templates = Jinja2Templates(directory="templates")
mount_olloweditor(app)
templates.env.globals["olloweditor_assets"] = olloweditor_assets


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html",
        {},
    )
```

### Jinja template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
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

        <button type="submit">
            Save article
        </button>
    </form>
</body>
</html>
```

Applications that process HTML form submissions may also need:

```bash
pip install python-multipart
```

`python-multipart` is not required just to mount or serve OllowEditor assets.

The FastAPI integration also provides `olloweditor_textarea()` for applications that want a helper-generated `<textarea>`.

## Base package and packaged assets

Installing `pip install olloweditor` gives you the packaged assets and resource helpers even without a framework extra.

Packaged runtime files:

- `olloweditor.browser.js`
- `olloweditor.css`
- `olloweditor-init.js`

Framework behavior:

- Django discovers assets through staticfiles.
- Flask serves them through the registered `olloweditor` blueprint.
- FastAPI serves them through `StaticFiles` with `mount_olloweditor()`.
- Base-package code can resolve them with `get_static_root()`, `get_asset_path()`, and `asset_exists()`.

The shared initializer looks for:

```html
<textarea
    id="content"
    name="content"
    data-olloweditor="true"
    data-olloweditor-options='{"theme":"auto"}'
></textarea>
```

It also exposes:

```javascript
window.bootOllowEditor(document);
```

Load order matters:

1. `olloweditor.browser.js`
2. `olloweditor-init.js`

## Multiple editors

Multiple editor instances on one page are supported.

```html
<textarea
    name="summary"
    data-olloweditor="true"
></textarea>

<textarea
    name="content"
    data-olloweditor="true"
></textarea>
```

Each marked textarea receives an independent OllowEditor instance.

## Per-editor configuration

Pass JavaScript options through the Django widget or the shared data attribute.

Django example:

```python
from olloweditor.integrations.django import OllowEditorWidget


widget = OllowEditorWidget(
    options={
        "theme": "auto",
    }
)
```

HTML example:

```html
<textarea
    name="content"
    data-olloweditor="true"
    data-olloweditor-options='{"theme":"auto"}'
></textarea>
```

For the full JavaScript option surface, use the main OllowEditor configuration documentation:

- <https://github.com/CodeFortifyCloud/olloweditor/blob/pip/docs/configuration.md>

## Working with submitted content

OllowEditor synchronizes HTML back into the original textarea. Your backend receives a normal HTML string and remains responsible for validation, sanitization, storage, and rendering policy.

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


@app.post("/articles")
def create_article(
    content: Annotated[str, Form()],
):
    return {
        "content": content,
    }
```

### Django REST Framework JSON API

```json
{
  "content": "<p>Article content</p>"
}
```

## Security and HTML sanitization

OllowEditor generates HTML. Treat that as application content, not as inherently trusted markup.

- Client-side cleanup and sanitization are not a complete security boundary.
- Untrusted HTML can still create XSS and related rendering risks.
- Python applications should validate and sanitize untrusted HTML server-side before rendering it.
- Your application should define allowed tags, attributes, URL schemes, image sources, and embed providers.
- Upload endpoints need their own authorization, CSRF, MIME-type, extension, size, filename, and storage validation.
- Authentication and authorization remain the responsibility of the host application.
- Django `safe`, Jinja `safe`, `Markup`, or equivalent trust markers should be used only after content has been sanitized or otherwise explicitly trusted.

For uploads and rich embeds, also consider image dimensions, storage policy, and rate limits where relevant.

More security guidance:

- <https://github.com/CodeFortifyCloud/olloweditor/blob/pip/python/docs/security.md>
- <https://github.com/CodeFortifyCloud/olloweditor/blob/pip/docs/security.md>

## Framework dependency isolation

The base package is intentionally lightweight:

```bash
pip install olloweditor
```

That installation does not pull in all supported frameworks. Install only what you need:

```bash
pip install "olloweditor[django]"
```

This avoids unnecessary framework dependencies and reduces conflict risk in applications that only use one integration.

## Example applications

Runnable examples are included for every supported integration:

- [Django example](https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/examples/django_example)
  - Model field, forms, admin, and staticfiles integration
- [Django REST Framework example](https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/examples/drf_example)
  - HTML API input plus a small package-backed frontend page
- [Flask example](https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/examples/flask_example)
  - Extension registration, packaged assets, and form submission
- [FastAPI example](https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/examples/fastapi_example)
  - Static mount, Jinja template helper, and form handling

There is also an example index:

- <https://github.com/CodeFortifyCloud/olloweditor/blob/pip/python/examples/README.md>

## Development setup

From the repository root:

```bash
npm ci
npm run build
npm run typecheck
npm test
npm run build:python-assets
npm run verify:python-assets
```

Then set up the Python environment:

```bash
cd python

python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -e ".[all,dev,test]"
```

Run Python checks:

```bash
python -m pytest
python -m ruff check .
python -m ruff format --check .
python -m mypy src
```

## Building the Python package

```bash
rm -rf build dist src/*.egg-info

python -m build
python -m twine check dist/*
```

Expected outputs:

- `dist/olloweditor-<version>-py3-none-any.whl`
- `dist/olloweditor-<version>.tar.gz`

## Local wheel testing

Test the built wheel directly:

```bash
pip install dist/olloweditor-<version>-py3-none-any.whl
```

With an extra:

```bash
pip install "olloweditor[django] @ file:///path/to/dist/olloweditor-<version>-py3-none-any.whl"
```

Release validation should use the built wheel, not only an editable installation.

## TestPyPI and PyPI status

The package metadata is prepared for PyPI, but the release audit currently recommends a TestPyPI rehearsal before a real PyPI release.

Release-oriented references:

- [Release audit](https://github.com/CodeFortifyCloud/olloweditor/blob/pip/python/RELEASE_AUDIT.md)
- [Release notes](https://github.com/CodeFortifyCloud/olloweditor/blob/pip/python/docs/release.md)

After the first real PyPI publication, this README should be updated to remove the pre-publication note and add the production PyPI project link.

## Relationship to the npm package

The npm package is the direct frontend package for JavaScript build pipelines:

```bash
npm install @codefortify/olloweditor
```

Use the npm package when your application wants to consume OllowEditor directly from a frontend toolchain. Use the Python package when you want bundled assets and framework-specific integration helpers in Django, Django REST Framework, Flask, or FastAPI.

Main project documentation:

- <https://github.com/CodeFortifyCloud/olloweditor>
- <https://github.com/CodeFortifyCloud/olloweditor/blob/pip/README.md>

## Troubleshooting

### The editor does not appear

Check:

- the required assets are loaded
- the browser console for initialization errors
- `data-olloweditor="true"` is present on the `<textarea>`
- `olloweditor.browser.js` is loaded before `olloweditor-init.js`
- the same element is not being initialized twice

### Django assets return 404

Check:

- `django.contrib.staticfiles` is installed
- `olloweditor.apps.OllowEditorConfig` is in `INSTALLED_APPS`
- `collectstatic` has been run where required
- production static asset serving is configured correctly

### `form.media` is missing

Make sure the template renders:

```django
{{ form.media }}
```

### Flask assets return 404

Check:

- `OllowEditor(app)` or `olloweditor.init_app(app)` was called
- the Blueprint URL prefix is what you expect
- the template is using `{{ olloweditor_assets() }}`

### FastAPI assets return 404

Check:

- `mount_olloweditor(app)` was called
- the mount path matches the helper output
- another route is not already using the same mount path

### ImportError for a framework

Install the matching extra:

```bash
pip install "olloweditor[flask]"
```

### Invalid editor options

`data-olloweditor-options` must contain valid JSON that decodes to an object.

## Testing and quality

The repository includes:

- Python unit tests for the base package
- Django integration tests
- Django REST Framework integration tests
- Flask integration tests
- FastAPI integration tests
- static asset tests
- wheel-content verification
- clean-install verification
- example smoke tests

See the release audit for the current release-readiness result:

- <https://github.com/CodeFortifyCloud/olloweditor/blob/pip/python/RELEASE_AUDIT.md>

## Contributing

To contribute:

1. Fork the repository.
2. Create a branch for your change.
3. Add or update tests.
4. Run the frontend and Python verification commands.
5. Submit a pull request.

## License

OllowEditor is released under the [MIT License](https://github.com/CodeFortifyCloud/olloweditor/blob/pip/LICENSE).

## Project links

- Main repository: <https://github.com/CodeFortifyCloud/olloweditor>
- Main OllowEditor README: <https://github.com/CodeFortifyCloud/olloweditor/blob/pip/README.md>
- Python package directory: <https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python>
- Python docs:
  - <https://github.com/CodeFortifyCloud/olloweditor/tree/pip/python/docs>
- npm package: <https://www.npmjs.com/package/@codefortify/olloweditor>
- Issue tracker: <https://github.com/CodeFortifyCloud/olloweditor/issues>
