# Release Process

OllowEditor has independent release units. A monorepo change does not imply that
all distributions receive the same version or release date.

## Common Preparation

1. Start from a clean, reviewed `main` commit.
2. Run all checks for the affected implementation.
3. Update that package's metadata, package README, and changelog or release
   notes when applicable.
4. Inspect the package contents and test installation in a clean environment.
5. Create a release commit and tag according to the maintainer's approved tag
   convention.

Never publish from an unreviewed working tree or reuse a released version.

## Direct JavaScript Distribution

The Vanilla implementation has no package registry metadata or automated
release script. Validate `ollow.js`, serve `ollow.html`, and exercise affected
editor behavior in supported modern browsers. A release is the reviewed set of
files in `packages/javascript/` attached or referenced by the project release.
Do not invent a registry version until maintainers adopt one.

## npm Package

From `packages/npm/` run:

```bash
npm ci
npm run typecheck
npm run build
npm pack --dry-run
```

Inspect that the tarball includes the declared `dist` entry points, stylesheet,
types, README, and license. The package name is `@codefortify/olloweditor` and
its version is controlled only by `packages/npm/package.json`. Publishing is a
manual maintainer action; this repository does not add an automatic npm publish
workflow.

## Python/PyPI Package

Follow [`packages/python/docs/release.md`](../packages/python/docs/release.md).
The existing release tooling builds and verifies browser assets, runs frontend
and Python tests, checks wheel contents and clean installs, and validates the
release tag against `pyproject.toml` and `package.json`.

PyPI publication uses the existing GitHub Actions trusted-publishing design and
the protected `pypi` environment. Maintainers must update the trusted publisher
to the monorepo workflow path if repository settings still reference an earlier
branch layout. The Python version remains independent of the npm package under
`packages/npm/`; its local browser-asset `package.json` is release tooling for
the Python distribution.
