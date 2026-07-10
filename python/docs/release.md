# Release

This project does not publish automatically during local verification. The release flow is manual by design.

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
- either:
  - API tokens for manual `twine upload`, or
  - trusted publishing configured in CI

Do not store PyPI or TestPyPI tokens in this repository.

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

## Real PyPI upload

Manual upload command:

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
- [ ] PyPI package verified
