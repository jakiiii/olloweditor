# Upload integration

[Back to README](../README.md)

## Supported flows

The browser runtime supports uploads for:

- single images
- galleries
- attachments
- drag-and-drop image insertion

If no image upload endpoint is configured, images and galleries can fall back to local `FileReader` data URLs.

## Configuration

```js
window.OllowEditor.create(document.getElementById("editor"), {
  upload: {
    imageUrl: "/api/uploads/images",
    galleryUrl: "/api/uploads/galleries",
    attachmentUrl: "/api/uploads/attachments",
    method: "POST",
    credentials: "same-origin",
    headers: {
      "X-CSRFToken": "..."
    },
    allowFallback: false
  }
});
```

You can also configure the main endpoint paths through textarea data attributes:

- `data-image-upload-url`
- `data-gallery-upload-url`
- `data-attachment-upload-url`
- `data-upload-allow-fallback`

## Request shape

Field names used by the runtime:

- images and galleries: `image`
- attachments: `file`

Gallery uploads behave like this:

- if `galleryUrl` is set, the editor sends a grouped gallery upload
- if `galleryUrl` is missing but `imageUrl` exists, each gallery file is uploaded through the image path

## Accepted response forms

Recommended JSON forms:

```json
{ "url": "/media/editor/images/file.jpg" }
```

```json
{ "urls": ["/media/editor/gallery/1.jpg", "/media/editor/gallery/2.jpg"] }
```

The runtime also accepts:

- a plain string URL
- an array of string URLs
- object fields `src` or `location` for single-file responses

Returned URLs are sanitized before insertion.

## CSRF behavior

When the runtime builds a request, it looks for CSRF information in this order:

1. `upload.headers` / `upload.csrfHeaderValue`
2. a hidden input named `csrfmiddlewaretoken`
3. a `csrftoken` cookie

Default CSRF header name:

- `X-CSRFToken`

## Credentials behavior

Cross-origin uploads do not automatically inherit same-origin credentials.

- same-origin upload URLs default to `same-origin`
- cross-origin upload URLs are downgraded to `omit`

That protects against accidentally leaking cookies or other credentials to a different origin.

## Fallback behavior

- no upload URL for images or galleries:
  local bitmap files are inserted with `FileReader`
- configured upload URL plus `allowFallback: true`:
  failed image or gallery uploads fall back to local data URLs
- attachments:
  no local fallback path; a real endpoint is required

## Validation responsibilities

OllowEditor only validates enough to keep editor behavior predictable. The backend still needs to enforce:

- authentication and authorization
- allowed file types
- MIME type validation
- extension checks
- file size limits
- malware scanning or storage policy where required

## Security note

Upload URL values are sanitized before the request is made. Returned URLs are sanitized before they are written into the editor HTML. That is useful, but it does not replace server-side upload policy enforcement.
