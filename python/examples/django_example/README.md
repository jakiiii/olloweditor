# Django OllowEditor Example

This example uses Django forms, the OllowEditor model field, Django admin,
packaged static assets, and Django storage-backed uploads for IMAGE, GALLERY,
and ATTACHMENT.

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
- `/olloweditor/upload/image/` authenticated image upload endpoint
- `/olloweditor/upload/gallery/` authenticated gallery upload endpoint
- `/olloweditor/upload/attachment/` authenticated attachment upload endpoint

## How HTML reaches the backend

`OllowEditorField` renders a textarea widget. The browser bundle keeps that textarea synchronized, and Django receives the HTML through `request.POST["content"]` inside the normal `ModelForm` flow.

When uploads are enabled, OllowEditor sends files to the Django endpoints
above. Django stores them through `default_storage`, and the saved article HTML
contains only media URLs such as `/media/olloweditor/images/2026/07/example.png`
instead of `data:image/...;base64,...`.

## Example upload settings

`django_site/settings.py` configures:

- `MEDIA_ROOT`
- `MEDIA_URL`
- `OLLOWEDITOR["UPLOADS_ENABLED"]`
- upload directories for images, galleries, and attachments
- size limits and extension allowlists

`django_site/urls.py` includes:

- `path("olloweditor/", include("olloweditor.integrations.django.urls"))`
- development-only media serving with `static(settings.MEDIA_URL, ...)`

## Security note

Stored HTML is shown escaped in the detail template. In a real application, sanitize untrusted HTML before rendering it as active markup.
