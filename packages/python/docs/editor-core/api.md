# JavaScript API

[Back to README](../README.md)

## Browser bundle API

The browser bundle exposes `window.OllowEditor`.

Verified methods:

- `create(target, options)`
- `init(target, options)` alias of `create`
- `initAll(root, options)`
- `get(target)`
- `instances()`
- `registerPlugin(name, factory)`

`create()` expects:

- an `HTMLTextAreaElement`, or
- a selector string that resolves to a textarea

It throws for missing targets and non-textarea targets.

`initAll()` comes from the underlying textarea runtime and scans:

- `textarea[data-nw-editor]`
- `textarea[data-ollow-editor]`

The Python package does not use `initAll()`. It ships a separate `olloweditor-init.js` helper that scans `data-olloweditor="true"` and calls `window.OllowEditor.create()` for each textarea.

## Browser instance methods

Common editor instance methods verified in the runtime:

- `getHTML()`
- `setHTML(html, options?)`
- `sync(options?)`
- `focus()`
- `clear()`
- `destroy()`
- `insertHTML(html)`
- `toggleSourceMode()`
- `enterSourceMode()`
- `exitSourceMode()`
- `isSourceMode()`
- `getTheme()`
- `setTheme(theme)`
- `importMarkdown(markdown, options?)`
- `exportMarkdown()`
- `importDOCX(file, options?)`
- `exportDOCX(options?)`
- `exportHTML(options?)`
- `exportPDF(options?)`
- `cleanPastedHTML(html)`
- `cleanPlainText(text)`
- `sanitizeHTML(html)`

Example:

```js
const editor = window.OllowEditor.create(document.getElementById("editor"));

editor.setHTML("<p>Hello</p>");
editor.sync({ autosave: false, silent: true });
console.log(editor.getHTML());
```

## Module API

The npm package exports:

- `createOllowEditor`
- `OllowEditorCore`
- default export = `createOllowEditor`

Typed module options:

- `initialHTML`
- `placeholder`
- `readOnly`
- `className`
- `onChange`
- `uploadImage`

Example:

```js
import { createOllowEditor } from "@codefortify/olloweditor";
import "@codefortify/olloweditor/style.css";

const editor = createOllowEditor(document.getElementById("editor"), {
  initialHTML: "<p>Hello</p>",
  onChange(html) {
    console.log(html);
  }
});
```

## React API

The React wrapper is exported from `@codefortify/olloweditor/react`.

Verified props:

- `value`
- `onChange`
- `placeholder`
- `uploadImage`
- `readOnly`
- `className`

The wrapper manages an `OllowEditorCore` instance under the hood.

## Events

The textarea runtime dispatches DOM events and also exposes an internal event emitter.

Verified DOM event names include:

- `nationwire-editor:ready`
- `nationwire-editor:change`
- `nationwire-editor:sync`
- `nationwire-editor:autosave`
- `ollow-editor:themechange`
- `ollow-editor:import-docx`
- `ollow-editor:export-html`
- `ollow-editor:export-docx`
- `ollow-editor:export-pdf`

Plugin-facing emitter hooks:

- `on(eventName, handler)`
- `off(eventName, handler)`
- `emit(eventName, detail)`

The Python auto-init helper adds separate lifecycle events on the textarea:

- `olloweditor:before-init`
- `olloweditor:ready`
- `olloweditor:error`

## Legacy compatibility

The underlying runtime still assigns:

- `window.NationWireEditor`

That alias exists for compatibility, but the preferred public name is `window.OllowEditor`.
