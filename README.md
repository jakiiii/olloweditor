# Ollow Editor

A clean, reusable, lightweight JavaScript rich-text editor built with plain HTML, CSS, and JavaScript.

Ollow Editor is designed for newsroom-style writing, blog publishing, CMS forms, article editors, and admin dashboards. It works with a normal `<textarea>` and syncs the final HTML automatically, so it can be used easily in any backend application such as Django, Laravel, Rails, Express, or plain HTML forms.

---

## Preview

![Ollow Editor Preview](./olloweditor.png)

---

## Features

- Clean newsroom-style writing interface
- Reusable JavaScript editor
- Works with a normal `<textarea>`
- No external dependencies
- Toolbar formatting
- Paragraph and heading support
- Bold, italic, underline
- Link and unlink support
- Bullet and numbered lists
- Pull quote block
- Image upload from local machine
- Drag-and-drop image upload
- Media alignment controls
- Code block support
- Table support
- Image URL insertion
- Multiple-image gallery block
- YouTube embed rendering
- Related content block
- Fact box block
- Attachment block
- Word count
- Estimated read time
- Autosave-style status indicator
- Synced HTML output for form submission

---

## Project Structure

```txt
olloweditor/
├── ollow.html
├── ollow.css
├── ollow.js
└── README.md
```

---

## Quick Start

Open the demo file directly in your browser:

```bash
cd /home/jaki/Dev/olloweditor
xdg-open ollow.html
```

Or serve it with a local server:

```bash
python3 -m http.server 8000
```

Then visit:

```txt
http://localhost:8000/ollow.html
```

---

## Basic Usage

Add a textarea in your form:

```html
<textarea id="ollo-editor" name="content"></textarea>
```

Include the editor CSS and JavaScript:

```html
<link rel="stylesheet" href="ollow.css" />

<script src="ollow.js"></script>
```

Initialize the editor:

```html
<script>
  document.addEventListener("DOMContentLoaded", function () {
    OllowEditor.init("#ollo-editor");
  });
</script>
```

After editing, the textarea will contain the synced HTML output.

You can also configure image uploads during initialization:

```html
<script>
  document.addEventListener("DOMContentLoaded", function () {
    OllowEditor.init("#ollo-editor", {
      uploadUrl: "/api/uploads/images/"
    });
  });
</script>
```

---

## Example Form

```html
<form method="post">
  <textarea id="ollo-editor" name="body">
    <h2>Article title</h2>
    <p>Start writing your story...</p>
  </textarea>

  <button type="submit">Save Article</button>
</form>

<link rel="stylesheet" href="ollow.css" />
<script src="ollow.js"></script>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    OllowEditor.init("#ollo-editor");
  });
</script>
```

---

## Toolbar Options

Ollow Editor currently supports:

| Feature       | Description                     |
| ------------- | ------------------------------- |
| Undo / Redo   | Revert or restore changes       |
| Paragraph     | Set normal paragraph text       |
| H2 / H3 / H4  | Insert heading styles           |
| Bold          | Make selected text bold         |
| Italic        | Make selected text italic       |
| Underline     | Underline selected text         |
| Link          | Insert a hyperlink              |
| Unlink        | Remove hyperlink                |
| Bullet List   | Insert unordered list           |
| Numbered List | Insert ordered list             |
| Pull Quote    | Insert styled quote block       |
| Image         | Insert uploaded or URL image    |
| Code          | Insert editable code block      |
| Gallery       | Insert multiple uploaded images |
| Embed         | Insert YouTube video            |
| Related       | Insert related-content block    |
| Fact Box      | Insert highlighted fact block   |
| Attachment    | Insert attachment-style block   |

---

## Image Upload

Users can insert images from their local machine or from an external URL.

Generated HTML example:

```html
<figure class="ollow-media ollow-image">
  <img src="image-source.jpg" alt="Image description" />
  <figcaption>Image caption</figcaption>
</figure>
```

For the static demo, local images are rendered using browser-based file reading. In a production app, you can replace this behavior with your own backend upload API.

### Drag and Drop

Users can drag one or more image files from their computer and drop them directly into the editor body.

- Dropped images are inserted at the current drop position
- Multiple images are inserted in the same order they were dropped
- Non-image files are rejected with an editor error message
- The browser default file-open behavior is prevented inside the editor drop area

Dropped images use this HTML:

```html
<figure class="ollow-editor-image">
  <img src="IMAGE_SRC" alt="">
  <figcaption></figcaption>
</figure>
```

If `uploadAdapter` or `uploadUrl` is configured, each dropped image is uploaded first and the returned URL is inserted. If neither is configured, Ollow Editor falls back to `FileReader` and inserts a base64 data URL so the image appears immediately.

### Image Resize Controls

Click an inserted editor image to show the floating resize toolbar. The toolbar supports:

- `Small`
- `Medium`
- `Large`
- `Full`
- `Reset`

Supported saved classes:

- `ollow-image-small`
- `ollow-image-medium`
- `ollow-image-large`
- `ollow-image-full`

The selected image outline is a UI-only state and is not saved into the synced textarea HTML.

Local test flow:

1. Open `ollow.html`
2. Click `Image`
3. Choose `/home/jaki/Dev/olloweditor/image.jpg`
4. Insert the image
5. Click the inserted image to show the resize toolbar
6. Apply `Small`, `Medium`, `Large`, `Full`, or `Reset`

