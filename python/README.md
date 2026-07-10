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
- icons
- fonts
- additional static files required by the editor

In this phase, the current OllowEditor browser bundle and CSS are included as packaged static assets.

## Development

From the repository root:

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev,test]"
python -m pytest
python -m build
python -m twine check dist/*
```

## License

MIT
