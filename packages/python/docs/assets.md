# Assets

Packaged assets live under:

```text
olloweditor/static/olloweditor/
```

Included runtime files:

- `olloweditor.browser.js`
- `olloweditor.css`
- `olloweditor-init.js`

Serving model:

- Django: staticfiles
- Flask: packaged blueprint
- FastAPI: `StaticFiles` mount

Rebuild flow from the repository root:

```bash
npm run build
npm run build:python-assets
npm run verify:python-assets
```

Custom CDN-style publishing is not handled by a dedicated helper. If you publish the packaged files yourself, keep filenames and paths aligned with the framework integration you use.
