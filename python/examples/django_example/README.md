# Django OllowEditor Example

This example uses Django forms, the OllowEditor model field, Django admin, and packaged static assets.

## Install

```bash
cd python
source .venv/bin/activate
python -m pip install -e ".[django,test]"
```

## Run

```bash
cd python/examples/django_example
../../.venv/bin/python manage.py migrate
../../.venv/bin/python manage.py collectstatic --noinput
../../.venv/bin/python manage.py runserver
```

Open `http://127.0.0.1:8000/`.

## Routes

- `/` article list
- `/articles/new/` create article
- `/articles/<id>/` article detail
- `/articles/<id>/edit/` update article
- `/admin/` Django admin

## How HTML reaches the backend

`OllowEditorField` renders a textarea widget. The browser bundle keeps that textarea synchronized, and Django receives the HTML through `request.POST["content"]` inside the normal `ModelForm` flow.

## Security note

Stored HTML is shown escaped in the detail template. In a real application, sanitize untrusted HTML before rendering it as active markup.
