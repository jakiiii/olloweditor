# Plugin API

[Back to README](../README.md)

## Registering a plugin

Plugins are registered globally and then enabled per editor instance.

```js
window.OllowEditor.registerPlugin("callout", (editor, options) => {
  editor.addSanitizerRule({
    classes: ["ollow-alert-box"]
  });

  editor.addToolbarButton({
    name: "callout",
    label: options.label || "Callout",
    group: "blocks",
    onClick() {
      editor.insertHTML(
        '<section class="ollow-alert-box"><p>Callout text</p></section>'
      );
    }
  });
});

window.OllowEditor.create(document.getElementById("editor"), {
  plugins: {
    callout: {
      label: "Callout"
    }
  }
});
```

## Verified plugin-facing methods

- `addToolbarGroup(config)`
- `addToolbarButton(config)`
- `addCommand(name, handler)`
- `runCommand(name, payload)`
- `on(eventName, handler)`
- `off(eventName, handler)`
- `emit(eventName, detail)`
- `addShortcut(shortcut, handler)`
- `removeShortcut(shortcut)`
- `getShortcuts()`
- `addSanitizerRule(rule)`
- `insertHTML(html)`
- `getHTML()`
- `setHTML(html)`
- `sync(options?)`
- `clear()`
- `focus()`
- `destroy()`

## Toolbar extension notes

`addToolbarButton()` can either:

- call a custom `onClick(editor, event)` handler, or
- dispatch a named command through `command` / `payload`

`group` defaults to `insert`. Non-`insert` groups are added to the primary toolbar row.

## Sanitizer extension notes

Plugin-added HTML does not bypass the core sanitizer.

- `insertHTML()` sanitizes the incoming markup before insertion
- exported and synchronized HTML is sanitized again through `getHTML()`
- `addSanitizerRule()` extends the allowlist, but the core URL, attribute, and structure checks still apply

## Failure behavior

The runtime is defensive around plugin loading:

- duplicate plugin names keep the first registration and log a warning
- plugin initialization failures are caught and logged
- editor startup continues even when a plugin fails
