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
    "SECTION",
    "SPAN",
    "STRONG",
    "U",
    "UL",
  ]);
  const CLASS_ALLOWLIST = new Set([
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
    "ollow-gallery",
    "ollow-gallery-grid",
    "ollow-gallery-header",
    "ollow-image",
    "ollow-media",
    "ollow-video-wrapper",
  ]);
  const DIV_DATA_TYPES = new Set(["attachment", "embed", "fact-box", "gallery", "related"]);
  const FIGURE_DATA_TYPES = new Set(["embed", "image"]);
  const BLOCKQUOTE_DATA_TYPES = new Set(["pull-quote"]);
  const SECTION_DATA_TYPES = new Set(["gallery"]);
  const URL_ATTRS = new Set(["href", "src"]);
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
            .filter((className) => CLASS_ALLOWLIST.has(className));
          if (classes.length) {
            clean.setAttribute("class", classes.join(" "));
          }
          return;
        }

        if (name === "data-type") {
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
      if (["P", "H2", "H3", "H4", "UL", "OL", "BLOCKQUOTE", "FIGURE", "DIV", "SECTION", "HR"].includes(tagName)) {
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
          if (["P", "H2", "H3", "H4", "BLOCKQUOTE", "UL", "OL", "FIGURE", "DIV", "SECTION"].includes(tagName)) {
            return current;
          }
        }
      current = current.parentNode;
    }
    return null;
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
      this.content = null;
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
      this.isDirty = false;
      this.isFocused = false;
      this.boundSelectionChange = this.handleSelectionChange.bind(this);
      this.boundModalClose = this.closeModal.bind(this);
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

      this.content = document.createElement("div");
      this.content.className = "nw-editor-content";
      this.content.contentEditable = "true";
      this.content.spellcheck = true;
      this.content.dataset.placeholder = this.options.placeholder;
      this.content.setAttribute("role", "textbox");
      this.content.setAttribute("aria-multiline", "true");

      surface.appendChild(this.content);

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

      row.appendChild(groupUndo);
      row.appendChild(this.makeDivider());
      row.appendChild(this.headingSelect);
      row.appendChild(groupText);
      row.appendChild(this.makeDivider());
      row.appendChild(groupInline);
      row.appendChild(this.makeDivider());
      row.appendChild(groupBlocks);
      return row;
    }

    buildToolbarInsert() {
      const row = document.createElement("div");
      row.className = "nw-insert-row";

      const insertItems = [
        ["pull-quote", "Pull Quote", "format_quote"],
        ["image", "Image", "image"],
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

      this.content.addEventListener("drop", (event) => {
        event.preventDefault();
      });

      this.content.addEventListener("keyup", () => {
        this.updateToolbarState();
      });

      this.content.addEventListener("mouseup", () => {
        this.updateToolbarState();
      });

      document.addEventListener("selectionchange", this.boundSelectionChange);

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
      if (this.isFocused || selectionInside(this.content)) {
        this.saveSelection();
        this.updateToolbarState();
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
            src = await readImageFileAsDataURL(values.file);
          } else if (values.url.trim()) {
            if (!isSafeUrl(values.url, "IMG")) {
              return "Enter a valid image URL.";
            }
            src = values.url.trim();
          } else {
            return "Choose an image file or enter an image URL.";
          }

          this.insertHTML(
            `<figure class="ollow-media ollow-image" data-type="image"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`
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
          const images = await readMultipleFilesAsDataURLs(values.files);
          this.insertHTML(
            `<section class="ollow-media ollow-gallery" data-type="gallery"><div class="ollow-gallery-header"><span class="nw-block-label">GALLERY</span><h3>${escapeHtml(title)}</h3>${note ? `<p>${escapeHtml(note)}</p>` : ""}</div><div class="ollow-gallery-grid">${images.map((src, index) => `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(`${title} image ${index + 1}`)}"></figure>`).join("")}</div></section>`
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
        } else {
          input = document.createElement("input");
          input.className = "nw-modal-input";
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
        if (field.type !== "file") {
          input.value = field.value || "";
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
      return sanitizeFragment(this.content.innerHTML);
    }

    setHTML(html, options) {
      const config = options || {};
      const source = String(html || "").trim();
      const clean = source ? sanitizeFragment(source) : "";
      this.content.innerHTML = clean;
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
