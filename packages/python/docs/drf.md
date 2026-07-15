# Django REST Framework

Install:

```bash
pip install "olloweditor[drf]"
```

Use `OllowEditorHTMLField` to receive editor-generated HTML strings in serializer payloads. The browser editor belongs to the frontend; DRF validates the resulting HTML string and can optionally sanitize it through a callable.
