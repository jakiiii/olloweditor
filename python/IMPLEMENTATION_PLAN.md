# OllowEditor Python Packaging Implementation Plan

## Phase 0 Scope

This document captures the current repository state and proposes a Python packaging plan for a future `olloweditor` PyPI package with optional integrations for:

- Django
- Django REST Framework
- Flask
- FastAPI

This phase does not implement runtime features. It only documents findings and the next implementation path.

## Existing Repository Findings

### Repository shape in the current checkout

The current repository checkout is not a full source tree. It is primarily a built/browser distribution plus docs and demo files.

Observed top-level files and directories:

- `README.md`
- `ollow.js`
- `ollow.css`
- `ollow.html`
- `dist/`
- `website/`
- `codefortify-olloweditor-0.1.0.tgz`

Not present in the current checkout:

- `package.json` at repo root
- Vite config files
- Rollup config files
- `tsconfig.json`
- `src/`
- test directories
- `.github/workflows/`

Because those files are missing from the working tree, the npm package tarball was inspected to recover package metadata and exported build targets.

### npm package metadata recovered from tarball

`codefortify-olloweditor-0.1.0.tgz` contains:

- `package/package.json`
- `package/dist/index.d.ts`
- `package/dist/react.d.ts`
- `package/dist/olloweditor.es.js`
- `package/dist/olloweditor.cjs`
- `package/dist/olloweditor-react.es.js`
- `package/dist/olloweditor-react.cjs`
- `package/dist/olloweditor.css`

Recovered npm package facts:

- package name: `@codefortify/olloweditor`
- version: `0.1.0`
- `main`: `./dist/olloweditor.cjs`
- `module`: `./dist/olloweditor.es.js`
- `types`: `./dist/index.d.ts`
- CSS export: `./dist/olloweditor.css`
- React subpath export: `./react`

The tarball metadata references Vite and TypeScript scripts, but the actual config files are not present in this checkout.

### Existing build outputs

Current build/distribution artifacts visible in the repo:

- Browser global build:
  - `ollow.js`
  - `ollow.css`
- npm `dist/` module outputs:
  - `dist/olloweditor.es.js`
  - `dist/olloweditor.cjs`
  - `dist/olloweditor-react.es.js`
  - `dist/olloweditor-react.cjs`
  - `dist/olloweditor.css`
  - `dist/index.d.ts`
  - `dist/react.d.ts`

### Existing docs and demos

- `README.md` is the main usage and API reference.
- `ollow.html` is a browser demo showing textarea binding.
- `website/` contains marketing/docs site files.

### Existing tests

No automated test files are present in the current checkout.

### Existing GitHub Actions workflows

No `.github/workflows/` directory is present in the current checkout.

## Existing Editor Initialization API

There are two related public surfaces today.

### 1. Browser global API from `ollow.js`

`ollow.js` is a browser-ready IIFE bundle. It exposes globals:

- `window.OllowEditor`
- `window.NationWireEditor`

The API object supports:

- `registerPlugin(name, factory)`
- `initAll(root, options)`
- `init(target, options)`
- `get(target)`
- `instances()`

Initialization examples:

```js
OllowEditor.init("#ollo-editor", {
  theme: "dark",
  persistTheme: true
});
```

Or auto-bind multiple textareas:

```js
NationWireEditor.initAll(document, {
  persistTheme: true
});
```

Textarea selectors auto-detected by `initAll`:

- `textarea[data-nw-editor]`
- `textarea[data-ollow-editor]`

### 2. npm module API from `dist/`

The ESM/CJS package exports:

- `createOllowEditor(selector, options)`
- `OllowEditorCore`
- default export = `createOllowEditor`

This module API wraps the textarea-based browser editor and can mount into either:

- an existing `<textarea>`
- a host HTMLElement, where the wrapper creates/manages a textarea internally

### Current instantiation model

The underlying editor runtime is textarea-centered.

- The main editor instance is `EditorInstance`.
- `api.init(...)` only accepts a `<textarea>`.
- The editor hides or augments the textarea and inserts the editor UI after it.
- The textarea remains the synchronization boundary for saved HTML.

## Detailed Behavior Findings

### Can the editor initialize from a textarea?

Yes. This is the native integration model.

### How textarea content is synchronized

The editor sync method writes generated HTML back into the original textarea:

```js
this.textarea.value = this.isSourceMode() ? this.getSourceHTML() : this.getHTML();
```

