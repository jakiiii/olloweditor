(function () {
  const DEFAULT_SELECTOR = "textarea[data-nw-editor]";
  const DEFAULT_AUTOSAVE_DELAY = 1500;
  const DEFAULT_PLACEHOLDER = "Start writing your story here…";
  const DEFAULT_READ_SPEED = 220;
  const ALLOWED_TAGS = new Set([
    "A",
    "BLOCKQUOTE",
    "BR",
    "CITE",
    "DIV",
    "EM",
    "FIGCAPTION",
    "FIGURE",
    "H2",
    "H3",
    "H4",
    "HR",
    "IMG",
    "IFRAME",
    "LI",
    "OL",
    "P",
    "PRE",
    "SECTION",
    "SPAN",
    "STRONG",
    "TABLE",
    "TBODY",
    "TD",
    "TH",
    "THEAD",
    "TR",
    "U",
    "UL",
    "CODE",
  ]);
  const CLASS_ALLOWLIST = new Set([
    "nw-editor-dragover",
    "nw-editor-feedback",
    "nw-attachment",
    "nw-block-label",
    "nw-block-meta",
    "nw-block-title",
    "nw-embed",
    "nw-fact-box",
    "nw-gallery",
    "nw-image-figure",
    "nw-inline-preview",
    "nw-pull-quote",
    "nw-prompt-link",
    "nw-related-card",
    "nw-related-copy",
    "nw-related-story",
    "ollow-embed",
    "ollow-align-center",
    "ollow-align-full",
    "ollow-align-left",
    "ollow-align-right",
    "ollow-align-wide",
    "ollow-editor-image",
    "ollow-editor-code",
    "ollow-editor-table",
    "ollow-editor-table-scroll",
    "ollow-gallery",
    "ollow-gallery-grid",
    "ollow-gallery-header",
    "ollow-image",
    "ollow-image-full",
    "ollow-image-large",
    "ollow-image-medium",
    "ollow-image-small",
    "ollow-text-center",
    "ollow-text-justify",
    "ollow-text-left",
    "ollow-text-right",
    "ollow-media",
    "ollow-video-wrapper",
  ]);
  const DIV_DATA_TYPES = new Set(["attachment", "embed", "fact-box", "gallery", "related"]);
  const FIGURE_DATA_TYPES = new Set(["code", "embed", "image", "table"]);
  const BLOCKQUOTE_DATA_TYPES = new Set(["pull-quote"]);
  const SECTION_DATA_TYPES = new Set(["gallery"]);
  const URL_ATTRS = new Set(["href", "src"]);
  const IMAGE_SIZE_CLASSES = ["ollow-image-small", "ollow-image-medium", "ollow-image-large", "ollow-image-full"];
  const MEDIA_ALIGNMENT_CLASSES = ["ollow-align-left", "ollow-align-center", "ollow-align-right", "ollow-align-wide", "ollow-align-full"];
  const TEXT_ALIGNMENT_CLASSES = ["ollow-text-left", "ollow-text-center", "ollow-text-right", "ollow-text-justify"];
  const TEMP_SELECTION_CLASSES = ["is-selected", "is-media-selected", "ollow-selected", "ollow-image-selected"];
  const MEDIA_DATA_TYPES = new Set(["attachment", "code", "embed", "gallery", "image"]);
  const IMAGE_SIZE_PRESETS = {
    small: 320,
    medium: 560,
    large: 760,
  };
  const instances = new Map();
  const formBindings = new WeakMap();

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isSafeUrl(value, tagName) {
    if (!value) return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (/^javascript:/i.test(trimmed)) return false;
    if (/^vbscript:/i.test(trimmed)) return false;
    if (tagName === "IMG") {
      return /^(https?:\/\/|\/|\.\/|\.\.\/|data:image\/)/i.test(trimmed);
    }
    return /^(https?:\/\/|mailto:|tel:|\/|#|\.\.?\/)/i.test(trimmed);
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      if (!(file instanceof File)) {
        reject(new Error("A file is required."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });
  }

  function readImageFileAsDataURL(file) {
    if (!(file instanceof File) || !file.type || !file.type.startsWith("image/")) {
      return Promise.reject(new Error("Please choose an image file."));
    }
    return readFileAsDataURL(file);
  }

  function readMultipleFilesAsDataURLs(files) {
    return Promise.all(Array.from(files || []).map((file) => readImageFileAsDataURL(file)));
  }

  function extractUploadUrl(payload) {
    if (!payload) return "";
    if (typeof payload === "string") {
      return payload.trim();
    }
    if (typeof payload === "object") {
      const candidate = payload.url || payload.src || payload.location || "";
      return typeof candidate === "string" ? candidate.trim() : "";
    }
    return "";
  }

  function parseYouTubeTime(value) {
    const input = String(value || "").trim();
    if (!input) return 0;
    if (/^\d+$/.test(input)) {
      return Number(input);
    }

    const match = input.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
    if (!match) return 0;
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  function getYouTubeEmbedUrl(input) {
    const raw = String(input || "").trim();
    if (!raw) return "";

    let url;
    try {
      url = new URL(raw);
    } catch (error) {
      return "";
    }

    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/")[2] || "";
      }
    }

    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return "";
    }

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
    const start = parseYouTubeTime(url.searchParams.get("t") || url.searchParams.get("start"));
    const list = url.searchParams.get("list");

    if (start > 0) {
      embedUrl.searchParams.set("start", String(start));
    }
    if (list) {
      embedUrl.searchParams.set("list", list);
    }

    return embedUrl.toString();
  }

  function sanitizePlainText(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => `<p>${escapeHtml(chunk).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  function sanitizeFragment(input) {
    const source = String(input || "");
    if (!source.trim()) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, "text/html");
    const fragment = document.createDocumentFragment();

    function cloneAllowed(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || "");
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createDocumentFragment();
      }

      const originalTagName = node.tagName.toUpperCase();
      const tagName = originalTagName === "B" ? "STRONG" : originalTagName === "I" ? "EM" : originalTagName;
      if (tagName === "SCRIPT" || tagName === "STYLE") {
        return document.createDocumentFragment();
      }

      if (!ALLOWED_TAGS.has(tagName)) {
        const wrapper = document.createDocumentFragment();
        Array.from(node.childNodes).forEach((child) => {
          wrapper.appendChild(cloneAllowed(child));
        });
        return wrapper;
      }

      if (tagName === "DIV") {
        const dataType = node.getAttribute("data-type") || "";
        if (dataType && !DIV_DATA_TYPES.has(dataType)) {
          const replacement = document.createElement("p");
          Array.from(node.childNodes).forEach((child) => {
            replacement.appendChild(cloneAllowed(child));
          });
          return replacement;
        }
      }

      if (tagName === "SECTION") {
        const dataType = node.getAttribute("data-type") || "";
        if (dataType && !SECTION_DATA_TYPES.has(dataType)) {
          return document.createDocumentFragment();
        }
      }

      if (tagName === "FIGURE") {
        const dataType = node.getAttribute("data-type") || "";
        if (dataType && !FIGURE_DATA_TYPES.has(dataType)) {
          return document.createDocumentFragment();
        }
      }

      if (tagName === "BLOCKQUOTE") {
        const dataType = node.getAttribute("data-type") || "";
        if (dataType && !BLOCKQUOTE_DATA_TYPES.has(dataType)) {
          node.removeAttribute("data-type");
          node.classList.remove("nw-pull-quote");
        }
      }

      const clean = document.createElement(tagName.toLowerCase());
      Array.from(node.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value;
        if (name.startsWith("on")) return;

        if (name === "class") {
          const classes = value
            .split(/\s+/)
            .filter((className) => CLASS_ALLOWLIST.has(className) || /^language-[a-z0-9+._-]+$/i.test(className));
          if (classes.length) {
            clean.setAttribute("class", classes.join(" "));
          }
          return;
        }

        if (name === "data-type") {
          clean.setAttribute(name, value);
          return;
        }

        if (name === "data-language" && tagName === "FIGURE") {
          clean.setAttribute(name, value);
          return;
        }

        if (URL_ATTRS.has(name)) {
          if (tagName === "IFRAME") {
            if (!getYouTubeEmbedUrl(value)) return;
            clean.setAttribute(name, getYouTubeEmbedUrl(value));
            return;
          }
          if (!isSafeUrl(value, tagName)) return;
          clean.setAttribute(name, value);
          if (tagName === "A" && name === "href") {
            clean.setAttribute("target", "_blank");
            clean.setAttribute("rel", "noopener noreferrer");
          }
          return;
        }

        if (tagName === "IMG" && name === "alt") {
          clean.setAttribute(name, value);
          return;
        }

        if (tagName === "IFRAME" && ["title", "frameborder", "allow", "loading", "allowfullscreen"].includes(name)) {
          if (name === "allowfullscreen") {
            clean.setAttribute("allowfullscreen", "");
          } else {
            clean.setAttribute(name, value);
          }
        }
      });

      Array.from(node.childNodes).forEach((child) => {
        clean.appendChild(cloneAllowed(child));
      });

      return clean;
    }

    Array.from(doc.body.childNodes).forEach((child) => {
      fragment.appendChild(cloneAllowed(child));
    });

    const container = document.createElement("div");
    container.appendChild(fragment);
    return normalizeOutputHtml(container.innerHTML);
  }

  function normalizeOutputHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html || ""}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    if (!root) return "";

    const normalizedRoot = doc.createElement("div");
    let paragraph = null;

    function flushParagraph() {
      if (paragraph && paragraph.textContent.trim()) {
        normalizedRoot.appendChild(paragraph);
      }
      paragraph = null;
    }

    Array.from(root.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (!text.trim()) return;
        paragraph = paragraph || doc.createElement("p");
        paragraph.appendChild(doc.createTextNode(text));
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tagName = node.tagName.toUpperCase();
      if (["P", "PRE", "H2", "H3", "H4", "UL", "OL", "BLOCKQUOTE", "FIGURE", "DIV", "SECTION", "HR"].includes(tagName)) {
        flushParagraph();
        normalizedRoot.appendChild(node);
      } else {
        paragraph = paragraph || doc.createElement("p");
        paragraph.appendChild(node);
      }
    });
    flushParagraph();

    return normalizedRoot.innerHTML.trim();
  }

  function selectionInside(root) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    return root.contains(range.commonAncestorContainer);
  }

  function closestBlock(node, root) {
    let current = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== root) {
        if (current.nodeType === Node.ELEMENT_NODE) {
          const tagName = current.tagName.toUpperCase();
          if (["P", "H2", "H3", "H4", "BLOCKQUOTE", "UL", "OL", "LI", "FIGURE", "DIV", "SECTION"].includes(tagName)) {
            return current;
          }
        }
      current = current.parentNode;
    }
    return null;
  }

  function isAlignableTextBlock(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    return ["P", "H2", "H3", "H4", "BLOCKQUOTE", "LI"].includes(node.tagName.toUpperCase());
  }

  function getClosestAlignableTextBlock(node, root) {
    let current = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== root) {
      if (isAlignableTextBlock(current)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function getAlignmentIcon(alignment) {
    const paths = {
      left: ["M3 5h14", "M3 8h10", "M3 11h14", "M3 14h9"],
      center: ["M3 5h14", "M5 8h10", "M3 11h14", "M6 14h8"],
      right: ["M3 5h14", "M7 8h10", "M3 11h14", "M8 14h9"],
      justify: ["M3 5h14", "M3 8h14", "M3 11h14", "M3 14h14"],
    };
    return `<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">${(paths[alignment] || paths.left).map((path) => `<path d="${path}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`).join("")}</svg>`;
  }

  function getSelectionAncestor(root) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    return root.contains(range.commonAncestorContainer) ? range.commonAncestorContainer : null;
  }

  function safeQueryState(command) {
    try {
      return document.queryCommandState(command);
    } catch (error) {
      return false;
    }
  }

  function placeCaretAfter(node) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function getClosestMediaBlock(node, root) {
    let current = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== root) {
      if (current.nodeType === Node.ELEMENT_NODE && (current.classList.contains("ollow-media") || current.hasAttribute("data-type"))) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function getImageFigure(node, root) {
    let current = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== root) {
      if (
        current.nodeType === Node.ELEMENT_NODE &&
        current.tagName.toUpperCase() === "FIGURE" &&
        (
          current.classList.contains("ollow-editor-image") ||
          current.classList.contains("ollow-image") ||
          current.getAttribute("data-type") === "image"
        )
      ) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function getTableCell(node, root) {
    let current = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== root) {
      if (current.nodeType === Node.ELEMENT_NODE && ["TD", "TH"].includes(current.tagName.toUpperCase())) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function getTableFigure(node, root) {
    let current = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== root) {
      if (
        current.nodeType === Node.ELEMENT_NODE &&
        current.tagName.toUpperCase() === "FIGURE" &&
        (current.classList.contains("ollow-editor-table") || current.getAttribute("data-type") === "table")
      ) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function getCodeFigure(node, root) {
    let current = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== root) {
      if (
        current.nodeType === Node.ELEMENT_NODE &&
        current.tagName.toUpperCase() === "FIGURE" &&
        (current.classList.contains("ollow-editor-code") || current.getAttribute("data-type") === "code")
      ) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function getSelectableMediaBlock(node, root) {
    let current = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== root) {
      if (current.nodeType !== Node.ELEMENT_NODE) {
        current = current.parentNode;
        continue;
      }

      const dataType = current.getAttribute("data-type") || "";
      if (MEDIA_DATA_TYPES.has(dataType)) {
        return current;
      }

      if (
        current.classList.contains("ollow-editor-image") ||
        current.classList.contains("ollow-editor-code") ||
        current.classList.contains("ollow-editor-embed") ||
        current.classList.contains("ollow-editor-attachment") ||
        current.classList.contains("ollow-editor-gallery") ||
        current.classList.contains("ollow-image") ||
        current.classList.contains("ollow-gallery") ||
        current.classList.contains("ollow-embed") ||
        current.classList.contains("nw-attachment") ||
        current.hasAttribute("data-gallery") ||
        current.hasAttribute("data-embed-provider")
      ) {
        return current;
      }

      current = current.parentNode;
    }
    return null;
  }

  function insertHtmlAtSelection(root, html, savedSelection) {
    const selection = window.getSelection();
    let range = null;

    if (selection && selection.rangeCount > 0) {
      const activeRange = selection.getRangeAt(0);
      if (root.contains(activeRange.commonAncestorContainer)) {
        range = activeRange.cloneRange();
      }
    }

    if (!range && savedSelection && root.contains(savedSelection.commonAncestorContainer)) {
      range = savedSelection.cloneRange();
    }

    if (!range) {
      root.insertAdjacentHTML("beforeend", html);
      return root.lastElementChild || null;
    }

    const mediaBlock = getClosestMediaBlock(range.commonAncestorContainer, root);
    if (mediaBlock) {
      range.setStartAfter(mediaBlock);
      range.collapse(true);
    }

    range.deleteContents();
    const template = document.createElement("template");
    template.innerHTML = html;
    const fragment = template.content.cloneNode(true);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);
    if (lastNode) {
      placeCaretAfter(lastNode);
    }
    return lastNode;
  }

  function resetModalForm(fieldRefs) {
    Object.values(fieldRefs || {}).forEach((input) => {
      if (!input) return;
      if (input.type === "file") {
        input.value = "";
      } else if (input.type === "checkbox") {
        input.checked = false;
      } else if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
        input.value = "";
      }
    });
  }

  function createButton(label, attrs) {
    const button = document.createElement("button");
    button.type = "button";
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === "className") {
        button.className = value;
      } else if (key === "html") {
        button.innerHTML = value;
      } else {
        button.setAttribute(key, value);
      }
    });
    if (!attrs || !attrs.html) {
      button.textContent = label;
    }
    return button;
  }

  class EditorInstance {
    constructor(textarea, options) {
      this.textarea = textarea;
      this.options = options;
      this.id = textarea.id || textarea.name || `nw-editor-${instances.size + 1}`;
      this.wrapper = null;
      this.surface = null;
      this.content = null;
      this.feedback = null;
      this.imageResizeToolbar = null;
      this.imageResizeHandle = null;
      this.tableToolbar = null;
      this.selectedMediaBlock = null;
      this.selectedImageFigure = null;
      this.selectedCodeFigure = null;
      this.selectedTableFigure = null;
      this.selectedTableCell = null;
      this.isDraggingImageResize = false;
      this.resizePointerId = null;
      this.statusWordCount = null;
      this.statusReadTime = null;
      this.statusActive = null;
      this.statusSave = null;
      this.statusDot = null;
      this.toolbarButtons = {};
      this.headingSelect = null;
      this.modal = null;
      this.modalTitle = null;
      this.modalCopy = null;
      this.modalBody = null;
      this.modalError = null;
      this.modalConfirm = null;
      this.modalFieldRefs = {};
      this.savedSelection = null;
      this.autosaveTimer = null;
      this.lastSavedAt = null;
      this.dragDepth = 0;
      this.isDirty = false;
      this.isFocused = false;
      this.boundSelectionChange = this.handleSelectionChange.bind(this);
      this.boundModalClose = this.closeModal.bind(this);
      this.boundDocumentPointerDown = this.handleDocumentPointerDown.bind(this);
      this.boundRepositionImageToolbar = this.positionImageResizeToolbar.bind(this);
      this.boundImageResizeMove = this.handleImageResizeMove.bind(this);
      this.boundImageResizeEnd = this.handleImageResizeEnd.bind(this);
      this.boundRepositionTableToolbar = this.positionTableToolbar.bind(this);
    }

    init() {
      this.build();
      this.hideSource();
      this.setHTML(this.textarea.value || "", { skipSync: true, skipAutosave: true });
      this.bind();
      this.sync({ autosave: false, silent: true });
      this.updateMetrics();
      this.updateToolbarState();
      this.updateStatus();
      this.dispatch("nationwire-editor:ready");
      return this;
    }

    build() {
      this.wrapper = document.createElement("div");
      this.wrapper.className = "nw-editor";
      this.wrapper.dataset.editorId = this.id;

      const card = document.createElement("div");
      card.className = "nw-editor-card";

      const toolbar = document.createElement("div");
      toolbar.className = "nw-editor-toolbar";
      toolbar.appendChild(this.buildToolbarPrimary());
      toolbar.appendChild(this.buildToolbarInsert());

      const surface = document.createElement("div");
      surface.className = "nw-editor-surface";
      this.surface = surface;

      this.content = document.createElement("div");
      this.content.className = "nw-editor-content";
      this.content.contentEditable = "true";
      this.content.spellcheck = true;
      this.content.dataset.placeholder = this.options.placeholder;
      this.content.setAttribute("role", "textbox");
      this.content.setAttribute("aria-multiline", "true");

      surface.appendChild(this.content);

      this.feedback = document.createElement("div");
      this.feedback.className = "nw-editor-feedback";
      this.feedback.hidden = true;
      surface.appendChild(this.feedback);

      this.imageResizeToolbar = this.buildImageResizeToolbar();
      this.imageResizeHandle = this.buildImageResizeHandle();
      this.tableToolbar = this.buildTableToolbar();
      surface.appendChild(this.imageResizeToolbar);
      surface.appendChild(this.imageResizeHandle);
      surface.appendChild(this.tableToolbar);

      const status = document.createElement("div");
      status.className = "nw-editor-status";
      status.innerHTML = `
        <div class="nw-status-meta">
          <span><strong data-role="word-count">0</strong> words</span>
          <span><strong data-role="read-time">0 min</strong> read</span>
          <span><strong data-role="active-label">Inactive</strong></span>
        </div>
        <div class="nw-status-save">
          <span class="nw-status-dot" data-role="status-dot"></span>
          <span data-role="save-status">Saved</span>
        </div>
      `;
      this.statusWordCount = status.querySelector('[data-role="word-count"]');
      this.statusReadTime = status.querySelector('[data-role="read-time"]');
      this.statusActive = status.querySelector('[data-role="active-label"]');
      this.statusDot = status.querySelector('[data-role="status-dot"]');
      this.statusSave = status.querySelector('[data-role="save-status"]');

      this.modal = this.buildModal();

      card.appendChild(toolbar);
      card.appendChild(surface);
      card.appendChild(status);
      this.wrapper.appendChild(card);
      this.wrapper.appendChild(this.modal);

      this.textarea.insertAdjacentElement("afterend", this.wrapper);
    }

    buildToolbarPrimary() {
      const row = document.createElement("div");
      row.className = "nw-toolbar-row";

      const groupUndo = document.createElement("div");
      groupUndo.className = "nw-toolbar-group";
      groupUndo.appendChild(this.makeToolbarButton("undo", "Undo", '<span class="material-symbols-outlined">undo</span>'));
      groupUndo.appendChild(this.makeToolbarButton("redo", "Redo", '<span class="material-symbols-outlined">redo</span>'));

      this.headingSelect = document.createElement("select");
      this.headingSelect.className = "nw-toolbar-select";
      this.headingSelect.innerHTML = `
        <option value="P">Paragraph</option>
        <option value="H2">H2</option>
        <option value="H3">H3</option>
        <option value="H4">H4</option>
      `;
      this.headingSelect.setAttribute("aria-label", "Paragraph style");

      const groupText = document.createElement("div");
      groupText.className = "nw-toolbar-group";
      groupText.appendChild(this.makeToolbarButton("h2", "Heading 2", "H2", "nw-toolbar-button nw-text-button"));
      groupText.appendChild(this.makeToolbarButton("h3", "Heading 3", "H3", "nw-toolbar-button nw-text-button"));
      groupText.appendChild(this.makeToolbarButton("h4", "Heading 4", "H4", "nw-toolbar-button nw-text-button"));

      const groupInline = document.createElement("div");
      groupInline.className = "nw-toolbar-group";
      groupInline.appendChild(this.makeToolbarButton("bold", "Bold", "B", "nw-toolbar-button nw-text-button"));
      groupInline.appendChild(this.makeToolbarButton("italic", "Italic", "I", "nw-toolbar-button nw-text-button"));
      groupInline.appendChild(this.makeToolbarButton("underline", "Underline", "U", "nw-toolbar-button nw-text-button"));
      groupInline.appendChild(this.makeToolbarButton("link", "Link", '<span class="material-symbols-outlined">link</span>'));
      groupInline.appendChild(this.makeToolbarButton("unlink", "Unlink", '<span class="material-symbols-outlined">link_off</span>'));

      const groupBlocks = document.createElement("div");
      groupBlocks.className = "nw-toolbar-group";
      groupBlocks.appendChild(this.makeToolbarButton("bulleted-list", "Bullet list", '<span class="material-symbols-outlined">format_list_bulleted</span>'));
      groupBlocks.appendChild(this.makeToolbarButton("numbered-list", "Numbered list", '<span class="material-symbols-outlined">format_list_numbered</span>'));
      groupBlocks.appendChild(this.makeToolbarButton("quote", "Quote", '<span class="material-symbols-outlined">format_quote</span>'));
      groupBlocks.appendChild(this.makeToolbarButton("horizontal-rule", "Horizontal rule", '<span class="material-symbols-outlined">horizontal_rule</span>'));

      const groupMediaAlign = document.createElement("div");
      groupMediaAlign.className = "nw-toolbar-group nw-toolbar-group--media-align";
      groupMediaAlign.appendChild(this.makeToolbarButton("align-left", "Align left", getAlignmentIcon("left")));
      groupMediaAlign.appendChild(this.makeToolbarButton("align-center", "Align center", getAlignmentIcon("center")));
      groupMediaAlign.appendChild(this.makeToolbarButton("align-right", "Align right", getAlignmentIcon("right")));
      groupMediaAlign.appendChild(this.makeToolbarButton("align-justify", "Justify", getAlignmentIcon("justify")));

      row.appendChild(groupUndo);
      row.appendChild(this.makeDivider());
      row.appendChild(this.headingSelect);
      row.appendChild(groupText);
      row.appendChild(this.makeDivider());
      row.appendChild(groupInline);
      row.appendChild(this.makeDivider());
      row.appendChild(groupBlocks);
      row.appendChild(this.makeDivider());
      row.appendChild(groupMediaAlign);
      return row;
    }

    buildToolbarInsert() {
      const row = document.createElement("div");
      row.className = "nw-insert-row";

      const insertItems = [
        ["pull-quote", "Pull Quote", "format_quote"],
        ["image", "Image", "image"],
        ["code", "Code", "code_blocks"],
        ["table", "Table", "table"],
        ["gallery", "Gallery", "photo_library"],
        ["embed", "Embed", "smart_display"],
        ["related", "Related", "article"],
        ["fact-box", "Fact Box", "fact_check"],
        ["attachment", "Attachment", "attach_file"],
      ];

      insertItems.forEach(([action, label, icon], index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `nw-insert-pill${index === 0 ? " is-active" : ""}`;
        button.dataset.action = action;
        button.title = label;
        button.innerHTML = `<span class="material-symbols-outlined">${icon}</span>${label}`;
        this.toolbarButtons[action] = button;
        row.appendChild(button);
      });

      return row;
    }

    buildModal() {
      const modal = document.createElement("div");
      modal.className = "nw-editor-modal";
      modal.hidden = true;
      modal.innerHTML = `
        <div class="nw-editor-modal-panel" role="dialog" aria-modal="true" aria-labelledby="${this.id}-modal-title">
          <div class="nw-editor-modal-header">
            <h3 class="nw-editor-modal-title" id="${this.id}-modal-title"></h3>
            <p class="nw-editor-modal-copy"></p>
          </div>
          <div class="nw-editor-modal-body"></div>
          <div class="nw-editor-modal-footer">
            <button class="nw-modal-button nw-modal-button--secondary" data-role="cancel" type="button">Cancel</button>
            <button class="nw-modal-button nw-modal-button--primary" data-role="confirm" type="button">Insert</button>
          </div>
        </div>
      `;

      this.modalTitle = modal.querySelector(".nw-editor-modal-title");
      this.modalCopy = modal.querySelector(".nw-editor-modal-copy");
      this.modalBody = modal.querySelector(".nw-editor-modal-body");
      this.modalConfirm = modal.querySelector('[data-role="confirm"]');
      modal.querySelector('[data-role="cancel"]').addEventListener("click", this.boundModalClose);
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          this.closeModal();
        }
      });
      return modal;
    }

    buildImageResizeToolbar() {
      const toolbar = document.createElement("div");
      toolbar.className = "ollow-media-toolbar";
      toolbar.hidden = true;
      toolbar.innerHTML = `
        <div class="ollow-media-toolbar-group" data-role="align-controls">
          <span class="ollow-media-toolbar-label">Align</span>
          <button type="button" class="ollow-media-toolbar-icon" data-media-align="left" title="Align left" aria-label="Align left">${getAlignmentIcon("left")}</button>
          <button type="button" class="ollow-media-toolbar-icon" data-media-align="center" title="Align center" aria-label="Align center">${getAlignmentIcon("center")}</button>
          <button type="button" class="ollow-media-toolbar-icon" data-media-align="right" title="Align right" aria-label="Align right">${getAlignmentIcon("right")}</button>
          <button type="button" data-media-align="wide">Wide</button>
          <button type="button" data-media-align="full">Full</button>
          <button type="button" data-media-align="reset">Reset</button>
        </div>
        <span class="ollow-media-toolbar-divider" data-role="size-divider"></span>
        <div class="ollow-media-toolbar-group" data-role="size-controls">
          <span class="ollow-media-toolbar-label">Size</span>
          <button type="button" data-image-size="small">Small</button>
          <button type="button" data-image-size="medium">Medium</button>
          <button type="button" data-image-size="large">Large</button>
          <button type="button" data-image-size="full">Full</button>
          <button type="button" data-image-size="reset">Reset</button>
        </div>
        <span class="ollow-media-toolbar-divider" data-role="code-divider" hidden></span>
        <div class="ollow-media-toolbar-group" data-role="code-controls" hidden>
          <button type="button" data-code-action="edit">Edit Code</button>
          <button type="button" data-code-action="copy">Copy</button>
          <button type="button" data-code-action="delete">Delete</button>
        </div>
      `;

      toolbar.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });

      toolbar.addEventListener("click", (event) => {
        const alignmentButton = event.target.closest("[data-media-align]");
        if (alignmentButton) {
          this.applySelectedMediaAlignment(alignmentButton.dataset.mediaAlign);
          return;
        }
        const button = event.target.closest("[data-image-size]");
        if (button) {
          this.applySelectedImageSize(button.dataset.imageSize);
          return;
        }
        const codeButton = event.target.closest("[data-code-action]");
        if (!codeButton) return;
        this.handleCodeAction(codeButton.dataset.codeAction);
      });

      return toolbar;
    }

    buildImageResizeHandle() {
      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "ollow-image-resize-handle";
      handle.hidden = true;
      handle.setAttribute("aria-label", "Resize image");

      handle.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });

      handle.addEventListener("pointerdown", (event) => {
        this.startImageResize(event);
      });

      return handle;
    }

    buildTableToolbar() {
      const toolbar = document.createElement("div");
      toolbar.className = "ollow-table-toolbar";
      toolbar.hidden = true;
      toolbar.innerHTML = `
        <button type="button" data-table-action="row-above">Row Above</button>
        <button type="button" data-table-action="row-below">Row Below</button>
        <button type="button" data-table-action="delete-row">Delete Row</button>
        <button type="button" data-table-action="col-left">Col Left</button>
        <button type="button" data-table-action="col-right">Col Right</button>
        <button type="button" data-table-action="delete-col">Delete Col</button>
        <button type="button" data-table-action="delete-table">Delete Table</button>
      `;

      toolbar.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });

      toolbar.addEventListener("click", (event) => {
        const button = event.target.closest("[data-table-action]");
        if (!button) return;
        this.handleTableAction(button.dataset.tableAction);
      });

      return toolbar;
    }

    makeDivider() {
      const divider = document.createElement("div");
      divider.className = "nw-toolbar-divider";
      return divider;
    }

    makeToolbarButton(action, title, content, className) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className || "nw-toolbar-button";
      button.dataset.action = action;
      button.title = title;
      button.setAttribute("aria-label", title);
      button.innerHTML = content;
      this.toolbarButtons[action] = button;
      return button;
    }

    hideSource() {
      this.textarea.classList.add("nw-editor-source");
      this.textarea.dataset.nwEditorBound = "true";
    }

    showSource() {
      this.textarea.classList.remove("nw-editor-source");
      delete this.textarea.dataset.nwEditorBound;
    }

    bind() {
      try {
        document.execCommand("defaultParagraphSeparator", false, "p");
      } catch (error) {
        // No-op.
      }

      this.wrapper.addEventListener("mousedown", (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (actionButton) {
          event.preventDefault();
          this.handleAction(actionButton.dataset.action);
        }
      });

      this.headingSelect.addEventListener("change", () => {
        this.applyBlock(this.headingSelect.value);
      });

      this.content.addEventListener("focus", () => {
        this.isFocused = true;
        this.statusActive.textContent = "Story body active";
        this.updateToolbarState();
      });

      this.content.addEventListener("blur", () => {
        this.isFocused = false;
        this.saveSelection();
        window.setTimeout(() => {
          if (!selectionInside(this.content)) {
            this.statusActive.textContent = "Story body inactive";
            this.updateToolbarState();
          }
        }, 0);
      });

      this.content.addEventListener("input", () => {
        this.handleContentChange();
      });

      this.content.addEventListener("paste", (event) => {
        this.handlePaste(event);
      });

      this.content.addEventListener("click", (event) => {
        this.handleContentClick(event);
      });

      this.content.addEventListener("dragenter", (event) => {
        this.handleDragEnter(event);
      });

      this.content.addEventListener("dragover", (event) => {
        this.handleDragOver(event);
      });

      this.content.addEventListener("dragleave", (event) => {
        this.handleDragLeave(event);
      });

      this.content.addEventListener("drop", (event) => {
        this.handleDrop(event);
      });

      this.content.addEventListener("keyup", () => {
        this.updateToolbarState();
      });

      this.content.addEventListener("mouseup", () => {
        this.updateToolbarState();
      });

      document.addEventListener("selectionchange", this.boundSelectionChange);
      document.addEventListener("pointerdown", this.boundDocumentPointerDown);
      window.addEventListener("resize", this.boundRepositionImageToolbar);
      window.addEventListener("scroll", this.boundRepositionImageToolbar, true);
      window.addEventListener("resize", this.boundRepositionTableToolbar);
      window.addEventListener("scroll", this.boundRepositionTableToolbar, true);

      if (this.textarea.form) {
        const form = this.textarea.form;
        const binding = formBindings.get(form) || {
          editors: new Set(),
          listener: (event) => {
            const activeBinding = formBindings.get(form);
            if (!activeBinding) return;
            activeBinding.editors.forEach((editor) => editor.handleFormSubmit(event));
          },
        };
        binding.editors.add(this);
        formBindings.set(form, binding);
        if (!form.dataset.nwEditorSubmitBound) {
          form.addEventListener("submit", binding.listener);
          form.dataset.nwEditorSubmitBound = "true";
        }
      }
    }

    handleSelectionChange() {
      const tableCell = getTableCell(getSelectionAncestor(this.content), this.content);
      if (tableCell) {
        this.selectTableCell(tableCell);
      } else if (this.selectedTableFigure) {
        this.clearTableSelection();
      }

      if (this.isFocused || selectionInside(this.content)) {
        this.saveSelection();
        this.updateToolbarState();
      }
      if (this.selectedMediaBlock && !this.isDraggingImageResize) {
        this.positionImageResizeToolbar();
      }
      if (this.selectedTableFigure) {
        this.positionTableToolbar();
      }
    }

    handleFormSubmit(event) {
      this.sync({ autosave: false });
    }

    handleContentChange() {
      this.isDirty = true;
      this.sync({ autosave: false, preserveDirty: true });
      this.updateMetrics();
      this.updateStatus();
      this.updateToolbarState();
      this.scheduleAutosave();
      this.dispatch("nationwire-editor:change");
    }

    handlePaste(event) {
      event.preventDefault();
      const html = event.clipboardData && event.clipboardData.getData("text/html");
      const text = event.clipboardData && event.clipboardData.getData("text/plain");
      const clean = html ? sanitizeFragment(html) : sanitizePlainText(text);
      if (!clean) return;
      this.insertHTML(clean);
    }

    handleContentClick(event) {
      const tableCell = getTableCell(event.target, this.content);
      if (tableCell) {
        this.selectTableCell(tableCell);
        return;
      }

      const mediaBlock = getSelectableMediaBlock(event.target, this.content);
      if (mediaBlock) {
        this.selectMediaBlock(mediaBlock);
        return;
      }
      this.clearMediaSelection();
      this.clearTableSelection();
    }

    handleDocumentPointerDown(event) {
      if (!this.wrapper || !this.wrapper.contains(event.target)) {
        this.clearMediaSelection();
        this.clearTableSelection();
        return;
      }

      if (this.imageResizeToolbar && this.imageResizeToolbar.contains(event.target)) {
        return;
      }

      if (this.imageResizeHandle && this.imageResizeHandle.contains(event.target)) {
        return;
      }

      if (this.tableToolbar && this.tableToolbar.contains(event.target)) {
        return;
      }

      if (getTableCell(event.target, this.content)) {
        return;
      }

      if (!getSelectableMediaBlock(event.target, this.content)) {
        this.clearMediaSelection();
      }
      this.clearTableSelection();
    }

    handleDragEnter(event) {
      if (!this.hasDraggedFiles(event)) return;
      event.preventDefault();
      this.dragDepth += 1;
      if (this.isValidImageDrag(event)) {
        this.setDragState(true);
      }
    }

    handleDragOver(event) {
      if (!this.hasDraggedFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = this.isValidImageDrag(event) ? "copy" : "none";
      this.setDragState(this.isValidImageDrag(event));
    }

    handleDragLeave(event) {
      if (!this.hasDraggedFiles(event)) return;
      event.preventDefault();
      this.dragDepth = Math.max(0, this.dragDepth - 1);
      if (this.dragDepth === 0) {
        this.setDragState(false);
      }
    }

    async handleDrop(event) {
      if (!this.hasDraggedFiles(event)) {
        event.preventDefault();
        this.setDragState(false);
        this.dragDepth = 0;
        return;
      }

      event.preventDefault();
      this.setDragState(false);
      this.dragDepth = 0;
      this.clearFeedback();

      const files = Array.from((event.dataTransfer && event.dataTransfer.files) || []);
      if (!files.length) return;

      if (files.some((file) => !this.isImageFile(file))) {
        this.showFeedback("Only image files can be dropped into the editor.");
        return;
      }

      this.focus();
      this.setSelectionFromPoint(event.clientX, event.clientY);
      this.saveSelection();

      try {
        await this.insertDroppedImages(files);
      } catch (error) {
        this.showFeedback(error && error.message ? error.message : "Unable to insert dropped images.");
      }
    }

    handleAction(action) {
      switch (action) {
        case "undo":
          this.execCommand("undo");
          return;
        case "redo":
          this.execCommand("redo");
          return;
        case "bold":
          this.execCommand("bold");
          return;
        case "italic":
          this.execCommand("italic");
          return;
        case "underline":
          this.execCommand("underline");
          return;
        case "link":
          this.openLinkModal();
          return;
        case "unlink":
          this.execCommand("unlink");
          return;
        case "bulleted-list":
          this.execCommand("insertUnorderedList");
          return;
        case "numbered-list":
          this.execCommand("insertOrderedList");
          return;
        case "quote":
          this.applyBlock("BLOCKQUOTE");
          return;
        case "horizontal-rule":
          this.insertHTML("<hr>");
          return;
        case "h2":
          this.applyBlock("H2");
          return;
        case "h3":
          this.applyBlock("H3");
          return;
        case "h4":
          this.applyBlock("H4");
          return;
        case "pull-quote":
          this.insertPullQuote();
          return;
        case "image":
          this.openImageModal();
          return;
        case "code":
          this.openCodeModal();
          return;
        case "table":
          this.openTableModal();
          return;
        case "gallery":
          this.openGalleryModal();
          return;
        case "embed":
          this.openEmbedModal();
          return;
        case "related":
          this.openRelatedModal();
          return;
        case "fact-box":
          this.insertFactBox();
          return;
        case "attachment":
          this.openAttachmentModal();
          return;
        case "align-left":
          this.handleAlignmentAction("left");
          return;
        case "align-center":
          this.handleAlignmentAction("center");
          return;
        case "align-right":
          this.handleAlignmentAction("right");
          return;
        case "align-justify":
          this.handleAlignmentAction("justify");
          return;
        default:
          return;
      }
    }

    execCommand(command, value) {
      this.focus();
      document.execCommand(command, false, value || null);
      this.handleContentChange();
    }

    applyBlock(tagName) {
      this.focus();
      if (tagName === "P") {
        document.execCommand("formatBlock", false, "p");
      } else {
        document.execCommand("formatBlock", false, tagName.toLowerCase());
      }
      this.headingSelect.value = tagName;
      this.handleContentChange();
    }

    insertHTML(html) {
      this.focus();
      this.restoreSelection();
      insertHtmlAtSelection(this.content, html, this.savedSelection);
      this.saveSelection();
      this.handleContentChange();
    }

    selectTableCell(cell) {
      if (!cell || !this.content.contains(cell)) return;
      const figure = getTableFigure(cell, this.content);
      if (!figure) return;
      if (this.selectedTableFigure && this.selectedTableFigure !== figure) {
        this.selectedTableFigure.classList.remove(...TEMP_SELECTION_CLASSES);
      }
      this.clearMediaSelection();
      this.selectedTableFigure = figure;
      this.selectedTableCell = cell;
      this.selectedTableFigure.classList.add("is-selected");
      this.positionTableToolbar();
    }

    clearTableSelection() {
      if (this.selectedTableFigure) {
        this.selectedTableFigure.classList.remove(...TEMP_SELECTION_CLASSES);
      }
      this.selectedTableFigure = null;
      this.selectedTableCell = null;
      if (this.tableToolbar) {
        this.tableToolbar.hidden = true;
      }
    }

    selectMediaBlock(block) {
      if (!block || !this.content.contains(block)) return;
      if (this.selectedMediaBlock && this.selectedMediaBlock !== block) {
        this.selectedMediaBlock.classList.remove(...TEMP_SELECTION_CLASSES);
      }
      this.clearTableSelection();
      this.selectedMediaBlock = block;
      this.selectedImageFigure = getImageFigure(block, this.content);
      this.selectedCodeFigure = getCodeFigure(block, this.content);
      this.selectedMediaBlock.classList.add("is-selected", "is-media-selected");
      this.updateMediaAlignmentToolbarState();
      this.updateImageResizeToolbarState();
      this.updateCodeToolbarState();
      this.positionImageResizeToolbar();
      this.updateToolbarState();
    }

    clearMediaSelection() {
      if (this.selectedMediaBlock) {
        this.selectedMediaBlock.classList.remove(...TEMP_SELECTION_CLASSES);
      }
      this.selectedMediaBlock = null;
      this.selectedImageFigure = null;
      this.selectedCodeFigure = null;
      if (this.imageResizeToolbar) {
        this.imageResizeToolbar.hidden = true;
      }
      if (this.imageResizeHandle) {
        this.imageResizeHandle.hidden = true;
      }
      this.updateToolbarState();
    }

    normalizeImageFigure(figure) {
      if (!figure) return;
      figure.classList.add("ollow-editor-image");
      figure.classList.remove("ollow-media");
      figure.classList.remove("ollow-image");
      figure.removeAttribute("style");
    }

    getSelectedMediaAlignment() {
      if (!this.selectedMediaBlock) return "";
      if (this.selectedMediaBlock.classList.contains("ollow-align-left")) return "left";
      if (this.selectedMediaBlock.classList.contains("ollow-align-center")) return "center";
      if (this.selectedMediaBlock.classList.contains("ollow-align-right")) return "right";
      if (this.selectedMediaBlock.classList.contains("ollow-align-wide")) return "wide";
      if (this.selectedMediaBlock.classList.contains("ollow-align-full")) return "full";
      return "";
    }

    removeTextAlignmentClasses(element) {
      if (!element || !element.classList) return;
      element.classList.remove(...TEXT_ALIGNMENT_CLASSES);
    }

    getCurrentBlocksFromSelection() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return [];
      const range = selection.getRangeAt(0);
      if (!this.content.contains(range.commonAncestorContainer)) return [];

      const blocks = new Set();
      Array.from(this.content.querySelectorAll("p, h2, h3, h4, blockquote, li")).forEach((element) => {
        try {
          if (range.intersectsNode(element)) {
            blocks.add(element);
          }
        } catch (error) {
          // Ignore invalid range intersections.
        }
      });

      if (!blocks.size) {
        const fallback = getClosestAlignableTextBlock(range.commonAncestorContainer, this.content);
        if (fallback) {
          blocks.add(fallback);
        }
      }

      return Array.from(blocks);
    }

    getSelectedTextAlignment() {
      const blocks = this.getCurrentBlocksFromSelection();
      if (!blocks.length) return "";

      const alignments = blocks.map((block) => {
        if (block.classList.contains("ollow-text-center")) return "center";
        if (block.classList.contains("ollow-text-right")) return "right";
        if (block.classList.contains("ollow-text-justify")) return "justify";
        if (block.classList.contains("ollow-text-left")) return "left";
        return "left";
      });

      const first = alignments[0];
      return alignments.every((alignment) => alignment === first) ? first : "";
    }

    applyTextAlignment(alignment) {
      const blocks = this.getCurrentBlocksFromSelection();
      if (!blocks.length) return;

      blocks.forEach((block) => {
        this.removeTextAlignmentClasses(block);
        if (alignment) {
          block.classList.add(`ollow-text-${alignment}`);
        }
      });

      this.saveSelection();
      this.handleContentChange();
    }

    handleAlignmentAction(alignment) {
      if (this.selectedMediaBlock && alignment !== "justify") {
        this.applySelectedMediaAlignment(alignment);
        return;
      }
      this.focus();
      this.restoreSelection();
      this.applyTextAlignment(alignment);
    }

    updateMediaAlignmentToolbarState() {
      if (!this.imageResizeToolbar) return;
      const activeAlignment = this.getSelectedMediaAlignment();
      Array.from(this.imageResizeToolbar.querySelectorAll("[data-media-align]")).forEach((button) => {
        const value = button.dataset.mediaAlign;
        const isActive = value === activeAlignment || (value === "reset" && !activeAlignment);
        button.classList.toggle("is-active", isActive);
      });

      const sizeControls = this.imageResizeToolbar.querySelector('[data-role="size-controls"]');
      const sizeDivider = this.imageResizeToolbar.querySelector('[data-role="size-divider"]');
      const supportsImageResize = Boolean(this.selectedImageFigure);
      if (sizeControls) {
        sizeControls.hidden = !supportsImageResize;
      }
      if (sizeDivider) {
        sizeDivider.hidden = !supportsImageResize;
      }
      if (!supportsImageResize && this.imageResizeHandle) {
        this.imageResizeHandle.hidden = true;
      }
    }

    updateCodeToolbarState() {
      if (!this.imageResizeToolbar) return;
      const codeControls = this.imageResizeToolbar.querySelector('[data-role="code-controls"]');
      const codeDivider = this.imageResizeToolbar.querySelector('[data-role="code-divider"]');
      const hasCodeBlock = Boolean(this.selectedCodeFigure);
      if (codeControls) {
        codeControls.hidden = !hasCodeBlock;
      }
      if (codeDivider) {
        codeDivider.hidden = !hasCodeBlock;
      }
    }

    getSelectedImageSize() {
      if (!this.selectedImageFigure) return "";
      if (this.selectedImageFigure.classList.contains("ollow-image-small")) return "small";
      if (this.selectedImageFigure.classList.contains("ollow-image-medium")) return "medium";
      if (this.selectedImageFigure.classList.contains("ollow-image-large")) return "large";
      if (this.selectedImageFigure.classList.contains("ollow-image-full")) return "full";
      return "";
    }

    updateImageResizeToolbarState() {
      if (!this.imageResizeToolbar) return;
      const activeSize = this.getSelectedImageSize();
      Array.from(this.imageResizeToolbar.querySelectorAll("[data-image-size]")).forEach((button) => {
        const value = button.dataset.imageSize;
        const isActive = value === activeSize || (value === "reset" && !activeSize);
        button.classList.toggle("is-active", isActive);
      });
    }

    positionImageResizeToolbar() {
      const targetBlock = this.selectedMediaBlock;
      if (!targetBlock || !this.surface || !this.content.contains(targetBlock)) {
        this.clearMediaSelection();
        return;
      }

      const toolbar = this.imageResizeToolbar;
      const handle = this.imageResizeHandle;
      if (!toolbar) return;

      const surfaceRect = this.surface.getBoundingClientRect();
      const figureRect = targetBlock.getBoundingClientRect();

      toolbar.hidden = false;

      const toolbarRect = toolbar.getBoundingClientRect();
      let top = figureRect.top - surfaceRect.top - toolbarRect.height - 10;
      if (top < 10) {
        top = figureRect.bottom - surfaceRect.top + 10;
      }

      const maxLeft = Math.max(10, surfaceRect.width - toolbarRect.width - 10);
      const left = Math.min(Math.max(10, figureRect.left - surfaceRect.left), maxLeft);

      toolbar.style.top = `${Math.round(top)}px`;
      toolbar.style.left = `${Math.round(left)}px`;

      if (handle && this.selectedImageFigure) {
        handle.hidden = false;
        handle.style.top = `${Math.round(figureRect.bottom - surfaceRect.top)}px`;
        handle.style.left = `${Math.round(figureRect.right - surfaceRect.left)}px`;
      }
    }

    applySelectedImageSize(size) {
      if (!this.selectedImageFigure) return;
      this.normalizeImageFigure(this.selectedImageFigure);
      this.selectedImageFigure.classList.remove(...IMAGE_SIZE_CLASSES);
      if (size && size !== "reset") {
        this.selectedImageFigure.classList.add(`ollow-image-${size}`);
      }
      this.selectedImageFigure.classList.add("is-selected", "is-media-selected");
      this.updateImageResizeToolbarState();
      this.positionImageResizeToolbar();
      this.handleContentChange();
    }

    applySelectedMediaAlignment(alignment) {
      if (!this.selectedMediaBlock) return;
      if (this.selectedImageFigure) {
        this.normalizeImageFigure(this.selectedImageFigure);
      }
      this.selectedMediaBlock.classList.remove(...MEDIA_ALIGNMENT_CLASSES);
      if (alignment && alignment !== "reset") {
        this.selectedMediaBlock.classList.add(`ollow-align-${alignment}`);
      }
      this.selectedMediaBlock.classList.add("is-selected", "is-media-selected");
      this.updateMediaAlignmentToolbarState();
      this.positionImageResizeToolbar();
      this.handleContentChange();
    }

    sanitizeLanguage(value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9+._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    getCodeBlockData(figure) {
      if (!figure) {
        return { language: "", filename: "", code: "" };
      }
      const codeElement = figure.querySelector("code");
      const classLanguage = codeElement
        ? Array.from(codeElement.classList).find((className) => className.startsWith("language-"))
        : "";
      const language = this.sanitizeLanguage(
        figure.getAttribute("data-language") || (classLanguage ? classLanguage.replace(/^language-/, "") : "")
      );
      const caption = figure.querySelector("figcaption");
      return {
        language,
        filename: caption ? caption.textContent || "" : "",
        code: codeElement ? codeElement.textContent || "" : "",
      };
    }

    buildCodeBlockHtml(language, code, filename) {
      const normalizedLanguage = this.sanitizeLanguage(language);
      const languageAttr = normalizedLanguage ? ` data-language="${escapeHtml(normalizedLanguage)}"` : "";
      const languageClass = normalizedLanguage ? ` class="language-${escapeHtml(normalizedLanguage)}"` : "";
      const captionHtml = filename ? `<figcaption>${escapeHtml(filename)}</figcaption>` : "";
      return `<figure class="ollow-editor-code" data-type="code"${languageAttr}>${captionHtml}<pre><code${languageClass}>${escapeHtml(code)}</code></pre></figure>`;
    }

    openCodeModal(existingFigure) {
      const current = this.getCodeBlockData(existingFigure);
      this.openModal({
        title: existingFigure ? "Edit Code Block" : "Insert Code Block",
        copy: "Add a language, paste code, and optionally label the snippet with a filename or title.",
        confirmLabel: existingFigure ? "Update Code" : "Insert Code",
        fields: [
          {
            name: "language",
            label: "Language",
            type: "text",
            placeholder: "python",
            value: current.language,
            list: ["plaintext", "bash", "css", "html", "javascript", "json", "php", "python", "ruby", "sql", "typescript"],
          },
          { name: "filename", label: "Filename or title", type: "text", placeholder: "example.py", value: current.filename },
          { name: "code", label: "Code", type: "textarea", placeholder: "print('Hello, world')", value: current.code, spellcheck: false },
        ],
        onConfirm: (values) => {
          const code = String(values.code || "");
          if (!code.trim()) {
            return "Code is required.";
          }
          if (existingFigure && this.content.contains(existingFigure)) {
            const replacement = this.updateCodeFigure(existingFigure, {
              language: values.language,
              code,
              filename: values.filename,
            });
            if (replacement) {
              this.selectMediaBlock(replacement);
            }
            this.handleContentChange();
            return null;
          }
          this.insertHTML(this.buildCodeBlockHtml(values.language, code, values.filename.trim()));
          return null;
        },
      });
    }

    handleCodeAction(action) {
      if (!this.selectedCodeFigure || !this.content.contains(this.selectedCodeFigure)) {
        this.clearMediaSelection();
        return;
      }

      if (action === "edit") {
        this.openCodeModal(this.selectedCodeFigure);
        return;
      }

      if (action === "copy") {
        const { code } = this.getCodeBlockData(this.selectedCodeFigure);
        if (!code) return;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(code).then(
            () => this.showFeedback("Code copied to clipboard."),
            () => this.showFeedback("Unable to copy code.")
          );
        } else {
          this.showFeedback("Clipboard copy is not available in this browser.");
        }
        return;
      }

      if (action === "delete") {
        const figure = this.selectedCodeFigure;
        this.clearMediaSelection();
        figure.remove();
        this.handleContentChange();
      }
    }

    startImageResize(event) {
      if (!this.selectedImageFigure || !this.imageResizeHandle) return;
      event.preventDefault();
      this.normalizeImageFigure(this.selectedImageFigure);
      this.isDraggingImageResize = true;
      this.resizePointerId = event.pointerId;
      this.imageResizeHandle.setPointerCapture(event.pointerId);
      document.addEventListener("pointermove", this.boundImageResizeMove);
      document.addEventListener("pointerup", this.boundImageResizeEnd);
      document.addEventListener("pointercancel", this.boundImageResizeEnd);
    }

    handleImageResizeMove(event) {
      if (!this.selectedImageFigure || !this.isDraggingImageResize) return;
      const contentRect = this.content.getBoundingClientRect();
      if (!contentRect.width) return;

      const targetWidth = Math.max(220, Math.min(event.clientX - contentRect.left, contentRect.width));
      const size = this.getClosestImageSize(targetWidth, contentRect.width);
      this.selectedImageFigure.classList.remove(...IMAGE_SIZE_CLASSES);
      if (size) {
        this.selectedImageFigure.classList.add(`ollow-image-${size}`);
      }
      this.selectedImageFigure.classList.add("is-selected");
      this.updateImageResizeToolbarState();
      this.positionImageResizeToolbar();
    }

    handleImageResizeEnd() {
      if (!this.isDraggingImageResize) return;
      if (this.imageResizeHandle && this.resizePointerId !== null) {
        try {
          this.imageResizeHandle.releasePointerCapture(this.resizePointerId);
        } catch (error) {
          // No-op.
        }
      }
      this.isDraggingImageResize = false;
      this.resizePointerId = null;
      document.removeEventListener("pointermove", this.boundImageResizeMove);
      document.removeEventListener("pointerup", this.boundImageResizeEnd);
      document.removeEventListener("pointercancel", this.boundImageResizeEnd);
      if (this.selectedImageFigure) {
        this.selectedImageFigure.classList.add("is-selected", "is-media-selected");
      }
      this.positionImageResizeToolbar();
      this.handleContentChange();
    }

    getClosestImageSize(width, maxWidth) {
      if (maxWidth && width >= maxWidth * 0.92) {
        return "full";
      }

      let chosen = "large";
      let smallestDistance = Number.POSITIVE_INFINITY;
      Object.entries(IMAGE_SIZE_PRESETS).forEach(([size, presetWidth]) => {
        const distance = Math.abs(width - presetWidth);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          chosen = size;
        }
      });
      return chosen;
    }

    positionTableToolbar() {
      if (!this.selectedTableFigure || !this.tableToolbar || !this.surface || !this.content.contains(this.selectedTableFigure)) {
        this.clearTableSelection();
        return;
      }

      const surfaceRect = this.surface.getBoundingClientRect();
      const tableRect = this.selectedTableFigure.getBoundingClientRect();
      this.tableToolbar.hidden = false;
      const toolbarRect = this.tableToolbar.getBoundingClientRect();
      let top = tableRect.top - surfaceRect.top - toolbarRect.height - 10;
      if (top < 10) {
        top = tableRect.bottom - surfaceRect.top + 10;
      }
      const maxLeft = Math.max(10, surfaceRect.width - toolbarRect.width - 10);
      const left = Math.min(Math.max(10, tableRect.left - surfaceRect.left), maxLeft);
      this.tableToolbar.style.top = `${Math.round(top)}px`;
      this.tableToolbar.style.left = `${Math.round(left)}px`;
    }

    focusTableCell(cell) {
      if (!cell) return;
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(cell);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      this.selectedTableCell = cell;
      this.saveSelection();
    }

    createTableRow(columnCount, useHeader) {
      const row = document.createElement("tr");
      for (let index = 0; index < columnCount; index += 1) {
        const cell = document.createElement(useHeader ? "th" : "td");
        cell.textContent = useHeader ? `Header ${index + 1}` : "Cell";
        row.appendChild(cell);
      }
      return row;
    }

    buildTableHtml(rows, columns, caption, hasHeaderRow) {
      const safeRows = Math.max(1, Math.min(20, Number(rows) || 1));
      const safeColumns = Math.max(1, Math.min(12, Number(columns) || 1));
      const totalBodyRows = hasHeaderRow ? Math.max(1, safeRows - 1) : safeRows;

      let thead = "";
      if (hasHeaderRow) {
        const headerCells = Array.from({ length: safeColumns }, (_, index) => `<th>Header ${index + 1}</th>`).join("");
        thead = `<thead><tr>${headerCells}</tr></thead>`;
      }

      const bodyRows = Array.from({ length: totalBodyRows }, () => {
        const cells = Array.from({ length: safeColumns }, () => "<td>Cell</td>").join("");
        return `<tr>${cells}</tr>`;
      }).join("");

      return `<figure class="ollow-editor-table" data-type="table"><div class="ollow-editor-table-scroll"><table>${thead}<tbody>${bodyRows}</tbody></table></div>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
    }

    openTableModal() {
      this.openModal({
        title: "Insert Table",
        copy: "Create an editable table with optional caption and header row.",
        confirmLabel: "Insert Table",
        fields: [
          { name: "rows", label: "Rows", type: "number", placeholder: "3", value: "3" },
          { name: "columns", label: "Columns", type: "number", placeholder: "4", value: "4" },
          { name: "caption", label: "Table caption", type: "text", placeholder: "Optional caption" },
          { name: "headerRow", label: "Header row", type: "checkbox", checked: true },
        ],
        onConfirm: (values) => {
          const rows = Math.max(1, Math.min(20, Number(values.rows) || 0));
          const columns = Math.max(1, Math.min(12, Number(values.columns) || 0));
          if (!rows || !columns) {
            return "Rows and columns are required.";
          }
          this.insertHTML(this.buildTableHtml(rows, columns, values.caption.trim(), Boolean(values.headerRow)));
          return null;
        },
      });
    }

    updateCodeFigure(figure, values) {
      if (!figure || !this.content.contains(figure)) return null;
      const replacement = document.createElement("div");
      replacement.innerHTML = this.buildCodeBlockHtml(values.language, values.code, values.filename.trim());
      const nextFigure = replacement.firstElementChild;
      figure.replaceWith(nextFigure);
      return nextFigure;
    }

    handleTableAction(action) {
      if (!this.selectedTableFigure || !this.selectedTableCell) return;
      const table = this.selectedTableFigure.querySelector("table");
      const currentRow = this.selectedTableCell.parentElement;
      if (!table || !currentRow) return;

      const rows = Array.from(table.querySelectorAll("tr"));
      const currentIndex = rows.indexOf(currentRow);
      const cellIndex = Array.from(currentRow.children).indexOf(this.selectedTableCell);
      if (currentIndex === -1 || cellIndex === -1) return;

      let focusCell = this.selectedTableCell;
      const currentTag = this.selectedTableCell.tagName.toLowerCase();

      switch (action) {
        case "row-above": {
          const newRow = this.createTableRow(currentRow.children.length, currentTag === "th");
          currentRow.parentElement.insertBefore(newRow, currentRow);
          focusCell = newRow.children[Math.min(cellIndex, newRow.children.length - 1)] || newRow.firstElementChild;
          break;
        }
        case "row-below": {
          const newRow = this.createTableRow(currentRow.children.length, currentTag === "th");
          currentRow.insertAdjacentElement("afterend", newRow);
          focusCell = newRow.children[Math.min(cellIndex, newRow.children.length - 1)] || newRow.firstElementChild;
          break;
        }
        case "delete-row": {
          const siblingRow = currentRow.nextElementSibling || currentRow.previousElementSibling;
          currentRow.remove();
          if (!table.querySelector("tr")) {
            this.selectedTableFigure.remove();
            this.clearTableSelection();
            this.handleContentChange();
            return;
          }
          if (table.tBodies.length && !table.tBodies[0].rows.length) {
            const fallbackRow = this.createTableRow(table.querySelector("tr").children.length, false);
            table.tBodies[0].appendChild(fallbackRow);
          }
          focusCell = siblingRow ? siblingRow.children[Math.min(cellIndex, siblingRow.children.length - 1)] : table.querySelector("td,th");
          break;
        }
        case "col-left":
        case "col-right": {
          Array.from(table.querySelectorAll("tr")).forEach((row) => {
            const sourceCell = row.children[Math.min(cellIndex, row.children.length - 1)];
            const newCell = document.createElement(sourceCell && sourceCell.tagName.toUpperCase() === "TH" ? "th" : "td");
            newCell.textContent = newCell.tagName.toUpperCase() === "TH" ? "Header" : "Cell";
            const referenceCell = row.children[cellIndex] || row.lastElementChild;
            if (!referenceCell) {
              row.appendChild(newCell);
              return;
            }
            if (action === "col-left") {
              row.insertBefore(newCell, referenceCell);
            } else {
              referenceCell.insertAdjacentElement("afterend", newCell);
            }
          });
          focusCell = currentRow.children[action === "col-left" ? cellIndex : cellIndex + 1] || currentRow.lastElementChild;
          break;
        }
        case "delete-col": {
          Array.from(table.querySelectorAll("tr")).forEach((row) => {
            if (row.children[cellIndex]) {
              row.children[cellIndex].remove();
            }
          });
          const hasCells = table.querySelector("td,th");
          if (!hasCells) {
            this.selectedTableFigure.remove();
            this.clearTableSelection();
            this.handleContentChange();
            return;
          }
          focusCell = currentRow.children[Math.min(cellIndex, currentRow.children.length - 1)] || table.querySelector("td,th");
          break;
        }
        case "delete-table": {
          const tableFigure = this.selectedTableFigure;
          this.clearTableSelection();
          tableFigure.remove();
          this.handleContentChange();
          return;
        }
        default:
          return;
      }

      if (table.tHead && !table.tHead.rows.length) {
        table.tHead.remove();
      }
      if (table.tBodies[0] && !table.tBodies[0].rows.length) {
        table.tBodies[0].remove();
      }
      if (!table.tBodies.length) {
        table.appendChild(document.createElement("tbody"));
      }

      const nextCell = focusCell || table.querySelector("td,th");
      if (nextCell) {
        this.selectTableCell(nextCell);
        this.focusTableCell(nextCell);
      }
      this.handleContentChange();
    }

    setDragState(isActive) {
      if (!this.surface) return;
      this.surface.classList.toggle("nw-editor-dragover", Boolean(isActive));
    }

    showFeedback(message) {
      if (!this.feedback) return;
      this.feedback.textContent = String(message || "");
      this.feedback.hidden = !message;
    }

    clearFeedback() {
      if (!this.feedback) return;
      this.feedback.textContent = "";
      this.feedback.hidden = true;
    }

    hasDraggedFiles(event) {
      const types = event.dataTransfer && event.dataTransfer.types;
      return Boolean(types && Array.from(types).includes("Files"));
    }

    isValidImageDrag(event) {
      const items = Array.from((event.dataTransfer && event.dataTransfer.items) || []);
      if (!items.length) {
        const files = Array.from((event.dataTransfer && event.dataTransfer.files) || []);
        return files.length > 0 && files.every((file) => this.isImageFile(file));
      }
      let hasFile = false;
      for (const item of items) {
        if (item.kind !== "file") continue;
        hasFile = true;
        if (item.type && !item.type.startsWith("image/")) {
          return false;
        }
      }
      return hasFile;
    }

    isImageFile(file) {
      return Boolean(file instanceof File && file.type && file.type.startsWith("image/"));
    }

    fileToDataURL(file) {
      return readImageFileAsDataURL(file);
    }

    async uploadImageFile(file) {
      if (typeof this.options.uploadAdapter === "function") {
        const result = await this.options.uploadAdapter(file, this);
        const url = extractUploadUrl(result);
        if (!url || !isSafeUrl(url, "IMG")) {
          throw new Error("The upload adapter must return a valid image URL.");
        }
        return url;
      }

      if (this.options.uploadUrl) {
        const formData = new FormData();
        formData.append(this.options.uploadFieldName || "image", file);

        const response = await fetch(this.options.uploadUrl, {
          method: this.options.uploadMethod || "POST",
          headers: this.options.uploadHeaders || {},
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Image upload failed.");
        }

        const payload = await response.json();
        const url = extractUploadUrl(payload);
        if (!url || !isSafeUrl(url, "IMG")) {
          throw new Error("The upload endpoint must return a valid image URL.");
        }
        return url;
      }

      return this.fileToDataURL(file);
    }

    async resolveImageSource(file) {
      if (!this.isImageFile(file)) {
        throw new Error("Only image files are supported.");
      }
      return this.uploadImageFile(file);
    }

    buildDroppedImageHtml(src) {
      return `<figure class="ollow-editor-image"><img src="${escapeHtml(src)}" alt=""><figcaption></figcaption></figure>`;
    }

    async insertDroppedImages(files) {
      const images = [];
      for (const file of files) {
        images.push(await this.resolveImageSource(file));
      }
      const html = images.map((src) => this.buildDroppedImageHtml(src)).join("");
      if (!html) return;
      this.insertHTML(html);
      this.clearFeedback();
    }

    setSelectionFromPoint(clientX, clientY) {
      let range = null;

      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(clientX, clientY);
      } else if (document.caretPositionFromPoint) {
        const position = document.caretPositionFromPoint(clientX, clientY);
        if (position) {
          range = document.createRange();
          range.setStart(position.offsetNode, position.offset);
          range.collapse(true);
        }
      }

      if (!range || !this.content.contains(range.commonAncestorContainer)) {
        return;
      }

      const selection = window.getSelection();
      if (!selection) return;
      selection.removeAllRanges();
      selection.addRange(range);
      this.savedSelection = range.cloneRange();
    }

    insertPullQuote() {
      const selection = window.getSelection();
      const selectedText = selection && selection.toString().trim();
      const quoteText = selectedText || "Pull quote";
      this.insertHTML(
        `<blockquote class="nw-pull-quote" data-type="pull-quote"><p>${escapeHtml(quoteText)}</p><cite>Pull Quote</cite></blockquote>`
      );
    }

    insertFactBox() {
      this.insertHTML(
        '<div class="nw-fact-box" data-type="fact-box"><span class="nw-block-label">Fact Box</span><p>Key context, verification point, or newsroom note.</p></div>'
      );
    }

    openLinkModal() {
      const selection = window.getSelection();
      const selectedText = selection && selection.toString().trim();
      this.openModal({
        title: "Insert Link",
        copy: "Add a safe URL and optional replacement text.",
        confirmLabel: "Apply Link",
        fields: [
          { name: "url", label: "URL", type: "url", placeholder: "https://example.com" },
          { name: "text", label: "Link text", type: "text", placeholder: selectedText || "Link text", value: selectedText },
        ],
        onConfirm: (values) => {
          if (!isSafeUrl(values.url, "A")) {
            return "Enter a valid URL.";
          }
          this.restoreSelection();
          const safeText = values.text.trim() || values.url.trim();
          if (window.getSelection() && window.getSelection().toString().trim()) {
            document.execCommand("createLink", false, values.url.trim());
            const selectionAnchor = getSelectionAncestor(this.content);
            const anchor = selectionAnchor && selectionAnchor.nodeType === Node.ELEMENT_NODE
              ? selectionAnchor.closest("a")
              : selectionAnchor && selectionAnchor.parentNode && selectionAnchor.parentNode.closest
                ? selectionAnchor.parentNode.closest("a")
                : null;
            if (anchor) {
              anchor.textContent = safeText;
              anchor.setAttribute("target", "_blank");
              anchor.setAttribute("rel", "noopener noreferrer");
            }
            this.handleContentChange();
            return null;
          }
          this.insertHTML(
            `<a href="${escapeHtml(values.url.trim())}" target="_blank" rel="noopener noreferrer">${escapeHtml(safeText)}</a>`
          );
          return null;
        },
      });
    }

    openImageModal() {
      this.openModal({
        title: "Insert Image",
        copy: "Upload an image or use an external image URL.",
        confirmLabel: "Insert Image",
        fields: [
          { name: "file", label: "Upload image", type: "file", accept: "image/*" },
          { name: "url", label: "Image URL", type: "url", placeholder: "https://example.com/image.jpg" },
          { name: "alt", label: "Alt text", type: "text", placeholder: "Describe the image" },
          { name: "caption", label: "Caption", type: "textarea", placeholder: "Photo caption" },
        ],
        onConfirm: async (values) => {
          const alt = values.alt.trim();
          const caption = values.caption.trim();
          let src = "";

          if (values.file) {
            src = await this.resolveImageSource(values.file);
          } else if (values.url.trim()) {
            if (!isSafeUrl(values.url, "IMG")) {
              return "Enter a valid image URL.";
            }
            src = values.url.trim();
          } else {
            return "Choose an image file or enter an image URL.";
          }

          this.insertHTML(
            `<figure class="ollow-editor-image" data-type="image"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`
          );
          return null;
        },
      });
    }

    openGalleryModal() {
      this.openModal({
        title: "Insert Gallery",
        copy: "Upload multiple images to build a gallery block.",
        confirmLabel: "Insert Gallery",
        fields: [
          { name: "title", label: "Gallery title", type: "text", placeholder: "Gallery title" },
          { name: "files", label: "Gallery images", type: "file", accept: "image/*", multiple: true },
          { name: "caption", label: "Gallery note", type: "textarea", placeholder: "Optional note or caption" },
        ],
        onConfirm: async (values) => {
          if (!values.files.length) {
            return "Select at least one image.";
          }

          const title = values.title.trim() || "Gallery";
          const note = values.caption.trim();
          const images = [];
          for (const file of values.files) {
            images.push(await this.resolveImageSource(file));
          }
          this.insertHTML(
            `<section class="ollow-media ollow-gallery" data-type="gallery"><div class="ollow-gallery-header"><h3>${escapeHtml(title)}</h3>${note ? `<p>${escapeHtml(note)}</p>` : ""}</div><div class="ollow-gallery-grid">${images.map((src, index) => `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(`${title} image ${index + 1}`)}"></figure>`).join("")}</div></section>`
          );
          return null;
        },
      });
    }

    openEmbedModal() {
      this.openModal({
        title: "Insert Embed",
        copy: "Paste a YouTube URL to render a responsive video embed.",
        confirmLabel: "Insert Embed",
        fields: [
          { name: "url", label: "Embed URL", type: "textarea", placeholder: "https://youtube.com/watch?v=..." },
          { name: "caption", label: "Caption", type: "text", placeholder: "Embed caption" },
        ],
        onConfirm: (values) => {
          if (!values.url.trim()) {
            return "Embed URL is required.";
          }
          const url = values.url.trim();
          const caption = values.caption.trim();
          const embedUrl = getYouTubeEmbedUrl(url);

          if (embedUrl) {
            this.insertHTML(
              `<figure class="ollow-media ollow-embed" data-type="embed"><div class="ollow-video-wrapper"><iframe src="${escapeHtml(embedUrl)}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`
            );
            return null;
          }

          if (!isSafeUrl(url, "A")) {
            return "Enter a valid YouTube URL or supported external link.";
          }

          this.insertHTML(
            `<div class="nw-inline-preview nw-embed" data-type="embed"><span class="nw-block-label">External Embed</span><p class="nw-block-title">Unsupported embed source</p><p class="nw-block-meta">${caption ? escapeHtml(caption) : "Only YouTube embeds are rendered in this demo."}</p><p><a class="nw-prompt-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open link</a></p></div>`
          );
          return null;
        },
      });
    }

    openRelatedModal() {
      this.openModal({
        title: "Insert Related Story",
        copy: "Create a related story placeholder with headline and link.",
        confirmLabel: "Insert Related",
        fields: [
          { name: "headline", label: "Headline", type: "text", placeholder: "Related story headline" },
          { name: "url", label: "Story URL", type: "url", placeholder: "/news/story-slug/" },
          { name: "meta", label: "Category / status", type: "text", placeholder: "Politics • Published" },
        ],
        onConfirm: (values) => {
          if (!values.headline.trim()) {
            return "Headline is required.";
          }
          const url = values.url.trim();
          if (url && !isSafeUrl(url, "A")) {
            return "Enter a valid related story URL.";
          }
          this.insertHTML(
            `<div class="nw-related-card nw-related-story" data-type="related"><div class="nw-related-copy"><span class="nw-block-label">Related Story</span><p class="nw-block-title">${escapeHtml(values.headline.trim())}</p><p>${escapeHtml(values.meta.trim() || "Related coverage")}</p></div>${url ? `<a class="nw-prompt-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open</a>` : `<span class="nw-prompt-link">Linked</span>`}</div>`
          );
          return null;
        },
      });
    }

    openAttachmentModal() {
      this.openModal({
        title: "Insert Attachment",
        copy: "Add an attachment placeholder with title, URL, type, and visibility.",
        confirmLabel: "Insert Attachment",
        fields: [
          { name: "title", label: "Attachment title", type: "text", placeholder: "Attachment title" },
          { name: "url", label: "Attachment URL", type: "url", placeholder: "https://example.com/report.pdf" },
          { name: "type", label: "Attachment type", type: "text", placeholder: "PDF / Report / Document" },
          { name: "visibility", label: "Visibility", type: "text", placeholder: "Public / Private", value: "Public" },
        ],
        onConfirm: (values) => {
          if (!values.title.trim()) {
            return "Attachment title is required.";
          }
          const url = values.url.trim();
          if (url && !isSafeUrl(url, "A")) {
            return "Enter a valid attachment URL.";
          }
          this.insertHTML(
            `<div class="nw-inline-preview nw-attachment" data-type="attachment"><span class="nw-block-label">Attachment</span><p class="nw-block-title">${escapeHtml(values.title.trim())}</p><p class="nw-block-meta">${escapeHtml((values.type.trim() || "Document") + " • " + (values.visibility.trim() || "Public"))}</p>${url ? `<p><a class="nw-prompt-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open file</a></p>` : ""}</div>`
          );
          return null;
        },
      });
    }

    openModal(config) {
      this.saveSelection();
      this.modalTitle.textContent = config.title;
      this.modalCopy.textContent = config.copy || "";
      this.modalConfirm.textContent = config.confirmLabel || "Insert";
      this.modalBody.innerHTML = "";

      const fieldRefs = {};
      (config.fields || []).forEach((field) => {
        const wrapper = document.createElement("div");
        wrapper.className = "nw-modal-field";
        const label = document.createElement("label");
        label.textContent = field.label;
        label.setAttribute("for", `${this.id}-${field.name}`);

        let input;
        if (field.type === "textarea") {
          input = document.createElement("textarea");
          input.className = "nw-modal-textarea";
        } else if (field.type === "select") {
          input = document.createElement("select");
          input.className = "nw-modal-input";
          (field.options || []).forEach((option) => {
            const optionElement = document.createElement("option");
            if (typeof option === "string") {
              optionElement.value = option;
              optionElement.textContent = option;
            } else {
              optionElement.value = option.value;
              optionElement.textContent = option.label;
            }
            input.appendChild(optionElement);
          });
        } else {
          input = document.createElement("input");
          input.className = field.type === "checkbox" ? "nw-modal-checkbox" : "nw-modal-input";
          input.type = field.type || "text";
        }
        input.id = `${this.id}-${field.name}`;
        input.name = field.name;
        input.placeholder = field.placeholder || "";
        if (field.accept) {
          input.setAttribute("accept", field.accept);
        }
        if (field.multiple) {
          input.multiple = true;
        }
        if (field.type === "checkbox") {
          input.checked = Boolean(field.checked);
        } else if (field.type !== "file") {
          input.value = field.value || "";
        }
        if (field.list && input.tagName === "INPUT") {
          const listId = `${this.id}-${field.name}-list`;
          input.setAttribute("list", listId);
          const datalist = document.createElement("datalist");
          datalist.id = listId;
          field.list.forEach((item) => {
            const option = document.createElement("option");
            option.value = item;
            datalist.appendChild(option);
          });
          wrapper.appendChild(datalist);
        }
        if (field.spellcheck === false) {
          input.spellcheck = false;
        }
        wrapper.appendChild(label);
        wrapper.appendChild(input);
        this.modalBody.appendChild(wrapper);
        fieldRefs[field.name] = input;
      });
      this.modalFieldRefs = fieldRefs;

      this.modalError = document.createElement("div");
      this.modalError.className = "nw-modal-error";
      this.modalBody.appendChild(this.modalError);

      this.modalConfirm.onclick = async () => {
        this.modalError.textContent = "";
        this.modalConfirm.disabled = true;
        try {
          const values = Object.fromEntries(
            Object.entries(fieldRefs).map(([key, input]) => {
              if (input.type === "file") {
                return [key, input.multiple ? Array.from(input.files || []) : (input.files && input.files[0]) || null];
              }
              if (input.type === "checkbox") {
                return [key, Boolean(input.checked)];
              }
              return [key, input.value || ""];
            })
          );
          const error = config.onConfirm ? await config.onConfirm(values, fieldRefs) : null;
          if (error) {
            this.modalError.textContent = error;
            return;
          }
          resetModalForm(fieldRefs);
          this.closeModal({ restoreSelection: false, focusEditor: true });
        } catch (error) {
          this.modalError.textContent = error && error.message ? error.message : "Unable to insert media.";
        } finally {
          this.modalConfirm.disabled = false;
        }
      };

      this.modal.hidden = false;
      const firstField = Object.values(fieldRefs)[0];
      if (firstField) {
        window.setTimeout(() => firstField.focus(), 0);
      }
    }

    closeModal(options) {
      if (!this.modal) return;
      const config = Object.assign({ restoreSelection: true, focusEditor: true, reset: true }, options || {});
      if (config.reset) {
        resetModalForm(this.modalFieldRefs);
      }
      this.modal.hidden = true;
      this.modalBody.innerHTML = "";
      this.modalConfirm.onclick = null;
      this.modalFieldRefs = {};
      if (config.focusEditor) {
        this.focus();
      }
      if (config.restoreSelection) {
        this.restoreSelection();
      }
    }

    saveSelection() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (!this.content.contains(range.commonAncestorContainer)) return;
      this.savedSelection = range.cloneRange();
    }

    restoreSelection() {
      if (!this.savedSelection) return;
      const selection = window.getSelection();
      if (!selection) return;
      selection.removeAllRanges();
      selection.addRange(this.savedSelection);
    }

    updateToolbarState() {
      const inside = selectionInside(this.content);
      const hasEditorContext = inside || this.isFocused || Boolean(this.selectedMediaBlock);
      const states = {
        bold: inside && safeQueryState("bold"),
        italic: inside && safeQueryState("italic"),
        underline: inside && safeQueryState("underline"),
        "bulleted-list": inside && safeQueryState("insertUnorderedList"),
        "numbered-list": inside && safeQueryState("insertOrderedList"),
        link: false,
        quote: false,
        h2: false,
        h3: false,
        h4: false,
      };

      const ancestor = getSelectionAncestor(this.content);
      const block = ancestor ? closestBlock(ancestor, this.content) : null;
      const blockTag = block ? block.tagName.toUpperCase() : "P";
      states.quote = blockTag === "BLOCKQUOTE";
      states.h2 = blockTag === "H2";
      states.h3 = blockTag === "H3";
      states.h4 = blockTag === "H4";

      let current = ancestor && ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;
      while (current && current !== this.content) {
        if (current.nodeType === Node.ELEMENT_NODE && current.tagName.toUpperCase() === "A") {
          states.link = true;
          break;
        }
        current = current.parentNode;
      }

      ["bold", "italic", "underline", "link", "quote", "bulleted-list", "numbered-list", "h2", "h3", "h4"].forEach((key) => {
        const button = this.toolbarButtons[key];
        if (button) {
          button.classList.toggle("is-active", Boolean(states[key]));
        }
      });

      const activeAlignment = this.selectedMediaBlock
        ? this.getSelectedMediaAlignment()
        : this.getSelectedTextAlignment();
      ["align-left", "align-center", "align-right", "align-justify"].forEach((key) => {
        const button = this.toolbarButtons[key];
        if (!button) return;
        const value = key.replace("align-", "");
        const isJustify = value === "justify";
        button.disabled = !hasEditorContext || (Boolean(this.selectedMediaBlock) && isJustify);
        button.classList.toggle("is-active", activeAlignment === value);
      });

      if (this.headingSelect) {
        this.headingSelect.value = ["H2", "H3", "H4"].includes(blockTag) ? blockTag : "P";
      }
    }

    updateMetrics() {
      const text = (this.content.textContent || "").trim().replace(/\s+/g, " ");
      const words = text ? text.split(" ").length : 0;
      const minutes = Math.max(1, Math.ceil(words / DEFAULT_READ_SPEED));
      this.statusWordCount.textContent = String(words);
      this.statusReadTime.textContent = `${words ? minutes : 0} min`;
    }

    updateStatus() {
      this.statusActive.textContent = this.isFocused ? "Story body active" : "Story body inactive";
      this.statusDot.classList.toggle("is-dirty", this.isDirty);
      if (this.isDirty) {
        this.statusSave.textContent = "Unsaved changes";
      } else if (this.lastSavedAt) {
        this.statusSave.textContent = `Autosaved at ${this.lastSavedAt}`;
      } else {
        this.statusSave.textContent = "Saved";
      }
    }

    scheduleAutosave() {
      window.clearTimeout(this.autosaveTimer);
      this.autosaveTimer = window.setTimeout(() => {
        this.sync({ autosave: true });
      }, this.options.autosaveDelay);
    }

    getHTML() {
      const clone = this.content.cloneNode(true);
      Array.from(clone.querySelectorAll("*")).forEach((element) => {
        element.classList.remove(...TEMP_SELECTION_CLASSES);
      });
      return sanitizeFragment(clone.innerHTML);
    }

    setHTML(html, options) {
      const config = options || {};
      const source = String(html || "").trim();
      const clean = source ? sanitizeFragment(source) : "";
      this.content.innerHTML = clean;
      this.clearMediaSelection();
      this.clearTableSelection();
      this.isDirty = false;
      if (!config.skipSync) {
        this.sync({ autosave: false, silent: Boolean(config.silent) });
      }
      this.updateMetrics();
      this.updateStatus();
      this.updateToolbarState();
    }

    clear() {
      this.setHTML("");
      this.focus();
    }

    focus() {
      this.content.focus();
      if (!selectionInside(this.content)) {
        const range = document.createRange();
        range.selectNodeContents(this.content);
        range.collapse(false);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }

    sync(options) {
      const config = options || {};
      this.textarea.value = this.getHTML();
      if (!config.preserveDirty) {
        this.isDirty = false;
      }
      if (config.autosave) {
        this.lastSavedAt = new Intl.DateTimeFormat([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date());
        this.dispatch("nationwire-editor:autosave");
      }
      this.updateStatus();
      if (!config.silent) {
        this.dispatch("nationwire-editor:sync");
      }
      return this.textarea.value;
    }

    dispatch(name) {
      this.textarea.dispatchEvent(
        new CustomEvent(name, {
          bubbles: true,
          detail: {
            editor: this,
            html: this.textarea.value,
            textarea: this.textarea,
          },
        })
      );
    }

    destroy() {
      window.clearTimeout(this.autosaveTimer);
      document.removeEventListener("selectionchange", this.boundSelectionChange);
      document.removeEventListener("pointerdown", this.boundDocumentPointerDown);
      window.removeEventListener("resize", this.boundRepositionImageToolbar);
      window.removeEventListener("scroll", this.boundRepositionImageToolbar, true);
      window.removeEventListener("resize", this.boundRepositionTableToolbar);
      window.removeEventListener("scroll", this.boundRepositionTableToolbar, true);
      document.removeEventListener("pointermove", this.boundImageResizeMove);
      document.removeEventListener("pointerup", this.boundImageResizeEnd);
      document.removeEventListener("pointercancel", this.boundImageResizeEnd);
      if (this.textarea.form && this.textarea.form.dataset.nwEditorSubmitBound) {
        const binding = formBindings.get(this.textarea.form);
        if (binding) {
          binding.editors.delete(this);
          if (!binding.editors.size) {
            this.textarea.form.removeEventListener("submit", binding.listener);
            delete this.textarea.form.dataset.nwEditorSubmitBound;
            formBindings.delete(this.textarea.form);
          }
        }
      }
      if (this.wrapper) {
        this.wrapper.remove();
      }
      this.showSource();
      instances.delete(this.textarea);
    }
  }

  function normalizeOptions(textarea, options) {
    const config = Object.assign({}, options || {});
    config.placeholder = config.placeholder || textarea.getAttribute("placeholder") || textarea.dataset.placeholder || DEFAULT_PLACEHOLDER;
    config.autosaveDelay = Number(config.autosaveDelay || textarea.dataset.autosaveDelay || DEFAULT_AUTOSAVE_DELAY) || DEFAULT_AUTOSAVE_DELAY;
    return config;
  }

  const api = {
    initAll(root, options) {
      const scope = root || document;
      return Array.from(scope.querySelectorAll(DEFAULT_SELECTOR)).map((textarea) => api.init(textarea, options));
    },

    init(target, options) {
      const textarea = typeof target === "string" ? document.querySelector(target) : target;
      if (!textarea || textarea.tagName.toUpperCase() !== "TEXTAREA") {
        return null;
      }
      if (instances.has(textarea)) {
        return instances.get(textarea);
      }
      const instance = new EditorInstance(textarea, normalizeOptions(textarea, options));
      instances.set(textarea, instance);
      return instance.init();
    },

    get(target) {
      const textarea = typeof target === "string" ? document.querySelector(target) : target;
      return textarea ? instances.get(textarea) || null : null;
    },

    instances() {
      return Array.from(instances.values());
    },
  };

  window.NationWireEditor = api;
})();
