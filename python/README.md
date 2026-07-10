# olloweditor

[![Python CI](https://github.com/CodeFortifyCloud/olloweditor/actions/workflows/python-ci.yml/badge.svg)](https://github.com/CodeFortifyCloud/olloweditor/actions/workflows/python-ci.yml)

`olloweditor` packages the OllowEditor browser build for Python applications and adds framework integrations for Django, Django REST Framework, Flask, and FastAPI.

It does not reimplement the editor in Python. The package ships the compiled JavaScript, CSS, and initialization assets, then provides Python helpers for serving those assets and wiring them into forms, templates, and APIs.

## Links

- Main OllowEditor project: <https://github.com/CodeFortifyCloud/olloweditor>
- Python documentation: <https://github.com/CodeFortifyCloud/olloweditor/tree/main/python>
- npm package: <https://www.npmjs.com/package/@codefortify/olloweditor>
- GitHub repository: <https://github.com/CodeFortifyCloud/olloweditor>
- Issue tracker: <https://github.com/CodeFortifyCloud/olloweditor/issues>

## Features

- Packaged browser assets:
  - `olloweditor.browser.js`
  - `olloweditor.css`
  - `olloweditor-init.js`
- Django:
  - `OllowEditorField`
  - `OllowEditorWidget`
  - Django admin support through normal form generation
  - staticfiles-compatible assets
- Django REST Framework:
  - `OllowEditorHTMLField` for HTML payload validation
  - optional sanitizer callable
- Flask:
  - `OllowEditor(app)` and `init_app`
  - packaged asset blueprint
  - Jinja helpers
- FastAPI:
  - `mount_olloweditor`
  - asset tag helper
  - optional textarea helper
- Example applications for all supported frameworks
- Release verification script and automated quality checks

## Supported Versions

- Python:
  - 3.10
  - 3.11
  - 3.12
  - 3.13
- Framework extras:
  - Django `>=4.2`
  - Django REST Framework `>=3.15`
  - Flask `>=3.0`
  - FastAPI `>=0.110`

## Architecture

`olloweditor` has three layers:

1. JavaScript editor:
   The existing OllowEditor browser bundle in `dist/` is the real editor implementation.

2. Packaged static assets:
   The Python package includes synchronized copies of the browser bundle, CSS, and shared initializer under `olloweditor/static/olloweditor/`.

3. Python integration layer:
   Framework-specific helpers connect those assets to Django forms, DRF serializers, Flask templates, and FastAPI mounts.

## Installation

Base package only:

```bash
pip install olloweditor
```

Framework extras:

```bash
pip install "olloweditor[django]"
pip install "olloweditor[drf]"
pip install "olloweditor[flask]"
pip install "olloweditor[fastapi]"
pip install "olloweditor[all]"
```

Base installation does not require Django, DRF, Flask, or FastAPI.

## Quick Start

### Django

Install:

```bash
pip install "olloweditor[django]"
```

Register the app:

```python
INSTALLED_APPS = [
    # ...
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

Render the form normally:

```django
{{ form.media }}
{{ form }}
```

The widget includes:

- `olloweditor/olloweditor.css`
- `olloweditor/olloweditor.browser.js`
- `olloweditor/olloweditor-init.js`

### Django REST Framework

Install:

```bash
pip install "olloweditor[drf]"
```

Use the serializer field:

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

Expected payload:

```json
{
  "title": "Article title",
  "content": "<p>Article content</p>"
}
```

DRF integration validates HTML strings. It does not render the browser editor for API clients.

### Flask

Install:

```bash
pip install "olloweditor[flask]"
```

Create the extension:

```python
from flask import Flask
from olloweditor.integrations.flask import OllowEditor


app = Flask(__name__)
olloweditor = OllowEditor(app)
```

Render assets in Jinja:

```html
{{ olloweditor_assets() }}

<textarea
    name="content"
    data-olloweditor="true"
></textarea>
```

Submitted HTML is available in Flask through:

```python
request.form["content"]
```

### FastAPI

Install:

```bash
pip install "olloweditor[fastapi]"
```

Mount packaged assets:

```python
from fastapi import FastAPI
from olloweditor.integrations.fastapi import mount_olloweditor


app = FastAPI()
mount_olloweditor(app)
```

Register the Jinja helper:

```python
from fastapi.templating import Jinja2Templates
from olloweditor.integrations.fastapi import olloweditor_assets


templates = Jinja2Templates(directory="templates")
templates.env.globals["olloweditor_assets"] = olloweditor_assets
```

Template usage:

```html
{{ olloweditor_assets() }}

<textarea
    name="content"
    data-olloweditor="true"
></textarea>
```

Submitted HTML is available through:

```python
form = await request.form()
content = form["content"]
```

FastAPI form parsing usually requires `python-multipart` in the application environment.

## Core Asset Behavior

The shared initializer uses:

- `data-olloweditor="true"`
- `data-olloweditor-options='{"theme":"auto"}'`

Load order:

```html
<link rel="stylesheet" href="/static/olloweditor/olloweditor.css">

<textarea
  name="content"
  data-olloweditor="true"
  data-olloweditor-options='{"theme":"auto"}'></textarea>

<script src="/static/olloweditor/olloweditor.browser.js"></script>
<script src="/static/olloweditor/olloweditor-init.js"></script>
```

The initializer also exposes:

```js
window.bootOllowEditor(root)
```

Use that when markup is inserted dynamically after initial page load.

## Django Integration

### `INSTALLED_APPS`

Add:

```python
"olloweditor.apps.OllowEditorConfig"
```

### `OllowEditorField`

`OllowEditorField` extends `django.db.models.TextField` and uses `OllowEditorWidget` in generated ModelForms.

```python
from django.db import models
from olloweditor.integrations.django import OllowEditorField


class Article(models.Model):
    content = OllowEditorField()
```

### `OllowEditorWidget`

Use it with an existing field:

```python
from django import forms
from olloweditor.integrations.django import OllowEditorWidget


class ArticleForm(forms.ModelForm):
    content = forms.CharField(
        widget=OllowEditorWidget(
            attrs={"rows": 12, "class": "editor-field"},
            options={"theme": "auto"},
        )
    )
```

Widget behavior:

- adds `data-olloweditor="true"`
- serializes `options` to `data-olloweditor-options`
- merges CSS classes without duplication
- includes widget media for CSS and JavaScript

### `form.media`

Templates must render `form.media`:

```django
{{ form.media }}
{{ form }}
```

### Admin

Models using `OllowEditorField` work in Django admin without extra code.

For an existing `TextField`, assign `OllowEditorWidget` in a custom `ModelForm` used by `ModelAdmin`.

### Multiple editor fields

Multiple widgets can appear on one page. Each textarea gets its own `data-olloweditor` boot path.

### Configuration options

Pass editor options through the widget:

```python
OllowEditorWidget(
    options={
        "theme": "auto",
    }
)
```

The package does not validate editor option names. They are forwarded to the browser API as JSON.

### `collectstatic`

In production, run:

```bash
python manage.py collectstatic
```

Django will collect the packaged assets under `olloweditor/`.

## Django REST Framework Integration

### `OllowEditorHTMLField`

Use it for HTML string payloads:

```python
from rest_framework import serializers
from olloweditor.integrations.drf import OllowEditorHTMLField


class ArticleSerializer(serializers.Serializer):
    title = serializers.CharField()
    content = OllowEditorHTMLField(allow_blank=True)
```

### Payload format

The backend receives editor output as an HTML string:

```json
{
  "title": "Article title",
  "content": "<p>Article content</p>"
}
```

### Validation behavior

`OllowEditorHTMLField` keeps HTML whitespace by default and supports normal DRF `CharField` options, including:

- `required`
- `allow_blank`
- `allow_null`
- `max_length`
- `min_length`
- `validators`
- `default`
- `read_only`
- `write_only`

### Sanitizer callable

You may provide a sanitizer:

```python
def sanitize_html(value: str) -> str:
    return value


content = OllowEditorHTMLField(sanitizer=sanitize_html)
```

Rules:

- the sanitizer runs after normal string validation
- it must return a string
- exceptions become DRF `ValidationError`

### Frontend/backend responsibility

The browser editor produces HTML. DRF receives and validates that HTML. API consumers are responsible for sending the HTML string. The DRF integration does not embed the editor into API clients.

## Flask Integration

### `OllowEditor(app)`

```python
from flask import Flask
from olloweditor.integrations.flask import OllowEditor


app = Flask(__name__)
olloweditor = OllowEditor(app)
```

### `init_app`

Application factory pattern:

```python
from flask import Flask
from olloweditor.integrations.flask import OllowEditor


olloweditor = OllowEditor()


def create_app() -> Flask:
    app = Flask(__name__)
    olloweditor.init_app(app)
    return app
```

### Blueprint asset route

The extension registers a blueprint named `olloweditor` and serves assets under `/olloweditor` by default.

Example asset URLs:

- `/olloweditor/olloweditor.css`
- `/olloweditor/olloweditor.browser.js`
- `/olloweditor/olloweditor-init.js`

Change the prefix with:

```python
app.config["OLLOWEDITOR_URL_PREFIX"] = "/assets/editor"
```

### Jinja helper

Use:

```html
{{ olloweditor_assets() }}
```

Optional helper:

```html
{{ olloweditor_textarea("content", "", id="content") }}
```

### Form submission

Submitted HTML is available through:

```python
request.form["content"]
```

## FastAPI Integration

### `mount_olloweditor`

```python
from fastapi import FastAPI
from olloweditor.integrations.fastapi import mount_olloweditor


app = FastAPI()
mount_olloweditor(app)
```

Default mount path:

```text
/olloweditor/static
```

You can customize it:

```python
mount_olloweditor(app, path="/assets/editor", name="editor_static")
```

### `Jinja2Templates`

Register the helper:

```python
from fastapi.templating import Jinja2Templates
from olloweditor.integrations.fastapi import olloweditor_assets


templates = Jinja2Templates(directory="templates")
templates.env.globals["olloweditor_assets"] = olloweditor_assets
```

Optional textarea helper:

```python
from olloweditor.integrations.fastapi import olloweditor_textarea

templates.env.globals["olloweditor_textarea"] = olloweditor_textarea
```

### Template global

```html
{{ olloweditor_assets() }}
```

### Form submission

```python
form = await request.form()
content = form["content"]
```

### Static route configuration

`mount_olloweditor()` normalizes trailing slashes and rejects invalid mount paths such as the application root or empty strings.

## Security

OllowEditor generates HTML. That matters.

- HTML from untrusted users may contain unsafe markup.
- Client-side editor behavior is not a complete security boundary.
- This package does not ship a default server-side HTML sanitizer.
- Rendering stored HTML as safe must be an explicit application decision.
- File uploads need their own validation and storage controls.
- Allowed tags, attributes, URL schemes, file types, and file sizes should be restricted by the application.

Typical production approach:

1. accept HTML from the editor
2. sanitize it on the server with a real HTML sanitizer chosen by the application
3. store the sanitized or reviewed form
4. render it only under an explicit trust policy

Do not assume that the editor alone makes HTML safe.

## Asset Handling

The Python package ships synchronized copies of the built frontend assets under:

```text
olloweditor/static/olloweditor/
```

### Django

Django serves them through `staticfiles`. Render `form.media` and run `collectstatic` in production.

### Flask

Flask serves them through the `olloweditor` blueprint. URLs are generated by `url_for`.

### FastAPI

FastAPI serves them through `mount_olloweditor()` using Starlette `StaticFiles`.

### Custom asset paths and CDN-style setups

Built-in helpers support:

- Django via your normal staticfiles path and `STATIC_URL`
- Flask via `OLLOWEDITOR_URL_PREFIX`
- FastAPI via the `path` argument to `mount_olloweditor()` and `olloweditor_assets(path=...)`

The package does not currently provide a dedicated CDN URL helper. If you publish the packaged files through your own asset pipeline or CDN, use the same filenames and framework-specific URL generation strategy on your side.

### Rebuild and synchronize assets

From the repository root:

```bash
npm run build
npm run build:python-assets
npm run verify:python-assets
```

## Development

From the repository root:

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev,test]"
python scripts/verify_release.py
```

Useful commands:

```bash
python -m pytest
python -m pytest --cov=olloweditor
python -m ruff check .
python -m ruff format --check .
python -m mypy src
python -m build
python -m twine check dist/*
```

## Build and Release

Recommended order:

1. build JavaScript assets
2. synchronize Python assets
3. verify synchronized Python assets
4. run `python/scripts/verify_release.py`

Single release verification command:

```bash
cd python
python scripts/verify_release.py
```

## Troubleshooting

### The editor does not appear

- check that both JavaScript files are loaded:
  - `olloweditor.browser.js`
  - `olloweditor-init.js`
- check that the textarea has `data-olloweditor="true"`
- check browser console errors

### CSS is not loading

- Django: confirm `form.media` is rendered and `collectstatic` is configured
- Flask: confirm the blueprint path is reachable
- FastAPI: confirm the mount path matches the helper path

### `window.OllowEditor` is missing

- make sure the browser bundle is loaded before the initializer
- make sure you are serving `olloweditor.browser.js`, not an ES module build

### Django `collectstatic` problems

- confirm `olloweditor.apps.OllowEditorConfig` is in `INSTALLED_APPS`
- confirm staticfiles is enabled
- rerun `python manage.py collectstatic`

### Flask blueprint conflict

- the extension uses the `olloweditor` blueprint name
- do not register a conflicting blueprint on the same app
- use `OLLOWEDITOR_URL_PREFIX` to change the served path if needed

### FastAPI mount conflict

- `mount_olloweditor()` rejects duplicate mount names and conflicting mount paths
- pass a different `path` or `name` when the app already uses that route

### Multiple initialization

- the shared initializer prevents duplicate initialization on the same marked element
- repeated calls to `window.bootOllowEditor(root)` should target newly inserted content

### Invalid `data-olloweditor-options` JSON

- invalid JSON does not stop the whole page
- the initializer logs a console error and continues with other elements

### Installed without the required framework extra

- base `pip install olloweditor` does not install framework dependencies
- install the needed extra:
  - `pip install "olloweditor[django]"`
  - `pip install "olloweditor[drf]"`
  - `pip install "olloweditor[flask]"`
  - `pip install "olloweditor[fastapi]"`

## Additional Documentation

- [Installation](docs/installation.md)
- [Django](docs/django.md)
- [Django REST Framework](docs/drf.md)
- [Flask](docs/flask.md)
- [FastAPI](docs/fastapi.md)
- [Configuration](docs/configuration.md)
- [Assets](docs/assets.md)
- [Security](docs/security.md)
- [Development](docs/development.md)
- [Release](docs/release.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

MIT