The synced textarea value is what form submission sends to the backend.

The editor also auto-binds form submission behavior so the textarea is current at submit time.

### Whether multiple editors can exist on one page

Yes.

- Instances are stored in a `Map`.
- `initAll(...)` binds all matching textareas in a root.
- `instances()` returns all live instances.

### Whether the editor supports configuration through an options object

Yes.

Observed option categories:

- `placeholder`
- `autosaveDelay`
- `theme`
- `persistTheme`
- `themeStorageKey`
- `readOnly`
- `upload`
- `uploadHeaders`
- `uploadMethod`
- `docx`
- `plugins`
- module-wrapper-only options such as `initialHTML`, `className`, `onChange`, `uploadImage`

### Plugin system

Yes. Plugins are registered globally before initialization and enabled per editor with `options.plugins`.

### Event model

Observed custom events and internal emitter hooks include:

- `nationwire-editor:ready`
- `nationwire-editor:sync`
- `nationwire-editor:change`
- `nationwire-editor:autosave`
- `ollow-editor:themechange`
- `ollow-editor:import-docx`
- `ollow-editor:export-html`
- `ollow-editor:export-docx`
- `ollow-editor:export-pdf`

### Theme API

Instance methods include:

- `getTheme()`
- `setTheme(theme)`

### Upload integration

The runtime supports upload configuration for:

- images
- galleries
- attachments

The client can send CSRF headers and respects cross-origin credential restrictions.

## Browser Bundle Compatibility Findings

### Browser-ready IIFE or UMD availability

- A browser-ready IIFE exists: `ollow.js`
- No UMD build was found
- The npm `dist/` directory only exposes ESM/CJS module builds plus CSS

This matters for Python framework integrations because server-rendered templates usually want a simple static asset that can be included with:

- `<script src="..."></script>`
- `<link rel="stylesheet" href="...">`

The existing `ollow.js`/`ollow.css` pair is the most direct asset set for Python framework static-file packaging.

### Which JS and CSS files should be packaged for Python

Minimum viable Python static assets:

- `ollow.js`
- `ollow.css`

Possible optional secondary asset set for completeness:

- `dist/olloweditor.es.js`
- `dist/olloweditor.cjs`
- `dist/olloweditor.css`

Recommendation: package only the browser-global asset pair first.

Reason:

- Django/Flask/FastAPI/DRF template integrations want browser-consumable static assets.
- ESM/CJS artifacts are not directly useful for normal server-rendered integration.
- Shipping both root CSS and `dist/olloweditor.css` risks duplicate or confusing asset choices.

### Required icons, fonts, workers, or extra assets

Observed requirements:

- icons are embedded inline in JS as generated SVG markup
- no standalone icon assets are required
- no workers were found
- no font files were found in the repo

External/optional runtime dependencies:

- DOCX import can use `window.mammoth`
- DOCX export can use `window.OllowDocxExporter`

The editor remains functional without bundling those optional adapters, but DOCX features degrade accordingly.

### CSS asset behavior

`ollow.css` appears self-contained. No local `@font-face` or bundled font assets were found.

Demo files import Google Fonts, but the editor runtime itself does not require packaged local font files to function.

## Static Asset Packaging Recommendation

Use the browser-global assets as the canonical Python payload:

- `python/src/olloweditor/static/olloweditor/ollow.js`
- `python/src/olloweditor/static/olloweditor/ollow.css`

Keep the Python package responsible for:

- distributing static assets
- rendering HTML tags/snippets for those assets
- rendering framework form/widget helpers
- exposing config serialization helpers

Do not attempt to port editor behavior into Python.

## Proposed Python Package Structure

Exact proposed layout under `python/`:

