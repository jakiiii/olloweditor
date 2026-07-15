# OllowEditor Python 0.1.2 Release Audit

## Reason for release

`0.1.2` is the next synchronized release candidate for the OllowEditor Python package.

The repository already published `olloweditor==0.1.1` to TestPyPI, so that version cannot be reused. This release carries the rewritten Python package README, corrected repository metadata, and a fresh synchronized browser asset build under a new version number.

The earlier `0.1.0` TestPyPI verification and the local `0.1.1` audit remain historical evidence only. They do not validate the `0.1.2` artifacts.

## Version information

- Python package version: `0.1.2`
- npm package version: `0.1.2`
- Browser bundle version: `0.1.2`
- Python fallback version: `0.1.2.dev0`
- Versioning policy: synchronized

Current repository policy requires synchronized release versions across:

- `package.json`
- `package-lock.json`
- `python/pyproject.toml`
- the generated browser bundle
- the release git tag

That policy is enforced by:

- `python/scripts/validate_publish_release.py`
- `.github/workflows/publish-python.yml`

## License metadata

Generated wheel metadata was inspected directly from:

- `dist/olloweditor-0.1.2-py3-none-any.whl`

Exact result:

- `License`: absent / `null`
- `License-Expression`: `MIT`
- `License-File`: `LICENSE`
- license classifier: none

Notes:

- This is standards-compliant for the current toolchain.
- The wheel uses PEP 639 metadata with `Metadata-Version: 2.4`.
- The packaged wheel contains `olloweditor-0.1.2.dist-info/licenses/LICENSE`.
- The source distribution also contains `LICENSE`.
- A legacy MIT license classifier was tested locally and rejected by `setuptools==83.0.0` because license expressions supersede legacy license classifiers in this configuration.

## Test results

| Check | Result | Notes |
| --- | --- | --- |
| `npm ci` | PASS | Completed with a non-blocking npm env warning about `min-release-age`. |
| `npm run build` | PASS | Rebuilt `dist/olloweditor.browser.js` and `dist/olloweditor.css`. |
| `npm run typecheck` | PASS | TypeScript check succeeded. |
| `npm test` | PASS | 13 browser tests passed. |
| `npm run build:python-assets` | PASS | Synchronized browser assets into the Python package. |
| `npm run verify:python-assets` | PASS | Verified packaged JS, CSS, and initializer. |
| `python -m pytest` | PASS | 85 tests passed. |
| Coverage threshold | PASS | `86.73%`, threshold `85%`. |
| `python -m ruff check .` | PASS | No lint errors. |
| `python -m ruff format --check .` | PASS | Formatting clean. |
| `python -m mypy src` | PASS | No type errors. |
| `python -m pytest --no-cov tests/test_verify_testpypi_release.py` | PASS | 6 verifier unit tests passed. |
| `python -m build` | PASS | Built fresh wheel and source distribution after metadata updates. |
| `python -m twine check dist/*` | PASS | Wheel and sdist metadata render correctly. |
| `python scripts/check_wheel_contents.py dist/*.whl` | PASS | Required packaged assets present and non-empty. |
| `python scripts/verify_wheel_installs.py dist/*.whl` | PASS | Base and extras install from the built wheel. |
| wheel-backed integration smoke pass | PASS | Base, Django, DRF, Flask, FastAPI, and `all` extras validated from isolated wheel installs. |
| local wheel browser runtime check | PASS | Verified browser global, auto-init, multiple instances, sync, and form submission from installed package assets. |
| `python -m pip check` | PASS | No broken requirements in the release environment. |
| sdist inspection | PASS | sdist contains `pyproject.toml`, `README.md`, `LICENSE`, Python sources, and required runtime assets. |

### Notable warning

- FastAPI tests emit `StarletteDeprecationWarning` from `fastapi.testclient` regarding `httpx`. This is non-blocking for `0.1.2` but should be tracked for a later dependency update.

## Distribution artifacts

- Wheel: `dist/olloweditor-0.1.2-py3-none-any.whl`
  - size: `117286` bytes
  - SHA-256: `60ab30d07c79263075c77a3a02bc90c826f86dd5397ed7e76a416e8ff0d03568`
