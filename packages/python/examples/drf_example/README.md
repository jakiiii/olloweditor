# DRF OllowEditor Example

This example uses Django REST Framework for HTML API input and serves a small
package-backed frontend page that posts editor HTML to the API. Uploads use the
shared Django storage-backed endpoints.

## Install

```bash
cd python
source .venv/bin/activate
python -m pip install -e ".[drf,test]"
```

## Run

```bash
cd packages/python/examples/drf_example
../../.venv/bin/python manage.py migrate
../../.venv/bin/python manage.py runserver
```

Open `http://127.0.0.1:8000/`.

## Routes

- `/` example frontend page
- `/api/articles/` list and create
- `/api/articles/<id>/` retrieve and update
- `/api/olloweditor/upload/image/`
- `/api/olloweditor/upload/gallery/`
- `/api/olloweditor/upload/attachment/`
- `/media/...` development-only media serving

## Example request

```bash
curl -X POST http://127.0.0.1:8000/api/articles/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Example","content":"<p>Saved from OllowEditor</p>"}'
```

## How HTML reaches the backend

The browser editor synchronizes a textarea. The example frontend submits the
textarea value as JSON to the API, and `OllowEditorHTMLField` validates the
HTML string on the server.

The frontend page also passes upload endpoint configuration into
`data-olloweditor-options`, so IMAGE, GALLERY, and ATTACHMENT use URL-based
uploads rather than base64. The serializer exposes a plain-text `preview`
field, and the template uses `extract_olloweditor_text(...)` for safe list
previews.

## Security note

This example stores HTML but does not declare it trusted. Sanitize untrusted
HTML before rendering it in a browser. The `/media/` route is for development
only.
