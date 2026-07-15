# FastAPI OllowEditor Example

This example uses the FastAPI integration class, Jinja templates,
package-provided assets, local development media storage, and storage-backed
upload endpoints for IMAGE, GALLERY, and ATTACHMENT.

## Install

```bash
cd python
source .venv/bin/activate
python -m pip install -e ".[fastapi,test]"
```

## Run

```bash
cd packages/python/examples/fastapi_example
../../.venv/bin/python -m uvicorn main:app --reload
```

Open `http://127.0.0.1:8000/`.

## Routes

- `/` create article form
- `/articles` form submission endpoint
- `/articles/{id}` stored article view
- `/olloweditor/static/...` package-backed assets
- `/olloweditor/upload/image/`
- `/olloweditor/upload/gallery/`
- `/olloweditor/upload/attachment/`
- `/uploads/...` development-only media mount

## How HTML reaches the backend

The browser bundle synchronizes the textarea value, and FastAPI reads the HTML
from `await request.form()`.

When uploads are enabled, OllowEditor posts files to the FastAPI router
endpoints above. The example stores files under
`packages/python/examples/fastapi_example/media` and inserts only URL-based references
such as `/uploads/olloweditor/images/...` into the saved HTML.

The home page uses `extract_olloweditor_text(...)` to show a safe plain-text
preview instead of rendering stored HTML as trusted markup.

## Security note

Stored HTML is shown escaped in the result page. Sanitize untrusted HTML before
rendering it as active markup. The development media mount is for local testing
only.
