# Contributing to OllowEditor

Thank you for helping improve OllowEditor. Contributions should remain scoped
to the implementation they affect and include validation appropriate to that
implementation.

## Fork and Clone

1. Fork `CodeFortifyCloud/olloweditor` on GitHub.
2. Clone your fork and add the upstream repository.
3. Create a focused branch from the latest `main`.

```bash
git clone https://github.com/YOUR-ACCOUNT/olloweditor.git
cd olloweditor
git remote add upstream https://github.com/CodeFortifyCloud/olloweditor.git
git fetch upstream
git switch -c feature/short-description upstream/main
```

Use descriptive prefixes such as `feature/`, `fix/`, `docs/`, `refactor/`,
`test/`, or `chore/`. Do not commit directly to a release branch.

## Local Development

- Vanilla JavaScript: work in `packages/javascript/` and open or serve
  `ollow.html` for browser testing.
- npm package: run `npm ci` in `packages/npm/`, then use `npm run dev`,
  `npm run typecheck`, and `npm run build`.
- Python package: follow `packages/python/docs/development.md`; use an isolated
  virtual environment and install `.[all,test,dev]` from `packages/python/`.

Cross-project setup is documented in [`docs/development.md`](docs/development.md).

## Coding Standards

- Follow `.editorconfig` and the existing style in the affected package.
- Use the root Prettier configuration for supported JavaScript, JSON, CSS, and
  Markdown files; generated Python browser assets are excluded.
- Python changes must pass Ruff and mypy using `packages/python/pyproject.toml`.
- Keep public APIs backward compatible unless the change is explicitly marked
  as breaking.
- Do not commit dependencies, virtual environments, generated distributions,
  credentials, local databases, uploaded media, or editor settings.

## Tests

Run every applicable check before opening a pull request:

```bash
npm run check:javascript

npm --prefix packages/npm ci
npm run check:npm
npm --prefix packages/npm pack --dry-run

npm --prefix packages/python ci
npm run check:python-frontend
python -m pytest packages/python/tests
python -m ruff check packages/python
python -m ruff format --check packages/python
python -m mypy packages/python/src
```

Add or update tests for behavioral changes. When an implementation has no
automated coverage for the affected behavior, document the exact manual browser
checks in the pull request.

## Commits and Pull Requests

Prefer concise, imperative commit subjects. Conventional Commit-style subjects
such as `fix(npm): preserve editor value on remount` are encouraged but not
required.

Pull requests must:

- explain the problem and the chosen solution;
- identify each affected implementation;
- link related issues;
- report automated and manual testing;
- update public API and user documentation;
- describe compatibility or release impact;
- avoid unrelated formatting or generated-file churn.

Maintainers may request changes before merging. Keep review follow-ups in the
same branch and do not force-push after review unless coordination requires it.

## Documentation and Releases

Update the package README and relevant files under `docs/` whenever setup,
configuration, APIs, supported versions, or release behavior changes. Do not
change a package version unless the change is part of an approved release.

## Security

Do not open public issues or pull requests for suspected vulnerabilities.
Follow [`SECURITY.md`](SECURITY.md) and allow maintainers time to investigate
and coordinate a fix before disclosure.
