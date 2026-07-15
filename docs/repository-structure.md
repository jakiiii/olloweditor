# Repository Structure

OllowEditor is a monorepo because its three distributions share an editing
model and project identity but have different consumers, toolchains, and release
cycles. Keeping them on `main` makes cross-ecosystem changes reviewable without
forcing package versions or publishing processes to move together.

## Top-Level Directories

- `.github/` contains issue forms, pull request guidance, ownership rules, and
  package-scoped automation.
- `docs/` contains architecture, repository, development, and release guidance
  that applies across implementations.
- `packages/javascript/` contains the dependency-free browser source, styles,
  demo, assets, and detailed usage guide.
- `packages/npm/` contains the publishable npm package, TypeScript declarations,
  React adapter, framework examples, Vite build, and package website.
- `packages/python/` contains the PyPI project, Python integrations, tests,
  examples, release tools, and the browser-asset source used by that package.
- `website/` is the combined public project website. It consumes the Vanilla
  JavaScript files from `packages/javascript/`.

Root files define project-wide governance, formatting, documentation, and
convenience checks. The root npm package is private and is never published.

## Package Relationships

The Vanilla implementation is the direct browser distribution. The npm package
has its own core source and adds module exports, declarations, and a React
adapter. The Python package ships a tested browser bundle plus framework-specific
widgets, fields, static serving, template helpers, upload endpoints, storage
adapters, and preview helpers.

These are independent release units. Similar generated or source assets are not
assumed to be interchangeable; changes must be synchronized through the owning
package's build and verification commands.

## Examples and Shared Material

Examples remain inside the package that owns their dependencies and validation:

- Vanilla browser demo: `packages/javascript/ollow.html`
- npm and framework examples: `packages/npm/examples/`
- Python framework examples: `packages/python/examples/`

Cross-project documentation belongs in root `docs/`. Implementation-specific
documentation, fixtures, images, and generated assets remain in that package.
Do not add a root copy of a package example merely for discoverability; link to
the owning example instead.