```text
python/
├── IMPLEMENTATION_PLAN.md
├── pyproject.toml
├── README.md
├── MANIFEST.in
├── src/
│   └── olloweditor/
│       ├── __init__.py
│       ├── _version.py
│       ├── assets.py
│       ├── html.py
│       ├── config.py
│       ├── static/
│       │   └── olloweditor/
│       │       ├── ollow.js
│       │       └── ollow.css
│       ├── templates/
│       │   └── olloweditor/
│       │       ├── _assets.html
│       │       ├── _init.html
│       │       ├── django_widget.html
│       │       ├── flask_widget.html
│       │       └── fastapi_widget.html
│       ├── django/
│       │   ├── __init__.py
│       │   ├── apps.py
│       │   ├── widgets.py
│       │   ├── fields.py
│       │   ├── forms.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── templatetags/
│       │       ├── __init__.py
│       │       └── olloweditor.py
│       ├── drf/
│       │   ├── __init__.py
│       │   ├── fields.py
│       │   ├── serializers.py
│       │   └── renderers.py
│       ├── flask/
│       │   ├── __init__.py
│       │   ├── blueprint.py
│       │   ├── forms.py
│       │   └── helpers.py
│       └── fastapi/
│           ├── __init__.py
│           ├── assets.py
│           ├── forms.py
│           └── helpers.py
└── tests/
    ├── test_assets.py
    ├── test_html.py
    ├── test_config.py
    ├── django/
    │   ├── test_widget.py
    │   └── test_template_tags.py
    ├── drf/
    │   └── test_serializer_field.py
    ├── flask/
    │   └── test_blueprint.py
    └── fastapi/
        └── test_helpers.py
```

## Integration Architecture

### Shared core

Core Python responsibilities should be framework-agnostic:

- asset path discovery
- HTML tag generation for CSS/JS includes
- serialization of editor options into safe JSON
- textarea attribute generation
- helper to build an initialization script against a known textarea selector/id

Recommended shared API shape:

- `asset_urls(...)`
- `render_assets(...)`
- `render_init(textarea_id, options)`
- `textarea_attrs(...)`

### Django integration

Recommended components:

- Django app config
- `OllowEditorWidget(forms.Textarea)`
- optional `OllowEditorField`
- template tags to render assets and init blocks

Behavior:

- widget renders a normal `<textarea>`
- widget adds `data-ollow-editor` by default
- widget Media class includes packaged CSS/JS
- options become `data-*` attributes where possible and inline init JSON where needed

### Django REST Framework integration

DRF does not need a browser editor runtime in API responses. The integration should stay narrow:

- serializer field that documents/stores HTML editor content
- optional Browsable API form widget integration by reusing Django widget classes when DRF renders HTML forms

Do not make DRF a hard dependency of the base package.

### Flask integration

Recommended components:

- Blueprint serving static files from package data
- Jinja helper/macros for assets and init blocks
- WTForms-compatible widget/helper if feasible

Behavior:

- allow `{{ olloweditor_assets() }}`
- allow `{{ olloweditor_init("field_id", options=...) }}`
- serve packaged `ollow.js` and `ollow.css` through the blueprint

### FastAPI integration

Recommended components:

- helper for mounting packaged static assets
- Jinja2 helpers for templates
- form helper for textarea rendering

Behavior:

- FastAPI itself does not provide a form/widget system like Django
- keep the FastAPI integration thin and template-oriented

## Required Frontend Build Changes

Current repo state already has usable browser assets, but a Python package will need a reproducible way to obtain them.

Recommended changes for a later phase:

1. Define a canonical source of truth for distributable browser assets.
2. Add a copy/sync step that places the exact release assets into `python/src/olloweditor/static/olloweditor/`.
3. Prefer copying from one canonical output only.

Recommendation:

- treat `ollow.js` and `ollow.css` as the Python-target assets initially
- avoid packaging both root assets and `dist/olloweditor.css` unless there is a verified reason

If the full JS source tree is restored later, add a non-breaking build target such as:

- `npm run build:python-assets`

That target should only:

- rebuild current browser assets
- copy them into the Python package staging directory

It should not change existing npm public exports.

## Testing Strategy

### Phase 1

Package-level tests:

- packaged files exist
- asset helpers produce correct URLs/tags
- option serialization is stable and escaped safely

### Phase 2

Django tests:

- widget renders textarea plus expected attributes
- static/media references resolve
- form submission preserves synced HTML value

### Phase 3

Flask and FastAPI tests:

- static assets served correctly
- helper output renders correct tags and init script

### Phase 4

DRF tests:

- serializer field behavior
- browsable API widget integration if implemented

### Browser integration tests

If later added, use a real browser runner to verify:

- multiple editors on one page
- textarea sync after typing
- initialization via `data-ollow-editor`
- initialization via explicit `OllowEditor.init(...)`

## Packaging Strategy

Use a modern Python package build with:

- `pyproject.toml`
- setuptools or hatchling

Recommendation: use setuptools first because static files, templates, and optional extras are straightforward and conservative.

Base install:

```bash
pip install olloweditor
```

Optional extras:

