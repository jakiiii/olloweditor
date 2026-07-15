# OllowEditor Python 0.1.0 Production Release Audit

## Release intent

This source state is prepared for the first production PyPI release of `olloweditor` as version `0.1.0`.

Important distinctions:

- Python package version: `0.1.0`
- npm package version: `0.1.0`
- browser bundle version: `0.1.0`
- intended git tag: `v0.1.0`

The `v` prefix belongs only to the git tag. It does not appear in `pyproject.toml`, wheel metadata, or the Python package import version.

## Historical context

- TestPyPI already contains `olloweditor==0.1.0`
- later TestPyPI release candidates `0.1.1` and `0.1.2` were used to validate packaging and publishing flows
- production PyPI does **not** currently contain `olloweditor==0.1.0`
- historical TestPyPI audit reports were preserved unchanged

This is valid because TestPyPI and production PyPI are separate indexes.

## Repository and publishing state

- GitHub owner: `CodeFortifyCloud`
- GitHub repository: `olloweditor`
- branch used for preparation: `pip`
- current commit audited: `074172d58182c403e78772902473316077c4634a`
- audit timestamp: `2026-07-11T08:19:57+06:00`

Existing git tags:

- `v0.1.1`

Tag status:

- `v0.1.0` does not exist yet
- no tag was created during this audit

Index status:

- PyPI: package available; version `0.1.0` not published
- TestPyPI: package exists; version `0.1.0` published

## Trusted Publishing workflow

Trusted Publishing target:

- PyPI project: `olloweditor`
- workflow filename: `.github/workflows/publish-python.yml`
- GitHub environment: `pypi`

Workflow audit result:

- builds frontend bundles before Python packaging
- synchronizes Python assets before Python build
- validates tag and version alignment
- builds distributions once in the `build` job
- uploads distributions as a GitHub Actions artifact
- publishes the exact artifact in the `publish` job
- uses `id-token: write`
- does not require a long-lived PyPI token

Result: workflow design is acceptable for production Trusted Publishing.

## Version synchronization

Verified synchronized release sources:

- `package.json`: `0.1.0`
- `package-lock.json`: `0.1.0`
- `python/pyproject.toml`: `0.1.0`
- `python/src/olloweditor/__init__.py` fallback: `0.1.0.dev0`
- `dist/olloweditor.browser.js`: `window.OllowEditor.version === "0.1.0"`
- `python/src/olloweditor/static/olloweditor/olloweditor.browser.js`: `0.1.0`

## Frontend verification

| Check | Result | Notes |
| --- | --- | --- |
| `npm ci` | PASS | Completed with a non-blocking npm env warning about `min-release-age`. |
| `npm run build` | PASS | Rebuilt `dist/olloweditor.browser.js` and `dist/olloweditor.css`. |
| `npm run typecheck` | PASS | TypeScript check succeeded. |
| `npm test` | PASS | 13 browser tests passed. |
| `npm run build:python-assets` | PASS | Synchronized browser assets into the Python package. |
| `npm run verify:python-assets` | PASS | Verified packaged JS, CSS, and initializer. |

## Python verification

| Check | Result | Notes |
| --- | --- | --- |
| `python -m pytest` | PASS | 85 tests passed. |
| Coverage threshold | PASS | `86.73%`, threshold `85%`. |
| `python -m ruff check .` | PASS | No lint errors. |
| `python -m ruff format --check .` | PASS | Formatting clean. |
| `python -m mypy src` | PASS | No type errors. |
| `python -m pytest --no-cov tests/test_verify_testpypi_release.py` | PASS | 6 verifier unit tests passed. |
| `python -m pip check` | PASS | No broken requirements in the release environment. |

### Notable warning

- FastAPI tests emit `StarletteDeprecationWarning` from `fastapi.testclient` regarding `httpx`. This is non-blocking for `0.1.0`.

## Distribution artifacts

- Wheel: `dist/olloweditor-0.1.0-py3-none-any.whl`
  - size: `117297` bytes
  - SHA-256: `34664bcbe6d24051906c9baadd733a9e99484260797c1f46e28e6a7b928bdf0e`
