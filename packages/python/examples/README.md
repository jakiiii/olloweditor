# OllowEditor Example Applications

This directory contains runnable examples for every supported Python integration:

- `django_example/`
- `drf_example/`
- `flask_example/`
- `fastapi_example/`

All examples use the local `olloweditor` package and the packaged OllowEditor static assets. No CDN assets are used.

## Shared setup

From the repository root:

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[all,test]"
```

## Examples

### Django

```bash
cd packages/python/examples/django_example
python ../../.venv/bin/python manage.py migrate
python ../../.venv/bin/python manage.py createsuperuser
python ../../.venv/bin/python manage.py runserver
```

Open `http://127.0.0.1:8000/`.

### Django REST Framework

```bash
cd packages/python/examples/drf_example
python ../../.venv/bin/python manage.py migrate
python ../../.venv/bin/python manage.py runserver
```

Open `http://127.0.0.1:8000/`.

### Flask

```bash
cd packages/python/examples/flask_example
python ../../.venv/bin/python app.py
```

Open `http://127.0.0.1:5000/`.

### FastAPI

```bash
cd packages/python/examples/fastapi_example
python ../../.venv/bin/python -m uvicorn main:app --reload
```

Open `http://127.0.0.1:8000/`.

## Security note

All examples store editor-produced HTML and show how it reaches the backend. They do not treat user HTML as trusted. Review and sanitize untrusted HTML before rendering it in a real application.