- `django`
- `drf`
- `flask`
- `fastapi`
- `all`

Recommended extras mapping:

- `django`: `Django>=4.2`
- `drf`: `Django>=4.2`, `djangorestframework>=3.15`
- `flask`: `Flask>=3.0`
- `fastapi`: `fastapi>=0.115`, `jinja2>=3.1`
- `all`: union of the above

The base package should have no framework dependency.

## Release Strategy

Versioning recommendation:

- keep Python package version aligned with the npm/editor asset version where possible
- if Python-only changes are released without asset changes, use a local convention only if truly necessary

Preferred rule:

- Python package `0.1.0` ships OllowEditor asset version `0.1.0`
- avoid letting npm and PyPI drift semantically without documenting the asset version embedded in the Python package

Recommended metadata:

- `olloweditor.__version__` = Python package version
- `olloweditor.__asset_version__` = bundled editor asset version

## Risks

### 1. Browser bundle compatibility

Risk:

- the npm `dist/` outputs are ESM/CJS, but Python template integrations need a browser-ready script

Mitigation:

- use `ollow.js` as the packaged browser asset
- do not rely on ESM/CJS files for server-rendered integration

### 2. Static asset path handling

Risk:

- each framework resolves static assets differently

Mitigation:

- Django: rely on app staticfiles discovery
- Flask: ship a blueprint
- FastAPI: provide `StaticFiles` mounting helper

### 3. Duplicate CSS confusion

Risk:

- both `ollow.css` and `dist/olloweditor.css` exist

Mitigation:

- pick one canonical CSS file for Python packaging
- document that choice clearly

### 4. Framework dependency isolation

Risk:

- base install becomes bloated or fragile if every framework is a hard dependency

Mitigation:

- use extras for all framework integrations
- keep base package framework-agnostic

### 5. HTML sanitization expectations

Risk:

- users may assume Python package sanitizes HTML server-side

Mitigation:

- document clearly that the package distributes a client-side editor
- require host applications to keep server-side validation/policy enforcement

### 6. Package name conflict

Risk:

- `olloweditor` may already exist or be reserved on PyPI

Mitigation:

- verify availability before publication phase
- if unavailable, decide on an alternate name before implementation hardens around it

### 7. npm/PyPI version synchronization

Risk:

- Python wrapper and bundled JS assets drift

Mitigation:

- store bundled asset version explicitly
- require release checklist validation before packaging

### 8. Optional DOCX adapter expectations

Risk:

- consumers may expect DOCX import/export to work automatically from the Python package

Mitigation:

- document that DOCX adapter globals are optional and not bundled by default unless later packaged explicitly

### 9. Root asset reproducibility

Risk:

- current repo checkout contains built root assets but not the build configuration that produces them

Mitigation:

- before implementation, recover or restore canonical frontend build config
- if unavailable, treat the current browser assets as frozen inputs until the JS build pipeline is restored

## Phase-by-Phase Implementation Checklist

### Phase 1: Python package scaffold

- [ ] Create `python/pyproject.toml`
- [ ] Create package metadata and extras
- [ ] Add `src/olloweditor/`
- [ ] Add packaged static assets copied from canonical browser outputs
- [ ] Add shared asset and HTML helper APIs
- [ ] Add package tests for asset discovery and HTML generation

### Phase 2: Django integration

- [ ] Add Django app config
- [ ] Add `OllowEditorWidget`
- [ ] Add template tags
- [ ] Add Django static/media integration tests

### Phase 3: Flask and FastAPI integrations

- [ ] Add Flask blueprint and helpers
- [ ] Add FastAPI static mount and Jinja helpers
- [ ] Add framework-specific tests

### Phase 4: DRF integration

- [ ] Add optional DRF field/serializer helpers
- [ ] Reuse Django widget behavior for browsable API where useful
- [ ] Add DRF tests

### Phase 5: Build/release automation

- [ ] Add asset copy/sync script
- [ ] Add version sync checks
- [ ] Add CI for Python tests
- [ ] Add packaging smoke tests for sdists/wheels

## Recommended Next Phase

Proceed to Phase 1 with a conservative implementation:

1. scaffold the Python package under `python/`
2. package only `ollow.js` and `ollow.css`
3. implement the shared helpers and Django integration first
4. keep Flask/FastAPI/DRF behind extras

This keeps the work aligned with the current repository reality: the browser asset pair already exists and the editor is already designed to work with a normal textarea.
