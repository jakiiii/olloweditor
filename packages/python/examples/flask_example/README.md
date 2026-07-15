# Flask OllowEditor Example

This example uses the OllowEditor Flask extension, Jinja templates,
package-provided assets, local development media storage, and storage-backed
upload endpoints for IMAGE, GALLERY, and ATTACHMENT.

## Install

```bash
cd python
source .venv/bin/activate
python -m pip install -e ".[flask,test]"
```

## Run

```bash
cd packages/python/examples/flask_example
../../.venv/bin/python app.py
```

Open `http://127.0.0.1:5000/`.

## Routes

- `/` create article form
- `/articles/<id>` stored article view
- `/olloweditor/upload/image/`
- `/olloweditor/upload/gallery/`
- `/olloweditor/upload/attachment/`
- `/uploads/...` development-only media serving

## How HTML reaches the backend

The browser bundle synchronizes the textarea value, and Flask receives the HTML
in `request.form["content"]`.

When uploads are enabled, OllowEditor posts files to the Flask Blueprint
endpoints above. The example stores files under `packages/python/examples/flask_example/media`
and inserts only URL-based references such as `/uploads/olloweditor/images/...`
into the saved HTML.

The home page uses `extract_olloweditor_text(...)` to show a safe plain-text
preview instead of rendering stored HTML as trusted markup.

## Security note

Stored HTML is shown escaped in the result page. Sanitize untrusted HTML before
rendering it as active markup. The development media route is for local testing
only.
