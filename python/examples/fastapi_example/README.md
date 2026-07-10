# FastAPI OllowEditor Example

This example uses the FastAPI mount helper, Jinja templates, and package-provided assets.

## Install

```bash
cd python
source .venv/bin/activate
python -m pip install -e ".[fastapi,test]"
```

## Run

```bash
cd python/examples/fastapi_example
../../.venv/bin/python -m uvicorn main:app --reload
```

Open `http://127.0.0.1:8000/`.

## Routes

- `/` create article form
- `/articles` form submission endpoint
- `/articles/{id}` stored article view
- `/olloweditor/static/...` package-backed assets

## How HTML reaches the backend

The browser bundle synchronizes the textarea value, and FastAPI reads the HTML from `await request.form()`.

## Security note

Stored HTML is shown escaped in the result page. Sanitize untrusted HTML before rendering it as active markup.
