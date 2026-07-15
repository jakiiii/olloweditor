# Configuration

[Back to README](../README.md)

## Browser runtime options

The browser bundle calls the textarea-centered runtime from `ollow.js`. Verified top-level options in that path include:

- `theme`: `light`, `dark`, or `auto`
- `persistTheme`: store the chosen theme in local storage
- `themeStorageKey`: override the theme storage key
- `placeholder`
- `autosaveDelay`
- `readOnly`
- `upload`
- `uploadHeaders`
- `uploadMethod`
- `plugins`
- `docx`

Example:

```js
window.OllowEditor.create(document.getElementById("editor"), {
  theme: "auto",
  persistTheme: true,
  placeholder: "Start writing...",
  upload: {
    imageUrl: "/api/uploads/images",
    galleryUrl: "/api/uploads/galleries",
    attachmentUrl: "/api/uploads/attachments",
    allowFallback: false
  },
  docx: {
    enabled: true
  }
});
```

## Textarea data attributes

The textarea runtime reads configuration from these attributes:

- `data-theme`
- `data-persist-theme`
- `data-theme-storage-key`
- `data-placeholder`
- `data-autosave-delay`
- `data-image-upload-url`
- `data-gallery-upload-url`
- `data-attachment-upload-url`
- `data-upload-allow-fallback`

Legacy selectors supported by `initAll()`:

- `textarea[data-nw-editor]`
- `textarea[data-ollow-editor]`

Example:

```html
<textarea
  id="editor"
  name="content"
  data-ollow-editor
  data-theme="dark"
  data-persist-theme="true"
  data-image-upload-url="/api/uploads/images"
  data-gallery-upload-url="/api/uploads/galleries"
  data-attachment-upload-url="/api/uploads/attachments"
></textarea>
```

## Shared Python auto-init attributes

The Python package adds a separate initializer script. That script looks for:

- `data-olloweditor="true"`
- `data-olloweditor-options='{"theme":"auto"}'`

Example:

```html
<textarea
  name="content"
  data-olloweditor="true"
  data-olloweditor-options='{"theme":"auto","persistTheme":true}'
></textarea>
```

## Module wrapper options

The typed ES module wrapper exposes a smaller option surface:

- `initialHTML`
- `placeholder`
- `readOnly`
- `className`
- `onChange`
- `uploadImage`

Example:

```js
import { createOllowEditor } from "@codefortify/olloweditor";

const editor = createOllowEditor(document.getElementById("editor"), {
  initialHTML: "<p>Hello</p>",
  placeholder: "Start writing...",
  onChange(html) {
    console.log(html);
  }
});
```

## Themes

Theme handling is instance-specific.

- `light` and `dark` force a theme
- `auto` follows `prefers-color-scheme`
- `persistTheme: true` stores the choice

The runtime stores a theme only when persistence is enabled. Explicit `theme` config still wins over stored values.

## DOCX options

DOCX import and export are optional browser integrations.

- import parser: `options.docx.parser` or `window.mammoth`
- export adapter: `options.docx.exporter` or `window.OllowDocxExporter`
- import can be disabled with `docx.enabled: false`
- export adapter use can be disabled with `docx.exportEnabled: false`
