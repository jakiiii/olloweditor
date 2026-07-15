# Django

Install:

```bash
pip install "olloweditor[django]"
```

Add the app:

```python
INSTALLED_APPS = [
    "olloweditor.apps.OllowEditorConfig",
]
```

Use `OllowEditorField` for model-backed rich text, or `OllowEditorWidget` for an existing field. Templates must render `{{ form.media }}`. Production deployments should run `python manage.py collectstatic`.
