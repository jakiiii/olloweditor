# Flask OllowEditor Example

This example uses the OllowEditor Flask extension, Jinja templates, and package-provided assets.

## Install

```bash
cd python
source .venv/bin/activate
python -m pip install -e ".[flask,test]"
```

## Run

```bash
cd python/examples/flask_example
../../.venv/bin/python app.py
```

Open `http://127.0.0.1:5000/`.

## Routes

- `/` create article form
- `/articles/<id>` stored article view

## How HTML reaches the backend

The browser bundle synchronizes the textarea value, and Flask receives the HTML in `request.form["content"]`.

## Security note

Stored HTML is shown escaped in the result page. Sanitize untrusted HTML before rendering it as active markup.
