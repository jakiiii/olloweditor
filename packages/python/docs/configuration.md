# Configuration

Current configuration surfaces:

- shared browser auto-init:
  - `data-olloweditor="true"`
  - `data-olloweditor-options='{"theme":"auto"}'`
- Django widget:
  - `attrs`
  - `options`
- Flask extension:
  - `url_prefix`
  - `app.config["OLLOWEDITOR_URL_PREFIX"]`
- FastAPI:
  - `mount_olloweditor(app, path=..., name=...)`
  - `olloweditor_assets(path=...)`

Editor option names are forwarded to the browser API as JSON. The Python package does not validate option semantics.
