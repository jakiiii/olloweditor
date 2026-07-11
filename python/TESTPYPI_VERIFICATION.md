# OllowEditor TestPyPI Verification

## Verification information

- Date and time: `2026-07-11T00:38:47.229260+00:00`
- Git commit: `10f7dfb4fce77fce7fdf59f783aff81084a8e7df`
- Package: `olloweditor`
- Version: `0.1.0`
- TestPyPI index: `https://test.pypi.org/simple/`
- Python used to orchestrate the tests: `3.12.3`
- Operating system: `linux`
- Downloaded artifact: `olloweditor-0.1.0-py3-none-any.whl`
- Artifact SHA-256: `90d33ab45a8d1bac7aaa98dd2797996b27271cf901b6f59ad1a922db8e15c1f7`

## Executive result

GO — TestPyPI verification passed

## Test matrix

| Test | Result | Environment | Notes |
| --- | --- | --- | --- |
| TestPyPI metadata | PASSED | Host |  |
| Wheel inspection | PASSED | Host |  |
| Base install | PASSED | Isolated venv |  |
| Django extra | PASSED | Isolated venv |  |
| DRF extra | PASSED | Isolated venv |  |
| Flask extra | PASSED | Isolated venv |  |
| FastAPI extra | PASSED | Isolated venv |  |
| All extra | PASSED | Isolated venv |  |
| Browser runtime | PASSED | Temporary browser test |  |
| Django example | PASSED | Isolated venv |  |
| DRF example | PASSED | Isolated venv |  |
| Flask example | PASSED | Isolated venv |  |
| FastAPI example | PASSED | Isolated venv |  |
| Metadata/README | PASSED | Host |  |

## Artifact details

- Wheel filename: `olloweditor-0.1.0-py3-none-any.whl`
- Wheel size: `117888` bytes
- SHA-256: `90d33ab45a8d1bac7aaa98dd2797996b27271cf901b6f59ad1a922db8e15c1f7`
- Download URL: `https://test-files.pythonhosted.org/packages/45/3e/82fd78aef4b7562f65a75a142cb58436f52017419a46d513b4dcbcb84e50/olloweditor-0.1.0-py3-none-any.whl`
- Source distribution filename: `olloweditor-0.1.0.tar.gz`
- Requires-Python: `>=3.10`
- Extras: django, drf, flask, fastapi, all, dev, test

### Packaged asset sizes

- `olloweditor/static/olloweditor/olloweditor.browser.js`: `476412` bytes
- `olloweditor/static/olloweditor/olloweditor.css`: `82883` bytes
- `olloweditor/static/olloweditor/olloweditor-init.js`: `4752` bytes

## Base package results

- Base install status: `passed`
- Framework distributions absent: `True`

## Framework results

### Django

- Status: `passed`
- Notes: 

### Django REST Framework

- Status: `passed`
- Notes: 

### Flask

- Status: `passed`
- Notes: 

### FastAPI

- Status: `passed`
- Notes: 

### All integrations

- Status: `passed`
- Notes: 

## Asset results

- CSS response: `82883` bytes
- Browser bundle response: `476157` bytes
- Initializer response: `4752` bytes
- Browser global: `True`
- Textarea initialization: `True`
- Textarea synchronization: `<p>Updated</p>`
- Multiple instances: `2`

## Failures

No required verification failures were recorded.
## Final production PyPI recommendation

READY — Proceed to production PyPI
