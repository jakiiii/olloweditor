# Development

## Prerequisites

- Git
- Node.js 20 or newer and npm for npm/Python browser-asset work
- Python 3.10 or newer for the Python distribution
- A modern browser for interactive editor verification

Package lockfiles are intentionally independent. Run `npm ci` inside the npm or
Python package; do not generate a root lockfile.

## Vanilla JavaScript

```bash
node --check packages/javascript/ollow.js
python -m http.server 8000 --directory packages/javascript
```

Open `http://localhost:8000/ollow.html`. There is currently no package manager,
build step, lint script, or automated browser suite for this implementation, so
changes require focused manual browser testing in addition to the syntax check.

## npm Package

```bash
cd packages/npm
npm ci
npm run dev
```

Before submitting changes:

```bash
npm run typecheck
npm run build
npm pack --dry-run
```

The package currently has no `lint` or `test` script. TypeScript checks cover
declarations and typed examples; the production Vite build validates exports.

## Python Package

The Python distribution owns both Python code and its packaged browser bundle.

```bash
cd packages/python
npm ci
npm run build
npm run typecheck
npm test
npm run build:python-assets
npm run verify:python-assets

python -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[all,test,dev]"
python -m pytest
python -m ruff check .
python -m ruff format --check .
python -m mypy src
python -m build --outdir python-dist
python -m twine check python-dist/*
python scripts/check_wheel_contents.py python-dist/*.whl
```

Run the relevant Django, DRF, Flask, and FastAPI examples under
`packages/python/examples/` when modifying framework integration or uploads.

## Generated Files

`packages/python/src/olloweditor/static/olloweditor/olloweditor.browser.js` and
`olloweditor.css` are intentionally tracked distribution assets. Regenerate and
verify them using the Python package npm scripts. Dependency directories,
virtual environments, coverage, caches, build directories, and distributions
must remain untracked.
