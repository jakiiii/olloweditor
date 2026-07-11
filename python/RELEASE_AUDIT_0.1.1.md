# OllowEditor Python 0.1.1 Release Audit

## Reason for release

`0.1.1` is a corrective release candidate for the Python package metadata.

The previous TestPyPI candidate, `olloweditor==0.1.0`, passed functional verification for the base package, Django, Django REST Framework, Flask, FastAPI, packaged browser assets, textarea synchronization, and example applications. Its built wheel metadata, however, reported a null `License` field. The source has now been corrected to emit standards-compliant license metadata through a PEP 639-style license expression.

This audit verifies the corrected local `0.1.1` release candidate before any new TestPyPI upload.

## Version information

- Python package version: `0.1.1`
- npm package version: `0.1.1`
- Versioning policy: synchronized

Current repository policy requires synchronized release versions across:

- `python/pyproject.toml`
- `package.json`
- release git tag

That policy is enforced by:

- `python/scripts/validate_publish_release.py`
- `.github/workflows/publish-python.yml`

## License metadata

Generated wheel metadata was inspected directly from:

- `dist/olloweditor-0.1.1-py3-none-any.whl`

Exact result:

- `License`: absent / `null`
- `License-Expression`: `MIT`
- `License-File`: `LICENSE`
- license classifier: none

Notes:

- This is standards-compliant for the current toolchain.
- The project now uses the modern license-expression field instead of the legacy free-form `License` field.
- The legacy MIT license classifier was removed because the current setuptools path rejects combining license expressions with legacy license classifiers.
- The packaged wheel contains `olloweditor-0.1.1.dist-info/licenses/LICENSE`.
- The source distribution also contains `LICENSE`.

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
| `python -m build` | PASS | Built fresh wheel and source distribution. |
| `python -m twine check dist/*` | PASS | Wheel and sdist metadata render correctly. |
| `python scripts/check_wheel_contents.py dist/*.whl` | PASS | Required packaged assets present and non-empty. |
| `python scripts/verify_wheel_installs.py dist/*.whl` | PASS | Base and extras install from the built wheel. |
| `python -m pip check` | PASS | No broken requirements in the release environment. |
| sdist rebuild check | PASS | Building a wheel from the sdist preserved required assets and license file. |
| local wheel browser runtime check | PASS | Verified browser global, auto-init, multiple instances, sync, and form submission from installed package assets. |

### Notable warning

- FastAPI and example tests emit `StarletteDeprecationWarning` from `fastapi.testclient` regarding `httpx`. This is non-blocking for `0.1.1` but should be tracked for a later dependency update.

## Distribution artifacts

- Wheel: `dist/olloweditor-0.1.1-py3-none-any.whl`
  - size: `117888` bytes
  - SHA-256: `f4b2bd07387ba0b358d638403be06d48039987640cc8dd4675f7a73ff3a5728c`
- Source distribution: `dist/olloweditor-0.1.1.tar.gz`
  - size: `130447` bytes
  - SHA-256: `03172babf6cb9509019a23dfa4609e0b638323511e9ee4f534405c087dabcb7b`

## Installation matrix

| Mode | Result | Notes |
| --- | --- | --- |
| Base | PASS | `olloweditor==0.1.1` installs without Django, DRF, Flask, or FastAPI. |
| Django | PASS | Widget, field, app config, media order, and static asset discovery verified from installed wheel. |
| DRF | PASS | Serializer field, sanitizer callback behavior, validation, and output verified from installed wheel. |
| Flask | PASS | Extension, blueprint, asset routes, Jinja helpers, and HTML form submission verified from installed wheel. |
| FastAPI | PASS | Static mount helper, asset helper, template rendering, asset routes, and HTML form submission verified from installed wheel. |
| All | PASS | All public integrations import together; no dependency conflicts. |

## Additional artifact checks

- `Metadata-Version`: `2.4`
- `Name`: `olloweditor`
- `Version`: `0.1.1`
- `Requires-Python`: `>=3.10`
- `Provides-Extra`: `django`, `drf`, `flask`, `fastapi`, `all`, `dev`, `test`
- wheel contains:
  - `olloweditor/static/olloweditor/olloweditor.browser.js`
  - `olloweditor/static/olloweditor/olloweditor.css`
  - `olloweditor/static/olloweditor/olloweditor-init.js`
  - `olloweditor-0.1.1.dist-info/licenses/LICENSE`
- sdist contains:
  - `pyproject.toml`
  - `README.md`
  - `LICENSE`
  - Python source package
  - framework integrations
  - packaged runtime assets

## Browser asset consistency

The browser bundle was rebuilt after version synchronization and now exposes:

- `window.OllowEditor.version === "0.1.1"`

The same `0.1.1` browser bundle is present in:

- repository `dist/olloweditor.browser.js`
- Python packaged static asset `python/src/olloweditor/static/olloweditor/olloweditor.browser.js`
- built wheel `olloweditor/static/olloweditor/olloweditor.browser.js`

## TestPyPI status

PENDING — Local verification passed; TestPyPI upload required

The previous `0.1.0` TestPyPI verification remains historical evidence only. It does not validate `0.1.1`.

Required next commands after approval:

```bash
cd python
python -m twine upload \
  --repository testpypi \
  dist/olloweditor-0.1.1-py3-none-any.whl \
  dist/olloweditor-0.1.1.tar.gz
```

Then verify the uploaded artifact:

```bash
python scripts/verify_testpypi_release.py \
  --package olloweditor \
  --version 0.1.1 \
  --verbose
```

## Production publishing note

Production PyPI publication should not happen until:

1. `0.1.1` is uploaded to TestPyPI
2. the TestPyPI verifier passes for `0.1.1`
3. the repository is committed and tagged as `v0.1.1`
4. the Trusted Publishing workflow is used for the final publish

Current trusted publishing configuration:

- GitHub owner: `jakiiii`
- GitHub repository: `olloweditor`
- workflow filename: `.github/workflows/publish-python.yml`
- environment name: `pypi`
- PyPI project name: `olloweditor`

## Final local decision

GO — Ready to upload 0.1.1 to TestPyPI
