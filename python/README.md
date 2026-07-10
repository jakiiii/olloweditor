# olloweditor

`olloweditor` is the Python packaging foundation for the OllowEditor browser bundle.

This package will distribute the existing OllowEditor JavaScript and CSS assets and add optional integrations for:

- Django
- Django REST Framework
- Flask
- FastAPI

This package includes the base asset packaging layer plus Django, Django REST Framework, Flask, and FastAPI integrations.

## Status

Current scope:

- Python package metadata and packaging configuration
- packaged static asset layout
- safe resource lookup helpers based on `importlib.resources`
- Django form/widget/model field integration
- Django REST Framework serializer field integration
- Flask extension and asset-serving blueprint
- FastAPI static mount and template helpers
- unit tests for asset resolution and path validation

Not included yet:

- framework-specific upload endpoints

## Installation

Base package:

```bash
pip install olloweditor
```

Optional extras are reserved for later phases:

```bash
pip install "olloweditor[django]"
pip install "olloweditor[drf]"
pip install "olloweditor[flask]"
pip install "olloweditor[fastapi]"
pip install "olloweditor[all]"
```

## Packaged Assets

The package is structured to carry browser assets such as:

- JavaScript bundles
- CSS bundles
- shared initialization scripts
- icons
- fonts
- additional static files required by the editor

In this phase, the current OllowEditor browser bundle and CSS are included as packaged static assets.

## Automatic Initialization

The packaged static files include a framework-independent initializer:

- `olloweditor.browser.js`
- `olloweditor-init.js`

Load order matters:

```html
<link rel="stylesheet" href="/static/olloweditor/olloweditor.css">

<textarea
  name="content"
  data-olloweditor="true"
  data-olloweditor-options='{"theme":"auto"}'></textarea>

<script src="/static/olloweditor/olloweditor.browser.js"></script>
<script src="/static/olloweditor/olloweditor-init.js"></script>
```

Supported data attributes:

- `data-olloweditor="true"` enables auto-initialization
- `data-olloweditor-options='{"theme":"auto"}'` passes JSON options to the existing browser API

The initializer also exposes:

```js
window.bootOllowEditor(root)
```

This is intended for dynamically inserted forms, modals, and partial page updates.

## Django

Install the Django integration with:

```bash
pip install "olloweditor[django]"
```

Register the app in `settings.py`:

```python
INSTALLED_APPS = [
    # ...
    "olloweditor.apps.OllowEditorConfig",
]
```

Use the model field directly:

```python
from django.db import models
from olloweditor.integrations.django import OllowEditorField


class Article(models.Model):
    title = models.CharField(max_length=255)
    content = OllowEditorField()
```

Use the widget on an existing text field:

```python
from django import forms
from olloweditor.integrations.django import OllowEditorWidget


class ArticleForm(forms.ModelForm):
    content = forms.CharField(
        widget=OllowEditorWidget(
            options={
                "theme": "auto",
            }
        )
    )
```

Template usage:

```django
{{ form.media }}
{{ form }}
```

Django admin works automatically for `OllowEditorField`. For an existing `TextField`, assign `OllowEditorWidget` in a custom form used by `ModelAdmin`.

In production, remember to run:

```bash
python manage.py collectstatic
```

Security note:

OllowEditor does not automatically sanitize or trust saved HTML on the server side. Applications must apply their own HTML sanitization and rendering policy for untrusted content.

## Django REST Framework

Install the DRF integration with:

```bash
pip install "olloweditor[drf]"
```

Use the serializer field directly:

```python
from rest_framework import serializers
from olloweditor.integrations.drf import OllowEditorHTMLField


class ArticleSerializer(serializers.ModelSerializer):
    content = OllowEditorHTMLField(
        allow_blank=True,
        required=False,
    )
```

Expected JSON:

```json
{
  "title": "Article title",
  "content": "<p>Article content</p>"
}
```

Supplying a trusted sanitizer callable:

```python
from rest_framework import serializers
from olloweditor.integrations.drf import OllowEditorHTMLField


def sanitize_html(value: str) -> str:
    return value


class ArticleSerializer(serializers.Serializer):
    content = OllowEditorHTMLField(
        allow_blank=True,
        sanitizer=sanitize_html,
    )
```

Security warning:

- HTML from users can contain unsafe markup.
- The editor is not a server-side security boundary.
- Applications must sanitize untrusted HTML before rendering it.

## FastAPI

Install the FastAPI integration with:

```bash
pip install "olloweditor[fastapi]"
```

Mount the packaged assets on the application:

```python
from fastapi import FastAPI
from olloweditor.integrations.fastapi import mount_olloweditor


app = FastAPI()
mount_olloweditor(app)
```

Register the HTML helper for Jinja templates:

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
  data-olloweditor="true"></textarea>
```

You may also generate a textarea directly from Python with `olloweditor_textarea(...)`.

If your application accepts HTML form submissions, FastAPI applications commonly need `python-multipart` installed for form parsing.

Submitted editor HTML is available through the normal FastAPI request form APIs:

```python
form = await request.form()
content = form["content"]
```

Security warning:

- HTML from users can contain unsafe markup.
- The editor is not a server-side security boundary.
- Applications must sanitize untrusted HTML before rendering it.
- This package does not ship a default server-side HTML sanitizer.

## Flask

Install the Flask integration with:

```bash
pip install "olloweditor[flask]"
```

Direct application setup:

```python
from flask import Flask
from olloweditor.integrations.flask import OllowEditor


app = Flask(__name__)
olloweditor = OllowEditor(app)
```

Application factory setup:

```python
from flask import Flask
from olloweditor.integrations.flask import OllowEditor


olloweditor = OllowEditor()


def create_app() -> Flask:
    app = Flask(__name__)
    olloweditor.init_app(app)
    return app
```

Template usage:

```html
{{ olloweditor_assets() }}

<textarea
  name="content"
  data-olloweditor="true"></textarea>
```

Submitted HTML is available through the normal Flask form APIs:

```python
from flask import request

content = request.form["content"]
```

The extension serves packaged assets from a blueprint under `/olloweditor` by default. Set `OLLOWEDITOR_URL_PREFIX` to change the prefix.

Security warning:

- HTML from users can contain unsafe markup.
- The editor is not a server-side security boundary.
- Applications must sanitize untrusted HTML before rendering it.

## Development

From the repository root:

```bash
npm run build
npm run build:python-assets
npm run verify:python-assets

cd python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev,test]"
python -m pytest
python -m build
python -m twine check dist/*
python scripts/check_wheel_contents.py dist/*.whl
```

Recommended release order:

1. Build JavaScript assets.
2. Synchronize Python package assets.
3. Verify synchronized Python assets.
4. Build the Python package and validate the wheel.

## License

MIT
