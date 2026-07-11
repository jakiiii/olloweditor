# Release

This project does not publish automatically during local verification. The release flow is manual by design, and PyPI publishing is gated through GitHub Actions Trusted Publishing.

## Before you start

Verify package status and version availability:

```bash
cd python
python scripts/check_pypi_status.py olloweditor 0.1.0
```

Interpretation:

- `package available` means the package name is not present on that index
- `package exists` means the name is already taken there
- `version published` means that exact version already exists and must not be reused

## Account setup

Prepare:

- a PyPI account
- a TestPyPI account
- two-factor authentication on both
- trusted publishing configured in CI

Do not store PyPI or TestPyPI tokens in this repository.

## Trusted Publishing setup

Configure a PyPI trusted publisher with these values:

- PyPI project name: `olloweditor`
- GitHub owner: `jakiiii`
- GitHub repository: `olloweditor`
- Workflow filename: `.github/workflows/publish-python.yml`
- Environment name: `pypi`

Notes:

- publishing uses GitHub OpenID Connect, not a stored API token
- the `pypi` GitHub environment should be protected and may require manual approval
- if the repository owner changes, update the PyPI trusted publisher configuration before the next release

## Clean local release process

From the repository root:

```bash
npm ci
npm run build
npm run build:python-assets
npm run verify:python-assets

cd python
rm -rf build dist src/*.egg-info
python -m pytest
python -m ruff check .
python -m build
python -m twine check dist/*
python scripts/check_wheel_contents.py dist/*.whl
python scripts/verify_wheel_installs.py dist/*.whl
```

You can also run the broader local verifier:

```bash
python scripts/verify_release.py
```

For release-tag validation without publishing:

```bash
python scripts/validate_publish_release.py \
  --release-tag v0.1.0 \
  --skip-git-check
```

## GitHub Actions publish flow

Publishing happens only after a GitHub release is published.

Workflow behavior:

- `workflow_dispatch` runs a manual dry run for an existing git tag and does not publish
- `release.published` builds the frontend and Python distributions, validates metadata, and uploads artifacts
- the `publish` job downloads the exact artifact created by the build job and publishes that artifact to PyPI
- failed builds never reach the publish step
- PyPI rejects re-upload of an existing version

Before the workflow builds distributions, it verifies:

- release tag format matches `v<version>`
- `python/pyproject.toml` version matches the tag
- `package.json` version matches the tag
- the checked out commit is exactly the tagged commit
- the version is not already published on PyPI

## TestPyPI upload

Manual upload command:

```bash
python -m twine upload --repository testpypi dist/*
```

## TestPyPI install verification

TestPyPI often does not host all transitive dependencies. Use the public PyPI index as a fallback source for dependencies:

```bash
python -m pip install \
  --index-url https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ \
  olloweditor
```

Implication:

- `olloweditor` is resolved from TestPyPI first
- missing dependencies can still come from the real PyPI index

Repeat the same pattern for extras if needed:

```bash
python -m pip install \
  --index-url https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ \
  "olloweditor[django]"
```

After TestPyPI upload, install and smoke-test the package in a clean virtual environment before touching real PyPI.

## Verify a TestPyPI release

Use the dedicated verifier from the `python/` directory:

```bash
python scripts/verify_testpypi_release.py \
  --package olloweditor \
  --version 0.1.0
```

What it does:

- downloads the exact wheel for the requested version from TestPyPI
- verifies that the artifact metadata and packaged files match expectations
- installs that downloaded wheel into isolated virtual environments
- tests the base package and every supported extra
- checks packaged static assets and browser-runtime behavior
- writes a Markdown report and a JSON report
- exits non-zero when any required verification fails

The verifier does not publish anything and does not require stored credentials.

## Real PyPI upload

Manual upload command, if you intentionally need a fallback outside Trusted Publishing:

```bash
python -m twine upload dist/*
```

## Release checklist

- [ ] version updated
- [ ] changelog updated
- [ ] JavaScript built
- [ ] Python assets synchronized
- [ ] Python asset verification passed
- [ ] tests passed
- [ ] lint passed
- [ ] type checks passed
- [ ] wheel inspected
- [ ] clean wheel installs verified
- [ ] TestPyPI upload completed
- [ ] TestPyPI install tested
- [ ] framework examples tested
- [ ] git tag created
- [ ] GitHub release created
- [ ] `publish-python.yml` completed successfully
- [ ] PyPI package verified