### Media Alignment

Click a supported media block to show the floating media toolbar. A smaller alignment group is also visible in the main editor toolbar and becomes enabled when a media block is selected.

Alignment controls support:

- `Left`
- `Center`
- `Right`
- `Wide`
- `Full`
- `Reset`

Supported media blocks:

- Editor image figures
- Gallery sections
- YouTube embed figures
- Attachment preview blocks
- Code block figures

Saved alignment classes:

- `ollow-align-left`
- `ollow-align-center`
- `ollow-align-right`
- `ollow-align-wide`
- `ollow-align-full`

The floating toolbar shows:

- alignment controls for all supported media blocks
- image size controls only for images

Alignment classes are saved in the synced HTML. Temporary selection classes used by the floating toolbar are not saved.

### Code Blocks

Use the `Code` toolbar button to insert a code figure with:

- language input with common suggestions
- code textarea
- optional filename or title

Saved output uses clean HTML:

```html
<figure class="ollow-editor-code" data-type="code" data-language="python">
  <figcaption>example.py</figcaption>
  <pre><code class="language-python">print(&quot;Hello&quot;)</code></pre>
</figure>
```

Notes:

- code text is HTML-escaped before it is inserted
- indentation and line breaks are preserved
- clicking a code block shows floating controls for `Edit Code`, `Copy`, and `Delete`
- temporary UI selection classes are not saved into the synced textarea HTML

Local test flow:

1. Open `ollow.html`
2. Click `Code`
3. Choose a language, add code, and optionally add a filename
4. Insert the block and confirm formatting is preserved
5. Click the block to edit, copy, or delete it

### Tables

Use the `Table` toolbar button to insert a table with:

- row count
- column count
- optional caption
- optional header row

Inserted tables use editable HTML like:

```html
<figure class="ollow-editor-table">
  <div class="ollow-editor-table-scroll">
    <table>
      <thead>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cell</td>
          <td>Cell</td>
        </tr>
      </tbody>
    </table>
  </div>
  <figcaption>Optional caption</figcaption>
</figure>
```

When the cursor is inside a table, Ollow Editor shows table editing controls for:

- add row above
- add row below
- delete row
- add column left
- add column right
- delete column
- delete table

---

## Gallery Block

Users can select multiple local images and insert them as a responsive gallery.

Generated HTML example:

```html
<section class="ollow-media ollow-gallery">
  <div class="ollow-gallery-header">
    <h3>Gallery title</h3>
    <p>Gallery note or caption</p>
  </div>

  <div class="ollow-gallery-grid">
    <figure>
      <img src="image-1.jpg" alt="Gallery image 1" />
    </figure>
    <figure>
      <img src="image-2.jpg" alt="Gallery image 2" />
    </figure>
  </div>
</section>
```

---

## YouTube Embed

Paste a YouTube link, and Ollow Editor converts it into a playable embedded video.

Supported formats:

```txt
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
```

Generated HTML example:

```html
<figure class="ollow-media ollow-embed">
  <div class="ollow-video-wrapper">
    <iframe
      src="https://www.youtube.com/embed/VIDEO_ID"
      title="YouTube video player"
      frameborder="0"
      allowfullscreen
      loading="lazy">
    </iframe>
  </div>
  <figcaption>Video caption</figcaption>
</figure>
```

---

## Textarea Sync

Ollow Editor keeps the original textarea updated with the generated HTML.

This means the editor works naturally with normal backend forms:

```html
<textarea name="content"></textarea>
```

When the form is submitted, the backend receives the final HTML through the textarea field.

---

## Backend Integration

Ollow Editor is backend-independent.

You can use it with:

* Django
* Laravel
* Express.js
* FastAPI
* Rails
* WordPress admin pages
* Static HTML forms
* Any custom CMS

For production image uploads, connect the image insert flow to your own upload endpoint.

Example idea:

```js
async function uploadImageToServer(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/uploads/images/", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return data.url;
}
```

Then initialize the editor with either an upload adapter or a simple upload URL:

```js
OllowEditor.init("#ollo-editor", {
  uploadAdapter: async function (file) {
    return uploadImageToServer(file);
  }
});
```

```js
OllowEditor.init("#ollo-editor", {
  uploadUrl: "/api/uploads/images/"
});
```

`uploadAdapter` should return either a URL string or an object with `url`, `src`, or `location`. `uploadUrl` sends a `POST` request with a `FormData` field named `image` by default and expects the same response shape.

---

## Custom Styling

All editor styles are inside:

```txt
ollow.css
```

Important classes:

```css
.ollow-editor
.ollow-toolbar
.ollow-content
.ollow-media
.ollow-image
.ollow-gallery
.ollow-gallery-grid
.ollow-embed
.ollow-video-wrapper
```

You can customize these classes to match your application theme.

---

## Browser Support

Ollow Editor works in modern browsers:

* Chrome
* Edge
* Firefox
* Safari

---

## Roadmap

Possible future improvements:

* Image resize controls
* Media alignment options
* Table support
* Code block support
* Markdown import/export
* Editor plugin API
* Dark mode
* Keyboard shortcuts
* Paste cleanup from Google Docs / MS Word

---

## License

This project is open for personal and commercial use.

You can customize it freely for your own applications.

---

## Author

Built for custom CMS and publishing workflows.

**Ollow Editor** — a lightweight reusable JavaScript editor.