- Source distribution: `dist/olloweditor-0.1.2.tar.gz`
  - size: `129337` bytes
  - SHA-256: `0ef46a26b1dc704ebfefc0ecddf26674d643d298ce0b1628b5e063b87a452abb`

## Installation matrix

| Mode | Result | Notes |
| --- | --- | --- |
| Base | PASS | `olloweditor==0.1.2` installs without Django, DRF, Flask, or FastAPI. |
| Django | PASS | Widget, field, app config, media order, static asset discovery, and bound form behavior verified from installed wheel. |
| DRF | PASS | Serializer field, sanitizer callback behavior, validation, whitespace preservation, and output verified from installed wheel. |
| Flask | PASS | Extension, blueprint, asset routes, Jinja helpers, and HTML form submission verified from installed wheel. |
| FastAPI | PASS | Static mount helper, asset helper, template rendering, asset routes, and HTML form submission verified from installed wheel. |
| All | PASS | All public integrations import together; no dependency conflicts. |

## Additional artifact checks

- `Metadata-Version`: `2.4`
- `Name`: `olloweditor`
- `Version`: `0.1.2`
- `Summary`: `Python integrations and packaged browser assets for using OllowEditor with Django, Django REST Framework, Flask, and FastAPI.`
- `Requires-Python`: `>=3.10`
- `Provides-Extra`: `django`, `drf`, `flask`, `fastapi`, `all`, `dev`, `test`
- `Project-URL` entries:
  - `Homepage, https://github.com/CodeFortifyCloud/olloweditor`
  - `Documentation, https://github.com/CodeFortifyCloud/olloweditor/tree/main/python`
  - `Repository, https://github.com/CodeFortifyCloud/olloweditor`
  - `Issues, https://github.com/CodeFortifyCloud/olloweditor/issues`
- wheel contains:
  - `olloweditor/static/olloweditor/olloweditor.browser.js`
  - `olloweditor/static/olloweditor/olloweditor.css`
  - `olloweditor/static/olloweditor/olloweditor-init.js`
  - `olloweditor-0.1.2.dist-info/licenses/LICENSE`
- sdist contains:
  - `pyproject.toml`
  - `README.md`
  - `LICENSE`
  - Python source package
  - framework integrations
  - packaged runtime assets

## Browser asset consistency

The browser bundle was rebuilt after version synchronization and now exposes:

- `window.OllowEditor.version === "0.1.2"`

The same `0.1.2` browser bundle is present in:

- repository `dist/olloweditor.browser.js`
- Python packaged static asset `python/src/olloweditor/static/olloweditor/olloweditor.browser.js`
- built wheel `olloweditor/static/olloweditor/olloweditor.browser.js`

## TestPyPI status

PENDING — Local verification passed; TestPyPI upload required

Current status checks:

- PyPI: package exists; version `0.1.2` not published
- TestPyPI: package exists; version `0.1.2` not published

Required next commands after approval:

```bash
cd python
python -m twine upload \
  --repository testpypi \
  dist/olloweditor-0.1.2-py3-none-any.whl \
  dist/olloweditor-0.1.2.tar.gz
```

Then verify the uploaded artifact:

```bash
python scripts/verify_testpypi_release.py \
  --package olloweditor \
  --version 0.1.2 \
  --verbose
```

## Production publishing note

Production PyPI publication should not happen until:

1. `0.1.2` is uploaded to TestPyPI
2. the TestPyPI verifier passes for `0.1.2`
3. the repository is committed and tagged as `v0.1.2`
4. the Trusted Publishing workflow is used for the final publish

Current trusted publishing configuration:

- GitHub owner: `CodeFortifyCloud`
- GitHub repository: `olloweditor`
- workflow filename: `.github/workflows/publish-python.yml`
- environment name: `pypi`
- PyPI project name: `olloweditor`

## Audit information

- Audit date: `2026-07-11T07:41:00+06:00`
- Git commit: `ea4e677dd695656bf74a14375df34741dcb0c082`

## Final local decision

GO — Ready to upload 0.1.2 to TestPyPI