- Source distribution: `dist/olloweditor-0.1.0.tar.gz`
  - size: `129455` bytes
  - SHA-256: `ca4dadbce43fec2bbed62e7e3278de691302ce36b691320fb4bafe23d5961988`

## Metadata inspection

Built wheel metadata:

- `Metadata-Version`: `2.4`
- `Name`: `olloweditor`
- `Version`: `0.1.0`
- `Summary`: `Python integrations and packaged browser assets for using OllowEditor with Django, Django REST Framework, Flask, and FastAPI.`
- `Requires-Python`: `>=3.10`
- `License`: absent / `null`
- `License-Expression`: `MIT`
- `License-File`: `LICENSE`

Extras:

- `django`
- `drf`
- `flask`
- `fastapi`
- `all`
- `dev`
- `test`

Project URLs:

- `Homepage, https://github.com/CodeFortifyCloud/olloweditor`
- `Documentation, https://github.com/CodeFortifyCloud/olloweditor/tree/main/python`
- `Repository, https://github.com/CodeFortifyCloud/olloweditor`
- `Issues, https://github.com/CodeFortifyCloud/olloweditor/issues`

License packaging:

- wheel contains `olloweditor-0.1.0.dist-info/licenses/LICENSE`
- sdist contains `LICENSE`

This metadata is acceptable for the current setuptools/PEP 639 path.

## Wheel content verification

Required packaged assets were present and non-empty:

- `olloweditor/static/olloweditor/olloweditor.browser.js` (`476412` bytes)
- `olloweditor/static/olloweditor/olloweditor.css` (`82883` bytes)
- `olloweditor/static/olloweditor/olloweditor-init.js` (`4752` bytes)

The source distribution also contains:

- `pyproject.toml`
- `README.md`
- `LICENSE`
- Python source package
- framework integrations
- packaged runtime assets

## Isolated wheel installation matrix

| Mode | Result | Notes |
| --- | --- | --- |
| Base | PASS | `olloweditor==0.1.0` installs without Django, DRF, Flask, or FastAPI. |
| Django | PASS | Widget, field, app config, media order, static asset discovery, and bound form behavior verified from installed wheel. |
| DRF | PASS | Serializer field, sanitizer callback behavior, validation, whitespace preservation, and output verified from installed wheel. |
| Flask | PASS | Extension, blueprint, asset routes, Jinja helpers, and HTML form submission verified from installed wheel. |
| FastAPI | PASS | Static mount helper, asset helper, template rendering, asset routes, and HTML form submission verified from installed wheel. |
| All | PASS | All public integrations import together; no dependency conflicts. |

## Browser runtime verification from wheel assets

Runtime checks used the installed wheel assets, not the repository source tree.

Results:

- browser global: PASS
- creation API: PASS
- automatic initialization: PASS
- multiple instances: PASS (`2`)
- textarea synchronization: PASS (`<p>Updated</p>`)
- form submission synchronization: PASS (`<p>Updated</p>`)

## Final local decision

GO — Ready for `v0.1.0` tag and GitHub release publication after explicit approval

## Next gated steps

These steps were **not** executed during this audit:

1. create git tag `v0.1.0`
2. push the tag
3. publish a GitHub release for `v0.1.0`
4. trigger Trusted Publishing to production PyPI
5. verify production installation from PyPI

Recommended next commands after approval:

```bash
git add \
  .github/workflows/publish-python.yml \
  dist/olloweditor.browser.js \
  package.json \
  package-lock.json \
  python/CHANGELOG.md \
  python/docs/release.md \
  python/pyproject.toml \
  python/src/olloweditor/__init__.py \
  python/src/olloweditor/static/olloweditor/.asset-manifest.json \
  python/src/olloweditor/static/olloweditor/olloweditor.browser.js \
  python/RELEASE_AUDIT_0.1.0.md
```

Then commit, create `v0.1.0`, and publish the GitHub release only after final approval.
