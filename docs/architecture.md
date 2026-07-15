# Architecture

## Editor Responsibilities

The browser editor turns a textarea into an interactive rich-text surface while
keeping submitted HTML synchronized with that textarea. It owns editing
commands, toolbar state, selection handling, rich blocks, theme behavior,
import/export operations, upload callbacks, and client-side content cleanup.

The Vanilla and npm implementations are separate source distributions. They
share product behavior but are not wired together by a root build. Changes to
one implementation must be reviewed for whether the other implementations need
an equivalent change.

## Framework Adapters

The npm package exposes an ES/CommonJS core and stylesheet, declarations for
TypeScript, and a React component. Next.js and Vue usage is demonstrated through
package examples. Express and NestJS documentation demonstrates the upload
response contract; those servers are not runtime dependencies of the editor.

## Python Integrations

The PyPI distribution packages browser assets and layers server integration
around them:

- Django supplies a model field, form/admin widget, checks, upload views,
  storage integration, and controlled admin previews.
- DRF supplies HTML field and multipart upload API integration using Django
  storage.
- Flask supplies an extension, asset blueprint, Jinja helpers, and upload routes.
- FastAPI supplies asset mounting, Jinja helpers, and an upload router.

Optional dependencies keep the base Python install independent of any one web
framework.

## Media and Rich-Text Output

The editor can delegate images, galleries, and attachments to host-provided
upload endpoints. Server integrations validate size and content, choose storage
names, and return URL-based response objects that the editor inserts into HTML.
Authentication, authorization, CSRF policy, durable media serving, and stored
HTML sanitization remain responsibilities of the host application.

Rich-text HTML is application data, not inherently trusted markup. Preview
helpers reduce risk for list displays but do not replace an explicit server-side
sanitization policy for public rendering.

## Boundaries

Each package owns its source, tests, examples, docs, metadata, version, build
output, and release process. Root files coordinate repository quality without
combining package manifests or forcing synchronized versions.
