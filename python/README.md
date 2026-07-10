# olloweditor

`olloweditor` is the Python packaging foundation for the OllowEditor browser bundle.

This package will distribute the existing OllowEditor JavaScript and CSS assets and add optional integrations for:

- Django
- Django REST Framework
- Flask
- FastAPI

This phase provides only the base package structure and packaged static-resource helpers. Framework integrations are added in later phases.

## Status

Current scope:

- Python package metadata and packaging configuration
- packaged static asset layout
- safe resource lookup helpers based on `importlib.resources`
- unit tests for asset resolution and path validation

Not included yet:

- Django widgets or template tags
- DRF serializer helpers
- Flask blueprint helpers
- FastAPI mounting helpers

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
