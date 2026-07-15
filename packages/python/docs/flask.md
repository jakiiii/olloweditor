# Flask

Install:

```bash
pip install "olloweditor[flask]"
```

Use `OllowEditor(app)` or `init_app(app)`. The extension registers a blueprint for packaged assets and exposes `olloweditor_assets()` plus `olloweditor_textarea()` to Jinja.
