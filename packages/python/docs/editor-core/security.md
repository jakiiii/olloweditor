# Security

[Back to README](../README.md)

OllowEditor includes client-side cleanup and sanitization, but it is not a complete security boundary.

## What the runtime does

Verified protections in the shipped browser runtime include:

- allowlist-based HTML sanitization
- cleanup of pasted HTML before insertion
- sanitization of source-mode edits before rendering
- sanitization of Markdown import output
- sanitization of DOCX import output
- sanitization of plugin-inserted HTML through `insertHTML()`
- URL filtering for links, images, uploads, and embeds
- safe bookmark ID normalization
- removal of temporary editor UI classes from saved output

## Allowed content model

The sanitizer keeps editor-supported structures such as:

- paragraphs and headings
- lists and blockquotes
- inline formatting tags
- links and bookmarks
- figures, images, and captions
- tables
- code blocks
- approved `div` / `section` / `figure` block types used by the editor

It removes unsupported or dangerous content such as:

- `script`
- `style`
- `meta`
- `base`
- `object`
- `embed`
- form controls
- `svg`
- `math`
- inline event handler attributes

## URL policy

Verified allowed URL classes:

- `http:`
- `https:`
- `mailto:`
- `tel:`
- safe relative URLs
- internal anchors such as `#bookmark-id`

Verified blocked classes include:

- `javascript:`
- `vbscript:`
- protocol-relative URLs such as `//host/path`
- `data:text/html`

For image data URLs, the runtime only accepts safe bitmap formats. `data:image/svg+xml` is not allowed.

## Embed policy

Iframe embeds are restricted to trusted YouTube formats.

Verified provider handling includes:

- `youtube.com`
- `www.youtube.com`
- `m.youtube.com`
- `youtu.be`
- `youtube-nocookie.com`

Approved iframes are normalized with additional restrictions such as `sandbox` and `referrerpolicy`.

## Inline style policy

The runtime keeps only a narrow inline-style subset:

- `color` with valid hex values
- `background-color` with valid hex values

Unsafe CSS functions and properties are stripped.

## Upload safety

The upload adapter sanitizes request URLs and returned asset URLs. That is useful, but the backend must still enforce:

- authentication and authorization
- file type and MIME validation
- extension checks
- file size limits
- CSRF protection
- storage policy and malware scanning where appropriate

## Server-side responsibilities

If editor output is untrusted, the application still needs to:

1. validate incoming content
2. sanitize stored or rendered HTML on the server
3. use an appropriate Content Security Policy
4. treat the editor as one layer in a larger security model

Do not describe OllowEditor as fully secure for arbitrary untrusted content. The client-side sanitizer is a strong normalization step, not a replacement for server-side policy.
