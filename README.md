# OllowEditor

OllowEditor is a modern, lightweight, framework-friendly rich text editor for JavaScript, TypeScript, React, MERN, Next.js, Node.js, NestJS, Vue, CMS forms, admin dashboards, and publishing workflows.

[![npm version](https://img.shields.io/npm/v/%40codefortify%2Followeditor)](https://www.npmjs.com/package/@codefortify/olloweditor)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![JavaScript](https://img.shields.io/badge/runtime-JavaScript-f7df1e)](https://developer.mozilla.org/docs/Web/JavaScript)
[![TypeScript Types](https://img.shields.io/badge/types-TypeScript-3178c6)](./dist/index.d.ts)
[![React Support](https://img.shields.io/badge/react-supported-61dafb)](./dist/react.d.ts)

## Preview

![OllowEditor Preview](./olloweditor.png)

## Features

- Lightweight rich text editor
- Vanilla JavaScript support
- Bundled TypeScript declarations
- React wrapper
- Next.js compatible with client-side loading
- HTML output
- Toolbar formatting
- Bold, italic, underline, and strikethrough
- Headings and paragraphs
- Bullet and numbered lists
- Links and bookmarks
- Images
- Image upload callback
- Gallery support
- YouTube embed support
- Table support
- Code block support
- Markdown import and export
- Export HTML
- Export PDF
- Import DOCX
- Export DOCX
- Responsive toolbar
- Keyboard shortcuts
- Light, dark, and auto theme support

## Installation

```bash
npm install @codefortify/olloweditor
```

```bash
yarn add @codefortify/olloweditor
```

```bash
pnpm add @codefortify/olloweditor
```

## CSS Import

Import the stylesheet once in your application entry or page:

```js
import "@codefortify/olloweditor/style.css";
```

## Quick Start

```js
import { createOllowEditor } from "@codefortify/olloweditor";
import "@codefortify/olloweditor/style.css";

const editor = createOllowEditor("#editor", {
  initialHTML: "<p>Hello OllowEditor</p>",
  placeholder: "Start writing...",
  onChange: (html) => {
    console.log(html);
  }
});
```

## Vanilla JavaScript Usage

```html
<div id="editor"></div>

<script type="module">
  import { createOllowEditor } from "@codefortify/olloweditor";
  import "@codefortify/olloweditor/style.css";

  const editor = createOllowEditor("#editor", {
    initialHTML: "<p>Hello OllowEditor</p>",
    placeholder: "Start writing...",
    onChange: (html) => {
      console.log(html);
    }
  });
</script>
```

## Vanilla TypeScript Usage

```ts
import {
  createOllowEditor,
  type OllowEditorOptions,
  type OllowEditorCore
} from "@codefortify/olloweditor";

import "@codefortify/olloweditor/style.css";

const options: OllowEditorOptions = {
  initialHTML: "<p>Hello TypeScript</p>",
  placeholder: "Write something...",
  onChange: (html: string) => {
    console.log(html);
  }
};

const editor: OllowEditorCore = createOllowEditor("#editor", options);
```

## React Usage

```jsx
import { useState } from "react";
import { OllowEditor } from "@codefortify/olloweditor/react";
import "@codefortify/olloweditor/style.css";

export default function App() {
  const [content, setContent] = useState("");

  return (
    <OllowEditor
      value={content}
      onChange={setContent}
      placeholder="Write your article..."
    />
  );
}
```

## React TypeScript Usage

```tsx
import { useState } from "react";
import {
  OllowEditor,
  type OllowEditorReactProps
} from "@codefortify/olloweditor/react";

import "@codefortify/olloweditor/style.css";

export default function App() {
  const [content, setContent] = useState<string>("");

  const uploadImage: OllowEditorReactProps["uploadImage"] = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/uploads/image", {
      method: "POST",
      body: formData
    });

    const data: { url: string } = await response.json();
    return data.url;
  };

  return (
    <OllowEditor
      value={content}
      onChange={setContent}
      placeholder="Write your article..."
      uploadImage={uploadImage}
    />
  );
}
```

## Next.js Usage

OllowEditor uses browser APIs, so in Next.js it should be loaded on the client.

```tsx
import dynamic from "next/dynamic";
import "@codefortify/olloweditor/style.css";

const OllowEditor = dynamic(
  () =>
    import("@codefortify/olloweditor/react").then((mod) => mod.OllowEditor),
  { ssr: false }
);

export default function Page() {
  return <OllowEditor placeholder="Write in Next.js..." />;
}
```

## Image Upload

OllowEditor does not hardcode any upload provider. Connect your own backend through the `uploadImage` callback.

```tsx
<OllowEditor
  uploadImage={async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/uploads/image", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    return data.url;
  }}
/>
```

```text
Frontend editor -> uploadImage callback -> backend upload API -> image URL -> editor content
```

If `uploadImage` is not provided, OllowEditor can fall back to a safe local preview flow where appropriate for image insertion.

## Express Upload Example

Express is not bundled with OllowEditor. A typical Express upload endpoint can accept a file, store it however your application needs, and return a public URL:

```js
import express from "express";
import multer from "multer";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/api/uploads/image", upload.single("image"), async (req, res) => {
  // Store the uploaded file and generate a public URL.
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});
```

## NestJS Upload Example

NestJS is not bundled with OllowEditor. A typical controller can accept an uploaded file and return a URL:

```ts
import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("api/uploads")
export class UploadController {
  @Post("image")
  @UseInterceptors(FileInterceptor("image"))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`
    };
  }
}
```

## API Reference

### createOllowEditor

```ts
createOllowEditor(
  selector: string | HTMLElement,
  options?: OllowEditorOptions
): OllowEditorCore
```

### OllowEditorOptions

```ts
interface OllowEditorOptions {
  initialHTML?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  onChange?: (html: string) => void;
  uploadImage?: (file: File) => Promise<string> | string;
}
```

### OllowEditorCore Methods

- `getHTML()`  
  Returns the current editor HTML.
- `setHTML(html)`  
  Replaces the current editor content.
- `focus()`  
  Moves focus into the editor surface.
- `destroy()`  
  Removes the editor instance and cleans up listeners.

## React Props

```ts
interface OllowEditorReactProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  uploadImage?: (file: File) => Promise<string> | string;
  readOnly?: boolean;
  className?: string;
}
```

## TypeScript Support

- Type declarations are bundled with the package.
- No separate `@types` package is required.
- Works with `.ts` and `.tsx` projects.

## Package Exports

```ts
import { createOllowEditor } from "@codefortify/olloweditor";
import { OllowEditor } from "@codefortify/olloweditor/react";
import "@codefortify/olloweditor/style.css";
```

## Toolbar Features

| Feature | Description |
| --- | --- |
| Bold / Italic / Underline / Strikethrough | Inline text formatting |
| Headings | Paragraph and heading styles |
| Lists | Bullet and numbered lists |
| Links | Add links to selected text |
| Images | Insert or upload images |
| Gallery | Insert image galleries |
| YouTube Embed | Insert YouTube video embeds |
| Tables | Insert and manage tables |
| Code Block | Add formatted code blocks |
| Markdown Import / Export | Convert to and from Markdown |
| Export HTML | Export editor content as HTML |
| Export PDF | Export using the browser PDF flow |
| DOCX Import / Export | Import and export DOCX content |
| Theme Controls | Light, dark, and auto mode |

## Import and Export

OllowEditor includes the following content workflows:

- Export HTML
- Export PDF
- Markdown import and export
- Import DOCX
- Export DOCX

Notes:

- PDF export depends on browser print support.
- DOCX import expects a browser-compatible parser such as `mammoth` to be available when that workflow is used.
- DOCX export depends on the configured exporter available to the editor at runtime.

## Browser Support

OllowEditor is designed for modern browsers with standard DOM support, including:

- Chrome
- Edge
- Firefox
- Safari
- Other modern Chromium-based browsers

## Package Structure

```text
olloweditor/
├── src/
│   ├── core/
│   ├── react/
│   ├── styles/
│   └── types/
├── dist/
├── examples/
├── website/
├── package.json
├── vite.config.js
├── tsconfig.json
└── README.md
```

## Local Development

```bash
git clone https://github.com/CodeFortifyCloud/olloweditor.git
cd olloweditor
npm install
npm run dev
```

## Build Package

```bash
npm run build
```

Expected output:

```text
dist/
├── olloweditor.es.js
├── olloweditor.cjs
├── olloweditor-react.es.js
├── olloweditor-react.cjs
├── olloweditor.css
├── index.d.ts
└── react.d.ts
```

## Test Before Publish

```bash
npm pack --dry-run
npm pack
```

Then test inside another project:

```bash
npm install ../olloweditor/codefortify-olloweditor-0.1.0.tgz
```

## Publishing

```bash
npm login
npm publish --access public
```

Use semantic versioning:

- patch for bug fixes
- minor for new features
- major for breaking changes

## License

MIT License.
