(function () {
  const DEFAULT_SELECTOR = 'textarea[data-nw-editor], textarea[data-ollow-editor]';
  const DEFAULT_AUTOSAVE_DELAY = 1500;
  const DEFAULT_PLACEHOLDER = "Start writing your story here…";
  const DEFAULT_READ_SPEED = 220;
  const DEFAULT_THEME_STORAGE_KEY = "ollow-editor-theme";
  const FONT_RECENTS_STORAGE_KEY = "ollow-editor-recent-fonts";
  const TEXT_COLOR_RECENTS_STORAGE_KEY = "ollow-editor-recent-colors";
  const SPECIAL_CHAR_RECENTS_STORAGE_KEY = "ollow-recent-special-chars";
  const EMOJI_RECENTS_STORAGE_KEY = "ollow-recent-emojis";
  const FIND_REPLACE_HIGHLIGHT_CLASS = "ollow-find-highlight";
  const FIND_REPLACE_CURRENT_CLASS = "ollow-find-highlight-current";
  const DEFAULT_FONT_FAMILY_KEY = "arial";
  const DEFAULT_FONT_SIZE = 16;
  const DEFAULT_TEXT_COLOR = "#111827";
  const DEFAULT_HIGHLIGHT_COLOR = "#fde68a";
  const FONT_FAMILIES = [
    { key: "arial", label: "Arial", stack: 'Arial, "Helvetica Neue", Helvetica, sans-serif' },
    { key: "times-new-roman", label: "Times New Roman", stack: '"Times New Roman", Times, serif' },
    { key: "georgia", label: "Georgia", stack: 'Georgia, "Times New Roman", serif' },
    { key: "verdana", label: "Verdana", stack: 'Verdana, Geneva, sans-serif' },
    { key: "tahoma", label: "Tahoma", stack: 'Tahoma, Geneva, sans-serif' },
    { key: "trebuchet-ms", label: "Trebuchet MS", stack: '"Trebuchet MS", Helvetica, sans-serif' },
    { key: "courier-new", label: "Courier New", stack: '"Courier New", Courier, monospace' },
    { key: "roboto", label: "Roboto", stack: 'Roboto, "Helvetica Neue", Arial, sans-serif' },
    { key: "merriweather", label: "Merriweather", stack: 'Merriweather, Georgia, serif' },
    { key: "playfair-display", label: "Playfair Display", stack: '"Playfair Display", Georgia, serif' },
    { key: "lora", label: "Lora", stack: 'Lora, Georgia, serif' },
    { key: "montserrat", label: "Montserrat", stack: 'Montserrat, Arial, sans-serif' },
    { key: "nunito", label: "Nunito", stack: 'Nunito, Arial, sans-serif' },
    { key: "oswald", label: "Oswald", stack: 'Oswald, Arial, sans-serif' },
    { key: "roboto-mono", label: "Roboto Mono", stack: '"Roboto Mono", "Courier New", monospace' },
    { key: "eb-garamond", label: "EB Garamond", stack: '"EB Garamond", Georgia, serif' },
    { key: "spectral", label: "Spectral", stack: 'Spectral, Georgia, serif' },
  ];
  const DEFAULT_RECENT_FONT_KEYS = ["arial", "times-new-roman", "georgia", "verdana", "roboto"];
  const FONT_SIZE_PRESETS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 60, 72, 96];
  const TEXT_COLOR_PRESETS = [
    { key: "black", label: "Black", hex: "#000000", section: "standard" },
    { key: "gray", label: "Gray", hex: "#6b7280", section: "standard" },
    { key: "red", label: "Red", hex: "#dc2626", section: "standard" },
    { key: "orange", label: "Orange", hex: "#ea580c", section: "standard" },
    { key: "yellow", label: "Yellow", hex: "#ca8a04", section: "standard" },
    { key: "green", label: "Green", hex: "#16a34a", section: "standard" },
    { key: "blue", label: "Blue", hex: "#2563eb", section: "standard" },
    { key: "purple", label: "Purple", hex: "#7c3aed", section: "standard" },
    { key: "white", label: "White", hex: "#ffffff", section: "standard" },
    { key: "111827", label: "#111827", hex: "#111827", section: "newsroom" },
    { key: "374151", label: "#374151", hex: "#374151", section: "newsroom" },
    { key: "dc2626", label: "#dc2626", hex: "#dc2626", section: "newsroom" },
    { key: "ea580c", label: "#ea580c", hex: "#ea580c", section: "newsroom" },
    { key: "ca8a04", label: "#ca8a04", hex: "#ca8a04", section: "newsroom" },
    { key: "16a34a", label: "#16a34a", hex: "#16a34a", section: "newsroom" },
    { key: "2563eb", label: "#2563eb", hex: "#2563eb", section: "newsroom" },
    { key: "7c3aed", label: "#7c3aed", hex: "#7c3aed", section: "newsroom" },
  ];
  const HIGHLIGHT_COLOR_PRESETS = [
    { key: "yellow", label: "Yellow", hex: "#fde68a" },
    { key: "green", label: "Green", hex: "#bbf7d0" },
    { key: "cyan", label: "Cyan", hex: "#bfdbfe" },
    { key: "pink", label: "Pink", hex: "#fbcfe8" },
    { key: "red", label: "Red", hex: "#fecaca" },
    { key: "orange", label: "Orange", hex: "#fed7aa" },
    { key: "purple", label: "Purple", hex: "#ddd6fe" },
    { key: "gray", label: "Gray", hex: "#e5e7eb" },
    { key: "soft-yellow", label: "Soft Yellow", hex: "#fef3c7" },
  ];
  const SPECIAL_CHARACTER_CATEGORIES = [
    {
      key: "punctuation",
      label: "Punctuation",
      chars: [
        { char: "—", label: "Em dash" },
        { char: "–", label: "En dash" },
        { char: "‘", label: "Left single quote" },
        { char: "’", label: "Right single quote" },
        { char: "“", label: "Left double quote" },
        { char: "”", label: "Right double quote" },
        { char: "…", label: "Ellipsis" },
        { char: "•", label: "Bullet" },
        { char: "·", label: "Middle dot" },
      ],
    },
    {
      key: "currency",
      label: "Currency",
      chars: [
        { char: "$", label: "Dollar" },
        { char: "€", label: "Euro" },
        { char: "£", label: "Pound sterling" },
        { char: "¥", label: "Yen" },
        { char: "₹", label: "Indian rupee" },
        { char: "৳", label: "Bangladeshi taka" },
      ],
    },
    {
      key: "math",
      label: "Math",
      chars: [
        { char: "±", label: "Plus minus" },
        { char: "×", label: "Multiplication" },
        { char: "÷", label: "Division" },
        { char: "≠", label: "Not equal" },
        { char: "≈", label: "Approximately equal" },
        { char: "≤", label: "Less than or equal" },
        { char: "≥", label: "Greater than or equal" },
        { char: "∞", label: "Infinity" },
        { char: "√", label: "Square root" },
        { char: "∑", label: "Summation" },
        { char: "π", label: "Pi" },
      ],
    },
    {
      key: "arrows",
      label: "Arrows",
      chars: [
        { char: "←", label: "Left arrow" },
        { char: "→", label: "Right arrow" },
        { char: "↑", label: "Up arrow" },
        { char: "↓", label: "Down arrow" },
        { char: "↔", label: "Left right arrow" },
        { char: "⇒", label: "Right double arrow" },
        { char: "⇐", label: "Left double arrow" },
      ],
    },
    {
      key: "legal-editorial",
      label: "Legal / Editorial",
      chars: [
        { char: "©", label: "Copyright" },
        { char: "®", label: "Registered trademark" },
        { char: "™", label: "Trademark" },
        { char: "§", label: "Section sign" },
        { char: "¶", label: "Paragraph sign" },
        { char: "†", label: "Dagger" },
        { char: "‡", label: "Double dagger" },
      ],
    },
    {
      key: "fractions",
      label: "Fractions",
      chars: [
        { char: "½", label: "One half" },
        { char: "⅓", label: "One third" },
        { char: "⅔", label: "Two thirds" },
        { char: "¼", label: "One quarter" },
        { char: "¾", label: "Three quarters" },
      ],
    },
    {
      key: "newsroom",
      label: "Newsroom",
      chars: [
        { char: "★", label: "Star filled" },
        { char: "☆", label: "Star outline" },
        { char: "✓", label: "Check mark" },
        { char: "✔", label: "Heavy check mark" },
        { char: "✕", label: "Multiplication x" },
        { char: "✖", label: "Heavy multiplication x" },
        { char: "⚠", label: "Warning" },
      ],
    },
  ];
  const SPECIAL_CHARACTER_LOOKUP = new Map(
    SPECIAL_CHARACTER_CATEGORIES.flatMap((category) => category.chars.map((item) => [item.char, Object.assign({ category: category.key, categoryLabel: category.label }, item)]))
  );
  const EMOJI_CATEGORIES = [
    {
      key: "smileys",
      label: "Smileys",
      emojis: [
        { emoji: "😀", label: "Grinning face" },
        { emoji: "😃", label: "Smiling face with open mouth" },
        { emoji: "😄", label: "Smiling face with open mouth and smiling eyes" },
        { emoji: "😁", label: "Beaming face with smiling eyes" },
        { emoji: "😆", label: "Grinning squinting face" },
        { emoji: "😂", label: "Face with tears of joy" },
        { emoji: "🙂", label: "Slightly smiling face" },
        { emoji: "😉", label: "Winking face" },
        { emoji: "😊", label: "Smiling face with smiling eyes" },
        { emoji: "😍", label: "Smiling face with heart eyes" },
        { emoji: "😎", label: "Smiling face with sunglasses" },
        { emoji: "🤔", label: "Thinking face" },
        { emoji: "😐", label: "Neutral face" },
        { emoji: "😢", label: "Crying face" },
        { emoji: "😡", label: "Pouting face" },
      ],
    },
    {
      key: "gestures",
      label: "Gestures",
      emojis: [
        { emoji: "👍", label: "Thumbs up" },
        { emoji: "👎", label: "Thumbs down" },
        { emoji: "👏", label: "Clapping hands" },
        { emoji: "🙌", label: "Raising hands" },
        { emoji: "🙏", label: "Folded hands" },
        { emoji: "💪", label: "Flexed biceps" },
        { emoji: "👋", label: "Waving hand" },
        { emoji: "✌️", label: "Victory hand" },
      ],
    },
    {
      key: "objects",
      label: "Objects",
      emojis: [
        { emoji: "📌", label: "Pushpin" },
        { emoji: "📍", label: "Round pushpin" },
        { emoji: "📝", label: "Memo" },
        { emoji: "📷", label: "Camera" },
        { emoji: "🎥", label: "Movie camera" },
        { emoji: "💡", label: "Light bulb" },
        { emoji: "🔥", label: "Fire" },
        { emoji: "⭐", label: "Star" },
        { emoji: "✅", label: "Check mark button" },
        { emoji: "❌", label: "Cross mark" },
        { emoji: "⚠️", label: "Warning" },
      ],
    },
    {
      key: "news-editorial",
      label: "News / Editorial",
      emojis: [
        { emoji: "📰", label: "Newspaper" },
        { emoji: "📢", label: "Loudspeaker" },
        { emoji: "📣", label: "Megaphone" },
        { emoji: "🗞️", label: "Rolled up newspaper" },
        { emoji: "🔎", label: "Magnifying glass tilted right" },
        { emoji: "📊", label: "Bar chart" },
        { emoji: "📈", label: "Chart increasing" },
        { emoji: "📉", label: "Chart decreasing" },
      ],
    },
    {
      key: "nature-weather",
      label: "Nature / Weather",
      emojis: [
        { emoji: "☀️", label: "Sun" },
        { emoji: "🌧️", label: "Cloud with rain" },
        { emoji: "⛈️", label: "Cloud with lightning and rain" },
        { emoji: "🌊", label: "Water wave" },
        { emoji: "🌍", label: "Globe showing Europe Africa" },
        { emoji: "🌱", label: "Seedling" },
      ],
    },
    {
      key: "flags",
      label: "Flags",
      emojis: [
        { emoji: "🇧🇩", label: "Flag Bangladesh" },
        { emoji: "🇺🇸", label: "Flag United States" },
        { emoji: "🇬🇧", label: "Flag United Kingdom" },
        { emoji: "🇵🇰", label: "Flag Pakistan" },
        { emoji: "🇪🇺", label: "Flag European Union" },
        { emoji: "🇹🇷", label: "Flag Türkiye" },
      ],
    },
  ];
  const EMOJI_LOOKUP = new Map(
    EMOJI_CATEGORIES.flatMap((category) => category.emojis.map((item) => [item.emoji, Object.assign({ category: category.key, categoryLabel: category.label }, item)]))
  );
  const FONT_FAMILY_LOOKUP = new Map(FONT_FAMILIES.map((font) => [font.key, font]));
  const TEXT_COLOR_LOOKUP = new Map(TEXT_COLOR_PRESETS.map((color) => [color.key, color]));
  const TEXT_COLOR_BY_HEX = new Map(TEXT_COLOR_PRESETS.map((color) => [color.hex, color]));
  const HIGHLIGHT_COLOR_LOOKUP = new Map(HIGHLIGHT_COLOR_PRESETS.map((color) => [color.key, color]));
  const HIGHLIGHT_COLOR_BY_HEX = new Map(HIGHLIGHT_COLOR_PRESETS.map((color) => [color.hex, color]));
  const FONT_CLASS_PREFIX = "ollow-font-";
  const FONT_SIZE_CLASS_PREFIX = "ollow-font-size-";
  const TEXT_COLOR_CLASS_PREFIX = "ollow-text-color-";
  const HIGHLIGHT_CLASS_PREFIX = "ollow-highlight-";
  const ALLOWED_FONT_FAMILY_CLASSES = FONT_FAMILIES.map((font) => `${FONT_CLASS_PREFIX}${font.key}`);
  const ALLOWED_FONT_SIZE_CLASSES = FONT_SIZE_PRESETS.map((size) => `${FONT_SIZE_CLASS_PREFIX}${size}`);
  const ALLOWED_TEXT_COLOR_CLASSES = TEXT_COLOR_PRESETS.map((color) => `${TEXT_COLOR_CLASS_PREFIX}${color.key}`);
  const ALLOWED_HIGHLIGHT_CLASSES = HIGHLIGHT_COLOR_PRESETS.map((color) => `${HIGHLIGHT_CLASS_PREFIX}${color.key}`);
  const BOOKMARK_CLASS = "ollow-bookmark";
  const STYLE_PRESETS = [
    { key: "normal", label: "Normal", type: "reset", previewClass: "" },
    { key: "lead", label: "Lead paragraph", type: "block", className: "ollow-style-lead" },
    { key: "caption", label: "Caption", type: "block", className: "ollow-style-caption" },
    { key: "small", label: "Small text", type: "block", className: "ollow-style-small" },
    { key: "warning", label: "Warning note", type: "block", className: "ollow-style-warning" },
    { key: "info", label: "Info note", type: "block", className: "ollow-style-info" },
    { key: "success", label: "Success note", type: "block", className: "ollow-style-success" },
    { key: "editorial", label: "Editorial note", type: "block", className: "ollow-style-editorial" },
    { key: "inline-code", label: "Inline code", type: "inline-code", className: "ollow-style-inline-code" },
    { key: "quote-emphasis", label: "Quote emphasis", type: "blockquote", className: "ollow-style-quote-emphasis" },
  ];
  const STYLE_PRESET_LOOKUP = new Map(STYLE_PRESETS.map((preset) => [preset.key, preset]));
  const STYLE_PRESET_CLASSES = STYLE_PRESETS.map((preset) => preset.className).filter(Boolean);
  const TOOLBAR_SHORTCUT_LABELS = {
    undo: "Mod+Z",
    redo: "Mod+Shift+Z / Mod+Y",
    bold: "Mod+B",
    italic: "Mod+I",
    underline: "Mod+U",
    strikethrough: "Mod+Shift+X",
    subscript: "Mod+,",
    superscript: "Mod+.",
    "remove-formatting": "Mod+\\",
    link: "Mod+K",
    "bulleted-list": "Mod+Shift+8",
    "numbered-list": "Mod+Shift+7",
    quote: "Mod+Shift+Q",
    "horizontal-rule": "Mod+Shift+H",
    h2: "Mod+Alt+2",
    h3: "Mod+Alt+3",
    h4: "Mod+Alt+4",
    code: "Mod+Shift+C",
    "source-html": "Mod+Shift+U",
    "find-replace": "Mod+F / Mod+H",
  };
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
    "S",
    "SECTION",
    "SPAN",
    "STRONG",
    "STRIKE",
    "SUB",
    "SUP",
    "TABLE",
    "TBODY",
    "TD",
    "TFOOT",
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
    "ollow-table-wide",
    "ollow-table-full",
    "ollow-table-bordered",
    "ollow-table-striped",
    "ollow-table-compact",
    "ollow-gallery",
    "ollow-gallery-grid",
    "ollow-gallery-header",
    "ollow-bookmark",
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
    ...ALLOWED_FONT_FAMILY_CLASSES,
    ...ALLOWED_FONT_SIZE_CLASSES,
    ...ALLOWED_TEXT_COLOR_CLASSES,
    ...ALLOWED_HIGHLIGHT_CLASSES,
    ...STYLE_PRESET_CLASSES,
  ]);
  const DIV_DATA_TYPES = new Set(["attachment", "embed", "fact-box", "gallery", "related"]);
  const FIGURE_DATA_TYPES = new Set(["code", "embed", "image", "table"]);
  const BLOCKQUOTE_DATA_TYPES = new Set(["pull-quote"]);
  const SECTION_DATA_TYPES = new Set(["gallery"]);
  const URL_ATTRS = new Set(["href", "src"]);
  const IMAGE_SIZE_CLASSES = ["ollow-image-small", "ollow-image-medium", "ollow-image-large", "ollow-image-full"];
  const MEDIA_ALIGNMENT_CLASSES = ["ollow-align-left", "ollow-align-center", "ollow-align-right", "ollow-align-wide", "ollow-align-full"];
  const TEXT_ALIGNMENT_CLASSES = ["ollow-text-left", "ollow-text-center", "ollow-text-right", "ollow-text-justify"];
  const TABLE_WIDTH_CLASSES = ["ollow-table-wide", "ollow-table-full"];
  const TABLE_STYLE_CLASSES = ["ollow-table-bordered", "ollow-table-striped", "ollow-table-compact"];
  const TEMP_SELECTION_CLASSES = ["is-selected", "is-media-selected", "ollow-selected", "ollow-image-selected", "is-bookmark-selected"];
  const MEDIA_DATA_TYPES = new Set(["attachment", "code", "embed", "gallery", "image"]);
  const IMAGE_SIZE_PRESETS = {
    small: 320,
    medium: 560,
    large: 760,
  };
  const instances = new Map();
  const formBindings = new WeakMap();
  const pluginRegistry = new Map();

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

  function getFontFamilyClassName(key) {
    return `${FONT_CLASS_PREFIX}${key}`;
  }

  function sanitizeBookmarkId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function formatHtmlForSource(html) {
    const source = String(html || "").trim();
    if (!source) return "";
    return source
      .replace(/></g, ">\n<")
      .replace(/\n{3,}/g, "\n\n");
  }

  function getFontSizeClassName(size) {
    return `${FONT_SIZE_CLASS_PREFIX}${size}`;
  }

  function parseFontFamilyKey(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";
    const normalized = raw.replace(/^["']|["']$/g, "");
    for (const font of FONT_FAMILIES) {
      const firstFamily = font.stack.split(",")[0].trim().replace(/^["']|["']$/g, "").toLowerCase();
      if (normalized === font.key || normalized === font.label.toLowerCase() || normalized === firstFamily) {
        return font.key;
      }
    }
    return "";
  }

  function parseFontFamilyList(value) {
    const tokens = String(value || "")
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);
    for (const token of tokens) {
      const key = parseFontFamilyKey(token);
      if (key) return key;
    }
    return "";
  }

  function clampFontSize(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_FONT_SIZE;
    return Math.min(96, Math.max(8, Math.round(parsed)));
  }

  function getClosestFontSize(value) {
    const size = clampFontSize(value);
    return FONT_SIZE_PRESETS.reduce((closest, current) => (
      Math.abs(current - size) < Math.abs(closest - size) ? current : closest
    ), FONT_SIZE_PRESETS[0]);
  }

  function parseFontSizeClass(className) {
    const match = String(className || "").match(/^ollow-font-size-(\d{1,2})$/);
    if (!match) return 0;
    const size = Number(match[1]);
    return FONT_SIZE_PRESETS.includes(size) ? size : 0;
  }

  function getFontFamilyFromElement(element) {
    if (!element || !element.classList) return "";
    for (const className of element.classList) {
      if (className.startsWith(FONT_CLASS_PREFIX)) {
        const key = className.slice(FONT_CLASS_PREFIX.length);
        if (FONT_FAMILY_LOOKUP.has(key)) {
          return key;
        }
      }
    }
    return "";
  }

  function getFontSizeFromElement(element) {
    if (!element || !element.classList) return 0;
    for (const className of element.classList) {
      const size = parseFontSizeClass(className);
      if (size) return size;
    }
    return 0;
  }

  function normalizeHexColor(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
    }
    if (/^#[0-9a-f]{6}$/i.test(raw)) {
      return raw.toLowerCase();
    }
    return "";
  }

  function getTextColorClassName(key) {
    return `${TEXT_COLOR_CLASS_PREFIX}${key}`;
  }

  function getTextColorPresetByHex(value) {
    const hex = normalizeHexColor(value);
    return hex ? (TEXT_COLOR_BY_HEX.get(hex) || null) : null;
  }

  function getHighlightClassName(key) {
    return `${HIGHLIGHT_CLASS_PREFIX}${key}`;
  }

  function getHighlightPresetByHex(value) {
    const hex = normalizeHexColor(value);
    return hex ? (HIGHLIGHT_COLOR_BY_HEX.get(hex) || null) : null;
  }

  function getTextColorFromElement(element) {
    if (!element) return null;
    if (element.classList) {
      for (const className of element.classList) {
        if (!className.startsWith(TEXT_COLOR_CLASS_PREFIX)) continue;
        const key = className.slice(TEXT_COLOR_CLASS_PREFIX.length);
        if (TEXT_COLOR_LOOKUP.has(key)) {
          const preset = TEXT_COLOR_LOOKUP.get(key);
          return { type: "preset", key: preset.key, hex: preset.hex };
        }
      }
    }
    const style = String(element.getAttribute && element.getAttribute("style") || "");
    const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3}|#[0-9a-f]{6})\s*(?:;|$)/i);
    const hex = normalizeHexColor(colorMatch && colorMatch[1]);
    return hex ? { type: "custom", key: "", hex } : null;
  }

  function getHighlightColorFromElement(element) {
    if (!element) return null;
    if (element.classList) {
      for (const className of element.classList) {
        if (!className.startsWith(HIGHLIGHT_CLASS_PREFIX)) continue;
        const key = className.slice(HIGHLIGHT_CLASS_PREFIX.length);
        if (HIGHLIGHT_COLOR_LOOKUP.has(key)) {
          const preset = HIGHLIGHT_COLOR_LOOKUP.get(key);
          return { type: "preset", key: preset.key, hex: preset.hex };
        }
      }
    }
    const style = String(element.getAttribute && element.getAttribute("style") || "");
    const colorMatch = style.match(/(?:^|;)\s*background-color\s*:\s*(#[0-9a-f]{3}|#[0-9a-f]{6})\s*(?:;|$)/i);
    const hex = normalizeHexColor(colorMatch && colorMatch[1]);
    return hex ? { type: "custom", key: "", hex } : null;
  }

  function cleanupStyleAttribute(element) {
    if (!element) return;
    const style = String(element.getAttribute("style") || "").trim();
    if (!style) {
      element.removeAttribute("style");
    }
  }

  function removeFontFamilyClassesFromElement(element) {
    if (!element || !element.classList) return;
    Array.from(element.classList).forEach((className) => {
      if (className.startsWith(FONT_CLASS_PREFIX) && FONT_FAMILY_LOOKUP.has(className.slice(FONT_CLASS_PREFIX.length))) {
        element.classList.remove(className);
      }
    });
  }

  function removeFontSizeClassesFromElement(element) {
    if (!element || !element.classList) return;
    Array.from(element.classList).forEach((className) => {
      if (parseFontSizeClass(className)) {
        element.classList.remove(className);
      }
    });
  }

  function removeTextColorClassesFromElement(element) {
    if (!element || !element.classList) return;
    Array.from(element.classList).forEach((className) => {
      if (className.startsWith(TEXT_COLOR_CLASS_PREFIX) && TEXT_COLOR_LOOKUP.has(className.slice(TEXT_COLOR_CLASS_PREFIX.length))) {
        element.classList.remove(className);
      }
    });
    if (element.style) {
      element.style.removeProperty("color");
      cleanupStyleAttribute(element);
    }
  }

  function removeHighlightClassesFromElement(element) {
    if (!element || !element.classList) return;
    Array.from(element.classList).forEach((className) => {
      if (className.startsWith(HIGHLIGHT_CLASS_PREFIX) && HIGHLIGHT_COLOR_LOOKUP.has(className.slice(HIGHLIGHT_CLASS_PREFIX.length))) {
        element.classList.remove(className);
      }
    });
    if (element.style) {
      element.style.removeProperty("background-color");
      cleanupStyleAttribute(element);
    }
  }

  function removeStylePresetClassesFromElement(element) {
    if (!element || !element.classList) return;
    element.classList.remove(...STYLE_PRESET_CLASSES);
  }

  function isInlineFormattingTag(tagName) {
    return ["STRONG", "EM", "U", "S", "STRIKE", "SUB", "SUP"].includes(String(tagName || "").toUpperCase());
  }

  function isInlineCodeFormattingElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE || element.tagName.toUpperCase() !== "CODE") return false;
    if (element.closest("pre")) return false;
    if (element.closest("figure.ollow-editor-code")) return false;
    return true;
  }

  function getStylePresetFromElement(element) {
    if (!element) return null;
    if (element.classList) {
      for (const preset of STYLE_PRESETS) {
        if (preset.className && element.classList.contains(preset.className)) {
          return preset;
        }
      }
    }
    if (element.tagName && element.tagName.toUpperCase() === "CODE" && element.classList && element.classList.contains("ollow-style-inline-code")) {
      return STYLE_PRESET_LOOKUP.get("inline-code") || null;
    }
    return null;
  }

  function removeTypographyClasses(container, options) {
    if (!container) return;
    const config = Object.assign({ fontFamily: false, fontSize: false, textColor: false, highlight: false }, options || {});
    if (container.nodeType === Node.ELEMENT_NODE) {
      if (config.fontFamily) {
        removeFontFamilyClassesFromElement(container);
      }
      if (config.fontSize) {
        removeFontSizeClassesFromElement(container);
      }
      if (config.textColor) {
        removeTextColorClassesFromElement(container);
      }
      if (config.highlight) {
        removeHighlightClassesFromElement(container);
      }
    }
    Array.from((container.querySelectorAll && container.querySelectorAll("*")) || []).forEach((element) => {
      if (config.fontFamily) {
        removeFontFamilyClassesFromElement(element);
      }
      if (config.fontSize) {
        removeFontSizeClassesFromElement(element);
      }
      if (config.textColor) {
        removeTextColorClassesFromElement(element);
      }
      if (config.highlight) {
        removeHighlightClassesFromElement(element);
      }
    });
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

  function extractUploadUrls(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) {
      return payload.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean);
    }
    if (typeof payload === "object") {
      if (Array.isArray(payload.urls)) {
        return payload.urls.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean);
      }
      const single = extractUploadUrl(payload);
      return single ? [single] : [];
    }
    if (typeof payload === "string") {
      return payload.trim() ? [payload.trim()] : [];
    }
    return [];
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

  function unwrapElement(element) {
    if (!element || !element.parentNode) return;
    const parent = element.parentNode;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  function cleanupPastedTextNode(node) {
    if (!node) return;
    node.textContent = String(node.textContent || "").replace(/\u00a0/g, " ");
  }

  function getTextAlignmentClass(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "center") return "ollow-text-center";
    if (normalized === "right") return "ollow-text-right";
    if (normalized === "justify") return "ollow-text-justify";
    if (normalized === "left") return "ollow-text-left";
    return "";
  }

  function stripListMarkerText(element) {
    if (!element) return;
    const firstNode = element.firstChild;
    if (firstNode && firstNode.nodeType === Node.TEXT_NODE) {
      firstNode.textContent = String(firstNode.textContent || "")
        .replace(/^\s*(?:[\u2022\u25e6\u25aa\u25cf\u00b7\u2043\-*o]+|\(?\d+[.)]|[a-zA-Z][.)])\s+/, "")
        .replace(/^\s+/, "");
    }
  }

  function detectOfficeListItem(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return null;
    const tagName = element.tagName.toUpperCase();
    if (!["P", "DIV"].includes(tagName)) return null;
    const text = String(element.textContent || "").replace(/\u00a0/g, " ").trim();
    if (!text) return null;
    const style = String(element.getAttribute("style") || "").toLowerCase();
    const className = String(element.getAttribute("class") || "").toLowerCase();
    const looksOffice = style.includes("mso-list") || className.includes("mso");
    if (/^(?:[\u2022\u25e6\u25aa\u25cf\u00b7\u2043\-*o])\s+/.test(text)) {
      return { type: "ul" };
    }
    if (/^\(?\d+[.)]\s+/.test(text)) {
      return { type: "ol" };
    }
    if (/^[a-zA-Z][.)]\s+/.test(text) && looksOffice) {
      return { type: "ol" };
    }
    if (looksOffice && /margin-left:\s*\d/i.test(style)) {
      return { type: "ul" };
    }
    return null;
  }

  function normalizeOfficeLists(root, doc) {
    if (!root) return;

    function processContainer(container) {
      const children = Array.from(container.childNodes);
      let currentList = null;
      let currentType = "";

      children.forEach((child) => {
        if (child.nodeType !== Node.ELEMENT_NODE) {
          currentList = null;
          currentType = "";
          return;
        }

        if (["UL", "OL", "TABLE", "PRE", "BLOCKQUOTE", "FIGURE", "SECTION", "DIV"].includes(child.tagName.toUpperCase()) && child !== container) {
          if (!["P", "DIV"].includes(child.tagName.toUpperCase())) {
            currentList = null;
            currentType = "";
          }
          processContainer(child);
        }

        const listData = detectOfficeListItem(child);
        if (!listData) {
          currentList = null;
          currentType = "";
          return;
        }

        if (!currentList || currentType !== listData.type || currentList.parentNode !== container) {
          currentList = doc.createElement(listData.type);
          currentType = listData.type;
          container.insertBefore(currentList, child);
        }

        const item = doc.createElement("li");
        while (child.firstChild) {
          item.appendChild(child.firstChild);
        }
        stripListMarkerText(item);
        currentList.appendChild(item);
        child.remove();
      });
    }

    processContainer(root);
  }

  function cleanPastedHtmlMarkup(input) {
    const source = String(input || "");
    if (!source.trim()) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, "text/html");
    const root = doc.body;
    if (!root) return "";

    Array.from(root.querySelectorAll("script, style, meta, link, xml, title")).forEach((node) => node.remove());

    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT);
    const toRemove = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.COMMENT_NODE) {
        toRemove.push(node);
      } else if (node.nodeType === Node.TEXT_NODE) {
        cleanupPastedTextNode(node);
      }
    }
    toRemove.forEach((node) => node.remove());

    Array.from(root.querySelectorAll("*")).forEach((element) => {
      const tagName = element.tagName.toUpperCase();
      if (tagName === "H1") {
        const replacement = doc.createElement("h2");
        Array.from(element.attributes).forEach((attr) => replacement.setAttribute(attr.name, attr.value));
        while (element.firstChild) replacement.appendChild(element.firstChild);
        element.replaceWith(replacement);
        element = replacement;
      } else if (tagName === "H5" || tagName === "H6") {
        const replacement = doc.createElement("h4");
        Array.from(element.attributes).forEach((attr) => replacement.setAttribute(attr.name, attr.value));
        while (element.firstChild) replacement.appendChild(element.firstChild);
        element.replaceWith(replacement);
        element = replacement;
      }

      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value;
        if (name === "id") {
          element.removeAttribute(attribute.name);
          return;
        }
        if (name.startsWith("on")) {
          element.removeAttribute(attribute.name);
          return;
        }
        if (name === "class") {
          const classes = value
            .split(/\s+/)
            .filter(Boolean)
            .filter((className) => !/^(mso|docs-|c\d+|kix)/i.test(className) && className !== "Apple-converted-space");
          if (classes.length) {
            element.setAttribute("class", classes.join(" "));
          } else {
            element.removeAttribute("class");
          }
          return;
        }
        if (name === "style") {
          const alignMatch = value.match(/text-align\s*:\s*(left|center|right|justify)/i);
          const alignClass = getTextAlignmentClass(alignMatch && alignMatch[1]);
          if (alignClass && ["P", "H2", "H3", "H4", "BLOCKQUOTE", "LI"].includes(element.tagName.toUpperCase())) {
            element.classList.remove(...TEXT_ALIGNMENT_CLASSES);
            element.classList.add(alignClass);
          }
          const fontFamilyMatch = value.match(/font-family\s*:\s*([^;]+)/i);
          const fontFamilyKey = parseFontFamilyList(fontFamilyMatch && fontFamilyMatch[1]);
          if (fontFamilyKey) {
            removeFontFamilyClassesFromElement(element);
            element.classList.add(getFontFamilyClassName(fontFamilyKey));
          }
          const fontSizeMatch = value.match(/font-size\s*:\s*([\d.]+)\s*(px|pt)?/i);
          const rawSize = fontSizeMatch ? Number(fontSizeMatch[1]) * (fontSizeMatch[2] && fontSizeMatch[2].toLowerCase() === "pt" ? 4 / 3 : 1) : 0;
          if (rawSize) {
            removeFontSizeClassesFromElement(element);
            element.classList.add(getFontSizeClassName(getClosestFontSize(rawSize)));
          }
          const colorMatch = value.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3}|#[0-9a-f]{6})\s*(?:;|$)/i);
          const textColor = normalizeHexColor(colorMatch && colorMatch[1]);
          const highlightMatch = value.match(/(?:^|;)\s*background-color\s*:\s*(#[0-9a-f]{3}|#[0-9a-f]{6})\s*(?:;|$)/i);
          const highlightColor = normalizeHexColor(highlightMatch && highlightMatch[1]);
          if (textColor) {
            removeTextColorClassesFromElement(element);
            const preset = getTextColorPresetByHex(textColor);
            if (preset) {
              element.classList.add(getTextColorClassName(preset.key));
            }
          }
          if (highlightColor) {
            removeHighlightClassesFromElement(element);
            const preset = getHighlightPresetByHex(highlightColor);
            if (preset) {
              element.classList.add(getHighlightClassName(preset.key));
            }
          }
          element.removeAttribute("style");
          const safeStyles = [];
          if (textColor && !getTextColorPresetByHex(textColor)) {
            safeStyles.push(`color:${textColor}`);
          }
          if (highlightColor && !getHighlightPresetByHex(highlightColor)) {
            safeStyles.push(`background-color:${highlightColor}`);
          }
          if (safeStyles.length) {
            element.setAttribute("style", safeStyles.join(";"));
          }
          return;
        }
        if (name === "align") {
          const alignClass = getTextAlignmentClass(value);
          if (alignClass && ["P", "H2", "H3", "H4", "BLOCKQUOTE", "LI"].includes(element.tagName.toUpperCase())) {
            element.classList.remove(...TEXT_ALIGNMENT_CLASSES);
            element.classList.add(alignClass);
          }
          element.removeAttribute("align");
          return;
        }
      });

      if (tagName === "SPAN") {
        const className = String(element.getAttribute("class") || "");
        if (className.includes("Apple-converted-space")) {
          element.textContent = String(element.textContent || "").replace(/\u00a0/g, " ");
          unwrapElement(element);
          return;
        }
        if (!element.attributes.length) {
          unwrapElement(element);
          return;
        }
      }

      if (tagName === "FONT") {
        unwrapElement(element);
        return;
      }

      if (tagName === "A") {
        const href = element.getAttribute("href") || "";
        if (!isSafeUrl(href, "A")) {
          unwrapElement(element);
        }
      }

      if (tagName === "IFRAME") {
        const src = element.getAttribute("src") || "";
        if (!getYouTubeEmbedUrl(src)) {
          element.remove();
        }
      }
    });

    normalizeOfficeLists(root, doc);

    Array.from(root.querySelectorAll("span")).forEach((element) => {
      if (!element.attributes.length) {
        unwrapElement(element);
      }
    });

    Array.from(root.querySelectorAll("p, h2, h3, h4, li, blockquote")).forEach((element) => {
      if (!element.textContent.trim() && !element.querySelector("img, iframe, table, br, code")) {
        element.remove();
      }
    });

    return root.innerHTML;
  }

  function resolveSanitizerRules(rules) {
    const extensions = {
      tags: new Set(),
      classes: new Set(),
      attributes: new Map(),
      transforms: [],
    };

    Array.from(rules || []).forEach((rule) => {
      if (!rule) return;
      if (typeof rule === "function") {
        extensions.transforms.push(rule);
        return;
      }
      if (Array.isArray(rule.tags)) {
        rule.tags.forEach((tag) => {
          if (tag) extensions.tags.add(String(tag).toUpperCase());
        });
      }
      if (Array.isArray(rule.classes)) {
        rule.classes.forEach((className) => {
          if (className) extensions.classes.add(String(className));
        });
      }
      if (rule.attributes && typeof rule.attributes === "object") {
        Object.entries(rule.attributes).forEach(([tag, attrs]) => {
          const key = String(tag || "*").toUpperCase();
          const existing = extensions.attributes.get(key) || new Set();
          Array.from(attrs || []).forEach((attr) => {
            if (attr) existing.add(String(attr).toLowerCase());
          });
          extensions.attributes.set(key, existing);
        });
      }
      if (typeof rule.transform === "function") {
        extensions.transforms.push(rule.transform);
      }
    });

    return extensions;
  }

  function parseInlineMarkdown(text) {
    const source = String(text || "");
    const codeTokens = [];
    let html = escapeHtml(source).replace(/`([^`]+)`/g, (_, code) => {
      const token = `__NW_CODE_${codeTokens.length}__`;
      codeTokens.push(`<code>${escapeHtml(code)}</code>`);
      return token;
    });

    html = html.replace(/!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)/g, (_, alt, url) => {
      if (!isSafeUrl(url, "IMG")) return escapeHtml(`![${alt}](${url})`);
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">`;
    });
    html = html.replace(/\[([^\]]+)\]\((\S+?)(?:\s+"([^"]*)")?\)/g, (_, label, url) => {
      if (!isSafeUrl(url, "A")) return escapeHtml(`[${label}](${url})`);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    html = html.replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    html = html.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");

    codeTokens.forEach((tokenHtml, index) => {
      html = html.replace(`__NW_CODE_${index}__`, tokenHtml);
    });
    return html;
  }

  function escapeMarkdownText(value) {
    return String(value || "").replace(/([\\`*_[\]{}()#+\-.!|>])/g, "\\$1");
  }

  function normalizeMarkdownCell(text) {
    return String(text || "").replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
  }

  function getYouTubeWatchUrl(input) {
    const embed = getYouTubeEmbedUrl(input);
    if (!embed) return "";
    try {
      const url = new URL(embed);
      const parts = url.pathname.split("/");
      const id = parts[parts.length - 1] || "";
      if (!id) return "";
      const watch = new URL(`https://www.youtube.com/watch?v=${id}`);
      const start = url.searchParams.get("start");
      const list = url.searchParams.get("list");
      if (start) watch.searchParams.set("t", start);
      if (list) watch.searchParams.set("list", list);
      return watch.toString();
    } catch (error) {
      return "";
    }
  }

  function readStoredTheme(storageKey) {
    try {
      const value = window.localStorage.getItem(storageKey || DEFAULT_THEME_STORAGE_KEY);
      return ["light", "dark", "auto"].includes(value) ? value : "";
    } catch (error) {
      return "";
    }
  }

  function writeStoredTheme(storageKey, value) {
    try {
      window.localStorage.setItem(storageKey || DEFAULT_THEME_STORAGE_KEY, value);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function readStoredRecentFonts() {
    try {
      const raw = window.localStorage.getItem(FONT_RECENTS_STORAGE_KEY);
      const values = JSON.parse(raw || "[]");
      if (!Array.isArray(values)) return DEFAULT_RECENT_FONT_KEYS.slice();
      const filtered = values.filter((key) => FONT_FAMILY_LOOKUP.has(key));
      return filtered.length ? filtered : DEFAULT_RECENT_FONT_KEYS.slice();
    } catch (error) {
      return DEFAULT_RECENT_FONT_KEYS.slice();
    }
  }

  function writeStoredRecentFonts(fonts) {
    try {
      window.localStorage.setItem(FONT_RECENTS_STORAGE_KEY, JSON.stringify(fonts || []));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function readStoredRecentColors() {
    try {
      const raw = window.localStorage.getItem(TEXT_COLOR_RECENTS_STORAGE_KEY);
      const values = JSON.parse(raw || "[]");
      if (!Array.isArray(values)) return [];
      return values.map((value) => normalizeHexColor(value)).filter(Boolean).slice(0, 6);
    } catch (error) {
      return [];
    }
  }

  function writeStoredRecentColors(colors) {
    try {
      window.localStorage.setItem(TEXT_COLOR_RECENTS_STORAGE_KEY, JSON.stringify((colors || []).slice(0, 6)));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function readStoredRecentSpecialCharacters() {
    try {
      const raw = window.localStorage.getItem(SPECIAL_CHAR_RECENTS_STORAGE_KEY);
      const values = JSON.parse(raw || "[]");
      if (!Array.isArray(values)) return [];
      return values.filter((value) => SPECIAL_CHARACTER_LOOKUP.has(value)).slice(0, 12);
    } catch (error) {
      return [];
    }
  }

  function writeStoredRecentSpecialCharacters(chars) {
    try {
      window.localStorage.setItem(SPECIAL_CHAR_RECENTS_STORAGE_KEY, JSON.stringify((chars || []).slice(0, 12)));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function readStoredRecentEmojis() {
    try {
      const raw = window.localStorage.getItem(EMOJI_RECENTS_STORAGE_KEY);
      const values = JSON.parse(raw || "[]");
      if (!Array.isArray(values)) return [];
      return values.filter((value) => EMOJI_LOOKUP.has(value)).slice(0, 18);
    } catch (error) {
      return [];
    }
  }

  function writeStoredRecentEmojis(emojis) {
    try {
      window.localStorage.setItem(EMOJI_RECENTS_STORAGE_KEY, JSON.stringify((emojis || []).slice(0, 18)));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function parseMarkdownToHtml(markdown, editor) {
    const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
    const blocks = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
        index += 1;
        continue;
      }

      const fenceMatch = trimmed.match(/^```([\w.+-]*)\s*$/);
      if (fenceMatch) {
        const language = fenceMatch[1] || "";
        index += 1;
        const codeLines = [];
        while (index < lines.length && !/^```/.test(lines[index].trim())) {
          codeLines.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        blocks.push(editor.buildCodeBlockHtml(language, codeLines.join("\n"), ""));
        continue;
      }

      if (/^(\*\s*\*\s*\*|-{3,}|_{3,})$/.test(trimmed)) {
        blocks.push("<hr>");
        index += 1;
        continue;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const depth = headingMatch[1].length;
        const text = headingMatch[2].trim();
        const tag = depth <= 2 ? "h2" : depth === 3 ? "h3" : "h4";
        blocks.push(`<${tag}>${parseInlineMarkdown(text)}</${tag}>`);
        index += 1;
        continue;
      }

      const imageMatch = trimmed.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/);
      if (imageMatch && isSafeUrl(imageMatch[2], "IMG")) {
        const [, alt, src, caption] = imageMatch;
        blocks.push(
          `<figure class="ollow-editor-image" data-type="image"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`
        );
        index += 1;
        continue;
      }

      if (
        index + 1 < lines.length &&
        lines[index].includes("|") &&
        /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(lines[index + 1])
      ) {
        const tableLines = [lines[index]];
        index += 2;
        while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
          tableLines.push(lines[index]);
          index += 1;
        }
        const parseCells = (value) => value.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
        const headers = parseCells(tableLines[0]);
        const bodyRows = tableLines.slice(1).map((row) => parseCells(row));
        const headerHtml = headers.map((cell) => `<th>${parseInlineMarkdown(cell)}</th>`).join("");
        const bodyHtml = bodyRows
          .map((row) => `<tr>${headers.map((_, i) => `<td>${parseInlineMarkdown(row[i] || "")}</td>`).join("")}</tr>`)
          .join("");
        blocks.push(`<figure class="ollow-editor-table" data-type="table"><div class="ollow-editor-table-scroll"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div></figure>`);
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        const quoteLines = [];
        while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
          quoteLines.push(lines[index].replace(/^>\s?/, ""));
          index += 1;
        }
        const quoteText = quoteLines.join(" ").trim();
        blocks.push(`<blockquote><p>${parseInlineMarkdown(quoteText)}</p></blockquote>`);
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        const items = [];
        while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
          items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
          index += 1;
        }
        blocks.push(`<ul>${items.map((item) => `<li>${parseInlineMarkdown(item)}</li>`).join("")}</ul>`);
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        const items = [];
        while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
          items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
          index += 1;
        }
        blocks.push(`<ol>${items.map((item) => `<li>${parseInlineMarkdown(item)}</li>`).join("")}</ol>`);
        continue;
      }

      const paragraphLines = [];
      while (index < lines.length && lines[index].trim()) {
        const current = lines[index].trim();
        if (
          /^```/.test(current) ||
          /^(#{1,6})\s+/.test(current) ||
          /^>\s?/.test(current) ||
          /^[-*]\s+/.test(current) ||
          /^\d+\.\s+/.test(current) ||
          /^(\*\s*\*\s*\*|-{3,}|_{3,})$/.test(current)
        ) {
          break;
        }
        paragraphLines.push(current);
        index += 1;
      }
      blocks.push(`<p>${parseInlineMarkdown(paragraphLines.join(" "))}</p>`);
    }

    return blocks.join("");
  }

  function htmlNodeToMarkdown(node) {
    if (!node) return "";
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeMarkdownText(node.textContent || "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toUpperCase();
    const inlineChildren = () => Array.from(node.childNodes).map((child) => htmlNodeToMarkdown(child)).join("");

    switch (tag) {
      case "STRONG":
        return `**${inlineChildren()}**`;
      case "EM":
        return `*${inlineChildren()}*`;
      case "U":
        return `<u>${inlineChildren()}</u>`;
      case "A": {
        const href = node.getAttribute("href") || "";
        return href ? `[${inlineChildren() || href}](${href})` : inlineChildren();
      }
      case "CODE":
        if (node.parentElement && node.parentElement.tagName.toUpperCase() === "PRE") {
          return node.textContent || "";
        }
        return `\`${node.textContent || ""}\``;
      case "BR":
        return "  \n";
      case "IMG": {
        const src = node.getAttribute("src") || "";
        const alt = node.getAttribute("alt") || "";
        return src ? `![${alt}](${src})` : "";
      }
      default:
        return inlineChildren();
    }
  }

  function exportTableToMarkdown(table) {
    if (!table) return "";
    const rows = Array.from(table.querySelectorAll("tr"));
    if (!rows.length) return "";
    const cellText = (row) => Array.from(row.children).map((cell) => normalizeMarkdownCell(htmlNodeToMarkdown(cell)));
    const header = cellText(rows[0]);
    const body = rows.slice(1).map(cellText);
    const separator = header.map(() => "---");
    return [
      `| ${header.join(" | ")} |`,
      `| ${separator.join(" | ")} |`,
      ...body.map((row) => `| ${header.map((_, i) => row[i] || "").join(" | ")} |`),
    ].join("\n");
  }

  function exportHtmlToMarkdown(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html || ""}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    if (!root) return "";

    const blocks = [];
    Array.from(root.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = String(node.textContent || "").trim();
        if (text) blocks.push(escapeMarkdownText(text));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tag = node.tagName.toUpperCase();
      switch (tag) {
        case "H2":
          blocks.push(`## ${Array.from(node.childNodes).map((child) => htmlNodeToMarkdown(child)).join("").trim()}`);
          break;
        case "H3":
          blocks.push(`### ${Array.from(node.childNodes).map((child) => htmlNodeToMarkdown(child)).join("").trim()}`);
          break;
        case "H4":
          blocks.push(`#### ${Array.from(node.childNodes).map((child) => htmlNodeToMarkdown(child)).join("").trim()}`);
          break;
        case "P":
          blocks.push(Array.from(node.childNodes).map((child) => htmlNodeToMarkdown(child)).join("").trim());
          break;
        case "UL":
          blocks.push(Array.from(node.children).map((li) => `- ${Array.from(li.childNodes).map((child) => htmlNodeToMarkdown(child)).join("").trim()}`).join("\n"));
          break;
        case "OL":
          blocks.push(Array.from(node.children).map((li, i) => `${i + 1}. ${Array.from(li.childNodes).map((child) => htmlNodeToMarkdown(child)).join("").trim()}`).join("\n"));
          break;
        case "BLOCKQUOTE": {
          const text = Array.from(node.querySelectorAll("p")).map((p) => Array.from(p.childNodes).map((child) => htmlNodeToMarkdown(child)).join("").trim()).join("\n");
          blocks.push(text.split("\n").map((line) => `> ${line}`).join("\n"));
          break;
        }
        case "HR":
          blocks.push("---");
          break;
        case "FIGURE":
          if (node.classList.contains("ollow-editor-image") || node.classList.contains("ollow-image")) {
            const img = node.querySelector("img");
            if (img) {
              const src = img.getAttribute("src") || "";
              const alt = img.getAttribute("alt") || "";
              const caption = (node.querySelector("figcaption")?.textContent || "").trim();
              blocks.push(`![${alt}](${src}${caption ? ` "${caption}"` : ""})`);
            }
          } else if (node.classList.contains("ollow-editor-code")) {
            const language = node.getAttribute("data-language") || "";
            const code = node.querySelector("code")?.textContent || "";
            blocks.push(`\`\`\`${language}\n${code}\n\`\`\``);
          } else if (node.classList.contains("ollow-editor-table")) {
            blocks.push(exportTableToMarkdown(node.querySelector("table")));
          } else if (node.classList.contains("ollow-embed")) {
            const iframe = node.querySelector("iframe");
            const url = iframe ? getYouTubeWatchUrl(iframe.getAttribute("src") || "") : "";
            if (url) blocks.push(url);
          }
          break;
        case "SECTION":
          if (node.classList.contains("ollow-gallery")) {
            const title = node.querySelector(".ollow-gallery-header h3")?.textContent?.trim();
            if (title) blocks.push(`### ${escapeMarkdownText(title)}`);
            Array.from(node.querySelectorAll(".ollow-gallery-grid img")).forEach((img) => {
              const src = img.getAttribute("src") || "";
              const alt = img.getAttribute("alt") || "";
              if (src) blocks.push(`![${alt}](${src})`);
            });
          }
          break;
        case "DIV":
          if (node.classList.contains("nw-attachment")) {
            const title = (node.querySelector(".nw-block-title")?.textContent || "Attachment").trim();
            const href = node.querySelector("a")?.getAttribute("href") || "";
            blocks.push(href ? `[${escapeMarkdownText(title)}](${href})` : escapeMarkdownText(title));
          } else if (node.classList.contains("nw-embed")) {
            const href = node.querySelector("a")?.getAttribute("href") || "";
            if (href) blocks.push(href);
          }
          break;
        default:
          blocks.push(Array.from(node.childNodes).map((child) => htmlNodeToMarkdown(child)).join("").trim());
      }
    });

    return blocks.filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function sanitizeFragment(input, rules) {
    const source = String(input || "");
    if (!source.trim()) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, "text/html");
    const fragment = document.createDocumentFragment();
    const sanitizerExtensions = resolveSanitizerRules(rules);

    function cloneAllowed(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || "");
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createDocumentFragment();
      }

      const originalTagName = node.tagName.toUpperCase();
      const tagName = originalTagName === "B"
        ? "STRONG"
        : originalTagName === "I"
          ? "EM"
          : originalTagName === "STRIKE"
            ? "S"
            : originalTagName;
      if (tagName === "SCRIPT" || tagName === "STYLE") {
        return document.createDocumentFragment();
      }

      if (!ALLOWED_TAGS.has(tagName) && !sanitizerExtensions.tags.has(tagName)) {
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
            .filter((className) => (
              CLASS_ALLOWLIST.has(className) ||
              sanitizerExtensions.classes.has(className) ||
              /^language-[a-z0-9+._-]+$/i.test(className) ||
              (className.startsWith(FONT_CLASS_PREFIX) && FONT_FAMILY_LOOKUP.has(className.slice(FONT_CLASS_PREFIX.length))) ||
              Boolean(parseFontSizeClass(className)) ||
              (className.startsWith(TEXT_COLOR_CLASS_PREFIX) && TEXT_COLOR_LOOKUP.has(className.slice(TEXT_COLOR_CLASS_PREFIX.length))) ||
              (className.startsWith(HIGHLIGHT_CLASS_PREFIX) && HIGHLIGHT_COLOR_LOOKUP.has(className.slice(HIGHLIGHT_CLASS_PREFIX.length)))
            ));
          if (classes.length) {
            clean.setAttribute("class", classes.join(" "));
          }
          return;
        }

        if (name === "style") {
          const safeStyles = [];
          const colorMatch = value.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3}|#[0-9a-f]{6})\s*(?:;|$)/i);
          const colorHex = normalizeHexColor(colorMatch && colorMatch[1]);
          if (colorHex) {
            safeStyles.push(`color:${colorHex}`);
          }
          const highlightMatch = value.match(/(?:^|;)\s*background-color\s*:\s*(#[0-9a-f]{3}|#[0-9a-f]{6})\s*(?:;|$)/i);
          const highlightHex = normalizeHexColor(highlightMatch && highlightMatch[1]);
          if (highlightHex) {
            safeStyles.push(`background-color:${highlightHex}`);
          }
          if (safeStyles.length) {
            clean.setAttribute("style", safeStyles.join(";"));
          }
          return;
        }

        if (name === "data-type") {
          clean.setAttribute(name, value);
          return;
        }

        if (name === "data-bookmark" && node.classList.contains(BOOKMARK_CLASS) && value === "true") {
          clean.setAttribute(name, "true");
          return;
        }

        if (name === "data-language" && tagName === "FIGURE") {
          clean.setAttribute(name, value);
          return;
        }

        if (name === "id" && node.classList.contains(BOOKMARK_CLASS)) {
          const bookmarkId = sanitizeBookmarkId(value);
          if (!bookmarkId) return;
          clean.setAttribute("id", bookmarkId);
          return;
        }

        if (name === "contenteditable" && node.classList.contains(BOOKMARK_CLASS) && value === "false") {
          clean.setAttribute("contenteditable", "false");
          return;
        }

        if (name === "title" && node.classList.contains(BOOKMARK_CLASS)) {
          clean.setAttribute("title", value);
          return;
        }

        const extraTagAttrs = sanitizerExtensions.attributes.get(tagName) || new Set();
        const extraGlobalAttrs = sanitizerExtensions.attributes.get("*") || new Set();
        if (extraTagAttrs.has(name) || extraGlobalAttrs.has(name)) {
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
            if (!String(value).trim().startsWith("#")) {
              clean.setAttribute("target", "_blank");
              clean.setAttribute("rel", "noopener noreferrer");
            }
          }
          return;
        }

        if (tagName === "IMG" && name === "alt") {
          clean.setAttribute(name, value);
          return;
        }

        if ((tagName === "TD" || tagName === "TH") && ["colspan", "rowspan"].includes(name)) {
          const number = Math.max(1, Math.min(24, Number.parseInt(value, 10) || 1));
          clean.setAttribute(name, String(number));
          return;
        }

        if (tagName === "TH" && name === "scope" && ["row", "col", "rowgroup", "colgroup"].includes(String(value || "").toLowerCase())) {
          clean.setAttribute(name, String(value).toLowerCase());
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
    sanitizerExtensions.transforms.forEach((transform) => {
      try {
        transform(container);
      } catch (error) {
        console.warn("OllowEditor sanitizer rule failed.", error);
      }
    });
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

  function getThemeIcon(theme) {
    if (theme === "dark") {
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"></path>
        </svg>
      `;
    }
    if (theme === "auto") {
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="2"></rect>
          <path d="M8 20h8"></path>
          <path d="M12 16v4"></path>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2.5"></path>
        <path d="M12 19.5V22"></path>
        <path d="m4.93 4.93 1.77 1.77"></path>
        <path d="m17.3 17.3 1.77 1.77"></path>
        <path d="M2 12h2.5"></path>
        <path d="M19.5 12H22"></path>
        <path d="m4.93 19.07 1.77-1.77"></path>
        <path d="m17.3 6.7 1.77-1.77"></path>
      </svg>
    `;
  }

  function getInlineToolbarIcon(name) {
    const icons = {
      edit: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 14.5V16h1.5L14 7.5 12.5 6 4 14.5Z" fill="currentColor"></path><path d="M11.8 6.7 13.3 5.2 14.8 6.7 13.3 8.2Z" fill="currentColor"></path></svg>',
      replace: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 6h8l-2.5-2.5L11 2l5 5-5 5-1.5-1.5L12 8H4V6Zm12 8H8l2.5 2.5L9 18l-5-5 5-5 1.5 1.5L8 12h8v2Z" fill="currentColor"></path></svg>',
      link: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M8 11.5 6.5 13a2.5 2.5 0 0 1-3.5-3.5L6 6.5A2.5 2.5 0 0 1 9.5 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 8.5 13.5 7a2.5 2.5 0 0 1 3.5 3.5L14 13.5A2.5 2.5 0 0 1 10.5 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7.5 12.5 12.5 7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      copy: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M7 7h8v10H7z" fill="none" stroke="currentColor" stroke-width="1.6" rx="1.5"/><path d="M5 13H4a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1h7.2a1 1 0 0 1 1 1V5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      external: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M11 3h6v6h-2V6.4l-6.3 6.3-1.4-1.4L13.6 5H11V3Z" fill="currentColor"></path><path d="M5 5h4v2H7v6h6v-2h2v4H5V5Z" fill="currentColor"></path></svg>',
      unlink: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M8.5 11.5 7 13a2.5 2.5 0 1 1-3.5-3.5L6.5 6.5A2.5 2.5 0 0 1 10 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 8l1-1a2.5 2.5 0 1 1 3.5 3.5L13.5 13.5A2.5 2.5 0 0 1 10 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 16 16 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      delete: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M6 6h8l-.7 10H6.7L6 6Zm2-3h4l1 1.5H16V6H4V4.5h3L8 3Z" fill="currentColor"></path></svg>',
      reset: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 4a6 6 0 1 1-5.3 3.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M5 2.8v4h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };
    return icons[name] || "";
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

  function getBookmarkNode(node, root) {
    let current = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (current && current !== root) {
      if (
        current.nodeType === Node.ELEMENT_NODE &&
        current.classList.contains(BOOKMARK_CLASS) &&
        current.getAttribute("data-bookmark") === "true" &&
        current.id
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
      this.sourcePanel = null;
      this.sourceToolbar = null;
      this.sourceTextarea = null;
      this.feedback = null;
      this.imageResizeToolbar = null;
      this.imageResizeHandle = null;
      this.tableToolbar = null;
      this.bookmarkToolbar = null;
      this.findReplacePanel = null;
      this.findReplaceState = null;
      this.findReplaceElements = {};
      this.findReplaceSelectionBeforeOpen = null;
      this.selectedMediaBlock = null;
      this.selectedBookmark = null;
      this.selectedImageFigure = null;
      this.selectedCodeFigure = null;
      this.selectedTableFigure = null;
      this.selectedTableCell = null;
      this.selectedTableCells = [];
      this.tableSelectionAnchorCell = null;
      this.isDraggingImageResize = false;
      this.resizePointerId = null;
      this.statusWordCount = null;
      this.statusReadTime = null;
      this.statusActive = null;
      this.statusSave = null;
      this.statusDot = null;
      this.toolbarButtons = {};
      this.toolbarRows = {};
      this.toolbarGroups = {};
      this.headingSelect = null;
      this.formatPainterButton = null;
      this.formatPainterState = null;
      this.formatPainterClickTimer = null;
      this.stylesButton = null;
      this.stylesMenu = null;
      this.stylesLabel = null;
      this.fontFamilyButton = null;
      this.fontFamilyMenu = null;
      this.fontFamilyLabel = null;
      this.fontSizeInput = null;
      this.fontSizeMenu = null;
      this.textColorButton = null;
      this.textColorBar = null;
      this.textColorPopover = null;
      this.textColorCustomInput = null;
      this.highlightButton = null;
      this.highlightBar = null;
      this.highlightPopover = null;
      this.highlightCustomInput = null;
      this.themeToggleButton = null;
      this.themeMenu = null;
      this.sourceMode = false;
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
      this.theme = options.theme || "light";
      this.themeStorageKey = options.themeStorageKey || DEFAULT_THEME_STORAGE_KEY;
      this.persistTheme = Boolean(options.persistTheme);
      this.recentFonts = readStoredRecentFonts();
      this.recentTextColors = readStoredRecentColors();
      this.recentSpecialCharacters = readStoredRecentSpecialCharacters();
      this.recentEmojis = readStoredRecentEmojis();
      this.systemThemeQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
      this.commands = new Map();
      this.eventHandlers = new Map();
      this.shortcuts = new Map();
      this.sanitizerRules = [];
      this.boundSelectionChange = this.handleSelectionChange.bind(this);
      this.boundModalClose = this.closeModal.bind(this);
      this.boundDocumentPointerDown = this.handleDocumentPointerDown.bind(this);
      this.boundDocumentKeydown = this.handleDocumentKeydown.bind(this);
      this.boundSystemThemeChange = this.handleSystemThemeChange.bind(this);
      this.boundViewportChange = this.handleViewportChange.bind(this);
      this.boundRepositionImageToolbar = this.positionImageResizeToolbar.bind(this);
      this.boundImageResizeMove = this.handleImageResizeMove.bind(this);
      this.boundImageResizeEnd = this.handleImageResizeEnd.bind(this);
      this.boundRepositionTableToolbar = this.positionTableToolbar.bind(this);
      this.boundRepositionBookmarkToolbar = this.positionBookmarkToolbar.bind(this);
    }

    init() {
      this.build();
      this.hideSource();
      this.setHTML(this.textarea.value || "", { skipSync: true, skipAutosave: true });
      this.bind();
      this.registerDefaultShortcuts();
      this.runConfiguredPlugins();
      this.sync({ autosave: false, silent: true });
      this.updateMetrics();
      this.updateToolbarState();
      this.updateStatus();
      this.dispatch("nationwire-editor:ready");
      this.emit("ready", { editor: this });
      return this;
    }

    build() {
      this.wrapper = document.createElement("div");
      this.wrapper.className = "nw-editor";
      this.wrapper.dataset.editorId = this.id;
      this.applyTheme();

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

      this.sourcePanel = this.buildSourcePanel();
      surface.appendChild(this.sourcePanel);

      this.feedback = document.createElement("div");
      this.feedback.className = "nw-editor-feedback";
      this.feedback.hidden = true;
      surface.appendChild(this.feedback);

      this.imageResizeToolbar = this.buildImageResizeToolbar();
      this.imageResizeHandle = this.buildImageResizeHandle();
      this.tableToolbar = this.buildTableToolbar();
      this.bookmarkToolbar = this.buildBookmarkToolbar();
      this.findReplacePanel = this.buildFindReplacePanel();
      surface.appendChild(this.imageResizeToolbar);
      surface.appendChild(this.imageResizeHandle);
      surface.appendChild(this.tableToolbar);
      surface.appendChild(this.bookmarkToolbar);
      surface.appendChild(this.findReplacePanel);

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
      this.toolbarRows.primary = row;

      const groupUndo = document.createElement("div");
      groupUndo.className = "nw-toolbar-group";
      this.toolbarGroups.undo = groupUndo;
      groupUndo.appendChild(this.makeToolbarButton("undo", "Undo", '<span class="material-symbols-outlined">undo</span>'));
      groupUndo.appendChild(this.makeToolbarButton("redo", "Redo", '<span class="material-symbols-outlined">redo</span>'));

      const typographyControls = this.buildTypographyControls();
      this.toolbarGroups.typography = typographyControls;

      const stylesControl = this.buildStylesControl();
      this.toolbarGroups.styles = stylesControl;

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
      this.toolbarGroups.text = groupText;
      groupText.appendChild(this.makeToolbarButton("h2", "Heading 2", "H2", "nw-toolbar-button nw-text-button"));
      groupText.appendChild(this.makeToolbarButton("h3", "Heading 3", "H3", "nw-toolbar-button nw-text-button"));
      groupText.appendChild(this.makeToolbarButton("h4", "Heading 4", "H4", "nw-toolbar-button nw-text-button"));

      const groupInline = document.createElement("div");
      groupInline.className = "nw-toolbar-group";
      this.toolbarGroups.inline = groupInline;
      groupInline.appendChild(this.makeToolbarButton("bold", "Bold", "B", "nw-toolbar-button nw-text-button"));
      groupInline.appendChild(this.makeToolbarButton("italic", "Italic", "I", "nw-toolbar-button nw-text-button"));
      groupInline.appendChild(this.makeToolbarButton("underline", "Underline", "U", "nw-toolbar-button nw-text-button"));
      groupInline.appendChild(this.makeToolbarButton("strikethrough", "Strikethrough", "S", "nw-toolbar-button nw-text-button nw-text-button--strikethrough"));
      groupInline.appendChild(this.makeToolbarButton("subscript", "Subscript", "x₂", "nw-toolbar-button nw-text-button"));
      groupInline.appendChild(this.makeToolbarButton("superscript", "Superscript", "x²", "nw-toolbar-button nw-text-button"));
      groupInline.appendChild(this.makeToolbarButton("remove-formatting", "Remove formatting", "Tx", "nw-toolbar-button nw-text-button"));
      groupInline.appendChild(this.buildFormatPainterButton());
      groupInline.appendChild(this.makeToolbarButton("link", "Link", '<span class="material-symbols-outlined">link</span>'));
      groupInline.appendChild(this.makeToolbarButton("unlink", "Unlink", '<span class="material-symbols-outlined">link_off</span>'));
      groupInline.appendChild(this.makeToolbarButton("bookmark", "Insert bookmark / anchor", '<span class="material-symbols-outlined">bookmark</span>'));

      const groupBlocks = document.createElement("div");
      groupBlocks.className = "nw-toolbar-group";
      this.toolbarGroups.blocks = groupBlocks;
      groupBlocks.appendChild(this.makeToolbarButton("bulleted-list", "Bullet list", '<span class="material-symbols-outlined">format_list_bulleted</span>'));
      groupBlocks.appendChild(this.makeToolbarButton("numbered-list", "Numbered list", '<span class="material-symbols-outlined">format_list_numbered</span>'));
      groupBlocks.appendChild(this.makeToolbarButton("quote", "Quote", '<span class="material-symbols-outlined">format_quote</span>'));
      groupBlocks.appendChild(this.makeToolbarButton("horizontal-rule", "Horizontal rule", '<span class="material-symbols-outlined">horizontal_rule</span>'));

      const groupMediaAlign = document.createElement("div");
      groupMediaAlign.className = "nw-toolbar-group nw-toolbar-group--media-align";
      this.toolbarGroups.alignment = groupMediaAlign;
      groupMediaAlign.appendChild(this.makeToolbarButton("align-left", "Align left", getAlignmentIcon("left")));
      groupMediaAlign.appendChild(this.makeToolbarButton("align-center", "Align center", getAlignmentIcon("center")));
      groupMediaAlign.appendChild(this.makeToolbarButton("align-right", "Align right", getAlignmentIcon("right")));
      groupMediaAlign.appendChild(this.makeToolbarButton("align-justify", "Justify", getAlignmentIcon("justify")));

      const groupTheme = document.createElement("div");
      groupTheme.className = "nw-toolbar-group nw-toolbar-group--theme";
      this.toolbarGroups.theme = groupTheme;
      groupTheme.appendChild(this.buildThemeControl());

      row.appendChild(groupUndo);
      row.appendChild(this.makeDivider());
      row.appendChild(typographyControls);
      row.appendChild(this.makeDivider());
      row.appendChild(stylesControl);
      row.appendChild(this.headingSelect);
      row.appendChild(groupText);
      row.appendChild(this.makeDivider());
      row.appendChild(groupInline);
      row.appendChild(this.makeDivider());
      row.appendChild(groupBlocks);
      row.appendChild(this.makeDivider());
      row.appendChild(groupMediaAlign);
      row.appendChild(groupTheme);
      return row;
    }

    buildTypographyControls() {
      const group = document.createElement("div");
      group.className = "nw-toolbar-group ollow-typography-controls";

      const fontControl = document.createElement("div");
      fontControl.className = "ollow-font-control";

      const fontButton = document.createElement("button");
      fontButton.type = "button";
      fontButton.className = "ollow-font-button";
      fontButton.setAttribute("data-font-menu-toggle", "true");
      fontButton.setAttribute("aria-haspopup", "menu");
      fontButton.setAttribute("aria-expanded", "false");
      fontButton.innerHTML = `<span class="ollow-current-font">${FONT_FAMILY_LOOKUP.get(DEFAULT_FONT_FAMILY_KEY).label}</span><span class="ollow-font-arrow" aria-hidden="true">▾</span>`;
      fontButton.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.saveSelection();
      });
      fontButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.toggleFontFamilyMenu();
      });

      const fontMenu = document.createElement("div");
      fontMenu.className = "ollow-font-menu";
      fontMenu.hidden = true;
      fontMenu.setAttribute("role", "menu");
      fontMenu.innerHTML = this.buildFontMenuMarkup();
      fontMenu.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      fontMenu.addEventListener("click", (event) => {
        const option = event.target.closest("[data-font-family]");
        if (!option) return;
        event.preventDefault();
        this.applyFontFamily(option.dataset.fontFamily);
        this.closeFontFamilyMenu();
      });

      fontControl.appendChild(fontButton);
      fontControl.appendChild(fontMenu);

      const sizeControl = document.createElement("div");
      sizeControl.className = "ollow-size-control";

      const sizeDown = document.createElement("button");
      sizeDown.type = "button";
      sizeDown.className = "ollow-size-step";
      sizeDown.setAttribute("aria-label", "Decrease font size");
      sizeDown.textContent = "−";
      sizeDown.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.saveSelection();
      });
      sizeDown.addEventListener("click", (event) => {
        event.preventDefault();
        this.stepFontSize(-1);
      });

      const sizeInput = document.createElement("input");
      sizeInput.type = "number";
      sizeInput.className = "ollow-size-input";
      sizeInput.min = "8";
      sizeInput.max = "96";
      sizeInput.step = "1";
      sizeInput.value = String(DEFAULT_FONT_SIZE);
      sizeInput.setAttribute("aria-label", "Font size");
      sizeInput.addEventListener("focus", () => {
        this.saveSelection();
      });
      sizeInput.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });
      sizeInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.applyFontSize(sizeInput.value);
          this.closeFontSizeMenu();
        } else if (event.key === "Escape") {
          event.preventDefault();
          this.closeFontSizeMenu();
          this.focus();
        } else {
          event.stopPropagation();
        }
      });
      sizeInput.addEventListener("change", () => {
        this.applyFontSize(sizeInput.value);
      });

      const sizeUp = document.createElement("button");
      sizeUp.type = "button";
      sizeUp.className = "ollow-size-step";
      sizeUp.setAttribute("aria-label", "Increase font size");
      sizeUp.textContent = "+";
      sizeUp.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.saveSelection();
      });
      sizeUp.addEventListener("click", (event) => {
        event.preventDefault();
        this.stepFontSize(1);
      });

      const sizeMenu = document.createElement("div");
      sizeMenu.className = "ollow-size-menu";
      sizeMenu.hidden = true;
      sizeMenu.innerHTML = FONT_SIZE_PRESETS.map((size) => `<button type="button" data-font-size-choice="${size}">${size}</button>`).join("");
      sizeMenu.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      sizeMenu.addEventListener("click", (event) => {
        const option = event.target.closest("[data-font-size-choice]");
        if (!option) return;
        event.preventDefault();
        this.applyFontSize(option.dataset.fontSizeChoice);
        this.closeFontSizeMenu();
      });

      sizeInput.addEventListener("focus", () => {
        this.openFontSizeMenu();
      });

      sizeControl.appendChild(sizeDown);
      sizeControl.appendChild(sizeInput);
      sizeControl.appendChild(sizeUp);
      sizeControl.appendChild(sizeMenu);

      const colorControl = document.createElement("div");
      colorControl.className = "ollow-text-color-wrap";

      const colorButton = document.createElement("button");
      colorButton.type = "button";
      colorButton.className = "ollow-text-color-btn";
      colorButton.title = "Text color";
      colorButton.setAttribute("aria-label", "Text color");
      colorButton.setAttribute("aria-haspopup", "menu");
      colorButton.setAttribute("aria-expanded", "false");
      colorButton.innerHTML = `
        <span class="ollow-text-color-label" aria-hidden="true">A</span>
        <span class="ollow-text-color-bar"></span>
        <span class="ollow-text-color-arrow" aria-hidden="true">▾</span>
      `;
      colorButton.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.saveSelection();
      });
      colorButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.toggleTextColorPopover();
      });

      const colorPopover = document.createElement("div");
      colorPopover.className = "ollow-text-color-popover";
      colorPopover.hidden = true;
      colorPopover.setAttribute("role", "menu");
      colorPopover.setAttribute("aria-label", "Text color palette");
      colorPopover.innerHTML = this.buildTextColorPopoverMarkup();
      colorPopover.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      colorPopover.addEventListener("click", (event) => {
        const choice = event.target.closest("[data-text-color-choice]");
        if (choice) {
          event.preventDefault();
          this.applyTextColor(choice.dataset.textColorChoice);
          return;
        }
        const automatic = event.target.closest("[data-text-color-reset]");
        if (automatic) {
          event.preventDefault();
          this.removeTextColor();
        }
      });

      const customInput = colorPopover.querySelector("[data-text-color-custom]");
      if (customInput) {
        customInput.addEventListener("input", () => {
          const hex = normalizeHexColor(customInput.value);
          if (!hex) return;
          this.applyTextColor(hex);
        });
      }

      colorControl.appendChild(colorButton);
      colorControl.appendChild(colorPopover);

      const highlightControl = document.createElement("div");
      highlightControl.className = "ollow-highlight-wrap";

      const highlightButton = document.createElement("button");
      highlightButton.type = "button";
      highlightButton.className = "ollow-highlight-btn";
      highlightButton.title = "Highlight color";
      highlightButton.setAttribute("aria-label", "Highlight color");
      highlightButton.setAttribute("aria-haspopup", "menu");
      highlightButton.setAttribute("aria-expanded", "false");
      highlightButton.innerHTML = `
        <span class="ollow-highlight-label" aria-hidden="true">ab</span>
        <span class="ollow-highlight-bar"></span>
        <span class="ollow-highlight-arrow" aria-hidden="true">▾</span>
      `;
      highlightButton.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.saveSelection();
      });
      highlightButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.toggleHighlightPopover();
      });

      const highlightPopover = document.createElement("div");
      highlightPopover.className = "ollow-highlight-popover";
      highlightPopover.hidden = true;
      highlightPopover.setAttribute("role", "menu");
      highlightPopover.setAttribute("aria-label", "Highlight color palette");
      highlightPopover.innerHTML = this.buildHighlightPopoverMarkup();
      highlightPopover.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      highlightPopover.addEventListener("click", (event) => {
        const choice = event.target.closest("[data-highlight-choice]");
        if (choice) {
          event.preventDefault();
          this.applyHighlightColor(choice.dataset.highlightChoice);
          return;
        }
        const reset = event.target.closest("[data-highlight-reset]");
        if (reset) {
          event.preventDefault();
          this.removeHighlightColor();
        }
      });

      const highlightCustomInput = highlightPopover.querySelector("[data-highlight-custom]");
      if (highlightCustomInput) {
        highlightCustomInput.addEventListener("input", () => {
          const hex = normalizeHexColor(highlightCustomInput.value);
          if (!hex) return;
          this.applyHighlightColor(hex);
        });
      }

      highlightControl.appendChild(highlightButton);
      highlightControl.appendChild(highlightPopover);

      this.fontFamilyButton = fontButton;
      this.fontFamilyMenu = fontMenu;
      this.fontFamilyLabel = fontButton.querySelector(".ollow-current-font");
      this.fontSizeInput = sizeInput;
      this.fontSizeMenu = sizeMenu;
      this.textColorButton = colorButton;
      this.textColorBar = colorButton.querySelector(".ollow-text-color-bar");
      this.textColorPopover = colorPopover;
      this.textColorCustomInput = customInput;
      this.highlightButton = highlightButton;
      this.highlightBar = highlightButton.querySelector(".ollow-highlight-bar");
      this.highlightPopover = highlightPopover;
      this.highlightCustomInput = highlightCustomInput;

      group.appendChild(fontControl);
      group.appendChild(sizeControl);
      group.appendChild(colorControl);
      group.appendChild(highlightControl);
      return group;
    }

    buildStylesControl() {
      const wrapper = document.createElement("div");
      wrapper.className = "ollow-styles-control";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ollow-styles-button";
      button.setAttribute("aria-haspopup", "menu");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Styles");
      button.innerHTML = `<span class="ollow-styles-current">Styles</span><span class="ollow-styles-arrow" aria-hidden="true">▾</span>`;
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.saveSelection();
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.toggleStylesMenu();
      });

      const menu = document.createElement("div");
      menu.className = "ollow-styles-menu";
      menu.hidden = true;
      menu.setAttribute("role", "menu");
      menu.innerHTML = this.buildStylesMenuMarkup();
      menu.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      menu.addEventListener("click", (event) => {
        const option = event.target.closest("[data-style-preset]");
        if (!option) return;
        event.preventDefault();
        this.applyStylePreset(option.dataset.stylePreset);
        this.closeStylesMenu();
      });

      this.stylesButton = button;
      this.stylesMenu = menu;
      this.stylesLabel = button.querySelector(".ollow-styles-current");

      wrapper.appendChild(button);
      wrapper.appendChild(menu);
      return wrapper;
    }

    buildFormatPainterButton() {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nw-toolbar-button ollow-format-painter-button";
      button.title = "Format Painter";
      button.setAttribute("aria-label", "Format Painter");
      button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 7h10v3l4 4v3h-2v4h-3v-6l-3-3H4z" fill="currentColor"></path>
          <path d="M6 3h8v3H6z" fill="currentColor"></path>
        </svg>
      `;
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.saveSelection();
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        window.clearTimeout(this.formatPainterClickTimer);
        this.formatPainterClickTimer = window.setTimeout(() => {
          this.armFormatPainter(false);
        }, 180);
      });
      button.addEventListener("dblclick", (event) => {
        event.preventDefault();
        window.clearTimeout(this.formatPainterClickTimer);
        this.armFormatPainter(true);
      });
      this.toolbarButtons["format-painter"] = button;
      this.formatPainterButton = button;
      return button;
    }

    buildStylesMenuMarkup() {
      return STYLE_PRESETS.map((preset) => this.buildStyleOptionMarkup(preset)).join("");
    }

    buildStyleOptionMarkup(preset) {
      const previewClass = preset.className ? ` ${preset.className}` : "";
      return `<button type="button" class="ollow-style-option" data-style-preset="${escapeHtml(preset.key)}"><span class="ollow-style-option-check" aria-hidden="true">✓</span><span class="ollow-style-option-preview${previewClass}">${escapeHtml(preset.label)}</span></button>`;
    }

    buildFontMenuMarkup() {
      const recentFonts = this.getRecentFonts();
      return `
        <div class="ollow-font-menu-section">
          <div class="ollow-font-menu-label">Recent Fonts</div>
          ${recentFonts.map((key) => this.buildFontOptionMarkup(key)).join("")}
        </div>
        <div class="ollow-font-menu-section">
          <div class="ollow-font-menu-label">All Fonts</div>
          ${FONT_FAMILIES.map((font) => this.buildFontOptionMarkup(font.key)).join("")}
        </div>
      `;
    }

    buildFontOptionMarkup(key) {
      const font = FONT_FAMILY_LOOKUP.get(key);
      if (!font) return "";
      return `<button type="button" class="ollow-font-option" data-font-family="${escapeHtml(font.key)}" style="font-family:${escapeHtml(font.stack)};"><span class="ollow-font-option-check" aria-hidden="true">✓</span><span>${escapeHtml(font.label)}</span></button>`;
    }

    buildTextColorPopoverMarkup() {
      const recentColors = this.getRecentTextColors();
      const standardColors = TEXT_COLOR_PRESETS.filter((color) => color.section === "standard");
      const newsroomColors = TEXT_COLOR_PRESETS.filter((color) => color.section === "newsroom");
      return `
        <div class="ollow-text-color-section">
          <button type="button" class="ollow-text-color-reset" data-text-color-reset="true">
            <span class="ollow-text-color-reset-icon">A</span>
            <span>Automatic</span>
          </button>
        </div>
        ${recentColors.length ? `
          <div class="ollow-text-color-section">
            <div class="ollow-text-color-section-label">Recent Colors</div>
            <div class="ollow-text-color-grid">
              ${recentColors.map((hex) => this.buildRecentTextColorMarkup(hex)).join("")}
            </div>
          </div>
        ` : ""}
        <div class="ollow-text-color-section">
          <div class="ollow-text-color-section-label">Theme Colors</div>
          <div class="ollow-text-color-grid">
            ${newsroomColors.map((color) => this.buildTextColorOptionMarkup(color)).join("")}
          </div>
        </div>
        <div class="ollow-text-color-section">
          <div class="ollow-text-color-section-label">Standard Colors</div>
          <div class="ollow-text-color-grid">
            ${standardColors.map((color) => this.buildTextColorOptionMarkup(color)).join("")}
          </div>
        </div>
        <div class="ollow-text-color-section">
          <div class="ollow-text-color-section-label">Custom Color</div>
          <label class="ollow-text-color-custom-row">
            <input type="color" value="${escapeHtml(DEFAULT_TEXT_COLOR)}" data-text-color-custom>
            <span class="ollow-text-color-custom-value">${escapeHtml(DEFAULT_TEXT_COLOR)}</span>
          </label>
        </div>
      `;
    }

    buildTextColorOptionMarkup(color) {
      return `<button type="button" class="ollow-text-color-swatch" data-text-color-choice="${escapeHtml(color.key)}" data-text-color-hex="${escapeHtml(color.hex)}" title="${escapeHtml(color.label)}" aria-label="${escapeHtml(color.label)}"><span class="ollow-text-color-chip" style="background:${escapeHtml(color.hex)};"></span><span class="ollow-text-color-name">${escapeHtml(color.label)}</span></button>`;
    }

    buildRecentTextColorMarkup(hex) {
      return `<button type="button" class="ollow-text-color-swatch" data-text-color-choice="${escapeHtml(hex)}" data-text-color-hex="${escapeHtml(hex)}" title="${escapeHtml(hex)}" aria-label="${escapeHtml(hex)}"><span class="ollow-text-color-chip" style="background:${escapeHtml(hex)};"></span><span class="ollow-text-color-name">${escapeHtml(hex.toUpperCase())}</span></button>`;
    }

    buildHighlightPopoverMarkup() {
      return `
        <div class="ollow-highlight-section">
          <button type="button" class="ollow-highlight-reset" data-highlight-reset="true">
            <span class="ollow-highlight-reset-icon">ab</span>
            <span>No highlight</span>
          </button>
        </div>
        <div class="ollow-highlight-section">
          <div class="ollow-highlight-section-label">Preset Colors</div>
          <div class="ollow-highlight-grid">
            ${HIGHLIGHT_COLOR_PRESETS.map((color) => this.buildHighlightOptionMarkup(color)).join("")}
          </div>
        </div>
        <div class="ollow-highlight-section">
          <div class="ollow-highlight-section-label">Custom Color</div>
          <label class="ollow-highlight-custom-row">
            <input type="color" value="${escapeHtml(DEFAULT_HIGHLIGHT_COLOR)}" data-highlight-custom>
            <span class="ollow-highlight-custom-value">${escapeHtml(DEFAULT_HIGHLIGHT_COLOR)}</span>
          </label>
        </div>
      `;
    }

    buildHighlightOptionMarkup(color) {
      return `<button type="button" class="ollow-highlight-swatch" data-highlight-choice="${escapeHtml(color.key)}" data-highlight-hex="${escapeHtml(color.hex)}" title="${escapeHtml(color.label)}" aria-label="${escapeHtml(color.label)}"><span class="ollow-highlight-chip" style="background:${escapeHtml(color.hex)};"></span><span class="ollow-highlight-name">${escapeHtml(color.label)}</span></button>`;
    }

    openStylesMenu() {
      if (!this.stylesMenu || !this.stylesButton) return;
      this.closeThemeMenu();
      this.closeFontFamilyMenu();
      this.closeFontSizeMenu();
      this.closeTextColorPopover();
      this.closeHighlightPopover();
      this.stylesMenu.hidden = false;
      this.stylesButton.setAttribute("aria-expanded", "true");
      this.updateStylesToolbarState();
    }

    closeStylesMenu() {
      if (!this.stylesMenu || !this.stylesButton) return;
      this.stylesMenu.hidden = true;
      this.stylesButton.setAttribute("aria-expanded", "false");
    }

    toggleStylesMenu() {
      if (!this.stylesMenu) return;
      if (this.stylesMenu.hidden) {
        this.openStylesMenu();
      } else {
        this.closeStylesMenu();
      }
    }

    buildThemeControl() {
      const wrapper = document.createElement("div");
      wrapper.className = "ollow-theme-control";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "nw-toolbar-button ollow-theme-toggle";
      button.title = "Change editor theme";
      button.setAttribute("aria-label", "Change editor theme");
      button.setAttribute("aria-haspopup", "menu");
      button.setAttribute("aria-expanded", "false");
      button.dataset.action = "theme-toggle";
      button.innerHTML = getThemeIcon(this.theme);
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.toggleThemeMenu();
      });

      const menu = document.createElement("div");
      menu.className = "ollow-theme-menu";
      menu.hidden = true;
      menu.setAttribute("role", "menu");
      menu.setAttribute("aria-label", "Editor theme");
      menu.innerHTML = `
        <button type="button" role="menuitemradio" data-theme-choice="light">${getThemeIcon("light")}<span>Light</span></button>
        <button type="button" role="menuitemradio" data-theme-choice="dark">${getThemeIcon("dark")}<span>Dark</span></button>
        <button type="button" role="menuitemradio" data-theme-choice="auto">${getThemeIcon("auto")}<span>Auto</span></button>
      `;
      menu.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      menu.addEventListener("click", (event) => {
        const choice = event.target.closest("[data-theme-choice]");
        if (!choice) return;
        event.preventDefault();
        this.setTheme(choice.dataset.themeChoice);
        this.closeThemeMenu();
      });

      this.themeToggleButton = button;
      this.themeMenu = menu;
      wrapper.appendChild(button);
      wrapper.appendChild(menu);
      this.updateThemeControlState();
      return wrapper;
    }

    buildToolbarInsert() {
      const row = document.createElement("div");
      row.className = "nw-insert-row";
      this.toolbarRows.insert = row;
      this.toolbarGroups.insert = row;

      const insertItems = [
        ["pull-quote", "Pull Quote", "format_quote"],
        ["image", "Image", "image"],
        ["code", "Code", "code_blocks"],
        ["table", "Table", "table"],
        ["bookmark", "Bookmark", "bookmark"],
        ["source-html", "HTML", ""],
        ["find-replace", "Find / Replace", "search"],
        ["special-characters", "Ω Symbols", ""],
        ["emoji", "Emoji", ""],
        ["import-markdown", "Import MD", "upload_file"],
        ["export-markdown", "Export MD", "download"],
        ["gallery", "Gallery", "photo_library"],
        ["embed", "Embed", "smart_display"],
        ["related", "Related", "article"],
        ["fact-box", "Fact Box", "fact_check"],
        ["attachment", "Attachment", "attach_file"],
      ];

      insertItems.forEach(([action, label, icon]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `nw-insert-pill${action === "bookmark" ? " ollow-bookmark-btn" : ""}`;
        button.dataset.action = action;
        button.setAttribute("aria-pressed", "false");
        const shortcutLabel = TOOLBAR_SHORTCUT_LABELS[action];
        const fullTitle = shortcutLabel ? `${label} (${shortcutLabel.replace(/mod/gi, "Ctrl/Cmd")})` : label;
        button.title = fullTitle;
        button.setAttribute("aria-label", fullTitle);
        button.innerHTML = action === "special-characters"
          ? `<span class="ollow-special-char-pill-icon" aria-hidden="true">Ω</span>${label}`
          : action === "emoji"
            ? `<span class="ollow-special-char-pill-icon" aria-hidden="true">☺</span>${label}`
          : action === "source-html"
            ? `<span class="ollow-special-char-pill-icon" aria-hidden="true">&lt;&gt;</span>${label}`
          : `<span class="material-symbols-outlined">${icon}</span>${label}`;
        this.toolbarButtons[action] = button;
        row.appendChild(button);
      });

      return row;
    }

    buildSourcePanel() {
      const panel = document.createElement("div");
      panel.className = "nw-source-panel";
      panel.hidden = true;

      const toolbar = document.createElement("div");
      toolbar.className = "nw-source-toolbar";
      toolbar.innerHTML = `
        <span class="nw-source-label">Source / HTML mode</span>
        <button type="button" class="nw-modal-button nw-modal-button--secondary" data-source-action="format-source">Format HTML</button>
      `;
      this.sourceToolbar = toolbar;
      panel.appendChild(toolbar);

      const textarea = document.createElement("textarea");
      textarea.className = "nw-source-textarea";
      textarea.setAttribute("spellcheck", "false");
      textarea.setAttribute("aria-label", "Source HTML");
      this.sourceTextarea = textarea;
      panel.appendChild(textarea);

      toolbar.addEventListener("click", (event) => {
        const button = event.target.closest("[data-source-action]");
        if (!button) return;
        event.preventDefault();
        if (button.dataset.sourceAction === "format-source") {
          this.formatSourceHTML();
        }
      });

      textarea.addEventListener("input", () => {
        this.handleSourceInput();
      });
      textarea.addEventListener("keydown", (event) => {
        const isMod = event.ctrlKey || event.metaKey;
        if (isMod && event.shiftKey && event.key.toLowerCase() === "u") {
          event.preventDefault();
          this.exitSourceMode();
        }
      });

      return panel;
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
      this.modalActions = modal.querySelector(".nw-editor-modal-footer");
      this.modalPanel = modal.querySelector(".nw-editor-modal-panel");
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
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="align-left" title="Align left" aria-label="Align left">${getAlignmentIcon("left")}</button>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="align-center" title="Align center" aria-label="Align center">${getAlignmentIcon("center")}</button>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="align-right" title="Align right" aria-label="Align right">${getAlignmentIcon("right")}</button>
        </div>
        <span class="ollow-media-toolbar-divider"></span>
        <div class="ollow-media-toolbar-group" data-role="width-controls">
          <button type="button" class="ollow-media-toolbar-pill" data-image-action="width-wide" title="Wide" aria-label="Wide">W</button>
          <button type="button" class="ollow-media-toolbar-pill" data-image-action="width-full" title="Full width" aria-label="Full width">F</button>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="reset-align" title="Reset alignment" aria-label="Reset alignment">${getInlineToolbarIcon("reset")}</button>
        </div>
        <span class="ollow-media-toolbar-divider" data-role="size-divider"></span>
        <div class="ollow-media-toolbar-group" data-role="size-controls">
          <button type="button" class="ollow-media-toolbar-pill" data-image-action="size-small" title="Small" aria-label="Small">S</button>
          <button type="button" class="ollow-media-toolbar-pill" data-image-action="size-medium" title="Medium" aria-label="Medium">M</button>
          <button type="button" class="ollow-media-toolbar-pill" data-image-action="size-large" title="Large" aria-label="Large">L</button>
          <button type="button" class="ollow-media-toolbar-pill" data-image-action="size-full" title="Full size" aria-label="Full size">F</button>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="reset-size" title="Reset size" aria-label="Reset size">${getInlineToolbarIcon("reset")}</button>
        </div>
        <span class="ollow-media-toolbar-divider" data-role="image-divider" hidden></span>
        <div class="ollow-media-toolbar-group" data-role="image-controls" hidden>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="edit-image" title="Edit image" aria-label="Edit image">${getInlineToolbarIcon("edit")}</button>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="replace-image" title="Replace image" aria-label="Replace image">${getInlineToolbarIcon("replace")}</button>
          <button type="button" class="ollow-media-toolbar-pill" data-image-action="alt-text" title="Alt text" aria-label="Alt text">ALT</button>
          <button type="button" class="ollow-media-toolbar-pill" data-image-action="caption" title="Caption" aria-label="Caption">CC</button>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="link-image" title="Link image" aria-label="Link image">${getInlineToolbarIcon("link")}</button>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="new-tab" title="Open in new tab" aria-label="Open in new tab">${getInlineToolbarIcon("external")}</button>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="remove-link" title="Remove link" aria-label="Remove link">${getInlineToolbarIcon("unlink")}</button>
        </div>
        <span class="ollow-media-toolbar-divider" data-role="delete-divider" hidden></span>
        <div class="ollow-media-toolbar-group" data-role="delete-controls" hidden>
          <button type="button" class="ollow-media-toolbar-icon is-danger" data-image-action="delete-image" title="Delete image" aria-label="Delete image">${getInlineToolbarIcon("delete")}</button>
        </div>
        <span class="ollow-media-toolbar-divider" data-role="code-divider" hidden></span>
        <div class="ollow-media-toolbar-group" data-role="code-controls" hidden>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="edit-code" title="Edit code" aria-label="Edit code">${getInlineToolbarIcon("edit")}</button>
          <button type="button" class="ollow-media-toolbar-icon" data-image-action="copy" title="Copy HTML" aria-label="Copy HTML">${getInlineToolbarIcon("replace")}</button>
          <button type="button" class="ollow-media-toolbar-icon is-danger" data-image-action="delete-code" title="Delete code block" aria-label="Delete code block">${getInlineToolbarIcon("delete")}</button>
        </div>
      `;

      toolbar.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });

      toolbar.addEventListener("click", (event) => {
        const imageButton = event.target.closest("[data-image-action]");
        if (!imageButton) return;
        event.preventDefault();
        event.stopPropagation();
        this.handleImageToolbarAction(imageButton.dataset.imageAction, imageButton);
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
        <div class="ollow-table-toolbar-group">
          <button type="button" data-table-action="row-above" title="Add row above">Row Above</button>
          <button type="button" data-table-action="row-below" title="Add row below">Row Below</button>
          <button type="button" data-table-action="delete-row" title="Delete current row">Delete Row</button>
        </div>
        <div class="ollow-table-toolbar-group">
          <button type="button" data-table-action="col-left" title="Add column left">Col Left</button>
          <button type="button" data-table-action="col-right" title="Add column right">Col Right</button>
          <button type="button" data-table-action="delete-col" title="Delete current column">Delete Col</button>
        </div>
        <div class="ollow-table-toolbar-group">
          <button type="button" data-table-action="toggle-header-row" title="Toggle header row">Header Row</button>
          <button type="button" data-table-action="toggle-header-col" title="Toggle header column">Header Col</button>
        </div>
        <div class="ollow-table-toolbar-group">
          <button type="button" data-table-action="merge-cells" title="Merge selected cells">Merge</button>
          <button type="button" data-table-action="split-cell" title="Split merged cell">Split</button>
        </div>
        <div class="ollow-table-toolbar-group">
          <button type="button" data-table-action="table-properties" title="Table properties">Properties</button>
          <button type="button" data-table-action="delete-table" title="Delete table" class="is-danger">Delete</button>
        </div>
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

    buildBookmarkToolbar() {
      const toolbar = document.createElement("div");
      toolbar.className = "ollow-bookmark-toolbar";
      toolbar.hidden = true;
      toolbar.innerHTML = `
        <button type="button" data-bookmark-action="edit" title="Edit bookmark" aria-label="Edit bookmark">${getInlineToolbarIcon("edit")}</button>
        <button type="button" data-bookmark-action="copy" title="Copy bookmark link" aria-label="Copy bookmark link">${getInlineToolbarIcon("copy")}</button>
        <button type="button" data-bookmark-action="delete" title="Delete bookmark" aria-label="Delete bookmark" class="is-danger">${getInlineToolbarIcon("delete")}</button>
      `;

      toolbar.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });

      toolbar.addEventListener("click", (event) => {
        const button = event.target.closest("[data-bookmark-action]");
        if (!button) return;
        event.preventDefault();
        this.handleBookmarkAction(button.dataset.bookmarkAction);
      });

      return toolbar;
    }

    buildFindReplacePanel() {
      const panel = document.createElement("div");
      panel.className = "ollow-find-replace-panel";
      panel.hidden = true;
      panel.innerHTML = `
        <div class="ollow-find-replace-row">
          <input type="search" class="nw-modal-input" data-role="find" placeholder="Find">
          <input type="text" class="nw-modal-input" data-role="replace" placeholder="Replace">
          <button type="button" class="nw-modal-button nw-modal-button--secondary" data-action="close">Close</button>
        </div>
        <div class="ollow-find-replace-row ollow-find-replace-row--options">
          <label><input type="checkbox" data-role="match-case"> Match case</label>
          <label><input type="checkbox" data-role="whole-word"> Whole word</label>
          <label><input type="checkbox" data-role="highlight-all" checked> Highlight all</label>
          <label><input type="checkbox" data-role="include-code"> Include code blocks</label>
          <span class="ollow-find-replace-count" data-role="count">0 of 0</span>
        </div>
        <div class="ollow-find-replace-row ollow-find-replace-row--actions">
          <button type="button" class="nw-modal-button nw-modal-button--secondary" data-action="previous">Previous</button>
          <button type="button" class="nw-modal-button nw-modal-button--secondary" data-action="next">Next</button>
          <button type="button" class="nw-modal-button nw-modal-button--secondary" data-action="replace">Replace</button>
          <button type="button" class="nw-modal-button nw-modal-button--primary" data-action="replace-all">Replace All</button>
        </div>
      `;

      this.findReplaceElements = {
        find: panel.querySelector('[data-role="find"]'),
        replace: panel.querySelector('[data-role="replace"]'),
        matchCase: panel.querySelector('[data-role="match-case"]'),
        wholeWord: panel.querySelector('[data-role="whole-word"]'),
        highlightAll: panel.querySelector('[data-role="highlight-all"]'),
        includeCode: panel.querySelector('[data-role="include-code"]'),
        count: panel.querySelector('[data-role="count"]'),
      };

      panel.addEventListener("mousedown", (event) => {
        if (event.target.closest("[data-action]")) {
          event.preventDefault();
        }
        event.stopPropagation();
      });

      panel.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        event.preventDefault();
        const action = button.dataset.action;
        if (action === "close") {
          this.closeFindReplacePanel({ restoreSelection: true });
        } else if (action === "previous") {
          this.moveFindMatch(-1);
        } else if (action === "next") {
          this.moveFindMatch(1);
        } else if (action === "replace") {
          this.replaceCurrentFindMatch();
        } else if (action === "replace-all") {
          this.replaceAllFindMatches();
        }
      });

      const refresh = () => {
        const cursorStart = this.findReplaceElements.find?.selectionStart ?? null;
        const cursorEnd = this.findReplaceElements.find?.selectionEnd ?? null;
        this.refreshFindReplaceResults({
          preserveCurrent: true,
          moveEditorSelection: false,
          preservePanelFocus: true,
        });
        if (this.findReplaceElements.find && document.activeElement !== this.findReplaceElements.find) {
          this.findReplaceElements.find.focus();
        }
        if (
          this.findReplaceElements.find &&
          cursorStart !== null &&
          cursorEnd !== null &&
          typeof this.findReplaceElements.find.setSelectionRange === "function"
        ) {
          this.findReplaceElements.find.setSelectionRange(cursorStart, cursorEnd);
        }
      };
      this.findReplaceElements.find?.addEventListener("input", refresh);
      this.findReplaceElements.matchCase?.addEventListener("change", refresh);
      this.findReplaceElements.wholeWord?.addEventListener("change", refresh);
      this.findReplaceElements.highlightAll?.addEventListener("change", () => {
        this.updateFindHighlightVisibility();
      });
      this.findReplaceElements.includeCode?.addEventListener("change", refresh);
      this.findReplaceElements.find?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.moveFindMatch(event.shiftKey ? -1 : 1);
        } else if (event.key === "Escape") {
          event.preventDefault();
          this.closeFindReplacePanel({ restoreSelection: true });
        }
      });
      this.findReplaceElements.replace?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.replaceCurrentFindMatch();
        } else if (event.key === "Escape") {
          event.preventDefault();
          this.closeFindReplacePanel({ restoreSelection: true });
        }
      });

      return panel;
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
      const shortcutLabel = TOOLBAR_SHORTCUT_LABELS[action];
      const fullTitle = shortcutLabel ? `${title} (${shortcutLabel.replace(/mod/gi, "Ctrl/Cmd")})` : title;
      button.title = fullTitle;
      button.setAttribute("aria-label", fullTitle);
      button.innerHTML = content;
      this.toolbarButtons[action] = button;
      return button;
    }

    isSourceMode() {
      return Boolean(this.sourceMode);
    }

    toggleSourceMode() {
      if (this.isSourceMode()) {
        this.exitSourceMode();
      } else {
        this.enterSourceMode();
      }
    }

    enterSourceMode() {
      if (this.isSourceMode() || !this.sourcePanel || !this.sourceTextarea) return;
      this.closeModal({ restoreSelection: false, focusEditor: false });
      this.closeFindReplacePanel();
      this.closeThemeMenu();
      this.closeFontFamilyMenu();
      this.closeFontSizeMenu();
      this.closeStylesMenu();
      this.closeTextColorPopover();
      this.closeHighlightPopover();
      this.clearMediaSelection();
      this.clearTableSelection();
      this.clearBookmarkSelection();
      this.sourceTextarea.value = formatHtmlForSource(this.getHTML());
      this.sourceMode = true;
      this.wrapper.classList.add("is-source-mode");
      this.content.hidden = true;
      this.sourcePanel.hidden = false;
      this.isFocused = false;
      this.updateToolbarState();
      this.updateStatus();
      window.setTimeout(() => {
        this.sourceTextarea.focus();
        this.sourceTextarea.setSelectionRange(0, 0);
      }, 0);
    }

    exitSourceMode() {
      if (!this.isSourceMode()) return;
      const clean = this.getSourceHTML();
      this.sourceMode = false;
      this.wrapper.classList.remove("is-source-mode");
      this.sourcePanel.hidden = true;
      this.content.hidden = false;
      this.content.innerHTML = clean;
      this.clearMediaSelection();
      this.clearTableSelection();
      this.clearBookmarkSelection();
      this.focus();
      this.handleContentChange();
    }

    getSourceHTML() {
      return this.sanitizeHTML(String(this.sourceTextarea?.value || ""));
    }

    formatSourceHTML() {
      if (!this.sourceTextarea) return;
      const start = this.sourceTextarea.selectionStart || 0;
      const end = this.sourceTextarea.selectionEnd || 0;
      this.sourceTextarea.value = formatHtmlForSource(this.getSourceHTML());
      this.handleSourceInput();
      this.sourceTextarea.focus();
      this.sourceTextarea.setSelectionRange(Math.min(start, this.sourceTextarea.value.length), Math.min(end, this.sourceTextarea.value.length));
    }

    handleSourceInput() {
      if (!this.isSourceMode()) return;
      this.isDirty = true;
      this.sync({ autosave: false, preserveDirty: true });
      this.updateMetricsFromHTML(this.getSourceHTML());
      this.updateStatus();
      this.updateToolbarState();
      this.scheduleAutosave();
      this.dispatch("nationwire-editor:change");
      this.emit("change", { editor: this, html: this.textarea.value });
    }

    getTheme() {
      return this.theme;
    }

    getEffectiveTheme() {
      if (this.theme === "auto") {
        return this.systemThemeQuery && this.systemThemeQuery.matches ? "dark" : "light";
      }
      return this.theme === "dark" ? "dark" : "light";
    }

    applyTheme() {
      if (!this.wrapper) return;
      this.wrapper.classList.remove("ollow-theme-light", "ollow-theme-dark", "ollow-theme-auto");
      this.wrapper.classList.add(`ollow-theme-${this.theme}`);
      this.wrapper.dataset.theme = this.getEffectiveTheme();
      this.updateThemeControlState();
    }

    handleSystemThemeChange() {
      if (this.theme === "auto") {
        this.applyTheme();
        this.dispatchThemeChange();
      }
    }

    setTheme(theme) {
      const nextTheme = ["light", "dark", "auto"].includes(theme) ? theme : "light";
      if (this.theme === nextTheme) {
        this.applyTheme();
        return this.theme;
      }
      this.theme = nextTheme;
      if (this.persistTheme) {
        writeStoredTheme(this.themeStorageKey, this.theme);
      }
      this.applyTheme();
      this.dispatchThemeChange();
      return this.theme;
    }

    updateThemeControlState() {
      if (this.themeToggleButton) {
        this.themeToggleButton.innerHTML = getThemeIcon(this.theme);
        this.themeToggleButton.title = `Theme: ${this.theme[0].toUpperCase()}${this.theme.slice(1)}`;
        this.themeToggleButton.setAttribute("aria-label", `Theme: ${this.theme}`);
      }
      if (!this.themeMenu) return;
      Array.from(this.themeMenu.querySelectorAll("[data-theme-choice]")).forEach((button) => {
        const isActive = button.dataset.themeChoice === this.theme;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-checked", isActive ? "true" : "false");
      });
    }

    openThemeMenu() {
      if (!this.themeMenu || !this.themeToggleButton) return;
      this.updateThemeControlState();
      this.themeMenu.hidden = false;
      this.themeToggleButton.setAttribute("aria-expanded", "true");
    }

    closeThemeMenu() {
      if (!this.themeMenu || !this.themeToggleButton) return;
      this.themeMenu.hidden = true;
      this.themeToggleButton.setAttribute("aria-expanded", "false");
    }

    toggleThemeMenu() {
      if (!this.themeMenu) return;
      this.closeStylesMenu();
      this.closeFontFamilyMenu();
      this.closeFontSizeMenu();
      this.closeTextColorPopover();
      this.closeHighlightPopover();
      if (this.themeMenu.hidden) {
        this.openThemeMenu();
      } else {
        this.closeThemeMenu();
      }
    }

    dispatchThemeChange() {
      const detail = {
        theme: this.theme,
        resolvedTheme: this.getEffectiveTheme(),
        editor: this,
        textarea: this.textarea,
      };
      this.textarea.dispatchEvent(
        new CustomEvent("ollow-editor:themechange", {
          bubbles: true,
          detail,
        })
      );
      this.emit("themechange", detail);
    }

    openFontFamilyMenu() {
      if (!this.fontFamilyMenu || !this.fontFamilyButton) return;
      this.closeThemeMenu();
      this.closeStylesMenu();
      this.closeFontSizeMenu();
      this.closeTextColorPopover();
      this.closeHighlightPopover();
      this.refreshFontMenu();
      this.fontFamilyMenu.hidden = false;
      this.fontFamilyButton.setAttribute("aria-expanded", "true");
      this.updateFontToolbarState();
    }

    closeFontFamilyMenu() {
      if (!this.fontFamilyMenu || !this.fontFamilyButton) return;
      this.fontFamilyMenu.hidden = true;
      this.fontFamilyButton.setAttribute("aria-expanded", "false");
    }

    toggleFontFamilyMenu() {
      if (!this.fontFamilyMenu) return;
      if (this.fontFamilyMenu.hidden) {
        this.openFontFamilyMenu();
      } else {
        this.closeFontFamilyMenu();
      }
    }

    openFontSizeMenu() {
      if (!this.fontSizeMenu) return;
      this.closeThemeMenu();
      this.closeStylesMenu();
      this.closeFontFamilyMenu();
      this.closeTextColorPopover();
      this.closeHighlightPopover();
      this.fontSizeMenu.hidden = false;
      this.updateFontToolbarState();
    }

    closeFontSizeMenu() {
      if (!this.fontSizeMenu) return;
      this.fontSizeMenu.hidden = true;
    }

    getSelectionRangeInEditor() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      return this.content.contains(range.commonAncestorContainer) ? range : null;
    }

    getCurrentTextBlock() {
      const range = this.getSelectionRangeInEditor() || this.savedSelection;
      if (!range || !this.content.contains(range.commonAncestorContainer)) return null;
      return getClosestAlignableTextBlock(range.commonAncestorContainer, this.content) || closestBlock(range.commonAncestorContainer, this.content);
    }

    getRecentFonts() {
      const fonts = Array.isArray(this.recentFonts) ? this.recentFonts : [];
      const unique = [];
      fonts.forEach((key) => {
        if (FONT_FAMILY_LOOKUP.has(key) && !unique.includes(key)) {
          unique.push(key);
        }
      });
      DEFAULT_RECENT_FONT_KEYS.forEach((key) => {
        if (FONT_FAMILY_LOOKUP.has(key) && !unique.includes(key) && unique.length < 5) {
          unique.push(key);
        }
      });
      return unique.slice(0, 5);
    }

    rememberRecentFont(fontKey) {
      if (!FONT_FAMILY_LOOKUP.has(fontKey)) return;
      const recentFonts = this.getRecentFonts().filter((key) => key !== fontKey);
      recentFonts.unshift(fontKey);
      this.recentFonts = recentFonts.slice(0, 5);
      writeStoredRecentFonts(this.recentFonts);
      this.refreshFontMenu();
    }

    refreshFontMenu() {
      if (!this.fontFamilyMenu) return;
      this.fontFamilyMenu.innerHTML = this.buildFontMenuMarkup();
    }

    getRecentTextColors() {
      const colors = Array.isArray(this.recentTextColors) ? this.recentTextColors : [];
      const unique = [];
      colors.forEach((value) => {
        const hex = normalizeHexColor(value);
        if (hex && !unique.includes(hex)) {
          unique.push(hex);
        }
      });
      return unique.slice(0, 6);
    }

    rememberRecentTextColor(value) {
      const hex = normalizeHexColor(value);
      if (!hex) return;
      const recentColors = this.getRecentTextColors().filter((item) => item !== hex);
      recentColors.unshift(hex);
      this.recentTextColors = recentColors.slice(0, 6);
      writeStoredRecentColors(this.recentTextColors);
      this.refreshTextColorPopover();
    }

    refreshTextColorPopover() {
      if (!this.textColorPopover) return;
      this.textColorPopover.innerHTML = this.buildTextColorPopoverMarkup();
      this.textColorCustomInput = this.textColorPopover.querySelector("[data-text-color-custom]");
      if (this.textColorCustomInput) {
        this.textColorCustomInput.addEventListener("input", () => {
          const hex = normalizeHexColor(this.textColorCustomInput.value);
          if (!hex) return;
          this.applyTextColor(hex);
        });
      }
      this.updateColorToolbarState();
    }

    getCurrentFontFamily() {
      const range = this.getSelectionRangeInEditor() || this.savedSelection;
      let current = range ? (range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer) : null;
      while (current && current !== this.content) {
        const key = getFontFamilyFromElement(current);
        if (key) return key;
        current = current.parentNode;
      }
      return DEFAULT_FONT_FAMILY_KEY;
    }

    getCurrentFontSize() {
      const range = this.getSelectionRangeInEditor() || this.savedSelection;
      let current = range ? (range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer) : null;
      while (current && current !== this.content) {
        const size = getFontSizeFromElement(current);
        if (size) return size;
        current = current.parentNode;
      }
      return DEFAULT_FONT_SIZE;
    }

    updateFontToolbarState() {
      const currentFont = this.getCurrentFontFamily();
      const currentSize = this.getCurrentFontSize();
      const font = FONT_FAMILY_LOOKUP.get(currentFont) || FONT_FAMILY_LOOKUP.get(DEFAULT_FONT_FAMILY_KEY);
      if (this.fontFamilyLabel) {
        this.fontFamilyLabel.textContent = font.label;
        this.fontFamilyLabel.style.fontFamily = font.stack;
      }
      if (this.fontSizeInput) {
        this.fontSizeInput.value = String(currentSize || DEFAULT_FONT_SIZE);
      }
      if (this.fontFamilyMenu) {
        Array.from(this.fontFamilyMenu.querySelectorAll("[data-font-family]")).forEach((button) => {
          const isActive = button.dataset.fontFamily === currentFont;
          button.classList.toggle("is-active", isActive);
        });
      }
      if (this.fontSizeMenu) {
        Array.from(this.fontSizeMenu.querySelectorAll("[data-font-size-choice]")).forEach((button) => {
          const isActive = Number(button.dataset.fontSizeChoice) === currentSize;
          button.classList.toggle("is-active", isActive);
        });
      }
    }

    getCurrentTextColor() {
      const range = this.getSelectionRangeInEditor() || this.savedSelection;
      let current = range ? (range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer) : null;
      while (current && current !== this.content) {
        const color = getTextColorFromElement(current);
        if (color) {
          return color;
        }
        current = current.parentNode;
      }
      return { type: "default", key: "", hex: DEFAULT_TEXT_COLOR };
    }

    updateColorToolbarState() {
      const current = this.getCurrentTextColor();
      const activeHex = normalizeHexColor(current && current.hex) || DEFAULT_TEXT_COLOR;
      if (this.textColorBar) {
        this.textColorBar.style.background = activeHex;
      }
      if (this.textColorButton) {
        this.textColorButton.setAttribute("aria-expanded", this.textColorPopover && !this.textColorPopover.hidden ? "true" : "false");
      }
      if (this.textColorCustomInput) {
        this.textColorCustomInput.value = activeHex;
        const valueLabel = this.textColorCustomInput.parentNode && this.textColorCustomInput.parentNode.querySelector(".ollow-text-color-custom-value");
        if (valueLabel) {
          valueLabel.textContent = activeHex.toUpperCase();
        }
      }
      if (!this.textColorPopover) return;
      Array.from(this.textColorPopover.querySelectorAll("[data-text-color-choice]")).forEach((button) => {
        const choice = String(button.dataset.textColorChoice || "");
        const swatchHex = normalizeHexColor(button.dataset.textColorHex || choice);
        const isPresetMatch = current.type === "preset" && choice === current.key;
        const isCustomMatch = current.type !== "preset" && swatchHex && swatchHex === activeHex;
        button.classList.toggle("is-active", isPresetMatch || isCustomMatch);
      });
      const resetButton = this.textColorPopover.querySelector("[data-text-color-reset]");
      if (resetButton) {
        resetButton.classList.toggle("is-active", current.type === "default");
      }
    }

    openTextColorPopover() {
      if (!this.textColorPopover || !this.textColorButton) return;
      this.closeThemeMenu();
      this.closeStylesMenu();
      this.closeFontFamilyMenu();
      this.closeFontSizeMenu();
      this.closeHighlightPopover();
      this.refreshTextColorPopover();
      this.textColorPopover.hidden = false;
      this.textColorButton.setAttribute("aria-expanded", "true");
      this.updateColorToolbarState();
    }

    closeTextColorPopover() {
      if (!this.textColorPopover || !this.textColorButton) return;
      this.textColorPopover.hidden = true;
      this.textColorButton.setAttribute("aria-expanded", "false");
    }

    toggleTextColorPopover() {
      if (!this.textColorPopover) return;
      if (this.textColorPopover.hidden) {
        this.openTextColorPopover();
      } else {
        this.closeTextColorPopover();
      }
    }

    getCurrentHighlightColor() {
      const range = this.getSelectionRangeInEditor() || this.savedSelection;
      let current = range ? (range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer) : null;
      while (current && current !== this.content) {
        const highlight = getHighlightColorFromElement(current);
        if (highlight) {
          return highlight;
        }
        current = current.parentNode;
      }
      return { type: "default", key: "", hex: DEFAULT_HIGHLIGHT_COLOR };
    }

    getCurrentStylePreset() {
      const range = this.getSelectionRangeInEditor() || this.savedSelection;
      let current = range ? (range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer) : null;
      while (current && current !== this.content) {
        const preset = getStylePresetFromElement(current);
        if (preset) return preset;
        current = current.parentNode;
      }
      const block = this.getCurrentTextBlock();
      return getStylePresetFromElement(block) || STYLE_PRESET_LOOKUP.get("normal");
    }

    updateStylesToolbarState() {
      const currentPreset = this.getCurrentStylePreset() || STYLE_PRESET_LOOKUP.get("normal");
      if (this.stylesLabel) {
        this.stylesLabel.textContent = currentPreset ? currentPreset.label : "Styles";
      }
      if (this.stylesButton) {
        this.stylesButton.setAttribute("aria-expanded", this.stylesMenu && !this.stylesMenu.hidden ? "true" : "false");
      }
      if (!this.stylesMenu) return;
      Array.from(this.stylesMenu.querySelectorAll("[data-style-preset]")).forEach((button) => {
        const isActive = button.dataset.stylePreset === (currentPreset ? currentPreset.key : "normal");
        button.classList.toggle("is-active", isActive);
      });
    }

    updateHighlightToolbarState() {
      const current = this.getCurrentHighlightColor();
      const activeHex = normalizeHexColor(current && current.hex) || DEFAULT_HIGHLIGHT_COLOR;
      if (this.highlightBar) {
        this.highlightBar.style.background = current.type === "default" ? "transparent" : activeHex;
      }
      if (this.highlightButton) {
        this.highlightButton.setAttribute("aria-expanded", this.highlightPopover && !this.highlightPopover.hidden ? "true" : "false");
      }
      if (this.highlightCustomInput) {
        this.highlightCustomInput.value = activeHex;
        const valueLabel = this.highlightCustomInput.parentNode && this.highlightCustomInput.parentNode.querySelector(".ollow-highlight-custom-value");
        if (valueLabel) {
          valueLabel.textContent = activeHex.toUpperCase();
        }
      }
      if (!this.highlightPopover) return;
      Array.from(this.highlightPopover.querySelectorAll("[data-highlight-choice]")).forEach((button) => {
        const choice = String(button.dataset.highlightChoice || "");
        const swatchHex = normalizeHexColor(button.dataset.highlightHex || choice);
        const isPresetMatch = current.type === "preset" && choice === current.key;
        const isCustomMatch = current.type !== "preset" && current.type !== "default" && swatchHex && swatchHex === activeHex;
        button.classList.toggle("is-active", isPresetMatch || isCustomMatch);
      });
      const resetButton = this.highlightPopover.querySelector("[data-highlight-reset]");
      if (resetButton) {
        resetButton.classList.toggle("is-active", current.type === "default");
      }
    }

    openHighlightPopover() {
      if (!this.highlightPopover || !this.highlightButton) return;
      this.closeThemeMenu();
      this.closeStylesMenu();
      this.closeFontFamilyMenu();
      this.closeFontSizeMenu();
      this.closeTextColorPopover();
      this.highlightPopover.hidden = false;
      this.highlightButton.setAttribute("aria-expanded", "true");
      this.updateHighlightToolbarState();
    }

    closeHighlightPopover() {
      if (!this.highlightPopover || !this.highlightButton) return;
      this.highlightPopover.hidden = true;
      this.highlightButton.setAttribute("aria-expanded", "false");
    }

    toggleHighlightPopover() {
      if (!this.highlightPopover) return;
      if (this.highlightPopover.hidden) {
        this.openHighlightPopover();
      } else {
        this.closeHighlightPopover();
      }
    }

    unwrapInlineCodePreset(codeElement) {
      if (!codeElement || codeElement.tagName.toUpperCase() !== "CODE") return;
      codeElement.classList.remove("ollow-style-inline-code");
      if (!codeElement.classList.length && !codeElement.attributes.length) {
        unwrapElement(codeElement);
        return;
      }
      if (!codeElement.classList.length) {
        codeElement.removeAttribute("class");
      }
    }

    removeStylePresets(element) {
      if (!element) return;
      if (element.nodeType === Node.ELEMENT_NODE) {
        removeStylePresetClassesFromElement(element);
        if (element.tagName.toUpperCase() === "CODE" && element.classList.contains("ollow-style-inline-code")) {
          this.unwrapInlineCodePreset(element);
        }
      }
      Array.from((element.querySelectorAll && element.querySelectorAll("*")) || []).forEach((node) => {
        removeStylePresetClassesFromElement(node);
        if (node.tagName.toUpperCase() === "CODE" && node.classList.contains("ollow-style-inline-code")) {
          this.unwrapInlineCodePreset(node);
        }
      });
    }

    removeKnownFormattingClasses(element, options) {
      if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
      const config = Object.assign({ removeBlockStyles: false }, options || {});
      removeFontFamilyClassesFromElement(element);
      removeFontSizeClassesFromElement(element);
      removeTextColorClassesFromElement(element);
      removeHighlightClassesFromElement(element);
      if (config.removeBlockStyles) {
        removeStylePresetClassesFromElement(element);
      } else if (element.tagName.toUpperCase() === "CODE" && element.classList.contains("ollow-style-inline-code")) {
        element.classList.remove("ollow-style-inline-code");
      }
      if (element.tagName.toUpperCase() === "A") {
        removeFontFamilyClassesFromElement(element);
        removeFontSizeClassesFromElement(element);
        removeTextColorClassesFromElement(element);
        removeHighlightClassesFromElement(element);
      }
      if (element.tagName.toUpperCase() === "SPAN" && !element.classList.length) {
        element.removeAttribute("class");
      }
      if (element.getAttribute("style")) {
        element.removeAttribute("style");
      }
      if (element.classList && !element.classList.length) {
        element.removeAttribute("class");
      }
    }

    unwrapInlineFormatting(node) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
      const tagName = node.tagName.toUpperCase();
      if (isInlineFormattingTag(tagName)) {
        unwrapElement(node);
        return;
      }
      if (isInlineCodeFormattingElement(node)) {
        unwrapElement(node);
        return;
      }
      if (tagName === "SPAN") {
        this.removeKnownFormattingClasses(node);
        if (!node.attributes.length) {
          unwrapElement(node);
        }
      }
    }

    cleanEmptySpans(root) {
      if (!root || !root.querySelectorAll) return;
      Array.from(root.querySelectorAll("span")).forEach((span) => {
        this.removeKnownFormattingClasses(span);
        if (!span.attributes.length) {
          unwrapElement(span);
        }
      });
    }

    stripFormattingWithin(root) {
      if (!root) return;
      const elements = Array.from((root.querySelectorAll && root.querySelectorAll("*")) || []);
      elements.reverse().forEach((element) => {
        if (["IMG", "IFRAME", "TABLE", "TBODY", "THEAD", "TR", "TD", "TH", "FIGURE", "SECTION", "DIV", "PRE"].includes(element.tagName.toUpperCase())) {
          return;
        }
        this.removeKnownFormattingClasses(element);
        this.unwrapInlineFormatting(element);
      });
      if (root.nodeType === Node.ELEMENT_NODE) {
        this.removeKnownFormattingClasses(root, { removeBlockStyles: true });
      }
      this.cleanEmptySpans(root);
    }

    removeFormattingFromSelection() {
      this.focus();
      this.restoreSelection();
      const selection = window.getSelection();
      const range = this.getSelectionRangeInEditor();
      if (!selection || !range) return false;

      if (range.collapsed) {
        const block = this.getCurrentTextBlock();
        if (!block) return false;
        if (["FIGURE", "SECTION", "DIV", "PRE"].includes(block.tagName.toUpperCase()) && !isAlignableTextBlock(block) && block.tagName.toUpperCase() !== "BLOCKQUOTE") {
          return false;
        }
        this.stripFormattingWithin(block);
        this.saveSelection();
        this.handleContentChange();
        return true;
      }

      const fragment = range.extractContents();
      this.stripFormattingWithin(fragment);
      const lastNode = fragment.lastChild;
      range.insertNode(fragment);
      if (lastNode) {
        placeCaretAfter(lastNode);
      }
      this.saveSelection();
      this.handleContentChange();
      return true;
    }

    captureCurrentFormat() {
      const range = this.getSelectionRangeInEditor() || this.savedSelection;
      if (!range) return null;
      const ancestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
      const block = this.getCurrentTextBlock();
      const stylePreset = this.getCurrentStylePreset();
      const inlineCode = Boolean(ancestor && ancestor.closest && ancestor.closest("code.ollow-style-inline-code") && !ancestor.closest("pre"));
      return {
        inlineTags: {
          bold: safeQueryState("bold"),
          italic: safeQueryState("italic"),
          underline: safeQueryState("underline"),
          strikethrough: safeQueryState("strikeThrough") || safeQueryState("strikethrough"),
          subscript: safeQueryState("subscript"),
          superscript: safeQueryState("superscript"),
          inlineCode,
        },
        fontFamily: this.getCurrentFontFamily(),
        fontSize: this.getCurrentFontSize(),
        textColor: this.getCurrentTextColor(),
        highlight: this.getCurrentHighlightColor(),
        stylePreset: stylePreset && stylePreset.key !== "normal" ? stylePreset.key : "",
        textAlignment: block ? this.getSelectedTextAlignment() : "",
      };
    }

    armFormatPainter(locked) {
      const format = this.captureCurrentFormat();
      if (!format) {
        this.showFeedback("Select styled text first.");
        return false;
      }
      this.formatPainterState = {
        active: true,
        locked: Boolean(locked),
        format,
      };
      this.showFeedback(locked ? "Format Painter locked. Select text to apply. Press Esc to cancel." : "Select text to apply formatting.");
      this.updateToolbarState();
      return true;
    }

    clearFormatPainter(options) {
      const config = options || {};
      this.formatPainterState = null;
      window.clearTimeout(this.formatPainterClickTimer);
      if (!config.keepFeedback) {
        this.clearFeedback();
      }
      this.updateToolbarState();
    }

    setFormatPainterLocked(value) {
      if (!this.formatPainterState) return;
      this.formatPainterState.locked = Boolean(value);
      this.updateToolbarState();
    }

    buildInlineFormatWrapper(fragment, format) {
      let node = fragment;
      const hasFontFamily = format.fontFamily && format.fontFamily !== DEFAULT_FONT_FAMILY_KEY;
      const hasFontSize = format.fontSize && format.fontSize !== DEFAULT_FONT_SIZE;
      const hasTextColor = format.textColor && format.textColor.type && format.textColor.type !== "default";
      const hasHighlight = format.highlight && format.highlight.type && format.highlight.type !== "default";
      if (hasFontFamily || hasFontSize || hasTextColor || hasHighlight) {
        const span = document.createElement("span");
        if (hasFontFamily) {
          span.classList.add(getFontFamilyClassName(format.fontFamily));
        }
        if (hasFontSize) {
          span.classList.add(getFontSizeClassName(format.fontSize));
        }
        if (hasTextColor) {
          if (format.textColor.type === "preset") {
            span.classList.add(getTextColorClassName(format.textColor.key));
          } else if (format.textColor.type === "custom") {
            span.style.color = format.textColor.hex;
          }
        }
        if (hasHighlight) {
          if (format.highlight.type === "preset") {
            span.classList.add(getHighlightClassName(format.highlight.key));
          } else if (format.highlight.type === "custom") {
            span.style.backgroundColor = format.highlight.hex;
          }
        }
        span.appendChild(node);
        node = span;
      }
      const tagOrder = [];
      if (format.inlineTags.bold) tagOrder.push("strong");
      if (format.inlineTags.italic) tagOrder.push("em");
      if (format.inlineTags.underline) tagOrder.push("u");
      if (format.inlineTags.strikethrough) tagOrder.push("s");
      if (format.inlineTags.subscript) tagOrder.push("sub");
      if (format.inlineTags.superscript) tagOrder.push("sup");
      tagOrder.forEach((tagName) => {
        const wrapper = document.createElement(tagName);
        wrapper.appendChild(node);
        node = wrapper;
      });
      if (format.inlineTags.inlineCode) {
        const code = document.createElement("code");
        code.className = "ollow-style-inline-code";
        code.appendChild(node);
        node = code;
      }
      return node;
    }

    applyCapturedFormatToSelection() {
      if (!this.formatPainterState || !this.formatPainterState.active) return false;
      const format = this.formatPainterState.format;
      this.focus();
      this.restoreSelection();
      const range = this.getSelectionRangeInEditor();
      if (!range || range.collapsed) return false;

      const blocks = this.getCurrentBlocksFromSelection();
      blocks.forEach((block) => {
        removeStylePresetClassesFromElement(block);
        if (format.stylePreset) {
          const preset = STYLE_PRESET_LOOKUP.get(format.stylePreset);
          if (preset && preset.type === "block") {
            block.classList.add(preset.className);
          } else if (preset && preset.type === "blockquote") {
            block.classList.add(preset.className);
          }
        }
        if (format.textAlignment) {
          this.removeTextAlignmentClasses(block);
          const alignmentClass = getTextAlignmentClass(format.textAlignment);
          if (alignmentClass) {
            block.classList.add(alignmentClass);
          }
        }
      });

      const fragment = range.extractContents();
      this.stripFormattingWithin(fragment);
      const content = this.buildInlineFormatWrapper(fragment, format);
      range.insertNode(content);
      placeCaretAfter(content);
      this.saveSelection();
      this.handleContentChange();
      if (!this.formatPainterState.locked) {
        this.clearFormatPainter();
      } else {
        this.showFeedback("Format Painter locked. Select text to apply. Press Esc to cancel.");
      }
      return true;
    }

    applyCapturedFormatToBlock(block) {
      if (!this.formatPainterState || !this.formatPainterState.active || !block) return false;
      const format = this.formatPainterState.format;
      if (["FIGURE", "SECTION", "DIV", "PRE"].includes(block.tagName.toUpperCase()) && !isAlignableTextBlock(block) && block.tagName.toUpperCase() !== "BLOCKQUOTE") {
        return false;
      }
      removeStylePresetClassesFromElement(block);
      removeFontFamilyClassesFromElement(block);
      removeFontSizeClassesFromElement(block);
      removeTextColorClassesFromElement(block);
      removeHighlightClassesFromElement(block);
      if (format.stylePreset) {
        const preset = STYLE_PRESET_LOOKUP.get(format.stylePreset);
        if (preset && preset.type !== "inline-code") {
          block.classList.add(preset.className);
        }
      }
      if (format.textAlignment) {
        this.removeTextAlignmentClasses(block);
        const alignmentClass = getTextAlignmentClass(format.textAlignment);
        if (alignmentClass) {
          block.classList.add(alignmentClass);
        }
      }
      if (format.fontFamily && format.fontFamily !== DEFAULT_FONT_FAMILY_KEY) {
        block.classList.add(getFontFamilyClassName(format.fontFamily));
      }
      if (format.fontSize && format.fontSize !== DEFAULT_FONT_SIZE) {
        block.classList.add(getFontSizeClassName(format.fontSize));
      }
      if (format.textColor && format.textColor.type && format.textColor.type !== "default") {
        if (format.textColor.type === "preset") {
          block.classList.add(getTextColorClassName(format.textColor.key));
        } else {
          block.style.color = format.textColor.hex;
        }
      }
      if (format.highlight && format.highlight.type && format.highlight.type !== "default") {
        if (format.highlight.type === "preset") {
          block.classList.add(getHighlightClassName(format.highlight.key));
        } else {
          block.style.backgroundColor = format.highlight.hex;
        }
      }
      this.saveSelection();
      this.handleContentChange();
      if (!this.formatPainterState.locked) {
        this.clearFormatPainter();
      } else {
        this.showFeedback("Format Painter locked. Select text to apply. Press Esc to cancel.");
      }
      return true;
    }

    tryApplyFormatPainterToSelection() {
      if (!this.formatPainterState || !this.formatPainterState.active) return false;
      const range = this.getSelectionRangeInEditor();
      if (!range || range.collapsed) return false;
      return this.applyCapturedFormatToSelection();
    }

    resetStylePreset() {
      const blocks = this.getCurrentBlocksFromSelection();
      if (blocks.length) {
        blocks.forEach((block) => {
          removeStylePresetClassesFromElement(block);
          if (block.tagName.toUpperCase() === "BLOCKQUOTE" && block.classList.contains("ollow-style-quote-emphasis")) {
            block.classList.remove("ollow-style-quote-emphasis");
          }
        });
      }
      const range = this.getSelectionRangeInEditor() || this.savedSelection;
      let current = range ? (range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer) : null;
      while (current && current !== this.content) {
        if (current.tagName && current.tagName.toUpperCase() === "CODE" && current.classList.contains("ollow-style-inline-code")) {
          this.unwrapInlineCodePreset(current);
          break;
        }
        current = current.parentNode;
      }
      this.saveSelection();
      this.handleContentChange();
    }

    applyInlineCodePreset() {
      this.focus();
      this.restoreSelection();
      const selection = window.getSelection();
      const range = this.getSelectionRangeInEditor();
      if (!selection || !range) return false;
      if (range.collapsed) {
        const block = this.getCurrentTextBlock();
        if (!block) return false;
        const code = document.createElement("code");
        code.className = "ollow-style-inline-code";
        code.textContent = block.textContent || "";
        block.textContent = "";
        block.appendChild(code);
        this.saveSelection();
        this.handleContentChange();
        return true;
      }
      const wrapper = document.createElement("code");
      wrapper.className = "ollow-style-inline-code";
      const fragment = range.extractContents();
      this.removeStylePresets(fragment);
      wrapper.appendChild(fragment);
      range.insertNode(wrapper);
      placeCaretAfter(wrapper);
      this.saveSelection();
      this.handleContentChange();
      return true;
    }

    applyBlockStylePreset(preset) {
      if (preset.type === "blockquote") {
        this.applyBlock("BLOCKQUOTE");
      }
      const blocks = this.getCurrentBlocksFromSelection();
      if (!blocks.length) {
        const block = this.getCurrentTextBlock();
        if (block) blocks.push(block);
      }
      if (!blocks.length) return false;
      blocks.forEach((block) => {
        removeStylePresetClassesFromElement(block);
        block.classList.add(preset.className);
      });
      this.saveSelection();
      this.handleContentChange();
      return true;
    }

    applyStylePreset(styleName) {
      const preset = STYLE_PRESET_LOOKUP.get(styleName) || STYLE_PRESET_LOOKUP.get("normal");
      if (!preset) return false;
      if (preset.type === "reset") {
        this.resetStylePreset();
        this.updateStylesToolbarState();
        return true;
      }
      if (preset.type === "inline-code") {
        const applied = this.applyInlineCodePreset();
        this.updateStylesToolbarState();
        return applied;
      }
      const applied = this.applyBlockStylePreset(preset);
      this.updateStylesToolbarState();
      return applied;
    }

    applyTypographyToBlock(options) {
      const block = this.getCurrentTextBlock();
      if (!block) return false;
      if (options.fontFamily) {
        removeFontFamilyClassesFromElement(block);
        block.classList.add(getFontFamilyClassName(options.fontFamily));
      }
      if (options.fontSize) {
        removeFontSizeClassesFromElement(block);
        block.classList.add(getFontSizeClassName(options.fontSize));
      }
      if (options.textColor === null) {
        removeTextColorClassesFromElement(block);
      } else if (options.textColor) {
        removeTextColorClassesFromElement(block);
        if (options.textColor.type === "preset") {
          block.classList.add(getTextColorClassName(options.textColor.key));
        } else if (options.textColor.type === "custom") {
          block.style.color = options.textColor.hex;
        }
      }
      if (options.highlight === null) {
        removeHighlightClassesFromElement(block);
      } else if (options.highlight) {
        removeHighlightClassesFromElement(block);
        if (options.highlight.type === "preset") {
          block.classList.add(getHighlightClassName(options.highlight.key));
        } else if (options.highlight.type === "custom") {
          block.style.backgroundColor = options.highlight.hex;
        }
      }
      this.saveSelection();
      this.handleContentChange();
      return true;
    }

    applyTypographyToSelection(options) {
      this.focus();
      this.restoreSelection();
      const selection = window.getSelection();
      const range = this.getSelectionRangeInEditor();
      if (!selection || !range) return false;
      if (range.collapsed) {
        return this.applyTypographyToBlock(options);
      }

      const startBlock = closestBlock(range.startContainer, this.content);
      const endBlock = closestBlock(range.endContainer, this.content);
      if (!startBlock || !endBlock || startBlock !== endBlock) {
        return this.applyTypographyToBlock(options);
      }

      const wrapper = document.createElement("span");
      if (options.fontFamily) {
        wrapper.classList.add(getFontFamilyClassName(options.fontFamily));
      }
      if (options.fontSize) {
        wrapper.classList.add(getFontSizeClassName(options.fontSize));
      }
      if (options.textColor && options.textColor.type === "preset") {
        wrapper.classList.add(getTextColorClassName(options.textColor.key));
      } else if (options.textColor && options.textColor.type === "custom") {
        wrapper.style.color = options.textColor.hex;
      }
      if (options.highlight && options.highlight.type === "preset") {
        wrapper.classList.add(getHighlightClassName(options.highlight.key));
      } else if (options.highlight && options.highlight.type === "custom") {
        wrapper.style.backgroundColor = options.highlight.hex;
      }
      const fragment = range.extractContents();
      removeTypographyClasses(fragment, {
        fontFamily: Boolean(options.fontFamily),
        fontSize: Boolean(options.fontSize),
        textColor: Object.prototype.hasOwnProperty.call(options, "textColor"),
        highlight: Object.prototype.hasOwnProperty.call(options, "highlight"),
      });
      const shouldWrap = wrapper.classList.length > 0 || Boolean(wrapper.getAttribute("style"));
      if (shouldWrap) {
        wrapper.appendChild(fragment);
        range.insertNode(wrapper);
        placeCaretAfter(wrapper);
      } else {
        const lastNode = fragment.lastChild;
        range.insertNode(fragment);
        if (lastNode) {
          placeCaretAfter(lastNode);
        }
      }
      this.saveSelection();
      this.handleContentChange();
      return true;
    }

    applyFontFamily(fontKey) {
      const key = FONT_FAMILY_LOOKUP.has(fontKey) ? fontKey : DEFAULT_FONT_FAMILY_KEY;
      this.rememberRecentFont(key);
      this.applyTypographyToSelection({ fontFamily: key });
      this.updateFontToolbarState();
    }

    applyFontSize(size) {
      const normalized = getClosestFontSize(size);
      this.applyTypographyToSelection({ fontSize: normalized });
      this.updateFontToolbarState();
    }

    applyTextColor(value) {
      this.focus();
      this.restoreSelection();
      const normalizedHex = normalizeHexColor(value);
      const preset = TEXT_COLOR_LOOKUP.get(value) || getTextColorPresetByHex(value);
      const textColor = preset
        ? { type: "preset", key: preset.key, hex: preset.hex }
        : (normalizedHex ? { type: "custom", key: "", hex: normalizedHex } : null);
      if (!textColor) return false;
      const applied = this.applyTypographyToSelection({ textColor });
      if (!applied) return false;
      this.rememberRecentTextColor(textColor.hex);
      this.updateColorToolbarState();
      return true;
    }

    removeTextColor() {
      this.focus();
      this.restoreSelection();
      const applied = this.applyTypographyToSelection({ textColor: null });
      if (!applied) return false;
      this.updateColorToolbarState();
      return true;
    }

    applyHighlightColor(value) {
      this.focus();
      this.restoreSelection();
      const normalizedHex = normalizeHexColor(value);
      const preset = HIGHLIGHT_COLOR_LOOKUP.get(value) || getHighlightPresetByHex(value);
      const highlight = preset
        ? { type: "preset", key: preset.key, hex: preset.hex }
        : (normalizedHex ? { type: "custom", key: "", hex: normalizedHex } : null);
      if (!highlight) return false;
      const applied = this.applyTypographyToSelection({ highlight });
      if (!applied) return false;
      this.updateHighlightToolbarState();
      return true;
    }

    removeHighlightColor() {
      this.focus();
      this.restoreSelection();
      const applied = this.applyTypographyToSelection({ highlight: null });
      if (!applied) return false;
      this.updateHighlightToolbarState();
      return true;
    }

    stepFontSize(direction) {
      const current = this.getCurrentFontSize();
      const index = FONT_SIZE_PRESETS.indexOf(current);
      const fallbackIndex = FONT_SIZE_PRESETS.findIndex((size) => size >= current);
      const currentIndex = index >= 0 ? index : (fallbackIndex >= 0 ? fallbackIndex : FONT_SIZE_PRESETS.length - 1);
      const nextIndex = Math.max(0, Math.min(FONT_SIZE_PRESETS.length - 1, currentIndex + (direction > 0 ? 1 : -1)));
      this.applyFontSize(FONT_SIZE_PRESETS[nextIndex]);
    }

    createPluginButton(config) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = config.className || "nw-toolbar-button";
      button.title = config.title || config.label || config.name || "";
      button.setAttribute("aria-label", config.title || config.label || config.name || "");
      if (config.icon && /<[^>]+>/.test(config.icon)) {
        button.innerHTML = config.icon;
      } else if (config.icon) {
        button.textContent = config.icon;
      } else {
        button.textContent = config.label || config.name || "";
      }
      button.addEventListener("click", (event) => {
        event.preventDefault();
        if (typeof config.onClick === "function") {
          config.onClick(this, event);
          return;
        }
        if (config.command) {
          this.runCommand(config.command, config.payload);
        }
      });
      return button;
    }

    getToolbarGroup(name) {
      return this.toolbarGroups[name] || null;
    }

    addToolbarGroup(config) {
      const rowName = config && config.row === "insert" ? "insert" : "primary";
      const row = this.toolbarRows[rowName];
      if (!row) return null;
      const groupName = (config && config.name) || `plugin-group-${Date.now()}`;
      if (this.toolbarGroups[groupName]) {
        return this.toolbarGroups[groupName];
      }
      const group = document.createElement("div");
      group.className = config.className || "nw-toolbar-group";
      this.toolbarGroups[groupName] = group;
      row.appendChild(group);
      return group;
    }

    addToolbarButton(config) {
      const groupName = (config && config.group) || "insert";
      const rowName = config && config.row ? config.row : (groupName === "insert" ? "insert" : "primary");
      const group = this.getToolbarGroup(groupName) || this.addToolbarGroup({ name: groupName, row: rowName });
      if (!group) return null;
      const button = this.createPluginButton(config || {});
      group.appendChild(button);
      return button;
    }

    addCommand(name, handler) {
      if (!name || typeof handler !== "function") return;
      this.commands.set(name, handler);
    }

    runCommand(name, payload) {
      const command = this.commands.get(name);
      if (!command) return undefined;
      return command(payload, this);
    }

    on(eventName, handler) {
      if (!eventName || typeof handler !== "function") return () => {};
      const handlers = this.eventHandlers.get(eventName) || new Set();
      handlers.add(handler);
      this.eventHandlers.set(eventName, handlers);
      return () => this.off(eventName, handler);
    }

    off(eventName, handler) {
      const handlers = this.eventHandlers.get(eventName);
      if (!handlers) return;
      handlers.delete(handler);
      if (!handlers.size) {
        this.eventHandlers.delete(eventName);
      }
    }

    emit(eventName, detail) {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(detail, this);
          } catch (error) {
            console.warn(`OllowEditor event handler failed for "${eventName}".`, error);
          }
        });
      }
      return detail;
    }

    normalizeShortcut(shortcut) {
      const tokens = String(shortcut || "")
        .toLowerCase()
        .split("+")
        .map((token) => token.trim())
        .filter(Boolean);
      const modifiers = [];
      const keys = [];
      tokens.forEach((token) => {
        if (token === "cmd" || token === "meta" || token === "ctrl" || token === "control" || token === "mod") {
          if (!modifiers.includes("mod")) modifiers.push("mod");
          return;
        }
        if (token === "option") token = "alt";
        if (["shift", "alt"].includes(token)) {
          if (!modifiers.includes(token)) modifiers.push(token);
          return;
        }
        keys.push(token);
      });
      return modifiers.concat(keys).join("+");
    }

    addShortcut(shortcut, handler) {
      const normalized = this.normalizeShortcut(shortcut);
      if (!normalized || typeof handler !== "function") return false;
      if (this.shortcuts.has(normalized)) return false;
      this.shortcuts.set(normalized, handler);
      return true;
    }

    removeShortcut(shortcut) {
      const normalized = this.normalizeShortcut(shortcut);
      if (!normalized) return false;
      return this.shortcuts.delete(normalized);
    }

    getShortcuts() {
      return Array.from(this.shortcuts.keys());
    }

    registerDefaultShortcuts() {
      this.addShortcut("mod+b", () => {
        this.execCommand("bold");
      });
      this.addShortcut("mod+i", () => {
        this.execCommand("italic");
      });
      this.addShortcut("mod+u", () => {
        this.execCommand("underline");
      });
      this.addShortcut("mod+shift+x", () => {
        this.execCommand("strikeThrough");
      });
      this.addShortcut("mod+,", () => {
        this.execExclusiveInlineCommand("subscript", "superscript");
      });
      this.addShortcut("mod+.", () => {
        this.execExclusiveInlineCommand("superscript", "subscript");
      });
      this.addShortcut("mod+\\", () => {
        this.removeFormattingFromSelection();
      });
      this.addShortcut("mod+k", () => {
        this.openLinkModal();
      });
      this.addShortcut("mod+z", () => {
        this.execCommand("undo");
      });
      this.addShortcut("mod+shift+z", () => {
        this.execCommand("redo");
      });
      this.addShortcut("mod+y", () => {
        this.execCommand("redo");
      });
      this.addShortcut("mod+alt+2", () => {
        this.applyBlock("H2");
      });
      this.addShortcut("mod+alt+3", () => {
        this.applyBlock("H3");
      });
      this.addShortcut("mod+alt+4", () => {
        this.applyBlock("H4");
      });
      this.addShortcut("mod+alt+0", () => {
        this.applyBlock("P");
      });
      this.addShortcut("mod+shift+7", () => {
        this.execCommand("insertOrderedList");
      });
      this.addShortcut("mod+shift+8", () => {
        this.execCommand("insertUnorderedList");
      });
      this.addShortcut("mod+shift+q", () => {
        this.applyBlock("BLOCKQUOTE");
      });
      this.addShortcut("mod+shift+h", () => {
        this.insertHTML("<hr>");
      });
      this.addShortcut("mod+shift+c", () => {
        this.openCodeModal();
      });
      this.addShortcut("mod+shift+u", () => {
        this.toggleSourceMode();
      });
      this.addShortcut("mod+f", () => {
        this.openFindReplacePanel("find");
      });
      this.addShortcut("mod+h", () => {
        this.openFindReplacePanel("replace");
      });
      this.addShortcut("mod+s", () => {
        this.sync({ autosave: false });
      });
    }

    eventToShortcut(event) {
      const parts = [];
      if (event.metaKey || event.ctrlKey) parts.push("mod");
      if (event.shiftKey) parts.push("shift");
      if (event.altKey) parts.push("alt");
      let key = "";
      const code = String(event.code || "");
      if (/^Key[A-Z]$/.test(code)) {
        key = code.slice(3).toLowerCase();
      } else if (/^Digit\d$/.test(code)) {
        key = code.slice(5);
      } else {
        key = String(event.key || "").toLowerCase();
      }
      if (key === " ") key = "space";
      if (key === "esc") key = "escape";
      if (!["shift", "control", "meta", "alt"].includes(key)) {
        parts.push(key);
      }
      return parts.join("+");
    }

    isShortcutContextAllowed(event) {
      const target = event.target;
      if (!(target instanceof Element)) return false;
      if (target.closest(".nw-editor-modal")) {
        return false;
      }
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName.toUpperCase())) {
        return false;
      }
      return target === this.content || this.content.contains(target);
    }

    handleShortcutKeydown(event) {
      if (!this.isFocused || !this.isShortcutContextAllowed(event)) return;
      const pressed = this.eventToShortcut(event);
      const handler = this.shortcuts.get(pressed);
      if (!handler) return;
      event.preventDefault();
      try {
        handler(event, this);
      } catch (error) {
        console.warn(`OllowEditor shortcut failed for "${pressed}".`, error);
      }
    }

    addSanitizerRule(rule) {
      if (!rule) return;
      this.sanitizerRules.push(rule);
    }

    cleanPastedHTML(html) {
      const prepared = cleanPastedHtmlMarkup(html);
      return prepared ? this.sanitizeHTML(prepared) : "";
    }

    cleanPlainText(text) {
      return sanitizePlainText(text);
    }

    sanitizeHTML(html) {
      return sanitizeFragment(html, this.sanitizerRules);
    }

    runConfiguredPlugins() {
      const pluginOptions = this.options.plugins || {};
      Object.entries(pluginOptions).forEach(([name, options]) => {
        const plugin = pluginRegistry.get(name);
        if (!plugin) {
          console.warn(`OllowEditor plugin "${name}" is not registered.`);
          return;
        }
        try {
          plugin(this, options === true ? {} : options || {});
        } catch (error) {
          console.warn(`OllowEditor plugin "${name}" failed during initialization.`, error);
        }
      });
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
        window.setTimeout(() => {
          if (!this.tryApplyFormatPainterToSelection()) {
            this.updateToolbarState();
          }
        }, 0);
      });

      this.content.addEventListener("keydown", (event) => {
        this.handleShortcutKeydown(event);
      });

      document.addEventListener("selectionchange", this.boundSelectionChange);
      document.addEventListener("pointerdown", this.boundDocumentPointerDown);
      document.addEventListener("keydown", this.boundDocumentKeydown);
      if (this.systemThemeQuery) {
        if (typeof this.systemThemeQuery.addEventListener === "function") {
          this.systemThemeQuery.addEventListener("change", this.boundSystemThemeChange);
        } else if (typeof this.systemThemeQuery.addListener === "function") {
          this.systemThemeQuery.addListener(this.boundSystemThemeChange);
        }
      }
      window.addEventListener("resize", this.boundRepositionImageToolbar);
      window.addEventListener("scroll", this.boundRepositionImageToolbar, true);
      window.addEventListener("resize", this.boundRepositionTableToolbar);
      window.addEventListener("scroll", this.boundRepositionTableToolbar, true);
      window.addEventListener("resize", this.boundRepositionBookmarkToolbar);
      window.addEventListener("scroll", this.boundRepositionBookmarkToolbar, true);
      window.addEventListener("resize", this.boundViewportChange);
      window.addEventListener("orientationchange", this.boundViewportChange);

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
      if (this.selectedBookmark) {
        this.positionBookmarkToolbar();
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
      if (this.isFindReplaceOpen()) {
        this.refreshFindReplaceResults({ preserveCurrent: true });
      }
      this.scheduleAutosave();
      this.dispatch("nationwire-editor:change");
      this.emit("change", { editor: this, html: this.textarea.value });
    }

    handlePaste(event) {
      event.preventDefault();
      const html = event.clipboardData && event.clipboardData.getData("text/html");
      const text = event.clipboardData && event.clipboardData.getData("text/plain");
      const clean = html ? this.cleanPastedHTML(html) : this.cleanPlainText(text);
      if (!clean) return;
      this.insertHTML(clean);
    }

    handleContentClick(event) {
      const bookmark = getBookmarkNode(event.target, this.content);
      if (bookmark) {
        this.selectBookmark(bookmark);
        return;
      }

      if (this.formatPainterState && this.formatPainterState.active) {
        const block = getClosestAlignableTextBlock(event.target, this.content) || closestBlock(event.target, this.content);
        if (block && !["FIGURE", "SECTION", "DIV", "PRE"].includes(block.tagName.toUpperCase())) {
          this.applyCapturedFormatToBlock(block);
          return;
        }
      }

      const tableCell = getTableCell(event.target, this.content);
      if (tableCell) {
        this.selectTableCell(tableCell, { extendSelection: event.shiftKey });
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
        this.closeStylesMenu();
        this.closeFontFamilyMenu();
        this.closeFontSizeMenu();
        this.closeTextColorPopover();
        this.closeHighlightPopover();
        this.closeThemeMenu();
        this.clearMediaSelection();
        this.clearTableSelection();
        this.clearBookmarkSelection();
        return;
      }

      if (
        (this.fontFamilyMenu && this.fontFamilyMenu.contains(event.target)) ||
        (this.fontFamilyButton && this.fontFamilyButton.contains(event.target)) ||
        (this.stylesMenu && this.stylesMenu.contains(event.target)) ||
        (this.stylesButton && this.stylesButton.contains(event.target)) ||
        (this.fontSizeMenu && this.fontSizeMenu.contains(event.target)) ||
        (this.fontSizeInput && this.fontSizeInput.contains && this.fontSizeInput.contains(event.target)) ||
        (event.target.closest && event.target.closest(".ollow-size-step")) ||
        (this.textColorPopover && this.textColorPopover.contains(event.target)) ||
        (this.textColorButton && this.textColorButton.contains(event.target)) ||
        (this.highlightPopover && this.highlightPopover.contains(event.target)) ||
        (this.highlightButton && this.highlightButton.contains(event.target))
      ) {
        return;
      }

      this.closeStylesMenu();
      this.closeFontFamilyMenu();
      this.closeFontSizeMenu();
      this.closeTextColorPopover();
      this.closeHighlightPopover();

      if (
        (this.themeMenu && this.themeMenu.contains(event.target)) ||
        (this.themeToggleButton && this.themeToggleButton.contains(event.target))
      ) {
        return;
      }

      this.closeThemeMenu();

      if (this.imageResizeToolbar && this.imageResizeToolbar.contains(event.target)) {
        return;
      }

      if (this.imageResizeHandle && this.imageResizeHandle.contains(event.target)) {
        return;
      }

      if (this.tableToolbar && this.tableToolbar.contains(event.target)) {
        return;
      }

      if (this.bookmarkToolbar && this.bookmarkToolbar.contains(event.target)) {
        return;
      }

      if (this.findReplacePanel && this.findReplacePanel.contains(event.target)) {
        return;
      }

      if (getTableCell(event.target, this.content)) {
        return;
      }

      if (getBookmarkNode(event.target, this.content)) {
        return;
      }

      if (!getSelectableMediaBlock(event.target, this.content)) {
        this.clearMediaSelection();
      }
      this.clearTableSelection();
      this.clearBookmarkSelection();
    }

    handleDocumentKeydown(event) {
      if (String(event.key || "").toLowerCase() !== "escape") return;
      if (!this.wrapper) return;
      if (this.formatPainterState && this.formatPainterState.active) {
        this.clearFormatPainter();
        return;
      }
      if (this.stylesMenu && !this.stylesMenu.hidden) {
        this.closeStylesMenu();
        return;
      }
      if (this.fontFamilyMenu && !this.fontFamilyMenu.hidden) {
        this.closeFontFamilyMenu();
        return;
      }
      if (this.fontSizeMenu && !this.fontSizeMenu.hidden) {
        this.closeFontSizeMenu();
        return;
      }
      if (this.textColorPopover && !this.textColorPopover.hidden) {
        this.closeTextColorPopover();
        return;
      }
      if (this.highlightPopover && !this.highlightPopover.hidden) {
        this.closeHighlightPopover();
        return;
      }
      if (this.themeMenu && !this.themeMenu.hidden) {
        this.closeThemeMenu();
        return;
      }
      if (this.isFindReplaceOpen()) {
        event.preventDefault();
        this.closeFindReplacePanel({ restoreSelection: true });
        return;
      }
      if (this.modal && !this.modal.hidden) {
        event.preventDefault();
        this.closeModal();
        return;
      }
      if (this.wrapper.contains(document.activeElement) || this.isFocused) {
        if (this.selectedMediaBlock) {
          this.clearMediaSelection();
        }
        if (this.selectedTableFigure) {
          this.clearTableSelection();
        }
        if (this.selectedBookmark) {
          this.clearBookmarkSelection();
        }
      }
    }

    handleViewportChange() {
      this.closeThemeMenu();
      this.closeStylesMenu();
      this.closeFontFamilyMenu();
      this.closeFontSizeMenu();
      this.closeTextColorPopover();
      this.closeHighlightPopover();
      if (this.isFindReplaceOpen()) {
        this.refreshFindReplaceResults({ preserveCurrent: true });
      }
      if (this.selectedMediaBlock && !this.isDraggingImageResize) {
        this.positionImageResizeToolbar();
      }
      if (this.selectedTableFigure) {
        this.positionTableToolbar();
      }
      if (this.selectedBookmark) {
        this.positionBookmarkToolbar();
      }
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
        case "strikethrough":
          this.execCommand("strikeThrough");
          return;
        case "subscript":
          this.execExclusiveInlineCommand("subscript", "superscript");
          return;
        case "superscript":
          this.execExclusiveInlineCommand("superscript", "subscript");
          return;
        case "remove-formatting":
          this.removeFormattingFromSelection();
          return;
        case "link":
          this.openLinkModal();
          return;
        case "unlink":
          this.execCommand("unlink");
          return;
        case "bookmark":
          this.openBookmarkModal();
          return;
        case "source-html":
          this.toggleSourceMode();
          return;
        case "find-replace":
          this.openFindReplacePanel("find");
          return;
        case "special-characters":
          this.openSpecialCharacterModal();
          return;
        case "emoji":
          this.openEmojiModal();
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
        case "import-markdown":
          this.openMarkdownImportModal();
          return;
        case "export-markdown":
          this.openMarkdownExportModal();
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

    execExclusiveInlineCommand(command, oppositeCommand) {
      this.focus();
      const oppositeActive = safeQueryState(oppositeCommand);
      if (oppositeActive) {
        document.execCommand(oppositeCommand, false, null);
      }
      document.execCommand(command, false, null);
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

    getBookmarks() {
      return Array.from(this.content.querySelectorAll(`.${BOOKMARK_CLASS}[data-bookmark="true"][id]`))
        .map((bookmark) => this.getBookmarkData(bookmark))
        .filter((bookmark) => bookmark.id);
    }

    getBookmarkData(bookmark) {
      if (!bookmark) {
        return { id: "", name: "", description: "" };
      }
      const label = (bookmark.textContent || "").replace(/^🔖\s*/, "").trim();
      return {
        id: bookmark.id || "",
        name: label || bookmark.id || "",
        description: bookmark.getAttribute("title") || "",
      };
    }

    getUniqueBookmarkId(value, exceptBookmark) {
      const base = sanitizeBookmarkId(value) || "bookmark";
      let candidate = base;
      let suffix = 2;
      while (
        Array.from(this.content.querySelectorAll(`[id="${candidate}"]`)).some((node) => node !== exceptBookmark)
      ) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
      }
      return candidate;
    }

    buildBookmarkHtml(values) {
      const config = Object.assign({ id: "", name: "", description: "" }, values || {});
      const name = String(config.name || "").trim() || config.id;
      const id = this.getUniqueBookmarkId(config.id || name);
      const description = String(config.description || "").trim();
      const titleAttr = description ? ` title="${escapeHtml(description)}"` : "";
      return `<span class="${BOOKMARK_CLASS}" id="${escapeHtml(id)}" data-bookmark="true" contenteditable="false"${titleAttr}>🔖 ${escapeHtml(name)}</span>`;
    }

    updateBookmarkNode(bookmark, values) {
      if (!bookmark || !this.content.contains(bookmark)) return null;
      const wrapper = document.createElement("div");
      const id = this.getUniqueBookmarkId(values.id || values.name, bookmark);
      wrapper.innerHTML = this.buildBookmarkHtml({
        id,
        name: values.name,
        description: values.description,
      });
      const replacement = wrapper.firstElementChild;
      if (!replacement) return null;
      bookmark.replaceWith(replacement);
      return replacement;
    }

    selectBookmark(bookmark) {
      if (!bookmark || !this.content.contains(bookmark)) return;
      if (this.selectedBookmark && this.selectedBookmark !== bookmark) {
        this.selectedBookmark.classList.remove(...TEMP_SELECTION_CLASSES);
      }
      this.clearMediaSelection();
      this.clearTableSelection();
      this.selectedBookmark = bookmark;
      this.selectedBookmark.classList.add("is-bookmark-selected");
      this.positionBookmarkToolbar();
    }

    clearBookmarkSelection() {
      if (this.selectedBookmark) {
        this.selectedBookmark.classList.remove(...TEMP_SELECTION_CLASSES);
      }
      this.selectedBookmark = null;
      if (this.bookmarkToolbar) {
        this.bookmarkToolbar.hidden = true;
      }
    }

    positionBookmarkToolbar() {
      if (!this.selectedBookmark || !this.bookmarkToolbar || !this.surface || !this.content.contains(this.selectedBookmark)) {
        this.clearBookmarkSelection();
        return;
      }
      if (this.isModalOpen()) {
        this.bookmarkToolbar.hidden = true;
        return;
      }
      const surfaceRect = this.surface.getBoundingClientRect();
      const bookmarkRect = this.selectedBookmark.getBoundingClientRect();
      this.bookmarkToolbar.hidden = false;
      const toolbarRect = this.bookmarkToolbar.getBoundingClientRect();
      let top = bookmarkRect.top - surfaceRect.top - toolbarRect.height - 10;
      if (top < 10) {
        top = bookmarkRect.bottom - surfaceRect.top + 10;
      }
      const maxLeft = Math.max(10, surfaceRect.width - toolbarRect.width - 10);
      const left = Math.min(Math.max(10, bookmarkRect.left - surfaceRect.left), maxLeft);
      this.bookmarkToolbar.style.top = `${Math.round(top)}px`;
      this.bookmarkToolbar.style.left = `${Math.round(left)}px`;
    }

    copyBookmarkLink(bookmark) {
      if (!bookmark || !bookmark.id) return;
      const value = `#${bookmark.id}`;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(value).then(
          () => this.showFeedback("Bookmark link copied."),
          () => this.showFeedback("Unable to copy bookmark link.")
        );
      } else {
        this.showFeedback("Clipboard copy is not available in this browser.");
      }
    }

    handleBookmarkAction(action) {
      if (!this.selectedBookmark || !this.content.contains(this.selectedBookmark)) {
        this.clearBookmarkSelection();
        return;
      }
      if (action === "edit") {
        this.openBookmarkModal(this.selectedBookmark);
        return;
      }
      if (action === "copy") {
        this.copyBookmarkLink(this.selectedBookmark);
        return;
      }
      if (action === "delete") {
        const bookmark = this.selectedBookmark;
        this.clearBookmarkSelection();
        bookmark.remove();
        this.handleContentChange();
      }
    }

    getSelectedTableCells() {
      const cells = Array.isArray(this.selectedTableCells) ? this.selectedTableCells.filter((item) => item && this.content.contains(item)) : [];
      if (cells.length) {
        return cells;
      }
      return this.selectedTableCell && this.content.contains(this.selectedTableCell) ? [this.selectedTableCell] : [];
    }

    getTableProperties(figure) {
      const target = figure || this.selectedTableFigure;
      const table = target ? target.querySelector("table") : null;
      if (!target || !table) {
        return {
          caption: "",
          width: "auto",
          headerRow: false,
          headerColumn: false,
          striped: false,
          bordered: false,
          compact: false,
        };
      }

      return {
        caption: (target.querySelector("figcaption")?.textContent || "").trim(),
        width: target.classList.contains("ollow-table-wide")
          ? "wide"
          : target.classList.contains("ollow-table-full")
            ? "full"
            : "auto",
        headerRow: Boolean(table.tHead && table.tHead.rows.length),
        headerColumn: Array.from(table.rows).some((row) => {
          const firstCell = row.cells[0];
          return firstCell && firstCell.tagName.toUpperCase() === "TH" && firstCell.getAttribute("scope") === "row";
        }),
        striped: target.classList.contains("ollow-table-striped"),
        bordered: target.classList.contains("ollow-table-bordered"),
        compact: target.classList.contains("ollow-table-compact"),
      };
    }

    clearSelectedTableCells() {
      this.getSelectedTableCells().forEach((cell) => {
        cell.classList.remove("is-selected-cell", "is-selected-cell-primary");
      });
      this.selectedTableCells = [];
    }

    buildSelectedTableCells(cell, extendSelection) {
      if (!extendSelection || !this.tableSelectionAnchorCell || !cell) {
        this.tableSelectionAnchorCell = cell;
        return cell ? [cell] : [];
      }

      const anchor = this.tableSelectionAnchorCell;
      const anchorRow = anchor.parentElement;
      const targetRow = cell.parentElement;
      if (!anchorRow || !targetRow || anchorRow.parentElement !== targetRow.parentElement) {
        this.tableSelectionAnchorCell = cell;
        return [cell];
      }

      const rowCells = Array.from(anchorRow.children);
      const anchorIndex = rowCells.indexOf(anchor);
      const targetIndex = Array.from(targetRow.children).indexOf(cell);
      if (anchorIndex === -1 || targetIndex === -1 || anchorRow !== targetRow) {
        return [cell];
      }

      const [start, end] = [anchorIndex, targetIndex].sort((a, b) => a - b);
      return rowCells.slice(start, end + 1);
    }

    selectTableCell(cell, options) {
      if (!cell || !this.content.contains(cell)) return;
      const config = Object.assign({ extendSelection: false }, options || {});
      const figure = getTableFigure(cell, this.content);
      if (!figure) return;
      if (this.selectedTableFigure && this.selectedTableFigure !== figure) {
        this.selectedTableFigure.classList.remove(...TEMP_SELECTION_CLASSES);
      }
      if (this.selectedTableFigure !== figure) {
        this.clearSelectedTableCells();
        this.tableSelectionAnchorCell = cell;
      }
      this.clearBookmarkSelection();
      this.clearMediaSelection();
      this.selectedTableFigure = figure;
      this.selectedTableCell = cell;
      this.clearSelectedTableCells();
      this.selectedTableCells = this.buildSelectedTableCells(cell, config.extendSelection);
      this.selectedTableCells.forEach((selectedCell, index) => {
        selectedCell.classList.add("is-selected-cell");
        if (index === 0) {
          selectedCell.classList.add("is-selected-cell-primary");
        }
      });
      this.selectedTableFigure.classList.add("is-selected");
      this.updateTableToolbarState();
      this.positionTableToolbar();
    }

    clearTableSelection() {
      if (this.selectedTableFigure) {
        this.selectedTableFigure.classList.remove(...TEMP_SELECTION_CLASSES);
      }
      this.clearSelectedTableCells();
      this.selectedTableFigure = null;
      this.selectedTableCell = null;
      this.tableSelectionAnchorCell = null;
      if (this.tableToolbar) {
        this.tableToolbar.hidden = true;
      }
    }

    selectMediaBlock(block) {
      if (!block || !this.content.contains(block)) return;
      if (this.selectedMediaBlock && this.selectedMediaBlock !== block) {
        this.selectedMediaBlock.classList.remove(...TEMP_SELECTION_CLASSES);
      }
      this.clearBookmarkSelection();
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
      Array.from(this.imageResizeToolbar.querySelectorAll('[data-image-action^="align-"], [data-image-action^="width-"], [data-image-action="reset-align"]')).forEach((button) => {
        const action = button.dataset.imageAction;
        const value = action === "align-left"
          ? "left"
          : action === "align-center"
            ? "center"
            : action === "align-right"
              ? "right"
              : action === "width-wide"
                ? "wide"
                : action === "width-full"
                  ? "full"
                  : "reset";
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

    updateImageEditToolbarState() {
      if (!this.imageResizeToolbar) return;
      const imageControls = this.imageResizeToolbar.querySelector('[data-role="image-controls"]');
      const imageDivider = this.imageResizeToolbar.querySelector('[data-role="image-divider"]');
      const deleteControls = this.imageResizeToolbar.querySelector('[data-role="delete-controls"]');
      const deleteDivider = this.imageResizeToolbar.querySelector('[data-role="delete-divider"]');
      const hasImage = Boolean(this.selectedImageFigure);
      if (imageControls) {
        imageControls.hidden = !hasImage;
      }
      if (imageDivider) {
        imageDivider.hidden = !hasImage;
      }
      if (deleteControls) {
        deleteControls.hidden = !hasImage;
      }
      if (deleteDivider) {
        deleteDivider.hidden = !hasImage;
      }
      const toggleNewTab = this.imageResizeToolbar.querySelector('[data-image-action="new-tab"]');
      const unlinkButton = this.imageResizeToolbar.querySelector('[data-image-action="remove-link"]');
      const hasLink = Boolean(this.getImageLinkData(this.selectedImageFigure).href);
      const opensNewTab = Boolean(this.getImageLinkData(this.selectedImageFigure).newTab);
      if (toggleNewTab) {
        toggleNewTab.disabled = !hasImage || !hasLink;
        toggleNewTab.classList.toggle("is-active", opensNewTab);
      }
      if (unlinkButton) {
        unlinkButton.disabled = !hasImage || !hasLink;
      }
    }

    getSelectedImageFigure() {
      if (this.selectedImageFigure && document.body.contains(this.selectedImageFigure)) {
        return this.selectedImageFigure;
      }
      return this.content.querySelector(
        'figure.ollow-editor-image.is-selected, figure.ollow-image.is-selected, figure[data-type="image"].is-selected, figure.ollow-editor-image.is-media-selected, figure.ollow-image.is-media-selected, figure[data-type="image"].is-media-selected'
      );
    }

    handleImageToolbarAction(action, button) {
      const imageFigure = this.getSelectedImageFigure();
      const codeFigure = this.selectedCodeFigure && document.body.contains(this.selectedCodeFigure) ? this.selectedCodeFigure : null;

      if (action === "edit-code" || action === "copy" || action === "delete-code") {
        if (!codeFigure) {
          this.clearMediaSelection();
          return;
        }
        if (action === "edit-code") {
          this.handleCodeAction("edit");
          return;
        }
        if (action === "copy") {
          this.handleCodeAction("copy");
          return;
        }
        if (action === "delete-code") {
          this.handleCodeAction("delete");
          return;
        }
      }

      if (!imageFigure) {
        this.clearMediaSelection();
        return;
      }

      switch (action) {
        case "align-left":
          this.applySelectedMediaAlignment("left");
          break;
        case "align-center":
          this.applySelectedMediaAlignment("center");
          break;
        case "align-right":
          this.applySelectedMediaAlignment("right");
          break;
        case "width-wide":
          this.applySelectedMediaAlignment("wide");
          break;
        case "width-full":
          this.applySelectedMediaAlignment("full");
          break;
        case "reset-align":
          this.applySelectedMediaAlignment("reset");
          break;
        case "size-small":
          this.applySelectedImageSize("small");
          break;
        case "size-medium":
          this.applySelectedImageSize("medium");
          break;
        case "size-large":
          this.applySelectedImageSize("large");
          break;
        case "size-full":
          this.applySelectedImageSize("full");
          break;
        case "reset-size":
          this.applySelectedImageSize("reset");
          break;
        case "edit-image":
          this.handleImageAction("edit");
          break;
        case "replace-image":
          this.handleImageAction("replace");
          break;
        case "alt-text":
          this.handleImageAction("alt");
          break;
        case "caption":
          this.handleImageAction("caption");
          break;
        case "link-image":
          this.handleImageAction("link");
          break;
        case "new-tab":
          this.handleImageAction("toggle-new-tab");
          break;
        case "remove-link":
          this.handleImageAction("unlink");
          break;
        case "delete-image":
          this.handleImageAction("delete");
          break;
        default:
          break;
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
      Array.from(this.imageResizeToolbar.querySelectorAll('[data-image-action^="size-"], [data-image-action="reset-size"]')).forEach((button) => {
        const action = button.dataset.imageAction;
        const value = action === "size-small"
          ? "small"
          : action === "size-medium"
            ? "medium"
            : action === "size-large"
              ? "large"
              : action === "size-full"
                ? "full"
                : "reset";
        const isActive = value === activeSize || (value === "reset" && !activeSize);
        button.classList.toggle("is-active", isActive);
      });
      this.updateImageEditToolbarState();
    }

    positionImageResizeToolbar() {
      const targetBlock = this.selectedMediaBlock;
      if (!targetBlock || !this.surface || !this.content.contains(targetBlock)) {
        this.clearMediaSelection();
        return;
      }
      if (this.isModalOpen()) {
        if (this.imageResizeToolbar) {
          this.imageResizeToolbar.hidden = true;
        }
        if (this.imageResizeHandle) {
          this.imageResizeHandle.hidden = true;
        }
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

    getImageLinkData(figure) {
      if (!figure) return { href: "", newTab: false };
      const anchor = figure.querySelector("a[href]");
      if (!anchor) return { href: "", newTab: false };
      return {
        href: anchor.getAttribute("href") || "",
        newTab: anchor.getAttribute("target") === "_blank",
      };
    }

    getImageFigureData(figure) {
      if (!figure) {
        return {
          src: "",
          alt: "",
          caption: "",
          linkUrl: "",
          openInNewTab: false,
          alignment: "",
          size: "",
        };
      }
      const img = figure.querySelector("img");
      const caption = figure.querySelector("figcaption");
      const link = this.getImageLinkData(figure);
      return {
        src: img ? (img.getAttribute("src") || "") : "",
        alt: img ? (img.getAttribute("alt") || "") : "",
        caption: caption ? (caption.textContent || "") : "",
        linkUrl: link.href,
        openInNewTab: link.newTab,
        alignment: this.selectedImageFigure === figure ? this.getSelectedMediaAlignment() : MEDIA_ALIGNMENT_CLASSES.find((className) => figure.classList.contains(className))?.replace("ollow-align-", "") || "",
        size: this.selectedImageFigure === figure ? this.getSelectedImageSize() : IMAGE_SIZE_CLASSES.find((className) => figure.classList.contains(className))?.replace("ollow-image-", "") || "",
      };
    }

    buildImageFigureHtml(data) {
      const config = Object.assign({
        src: "",
        alt: "",
        caption: "",
        linkUrl: "",
        openInNewTab: false,
        alignment: "",
        size: "",
      }, data || {});
      const classes = ["ollow-editor-image"];
      if (config.size && config.size !== "reset") {
        classes.push(`ollow-image-${config.size}`);
      }
      if (config.alignment && config.alignment !== "reset") {
        classes.push(`ollow-align-${config.alignment}`);
      }
      const imgHtml = `<img src="${escapeHtml(config.src)}" alt="${escapeHtml(config.alt)}">`;
      const linkUrl = String(config.linkUrl || "").trim();
      const safeLink = linkUrl && isSafeUrl(linkUrl, "A") ? linkUrl : "";
      const mediaHtml = safeLink
        ? `<a href="${escapeHtml(safeLink)}"${config.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ""}>${imgHtml}</a>`
        : imgHtml;
      return `<figure class="${escapeHtml(classes.join(" "))}" data-type="image">${mediaHtml}<figcaption>${escapeHtml(config.caption || "")}</figcaption></figure>`;
    }

    updateImageFigure(figure, values) {
      if (!figure || !this.content.contains(figure)) return null;
      const wrapper = document.createElement("div");
      wrapper.innerHTML = this.buildImageFigureHtml(values);
      const replacement = wrapper.firstElementChild;
      if (!replacement) return null;
      figure.replaceWith(replacement);
      return replacement;
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

    handleImageAction(action) {
      if (!this.selectedImageFigure || !this.content.contains(this.selectedImageFigure)) {
        this.clearMediaSelection();
        return;
      }

      if (action === "edit") {
        this.openImageModalForFigure(this.selectedImageFigure);
        return;
      }

      if (action === "replace") {
        this.openImageModalForFigure(this.selectedImageFigure, { focusField: "file" });
        return;
      }

      if (action === "alt") {
        const current = this.getImageFigureData(this.selectedImageFigure);
        this.openModal({
          title: "Edit Alt Text",
          copy: "Describe the image for accessibility and screen readers.",
          confirmLabel: "Update Alt Text",
          fields: [
            { name: "alt", label: "Alt text", type: "text", placeholder: "Describe the image", value: current.alt },
          ],
          onConfirm: (values) => {
            const replacement = this.updateImageFigure(this.selectedImageFigure, Object.assign({}, current, { alt: values.alt.trim() }));
            if (replacement) {
              this.selectMediaBlock(replacement);
              this.handleContentChange();
            }
            return null;
          },
        });
        return;
      }

      if (action === "caption") {
        const current = this.getImageFigureData(this.selectedImageFigure);
        this.openModal({
          title: "Edit Caption",
          copy: "Update the image caption.",
          confirmLabel: "Update Caption",
          fields: [
            { name: "caption", label: "Caption", type: "textarea", placeholder: "Photo caption", value: current.caption },
          ],
          onConfirm: (values) => {
            const replacement = this.updateImageFigure(this.selectedImageFigure, Object.assign({}, current, { caption: values.caption.trim() }));
            if (replacement) {
              this.selectMediaBlock(replacement);
              this.handleContentChange();
            }
            return null;
          },
        });
        return;
      }

      if (action === "link") {
        const current = this.getImageFigureData(this.selectedImageFigure);
        this.openModal({
          title: "Link Image",
          copy: "Wrap the image in a safe link.",
          confirmLabel: "Update Link",
          fields: [
            { name: "linkUrl", label: "Link URL", type: "url", placeholder: "https://example.com", value: current.linkUrl },
            { name: "openInNewTab", label: "Open in new tab", type: "checkbox", checked: current.openInNewTab },
          ],
          onConfirm: (values) => {
            const linkUrl = String(values.linkUrl || "").trim();
            if (linkUrl && !isSafeUrl(linkUrl, "A")) {
              return "Enter a valid link URL.";
            }
            const replacement = this.updateImageFigure(this.selectedImageFigure, Object.assign({}, current, {
              linkUrl,
              openInNewTab: Boolean(values.openInNewTab),
            }));
            if (replacement) {
              this.selectMediaBlock(replacement);
              this.handleContentChange();
            }
            return null;
          },
        });
        return;
      }

      if (action === "toggle-new-tab") {
        const current = this.getImageFigureData(this.selectedImageFigure);
        if (!current.linkUrl) {
          this.showFeedback("Add an image link before toggling new-tab behavior.");
          return;
        }
        const replacement = this.updateImageFigure(this.selectedImageFigure, Object.assign({}, current, {
          openInNewTab: !current.openInNewTab,
        }));
        if (replacement) {
          this.selectMediaBlock(replacement);
          this.handleContentChange();
        }
        return;
      }

      if (action === "unlink") {
        const current = this.getImageFigureData(this.selectedImageFigure);
        if (!current.linkUrl) return;
        const replacement = this.updateImageFigure(this.selectedImageFigure, Object.assign({}, current, {
          linkUrl: "",
          openInNewTab: false,
        }));
        if (replacement) {
          this.selectMediaBlock(replacement);
          this.handleContentChange();
        }
        return;
      }

      if (action === "delete") {
        const figure = this.selectedImageFigure;
        this.clearMediaSelection();
        figure.remove();
        this.handleContentChange();
      }
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

    isModalOpen() {
      return Boolean(this.modal && !this.modal.hidden);
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
      if (this.isModalOpen()) {
        this.tableToolbar.hidden = true;
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
      this.updateTableToolbarState();
    }

    updateTableToolbarState() {
      if (!this.tableToolbar) return;
      const properties = this.getTableProperties(this.selectedTableFigure);
      const selectedCells = this.getSelectedTableCells();
      const hasHorizontalMergeSelection = this.canMergeSelectedTableCells();
      const splitAllowed = Boolean(this.selectedTableCell && ((Number(this.selectedTableCell.getAttribute("colspan")) || 1) > 1 || (Number(this.selectedTableCell.getAttribute("rowspan")) || 1) > 1));

      Array.from(this.tableToolbar.querySelectorAll("[data-table-action]")).forEach((button) => {
        const action = button.dataset.tableAction;
        button.classList.toggle("is-active", (
          (action === "toggle-header-row" && properties.headerRow) ||
          (action === "toggle-header-col" && properties.headerColumn)
        ));

        if (action === "merge-cells") {
          button.disabled = !hasHorizontalMergeSelection;
        } else if (action === "split-cell") {
          button.disabled = !splitAllowed;
        } else {
          button.disabled = !selectedCells.length;
        }
      });
    }

    getTableRowCells(row) {
      return Array.from((row && row.children) || []).filter((cell) => ["TD", "TH"].includes(cell.tagName.toUpperCase()));
    }

    ensureTableBody(table) {
      if (!table.tBodies.length) {
        table.appendChild(document.createElement("tbody"));
      }
      return table.tBodies[0];
    }

    normalizeTableStructure(table) {
      if (!table) return;
      if (table.tHead && !table.tHead.rows.length) {
        table.tHead.remove();
      }
      Array.from(table.tBodies).forEach((tbody) => {
        if (!tbody.rows.length) {
          tbody.remove();
        }
      });
      this.ensureTableBody(table);
    }

    setTableHeaderRow(enabled) {
      const figure = this.selectedTableFigure;
      const table = figure && figure.querySelector("table");
      if (!figure || !table) return;
      const body = this.ensureTableBody(table);

      if (enabled) {
        if (table.tHead && table.tHead.rows.length) return;
        const sourceRow = body.rows[0] || table.rows[0];
        if (!sourceRow) return;
        const headerRow = sourceRow.cloneNode(true);
        Array.from(headerRow.cells).forEach((cell) => {
          const nextCell = document.createElement("th");
          nextCell.innerHTML = cell.innerHTML || "Header";
          nextCell.colSpan = cell.colSpan || 1;
          nextCell.rowSpan = cell.rowSpan || 1;
          nextCell.setAttribute("scope", "col");
          cell.replaceWith(nextCell);
        });
        const thead = document.createElement("thead");
        thead.appendChild(headerRow);
        table.insertBefore(thead, table.firstChild);
        sourceRow.remove();
      } else if (table.tHead && table.tHead.rows.length) {
        const headerRow = table.tHead.rows[0];
        const replacement = document.createElement("tr");
        Array.from(headerRow.cells).forEach((cell) => {
          const nextCell = document.createElement("td");
          nextCell.innerHTML = cell.innerHTML || "Cell";
          nextCell.colSpan = cell.colSpan || 1;
          nextCell.rowSpan = cell.rowSpan || 1;
          replacement.appendChild(nextCell);
        });
        body.insertBefore(replacement, body.firstChild || null);
        table.tHead.remove();
      }
      this.normalizeTableStructure(table);
    }

    setTableHeaderColumn(enabled) {
      const figure = this.selectedTableFigure;
      const table = figure && figure.querySelector("table");
      if (!figure || !table) return;

      Array.from(table.rows).forEach((row, rowIndex) => {
        const firstCell = row.cells[0];
        if (!firstCell) return;
        if (enabled) {
          if (firstCell.tagName.toUpperCase() !== "TH") {
            const replacement = document.createElement("th");
            replacement.innerHTML = firstCell.innerHTML || (rowIndex === 0 && table.tHead ? "Header" : "Row");
            replacement.colSpan = firstCell.colSpan || 1;
            replacement.rowSpan = firstCell.rowSpan || 1;
            replacement.setAttribute("scope", "row");
            firstCell.replaceWith(replacement);
          } else {
            firstCell.setAttribute("scope", rowIndex === 0 && table.tHead ? "col" : "row");
          }
        } else if (firstCell.tagName.toUpperCase() === "TH" && firstCell.getAttribute("scope") === "row") {
          const replacement = document.createElement("td");
          replacement.innerHTML = firstCell.innerHTML || "Cell";
          replacement.colSpan = firstCell.colSpan || 1;
          replacement.rowSpan = firstCell.rowSpan || 1;
          firstCell.replaceWith(replacement);
        }
      });
      this.normalizeTableStructure(table);
    }

    canMergeSelectedTableCells() {
      const cells = this.getSelectedTableCells();
      if (cells.length < 2) return false;
      const firstRow = cells[0].parentElement;
      if (!firstRow || !cells.every((cell) => cell.parentElement === firstRow)) {
        return false;
      }
      const indexes = cells
        .map((cell) => this.getTableRowCells(firstRow).indexOf(cell))
        .filter((index) => index >= 0)
        .sort((a, b) => a - b);
      if (indexes.length !== cells.length) return false;
      return indexes.every((index, position) => position === 0 || index === indexes[position - 1] + 1);
    }

    mergeSelectedTableCells() {
      const cells = this.getSelectedTableCells();
      if (!this.canMergeSelectedTableCells()) {
        this.showFeedback("Only adjacent cells in the same row can be merged.");
        return this.selectedTableCell;
      }
      const primaryCell = cells[0];
      const totalColspan = cells.reduce((sum, cell) => sum + (Number(cell.getAttribute("colspan")) || 1), 0);
      const mergedContent = cells
        .map((cell) => (cell.textContent || "").trim())
        .filter(Boolean)
        .join(" ");
      primaryCell.colSpan = totalColspan;
      primaryCell.innerHTML = mergedContent ? escapeHtml(mergedContent) : "Cell";
      cells.slice(1).forEach((cell) => cell.remove());
      return primaryCell;
    }

    splitSelectedTableCell() {
      const cell = this.selectedTableCell;
      if (!cell) return cell;
      const colspan = Number(cell.getAttribute("colspan")) || 1;
      const rowspan = Number(cell.getAttribute("rowspan")) || 1;
      if (rowspan > 1) {
        this.showFeedback("Splitting row spans is not supported in this editor yet.");
      }
      if (colspan <= 1) {
        return cell;
      }
      const tagName = cell.tagName.toLowerCase();
      cell.removeAttribute("colspan");
      for (let index = 1; index < colspan; index += 1) {
        const nextCell = document.createElement(tagName);
        if (tagName === "th" && cell.getAttribute("scope")) {
          nextCell.setAttribute("scope", cell.getAttribute("scope"));
        }
        nextCell.textContent = tagName === "th" ? "Header" : "Cell";
        cell.insertAdjacentElement("afterend", nextCell);
      }
      return cell;
    }

    applyTableProperties(values) {
      const figure = this.selectedTableFigure;
      const table = figure && figure.querySelector("table");
      if (!figure || !table) return;

      figure.classList.remove(...TABLE_WIDTH_CLASSES, ...TABLE_STYLE_CLASSES);
      if (values.width === "wide") {
        figure.classList.add("ollow-table-wide");
      } else if (values.width === "full") {
        figure.classList.add("ollow-table-full");
      }
      if (values.striped) {
        figure.classList.add("ollow-table-striped");
      }
      if (values.bordered) {
        figure.classList.add("ollow-table-bordered");
      }
      if (values.compact) {
        figure.classList.add("ollow-table-compact");
      }

      this.setTableHeaderRow(Boolean(values.headerRow));
      this.setTableHeaderColumn(Boolean(values.headerColumn));

      let caption = figure.querySelector("figcaption");
      const captionText = String(values.caption || "").trim();
      if (captionText) {
        if (!caption) {
          caption = document.createElement("figcaption");
          figure.appendChild(caption);
        }
        caption.textContent = captionText;
      } else if (caption) {
        caption.remove();
      }

      this.normalizeTableStructure(table);
      this.updateTableToolbarState();
      this.handleContentChange();
    }

    openTablePropertiesModal() {
      const current = this.getTableProperties(this.selectedTableFigure);
      this.openModal({
        title: "Table Properties",
        copy: "Set caption, width, header behavior, and display variants for the selected table.",
        confirmLabel: "Update Table",
        panelClass: "ollow-table-properties-modal-panel",
        fields: [
          { name: "caption", label: "Table caption", type: "text", placeholder: "Table caption", value: current.caption },
          {
            name: "width",
            label: "Table width",
            type: "select",
            value: current.width,
            options: [
              { value: "auto", label: "Auto" },
              { value: "wide", label: "Wide" },
              { value: "full", label: "Full width" },
            ],
          },
          { name: "headerRow", label: "Header row", type: "checkbox", checked: current.headerRow },
          { name: "headerColumn", label: "Header column", type: "checkbox", checked: current.headerColumn },
          { name: "striped", label: "Striped rows", type: "checkbox", checked: current.striped },
          { name: "bordered", label: "Bordered style", type: "checkbox", checked: current.bordered },
          { name: "compact", label: "Compact style", type: "checkbox", checked: current.compact },
        ],
        onConfirm: (values) => {
          this.applyTableProperties(values);
          return null;
        },
      });
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

    buildTableHtml(rows, columns, caption, hasHeaderRow, options) {
      const config = Object.assign({
        width: "auto",
        headerColumn: false,
        striped: false,
        bordered: false,
        compact: false,
      }, options || {});
      const safeRows = Math.max(1, Math.min(20, Number(rows) || 1));
      const safeColumns = Math.max(1, Math.min(12, Number(columns) || 1));
      const totalBodyRows = hasHeaderRow ? Math.max(1, safeRows - 1) : safeRows;
      const figureClasses = ["ollow-editor-table"];
      if (config.width === "wide") figureClasses.push("ollow-table-wide");
      if (config.width === "full") figureClasses.push("ollow-table-full");
      if (config.striped) figureClasses.push("ollow-table-striped");
      if (config.bordered) figureClasses.push("ollow-table-bordered");
      if (config.compact) figureClasses.push("ollow-table-compact");

      let thead = "";
      if (hasHeaderRow) {
        const headerCells = Array.from({ length: safeColumns }, (_, index) => `<th scope="col">Header ${index + 1}</th>`).join("");
        thead = `<thead><tr>${headerCells}</tr></thead>`;
      }

      const bodyRows = Array.from({ length: totalBodyRows }, (_, rowIndex) => {
        const cells = Array.from({ length: safeColumns }, (_, cellIndex) => {
          if (cellIndex === 0 && config.headerColumn) {
            return `<th scope="row">${hasHeaderRow ? `Row ${rowIndex + 1}` : `Header ${rowIndex + 1}`}</th>`;
          }
          return "<td>Cell</td>";
        }).join("");
        return `<tr>${cells}</tr>`;
      }).join("");

      return `<figure class="${escapeHtml(figureClasses.join(" "))}" data-type="table"><div class="ollow-editor-table-scroll"><table>${thead}<tbody>${bodyRows}</tbody></table></div>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
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
      const rowCells = this.getTableRowCells(currentRow);
      const cellIndex = rowCells.indexOf(this.selectedTableCell);
      if (currentIndex === -1 || cellIndex === -1) return;

      let focusCell = this.selectedTableCell;
      const currentTag = this.selectedTableCell.tagName.toLowerCase();

      switch (action) {
        case "row-above": {
          const newRow = this.createTableRow(rowCells.length, currentTag === "th");
          currentRow.parentElement.insertBefore(newRow, currentRow);
          focusCell = newRow.children[Math.min(cellIndex, newRow.children.length - 1)] || newRow.firstElementChild;
          break;
        }
        case "row-below": {
          const newRow = this.createTableRow(rowCells.length, currentTag === "th");
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
            const cells = this.getTableRowCells(row);
            const sourceCell = cells[Math.min(cellIndex, cells.length - 1)];
            const newCell = document.createElement(sourceCell && sourceCell.tagName.toUpperCase() === "TH" ? "th" : "td");
            newCell.textContent = newCell.tagName.toUpperCase() === "TH" ? "Header" : "Cell";
            if (newCell.tagName.toUpperCase() === "TH" && row.parentElement && row.parentElement.tagName.toUpperCase() === "THEAD") {
              newCell.setAttribute("scope", "col");
            }
            const referenceCell = cells[cellIndex] || row.lastElementChild;
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
            const cells = this.getTableRowCells(row);
            if (cells[cellIndex]) {
              cells[cellIndex].remove();
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
        case "toggle-header-row": {
          this.setTableHeaderRow(!(table.tHead && table.tHead.rows.length));
          focusCell = table.querySelector("td,th");
          break;
        }
        case "toggle-header-col": {
          this.setTableHeaderColumn(!this.getTableProperties(this.selectedTableFigure).headerColumn);
          focusCell = table.querySelector("td,th");
          break;
        }
        case "merge-cells": {
          focusCell = this.mergeSelectedTableCells();
          break;
        }
        case "split-cell": {
          focusCell = this.splitSelectedTableCell();
          break;
        }
        case "table-properties": {
          this.openTablePropertiesModal();
          return;
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

      this.normalizeTableStructure(table);

      const nextCell = focusCell || table.querySelector("td,th");
      if (nextCell) {
        this.selectTableCell(nextCell);
        this.focusTableCell(nextCell);
      }
      this.updateTableToolbarState();
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
      if (!(file instanceof File)) {
        return Promise.reject(new Error("A file is required."));
      }
      return readFileAsDataURL(file);
    }

    getUploadUrl(type) {
      const upload = this.options.upload || {};
      if (type === "gallery") return upload.galleryUrl || upload.imageUrl || "";
      if (type === "attachment") return upload.attachmentUrl || "";
      return upload.imageUrl || "";
    }

    getCSRFToken() {
      const upload = this.options.upload || {};
      if (upload.csrfToken) return String(upload.csrfToken);

      const hiddenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
      if (hiddenInput && hiddenInput.value) {
        return hiddenInput.value;
      }

      const cookieMatch = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
      return cookieMatch ? decodeURIComponent(cookieMatch[1]) : "";
    }

    async uploadFile(file, type) {
      const files = await this.uploadFiles([file], type);
      return files[0] || "";
    }

    async uploadFiles(files, type) {
      const fileList = Array.from(files || []).filter((file) => file instanceof File);
      if (!fileList.length) {
        throw new Error("A file is required.");
      }

      if ((type === "image" || type === "gallery") && fileList.some((file) => !this.isImageFile(file))) {
        throw new Error("Only image files are supported.");
      }

      const upload = this.options.upload || {};
      const uploadUrl = this.getUploadUrl(type);
      const allowFallback = Boolean(upload.allowFallback);

      if (type === "gallery" && !upload.galleryUrl && upload.imageUrl) {
        return Promise.all(fileList.map((item) => this.uploadFile(item, "image")));
      }

      if (!uploadUrl) {
        if (type === "attachment") {
          throw new Error("Attachment upload URL is not configured.");
        }
        return Promise.all(fileList.map((file) => this.fileToDataURL(file)));
      }

      const formData = new FormData();
      const fieldName = type === "attachment" ? "file" : "image";
      fileList.forEach((file) => {
        formData.append(fieldName, file);
      });

      const headers = Object.assign({}, upload.headers || {});
      const csrfHeaderName = upload.csrfHeaderName || "X-CSRFToken";
      const csrfHeaderValue = upload.csrfHeaderValue || this.getCSRFToken();
      if (csrfHeaderName && csrfHeaderValue && !headers[csrfHeaderName]) {
        headers[csrfHeaderName] = csrfHeaderValue;
      }

      this.showFeedback(type === "attachment" ? "Uploading attachment..." : "Uploading files...");
      try {
        const response = await fetch(uploadUrl, {
          method: upload.method || "POST",
          headers,
          body: formData,
          credentials: upload.credentials || "same-origin",
        });

        let payload = null;
        const responseType = response.headers.get("content-type") || "";
        if (responseType.includes("application/json")) {
          payload = await response.json();
        } else {
          const text = await response.text();
          payload = text ? { detail: text } : null;
        }

        if (!response.ok) {
          const serverMessage = payload && (payload.error || payload.detail || payload.message);
          throw new Error(serverMessage || `Upload failed with status ${response.status}.`);
        }

        const urls = extractUploadUrls(payload);
        const validUrls = urls.filter((url) => isSafeUrl(url, type === "attachment" ? "A" : "IMG"));
        if (!validUrls.length) {
          throw new Error("The upload endpoint must return a valid URL.");
        }
        if (fileList.length > 1 && validUrls.length !== fileList.length) {
          throw new Error("The upload endpoint returned an unexpected number of files.");
        }
        return validUrls;
      } catch (error) {
        if (allowFallback && type !== "attachment") {
          return Promise.all(fileList.map((item) => this.fileToDataURL(item)));
        }
        throw error;
      } finally {
        this.clearFeedback();
      }
    }

    async resolveImageSource(file) {
      if (!this.isImageFile(file)) {
        throw new Error("Only image files are supported.");
      }
      return this.uploadFile(file, "image");
    }

    buildDroppedImageHtml(src) {
      return this.buildImageFigureHtml({ src, alt: "", caption: "", linkUrl: "", openInNewTab: false, alignment: "", size: "" });
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

    getRecentSpecialCharacters() {
      const chars = Array.isArray(this.recentSpecialCharacters) ? this.recentSpecialCharacters : [];
      return chars.filter((char) => SPECIAL_CHARACTER_LOOKUP.has(char)).slice(0, 12);
    }

    rememberRecentSpecialCharacter(char) {
      if (!SPECIAL_CHARACTER_LOOKUP.has(char)) return;
      const chars = this.getRecentSpecialCharacters().filter((item) => item !== char);
      chars.unshift(char);
      this.recentSpecialCharacters = chars.slice(0, 12);
      writeStoredRecentSpecialCharacters(this.recentSpecialCharacters);
    }

    insertSpecialCharacter(char) {
      if (!char) return;
      this.focus();
      this.restoreSelection();
      insertHtmlAtSelection(this.content, escapeHtml(char), this.savedSelection);
      this.saveSelection();
      this.rememberRecentSpecialCharacter(char);
      this.handleContentChange();
    }

    getSpecialCharacterResults(searchTerm, category) {
      const query = String(searchTerm || "").trim().toLowerCase();
      return SPECIAL_CHARACTER_CATEGORIES
        .filter((group) => category === "all" || group.key === category)
        .flatMap((group) => group.chars.map((item) => Object.assign({ category: group.key, categoryLabel: group.label }, item)))
        .filter((item) => {
          if (!query) return true;
          return item.char.includes(query) ||
            item.label.toLowerCase().includes(query) ||
            item.categoryLabel.toLowerCase().includes(query);
        });
    }

    openSpecialCharacterModal() {
      let selectedChar = "";
      let activeCategory = "all";
      let searchTerm = "";
      this.openModal({
        title: "Special Characters",
        copy: "Search, preview, and insert symbols into the current story position.",
        confirmLabel: "Insert Character",
        panelClass: "ollow-special-characters-modal-panel",
        fields: [
          {
            name: "picker",
            label: "Character picker",
            type: "html",
            html: `
              <div class="ollow-special-chars-picker">
                <div class="ollow-special-chars-search-row">
                  <input type="search" class="nw-modal-input ollow-special-chars-search" placeholder="Search characters, labels, or categories">
                </div>
                <div class="ollow-special-chars-tabs">
                  <button type="button" class="is-active" data-special-category="all">All</button>
                  ${SPECIAL_CHARACTER_CATEGORIES.map((category) => `<button type="button" data-special-category="${escapeHtml(category.key)}">${escapeHtml(category.label)}</button>`).join("")}
                </div>
                <div class="ollow-special-chars-section" data-role="recent-wrap" hidden>
                  <div class="ollow-special-chars-section-label">Recent</div>
                  <div class="ollow-special-chars-grid ollow-special-chars-grid--compact" data-role="recent-grid"></div>
                </div>
                <div class="ollow-special-chars-grid" data-role="results-grid"></div>
                <div class="ollow-special-chars-preview">
                  <div class="ollow-special-chars-preview-char" data-role="preview-char">Ω</div>
                  <div class="ollow-special-chars-preview-meta">
                    <strong data-role="preview-label">Special character</strong>
                    <span data-role="preview-category">Choose a symbol to insert.</span>
                  </div>
                </div>
              </div>
            `,
          },
        ],
        onOpen: () => {
          const root = this.modalBody.querySelector(".ollow-special-chars-picker");
          if (!root) return;
          const searchInput = root.querySelector(".ollow-special-chars-search");
          const tabButtons = Array.from(root.querySelectorAll("[data-special-category]"));
          const recentWrap = root.querySelector('[data-role="recent-wrap"]');
          const recentGrid = root.querySelector('[data-role="recent-grid"]');
          const resultsGrid = root.querySelector('[data-role="results-grid"]');
          const previewChar = root.querySelector('[data-role="preview-char"]');
          const previewLabel = root.querySelector('[data-role="preview-label"]');
          const previewCategory = root.querySelector('[data-role="preview-category"]');

          const setPreview = (char) => {
            const item = SPECIAL_CHARACTER_LOOKUP.get(char);
            selectedChar = char;
            if (!item) {
              previewChar.textContent = "Ω";
              previewLabel.textContent = "Special character";
              previewCategory.textContent = "Choose a symbol to insert.";
              return;
            }
            previewChar.textContent = item.char;
            previewLabel.textContent = item.label;
            previewCategory.textContent = item.categoryLabel;
          };

          const renderRecent = () => {
            const recent = this.getRecentSpecialCharacters();
            recentWrap.hidden = !recent.length;
            recentGrid.innerHTML = recent.map((char) => {
              const item = SPECIAL_CHARACTER_LOOKUP.get(char);
              return `<button type="button" class="ollow-special-char-option ollow-special-char-option--compact${selectedChar === item.char ? " is-active" : ""}" data-special-char="${escapeHtml(item.char)}" title="${escapeHtml(item.label)}">${escapeHtml(item.char)}</button>`;
            }).join("");
          };

          const renderResults = () => {
            const results = this.getSpecialCharacterResults(searchTerm, activeCategory);
            resultsGrid.innerHTML = results.length
              ? results.map((item) => `
                <button type="button" class="ollow-special-char-option${selectedChar === item.char ? " is-active" : ""}" data-special-char="${escapeHtml(item.char)}" title="${escapeHtml(item.label)}">
                  <span class="ollow-special-char-glyph">${escapeHtml(item.char)}</span>
                  <span class="ollow-special-char-name">${escapeHtml(item.label)}</span>
                </button>
              `).join("")
              : `<div class="ollow-special-chars-empty">No characters match that search.</div>`;
          };

          const handleChoice = (char) => {
            setPreview(char);
            renderRecent();
            renderResults();
          };

          renderRecent();
          renderResults();
          setPreview(selectedChar);

          searchInput?.addEventListener("input", () => {
            searchTerm = searchInput.value || "";
            renderResults();
          });

          tabButtons.forEach((button) => {
            button.addEventListener("click", (event) => {
              event.preventDefault();
              activeCategory = button.dataset.specialCategory || "all";
              tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
              renderResults();
            });
          });

          root.addEventListener("click", (event) => {
            const option = event.target.closest("[data-special-char]");
            if (!option) return;
            event.preventDefault();
            handleChoice(option.dataset.specialChar || "");
          });
        },
        onConfirm: () => {
          if (!selectedChar) {
            return "Choose a character to insert.";
          }
          this.insertSpecialCharacter(selectedChar);
          return null;
        },
      });
    }

    getRecentEmojis() {
      const emojis = Array.isArray(this.recentEmojis) ? this.recentEmojis : [];
      return emojis.filter((emoji) => EMOJI_LOOKUP.has(emoji)).slice(0, 18);
    }

    rememberRecentEmoji(emoji) {
      if (!EMOJI_LOOKUP.has(emoji)) return;
      const emojis = this.getRecentEmojis().filter((item) => item !== emoji);
      emojis.unshift(emoji);
      this.recentEmojis = emojis.slice(0, 18);
      writeStoredRecentEmojis(this.recentEmojis);
    }

    insertEmoji(emoji) {
      if (!emoji) return;
      this.focus();
      this.restoreSelection();
      insertHtmlAtSelection(this.content, escapeHtml(emoji), this.savedSelection);
      this.saveSelection();
      this.rememberRecentEmoji(emoji);
      this.handleContentChange();
    }

    getEmojiResults(searchTerm, category) {
      const query = String(searchTerm || "").trim().toLowerCase();
      return EMOJI_CATEGORIES
        .filter((group) => category === "all" || group.key === category)
        .flatMap((group) => group.emojis.map((item) => Object.assign({ category: group.key, categoryLabel: group.label }, item)))
        .filter((item) => {
          if (!query) return true;
          return item.label.toLowerCase().includes(query) || item.categoryLabel.toLowerCase().includes(query);
        });
    }

    openEmojiModal() {
      let selectedEmoji = "";
      let activeCategory = "all";
      let searchTerm = "";
      this.openModal({
        title: "Emoji Picker",
        copy: "Search, preview, and insert emoji into the current story position.",
        confirmLabel: "Insert Emoji",
        panelClass: "ollow-special-characters-modal-panel ollow-emoji-modal-panel",
        fields: [
          {
            name: "picker",
            label: "Emoji picker",
            type: "html",
            html: `
              <div class="ollow-emoji-picker">
                <div class="ollow-special-chars-search-row">
                  <input type="search" class="nw-modal-input ollow-emoji-search" placeholder="Search emoji or categories">
                </div>
                <div class="ollow-special-chars-tabs ollow-emoji-tabs">
                  <button type="button" class="is-active" data-emoji-category="all">All</button>
                  ${EMOJI_CATEGORIES.map((category) => `<button type="button" data-emoji-category="${escapeHtml(category.key)}">${escapeHtml(category.label)}</button>`).join("")}
                </div>
                <div class="ollow-special-chars-section" data-role="recent-wrap" hidden>
                  <div class="ollow-special-chars-section-label">Recent</div>
                  <div class="ollow-emoji-grid ollow-emoji-grid--compact" data-role="recent-grid"></div>
                </div>
                <div class="ollow-emoji-grid" data-role="results-grid"></div>
                <div class="ollow-special-chars-preview ollow-emoji-preview">
                  <div class="ollow-special-chars-preview-char ollow-emoji-preview-char" data-role="preview-emoji">☺</div>
                  <div class="ollow-special-chars-preview-meta">
                    <strong data-role="preview-label">Emoji</strong>
                    <span data-role="preview-category">Choose an emoji to insert.</span>
                  </div>
                </div>
              </div>
            `,
          },
        ],
        onOpen: () => {
          const root = this.modalBody.querySelector(".ollow-emoji-picker");
          if (!root) return;
          const searchInput = root.querySelector(".ollow-emoji-search");
          const tabButtons = Array.from(root.querySelectorAll("[data-emoji-category]"));
          const recentWrap = root.querySelector('[data-role="recent-wrap"]');
          const recentGrid = root.querySelector('[data-role="recent-grid"]');
          const resultsGrid = root.querySelector('[data-role="results-grid"]');
          const previewEmoji = root.querySelector('[data-role="preview-emoji"]');
          const previewLabel = root.querySelector('[data-role="preview-label"]');
          const previewCategory = root.querySelector('[data-role="preview-category"]');

          const setPreview = (emoji) => {
            const item = EMOJI_LOOKUP.get(emoji);
            selectedEmoji = emoji;
            if (!item) {
              previewEmoji.textContent = "☺";
              previewLabel.textContent = "Emoji";
              previewCategory.textContent = "Choose an emoji to insert.";
              return;
            }
            previewEmoji.textContent = item.emoji;
            previewLabel.textContent = item.label;
            previewCategory.textContent = item.categoryLabel;
          };

          const renderRecent = () => {
            const recent = this.getRecentEmojis();
            recentWrap.hidden = !recent.length;
            recentGrid.innerHTML = recent.map((emoji) => {
              const item = EMOJI_LOOKUP.get(emoji);
              return `<button type="button" class="ollow-emoji-option ollow-emoji-option--compact${selectedEmoji === item.emoji ? " is-active" : ""}" data-emoji-choice="${escapeHtml(item.emoji)}" title="${escapeHtml(item.label)}">${escapeHtml(item.emoji)}</button>`;
            }).join("");
          };

          const renderResults = () => {
            const results = this.getEmojiResults(searchTerm, activeCategory);
            resultsGrid.innerHTML = results.length
              ? results.map((item) => `
                <button type="button" class="ollow-emoji-option${selectedEmoji === item.emoji ? " is-active" : ""}" data-emoji-choice="${escapeHtml(item.emoji)}" title="${escapeHtml(item.label)}">
                  <span class="ollow-emoji-glyph">${escapeHtml(item.emoji)}</span>
                  <span class="ollow-emoji-name">${escapeHtml(item.label)}</span>
                </button>
              `).join("")
              : `<div class="ollow-special-chars-empty">No emoji match that search.</div>`;
          };

          const handleChoice = (emoji) => {
            setPreview(emoji);
            renderRecent();
            renderResults();
          };

          renderRecent();
          renderResults();
          setPreview(selectedEmoji);

          searchInput?.addEventListener("input", () => {
            searchTerm = searchInput.value || "";
            renderResults();
          });

          tabButtons.forEach((button) => {
            button.addEventListener("click", (event) => {
              event.preventDefault();
              activeCategory = button.dataset.emojiCategory || "all";
              tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
              renderResults();
            });
          });

          root.addEventListener("click", (event) => {
            const option = event.target.closest("[data-emoji-choice]");
            if (!option) return;
            event.preventDefault();
            handleChoice(option.dataset.emojiChoice || "");
          });
        },
        onConfirm: () => {
          if (!selectedEmoji) {
            return "Choose an emoji to insert.";
          }
          this.insertEmoji(selectedEmoji);
          return null;
        },
      });
    }

    isFindReplaceOpen() {
      return Boolean(this.findReplacePanel && !this.findReplacePanel.hidden);
    }

    getFindReplaceOptions() {
      return {
        query: String(this.findReplaceElements.find?.value || ""),
        replace: String(this.findReplaceElements.replace?.value || ""),
        matchCase: Boolean(this.findReplaceElements.matchCase?.checked),
        wholeWord: Boolean(this.findReplaceElements.wholeWord?.checked),
        highlightAll: Boolean(this.findReplaceElements.highlightAll?.checked),
        includeCode: Boolean(this.findReplaceElements.includeCode?.checked),
      };
    }

    buildFindReplaceRegex(options) {
      const query = String(options.query || "");
      if (!query) return null;
      const escaped = escapeRegExp(query);
      const pattern = options.wholeWord ? `\\b${escaped}\\b` : escaped;
      return new RegExp(pattern, options.matchCase ? "g" : "gi");
    }

    unwrapFindHighlightSpan(span) {
      if (!span || !span.parentNode) return;
      const text = document.createTextNode(span.textContent || "");
      span.replaceWith(text);
    }

    clearFindReplaceHighlights() {
      const root = this.getFindReplaceRoot();
      if (!root) return;
      Array.from(root.querySelectorAll(`span.${FIND_REPLACE_HIGHLIGHT_CLASS}`)).forEach((span) => {
        this.unwrapFindHighlightSpan(span);
      });
      root.normalize();
      root.classList.remove("ollow-find-hide-others");
      if (this.findReplaceState) {
        this.findReplaceState.matches = [];
        this.findReplaceState.currentIndex = -1;
      }
    }

    getFindReplaceRoot() {
      return this.content || null;
    }

    getFindReplaceTextNodes(includeCode) {
      const root = this.getFindReplaceRoot();
      if (!root) return [];
      const nodes = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement || node.parentNode;
          if (!(parent instanceof Element)) return NodeFilter.FILTER_REJECT;
          if (parent.closest("[contenteditable='false']")) return NodeFilter.FILTER_REJECT;
          if (parent.closest(`.${BOOKMARK_CLASS}`)) return NodeFilter.FILTER_REJECT;
          if (parent.closest(`span.${FIND_REPLACE_HIGHLIGHT_CLASS}`)) return NodeFilter.FILTER_REJECT;
          if (
            parent.closest(
              ".ollow-find-replace-panel, .nw-editor-toolbar, .nw-toolbar-cluster, .ollow-media-toolbar, .ollow-image-resize-toolbar, .ollow-table-toolbar, .ollow-bookmark-toolbar, .nw-modal, .nw-modal-backdrop"
            )
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!includeCode && parent.closest("figure.ollow-editor-code, pre")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let current = walker.nextNode();
      while (current) {
        nodes.push(current);
        current = walker.nextNode();
      }
      return nodes;
    }

    updateFindReplaceCount() {
      if (!this.findReplaceElements.count) return;
      const total = this.findReplaceState && Array.isArray(this.findReplaceState.matches) ? this.findReplaceState.matches.length : 0;
      const current = total ? (this.findReplaceState.currentIndex + 1) : 0;
      this.findReplaceElements.count.textContent = `${current} of ${total}`;
    }

    updateFindHighlightVisibility() {
      const root = this.getFindReplaceRoot();
      if (!root) return;
      const shouldHighlightAll = Boolean(this.findReplaceElements.highlightAll?.checked);
      root.classList.toggle("ollow-find-hide-others", !shouldHighlightAll);
    }

    focusCurrentFindMatch(options) {
      const config = Object.assign({ moveEditorSelection: false }, options || {});
      const matches = this.findReplaceState?.matches || [];
      const current = matches[this.findReplaceState.currentIndex] || null;
      matches.forEach((match) => match.classList.remove(FIND_REPLACE_CURRENT_CLASS));
      if (!current) {
        this.updateFindReplaceCount();
        this.updateFindHighlightVisibility();
        return;
      }
      current.classList.add(FIND_REPLACE_CURRENT_CLASS);
      current.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      if (config.moveEditorSelection) {
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(current);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      this.updateFindReplaceCount();
      this.updateFindHighlightVisibility();
    }

    refreshFindReplaceResults(options) {
      if (!this.findReplacePanel) return;
      const root = this.getFindReplaceRoot();
      if (!root) return;
      const config = Object.assign({
        preserveCurrent: false,
        moveEditorSelection: false,
        preservePanelFocus: false,
      }, options || {});
      const panelFocus = config.preservePanelFocus ? this.captureFindReplaceFocus() : null;
      const previousText = config.preserveCurrent && this.findReplaceState?.matches?.[this.findReplaceState.currentIndex]
        ? this.findReplaceState.matches[this.findReplaceState.currentIndex].textContent
        : "";
      this.clearFindReplaceHighlights();

      const searchOptions = this.getFindReplaceOptions();
      const regex = this.buildFindReplaceRegex(searchOptions);
      this.findReplaceState = {
        options: searchOptions,
        matches: [],
        currentIndex: -1,
      };
      if (!regex) {
        this.updateFindReplaceCount();
        return;
      }

      this.getFindReplaceTextNodes(searchOptions.includeCode).forEach((textNode) => {
        const text = textNode.nodeValue || "";
        const matches = [];
        regex.lastIndex = 0;
        let match = regex.exec(text);
        while (match) {
          matches.push({
            index: match.index || 0,
            value: match[0],
          });
          if (!match[0]) {
            regex.lastIndex += 1;
          }
          match = regex.exec(text);
        }
        if (!matches.length) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        matches.forEach((match) => {
          const start = match.index || 0;
          const end = start + match.value.length;
          if (start > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));
          }
          const span = document.createElement("span");
          span.className = FIND_REPLACE_HIGHLIGHT_CLASS;
          span.textContent = match.value;
          fragment.appendChild(span);
          this.findReplaceState.matches.push(span);
          lastIndex = end;
        });
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        textNode.parentNode.replaceChild(fragment, textNode);
      });

      if (this.findReplaceState.matches.length) {
        const preservedIndex = previousText
          ? this.findReplaceState.matches.findIndex((match) => match.textContent === previousText)
          : -1;
        this.findReplaceState.currentIndex = preservedIndex >= 0 ? preservedIndex : 0;
      }
      this.focusCurrentFindMatch({ moveEditorSelection: config.moveEditorSelection });
      if (panelFocus) {
        this.restoreFindReplaceFocus(panelFocus);
      }
    }

    moveFindMatch(direction) {
      if (!this.findReplaceState?.matches?.length) {
        this.refreshFindReplaceResults({ preservePanelFocus: true, moveEditorSelection: false });
        return;
      }
      const total = this.findReplaceState.matches.length;
      this.findReplaceState.currentIndex = (this.findReplaceState.currentIndex + (direction > 0 ? 1 : -1) + total) % total;
      this.focusCurrentFindMatch({ moveEditorSelection: false });
      this.findReplaceElements.find?.focus();
    }

    replaceCurrentFindMatch() {
      const match = this.findReplaceState?.matches?.[this.findReplaceState.currentIndex];
      if (!match) return;
      const panelFocus = this.captureFindReplaceFocus();
      const replacement = document.createTextNode(this.getFindReplaceOptions().replace);
      match.replaceWith(replacement);
      this.handleContentChange();
      this.refreshFindReplaceResults({ preservePanelFocus: true, moveEditorSelection: false });
      this.restoreFindReplaceFocus(panelFocus);
    }

    replaceAllFindMatches() {
      const options = this.getFindReplaceOptions();
      const regex = this.buildFindReplaceRegex(options);
      if (!regex) return;
      const panelFocus = this.captureFindReplaceFocus();
      this.clearFindReplaceHighlights();
      let replacements = 0;
      this.getFindReplaceTextNodes(options.includeCode).forEach((textNode) => {
        const original = textNode.nodeValue || "";
        regex.lastIndex = 0;
        if (!regex.test(original)) return;
        regex.lastIndex = 0;
        textNode.nodeValue = original.replace(regex, () => {
          replacements += 1;
          return options.replace;
        });
      });
      if (replacements) {
        this.handleContentChange();
      }
      this.refreshFindReplaceResults({ preservePanelFocus: true, moveEditorSelection: false });
      this.restoreFindReplaceFocus(panelFocus);
    }

    openFindReplacePanel(mode) {
      if (!this.findReplacePanel) return;
      this.saveSelection();
      if (this.findReplacePanel.hidden) {
        this.findReplaceSelectionBeforeOpen = this.savedSelection ? this.savedSelection.cloneRange() : null;
      }
      const selection = window.getSelection();
      const selectedText = selection && selection.toString().trim();
      if (selectedText && this.findReplaceElements.find && !this.findReplaceElements.find.value) {
        this.findReplaceElements.find.value = selectedText;
      }
      this.findReplacePanel.hidden = false;
      this.refreshFindReplaceResults({ moveEditorSelection: false, preservePanelFocus: true });
      const target = mode === "replace" ? this.findReplaceElements.replace : this.findReplaceElements.find;
      if (target) {
        window.setTimeout(() => {
          target.focus();
          target.select();
        }, 0);
      }
    }

    closeFindReplacePanel(options) {
      if (!this.findReplacePanel) return;
      const config = Object.assign({ restoreSelection: false }, options || {});
      this.clearFindReplaceHighlights();
      this.findReplacePanel.hidden = true;
      if (config.restoreSelection) {
        this.focus();
        if (this.findReplaceSelectionBeforeOpen) {
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(this.findReplaceSelectionBeforeOpen.cloneRange());
          }
          this.savedSelection = this.findReplaceSelectionBeforeOpen.cloneRange();
        } else {
          this.restoreSelection();
        }
      }
      this.findReplaceSelectionBeforeOpen = null;
    }

    captureFindReplaceFocus() {
      if (!this.findReplacePanel || !this.findReplacePanel.contains(document.activeElement)) return null;
      const element = document.activeElement;
      return {
        role: element?.dataset?.role || "",
        action: element?.dataset?.action || "",
        start: typeof element?.selectionStart === "number" ? element.selectionStart : null,
        end: typeof element?.selectionEnd === "number" ? element.selectionEnd : null,
      };
    }

    restoreFindReplaceFocus(focusState) {
      if (!focusState || !this.findReplacePanel) return;
      let target = null;
      if (focusState.role) {
        target = this.findReplacePanel.querySelector(`[data-role="${focusState.role}"]`);
      } else if (focusState.action) {
        target = this.findReplacePanel.querySelector(`[data-action="${focusState.action}"]`);
      }
      if (!target) return;
      target.focus();
      if (
        focusState.start !== null &&
        focusState.end !== null &&
        typeof target.setSelectionRange === "function"
      ) {
        target.setSelectionRange(focusState.start, focusState.end);
      }
    }

    openLinkModal() {
      const selection = window.getSelection();
      const selectedText = selection && selection.toString().trim();
      const bookmarks = this.getBookmarks();
      this.openModal({
        title: "Insert Link",
        copy: "Add a safe URL, or jump to an existing bookmark in this article.",
        confirmLabel: "Apply Link",
        fields: [
          { name: "url", label: "URL", type: "url", placeholder: "https://example.com" },
          {
            name: "bookmarkId",
            label: "Link to bookmark",
            type: "select",
            value: "",
            options: [{ value: "", label: "None" }].concat(
              bookmarks.map((bookmark) => ({ value: bookmark.id, label: `${bookmark.name} (#${bookmark.id})` }))
            ),
          },
          { name: "text", label: "Link text", type: "text", placeholder: selectedText || "Link text", value: selectedText },
        ],
        onOpen: (fieldRefs) => {
          const urlInput = fieldRefs.url;
          const bookmarkSelect = fieldRefs.bookmarkId;
          const textInput = fieldRefs.text;
          if (bookmarkSelect && urlInput) {
            bookmarkSelect.addEventListener("change", () => {
              if (!bookmarkSelect.value) return;
              urlInput.value = `#${bookmarkSelect.value}`;
              const selectedBookmark = bookmarks.find((bookmark) => bookmark.id === bookmarkSelect.value);
              if (selectedBookmark && textInput && !String(textInput.value || "").trim()) {
                textInput.value = selectedBookmark.name;
              }
            });
          }
          if (urlInput && bookmarkSelect) {
            urlInput.addEventListener("input", () => {
              const value = String(urlInput.value || "").trim();
              if (!value.startsWith("#")) {
                bookmarkSelect.value = "";
              }
            });
          }
        },
        onConfirm: (values) => {
          const url = String(values.url || "").trim() || (values.bookmarkId ? `#${values.bookmarkId}` : "");
          if (!isSafeUrl(url, "A")) {
            return "Enter a valid URL.";
          }
          this.restoreSelection();
          const isHashLink = url.startsWith("#");
          const safeText = values.text.trim() || url;
          if (window.getSelection() && window.getSelection().toString().trim()) {
            document.execCommand("createLink", false, url);
            const selectionAnchor = getSelectionAncestor(this.content);
            const anchor = selectionAnchor && selectionAnchor.nodeType === Node.ELEMENT_NODE
              ? selectionAnchor.closest("a")
              : selectionAnchor && selectionAnchor.parentNode && selectionAnchor.parentNode.closest
                ? selectionAnchor.parentNode.closest("a")
                : null;
            if (anchor) {
              anchor.textContent = safeText;
              if (isHashLink) {
                anchor.removeAttribute("target");
                anchor.removeAttribute("rel");
              } else {
                anchor.setAttribute("target", "_blank");
                anchor.setAttribute("rel", "noopener noreferrer");
              }
            }
            this.handleContentChange();
            return null;
          }
          this.insertHTML(
            `<a href="${escapeHtml(url)}"${isHashLink ? "" : ' target="_blank" rel="noopener noreferrer"'}>${escapeHtml(safeText)}</a>`
          );
          return null;
        },
      });
    }

    openBookmarkModal(existingBookmark) {
      const current = this.getBookmarkData(existingBookmark);
      this.openModal({
        title: existingBookmark ? "Edit Bookmark" : "Insert Bookmark",
        copy: "Create an anchor point inside the article and link to it later with #bookmark-id.",
        confirmLabel: existingBookmark ? "Update Bookmark" : "Insert Bookmark",
        fields: [
          { name: "name", label: "Bookmark name", type: "text", placeholder: "Economic Policy Section", value: current.name },
          { name: "id", label: "Bookmark ID", type: "text", placeholder: "economic-policy-section", value: current.id },
          { name: "description", label: "Description", type: "text", placeholder: "Optional note", value: current.description },
        ],
        onOpen: (fieldRefs) => {
          const nameInput = fieldRefs.name;
          const idInput = fieldRefs.id;
          let manualId = Boolean(current.id);
          if (idInput) {
            idInput.addEventListener("input", () => {
              manualId = true;
              idInput.value = sanitizeBookmarkId(idInput.value);
            });
          }
          if (nameInput && idInput) {
            nameInput.addEventListener("input", () => {
              if (manualId) return;
              idInput.value = sanitizeBookmarkId(nameInput.value);
            });
          }
        },
        onConfirm: (values) => {
          const name = String(values.name || "").trim();
          if (!name) {
            return "Bookmark name is required.";
          }
          const id = this.getUniqueBookmarkId(values.id || name, existingBookmark || null);
          const payload = {
            name,
            id,
            description: String(values.description || "").trim(),
          };
          if (existingBookmark && this.content.contains(existingBookmark)) {
            const replacement = this.updateBookmarkNode(existingBookmark, payload);
            if (replacement) {
              this.selectBookmark(replacement);
              this.handleContentChange();
            }
            return null;
          }
          this.insertHTML(this.buildBookmarkHtml(payload));
          const inserted = this.content.querySelector(`.${BOOKMARK_CLASS}[id="${id}"]`);
          if (inserted) {
            this.selectBookmark(inserted);
          }
          return null;
        },
      });
    }

    openImageModal() {
      this.openImageModalForFigure(null);
    }

    openImageModalForFigure(existingFigure, options) {
      const current = this.getImageFigureData(existingFigure);
      const config = options || {};
      this.openModal({
        title: existingFigure ? "Edit Image" : "Insert Image",
        copy: existingFigure ? "Update the selected image, replace the source, and manage caption or link settings." : "Upload an image or use an external image URL.",
        confirmLabel: existingFigure ? "Update Image" : "Insert Image",
        initialFocus: config.focusField || "file",
        panelClass: "ollow-image-edit-modal-panel",
        fields: [
          { name: "preview", label: "Preview", type: "html", html: `<div class="ollow-image-modal-preview">${current.src ? `<img src="${escapeHtml(current.src)}" alt="${escapeHtml(current.alt)}">` : '<div class="ollow-image-modal-preview-placeholder">No image selected</div>'}</div>` },
          { name: "file", label: "Upload image", type: "file", accept: "image/*" },
          { name: "url", label: "Image URL", type: "url", placeholder: "https://example.com/image.jpg", value: current.src },
          { name: "alt", label: "Alt text", type: "text", placeholder: "Describe the image", value: current.alt },
          { name: "caption", label: "Caption", type: "textarea", placeholder: "Photo caption", value: current.caption },
          { name: "linkUrl", label: "Link URL", type: "url", placeholder: "https://example.com", value: current.linkUrl },
          { name: "openInNewTab", label: "Open link in new tab", type: "checkbox", checked: current.openInNewTab },
          {
            name: "alignment",
            label: "Alignment",
            type: "select",
            value: current.alignment || "reset",
            options: [
              { value: "reset", label: "Default" },
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
              { value: "wide", label: "Wide" },
              { value: "full", label: "Full width" },
            ],
          },
          {
            name: "size",
            label: "Size",
            type: "select",
            value: current.size || "reset",
            options: [
              { value: "reset", label: "Default" },
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "full", label: "Full width" },
            ],
          },
        ],
        onOpen: (fieldRefs) => {
          const preview = this.modalBody.querySelector(".ollow-image-modal-preview");
          const urlInput = fieldRefs.url;
          const fileInput = fieldRefs.file;
          const setPreview = (src, alt) => {
            if (!preview) return;
            preview.innerHTML = src
              ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt || "")}">`
              : '<div class="ollow-image-modal-preview-placeholder">No image selected</div>';
          };
          if (urlInput) {
            urlInput.addEventListener("input", () => {
              const value = String(urlInput.value || "").trim();
              if (isSafeUrl(value, "IMG")) {
                setPreview(value, fieldRefs.alt ? fieldRefs.alt.value : "");
              }
            });
          }
          if (fileInput) {
            fileInput.addEventListener("change", async () => {
              const file = fileInput.files && fileInput.files[0];
              if (!file || !this.isImageFile(file)) return;
              try {
                const src = await this.fileToDataURL(file);
                setPreview(src, fieldRefs.alt ? fieldRefs.alt.value : "");
              } catch (error) {
                // Ignore preview failures.
              }
            });
          }
        },
        onConfirm: async (values) => {
          const alt = values.alt.trim();
          const caption = values.caption.trim();
          const linkUrl = String(values.linkUrl || "").trim();
          let src = current.src;

          if (values.file) {
            src = await this.resolveImageSource(values.file);
          } else if (values.url.trim()) {
            if (!isSafeUrl(values.url, "IMG")) {
              return "Enter a valid image URL.";
            }
            src = values.url.trim();
          } else if (!src) {
            return "Choose an image file or enter an image URL.";
          }

          if (linkUrl && !isSafeUrl(linkUrl, "A")) {
            return "Enter a valid link URL.";
          }

          const payload = {
            src,
            alt,
            caption,
            linkUrl,
            openInNewTab: Boolean(values.openInNewTab),
            alignment: values.alignment,
            size: values.size,
          };

          if (existingFigure && this.content.contains(existingFigure)) {
            const replacement = this.updateImageFigure(existingFigure, payload);
            if (replacement) {
              this.selectMediaBlock(replacement);
              this.handleContentChange();
            }
            return null;
          }

          this.insertHTML(this.buildImageFigureHtml(payload));
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
          const images = await this.uploadFiles(values.files, "gallery");
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
        copy: "Add an attachment placeholder with title, uploaded file or URL, type, and visibility.",
        confirmLabel: "Insert Attachment",
        fields: [
          { name: "title", label: "Attachment title", type: "text", placeholder: "Attachment title" },
          { name: "file", label: "Upload attachment", type: "file" },
          { name: "url", label: "Attachment URL", type: "url", placeholder: "https://example.com/report.pdf" },
          { name: "type", label: "Attachment type", type: "text", placeholder: "PDF / Report / Document" },
          { name: "visibility", label: "Visibility", type: "text", placeholder: "Public / Private", value: "Public" },
        ],
        onConfirm: async (values) => {
          if (!values.title.trim()) {
            return "Attachment title is required.";
          }
          let url = values.url.trim();
          if (values.file) {
            url = await this.uploadFile(values.file, "attachment");
          }
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

    openMarkdownImportModal() {
      this.openModal({
        title: "Import Markdown",
        copy: "Paste Markdown and either replace the editor content or insert it at the current cursor.",
        confirmLabel: "Import Markdown",
        fields: [
          { name: "markdown", label: "Markdown", type: "textarea", placeholder: "## Heading\n\nParagraph text", spellcheck: false },
          {
            name: "mode",
            label: "Import mode",
            type: "select",
            options: [
              { value: "replace", label: "Replace current editor content" },
              { value: "insert", label: "Insert at cursor" },
            ],
          },
        ],
        onConfirm: (values) => {
          if (!String(values.markdown || "").trim()) {
            return "Markdown is required.";
          }
          this.importMarkdown(values.markdown, { mode: values.mode || "replace" });
          return null;
        },
      });
    }

    openMarkdownExportModal() {
      const markdown = this.exportMarkdown();
      this.openModal({
        title: "Export Markdown",
        copy: "Review the generated Markdown or copy it to your clipboard. The editor textarea still stores HTML.",
        confirmLabel: "Close",
        fields: [
          { name: "markdown", label: "Markdown", type: "textarea", value: markdown, spellcheck: false, readonly: true },
        ],
        extraActions: [
          {
            label: "Copy Markdown",
            className: "nw-modal-button nw-modal-button--secondary",
            onClick: async () => {
              try {
                await navigator.clipboard.writeText(this.modalFieldRefs.markdown.value || "");
                this.showFeedback("Markdown copied to clipboard.");
              } catch (error) {
                this.showFeedback("Unable to copy Markdown.");
              }
            },
          },
        ],
        onConfirm: () => null,
      });
    }

    openModal(config) {
      this.saveSelection();
      if (this.wrapper) {
        this.wrapper.classList.add("ollow-modal-open");
      }
      if (this.modalPanel) {
        this.modalPanel.className = "nw-editor-modal-panel";
        if (config.panelClass) {
          this.modalPanel.classList.add(...String(config.panelClass).split(/\s+/).filter(Boolean));
        }
      }
      this.modalTitle.textContent = config.title;
      this.modalCopy.textContent = config.copy || "";
      this.modalConfirm.textContent = config.confirmLabel || "Insert";
      this.modalBody.innerHTML = "";
      Array.from(this.modal.querySelectorAll("[data-extra-action]")).forEach((button) => button.remove());

      const fieldRefs = {};
      (config.fields || []).forEach((field) => {
        const wrapper = document.createElement("div");
        wrapper.className = "nw-modal-field";
        if (field.type === "html") {
          if (field.label) {
            const htmlLabel = document.createElement("div");
            htmlLabel.className = "nw-modal-field-label";
            htmlLabel.textContent = field.label;
            wrapper.appendChild(htmlLabel);
          }
          const panel = document.createElement("div");
          panel.className = "nw-modal-html";
          panel.innerHTML = field.html || "";
          wrapper.appendChild(panel);
          this.modalBody.appendChild(wrapper);
          return;
        }
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
        if (field.readonly) {
          input.readOnly = true;
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

      (config.extraActions || []).forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = action.className || "nw-modal-button nw-modal-button--secondary";
        button.textContent = action.label;
        button.setAttribute("data-extra-action", "true");
        button.addEventListener("click", () => action.onClick && action.onClick(fieldRefs));
        this.modalConfirm.insertAdjacentElement("beforebegin", button);
      });

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
      const firstField = config.initialFocus && fieldRefs[config.initialFocus] ? fieldRefs[config.initialFocus] : Object.values(fieldRefs)[0];
      if (typeof config.onOpen === "function") {
        try {
          config.onOpen(fieldRefs);
        } catch (error) {
          console.warn("OllowEditor modal onOpen failed.", error);
        }
      }
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
      if (this.wrapper) {
        this.wrapper.classList.remove("ollow-modal-open");
      }
      this.modalBody.innerHTML = "";
      this.modalConfirm.onclick = null;
      this.modalFieldRefs = {};
      if (config.focusEditor) {
        this.focus();
      }
      if (config.restoreSelection) {
        this.restoreSelection();
      }
      if (this.selectedImageFigure && this.content.contains(this.selectedImageFigure)) {
        this.updateImageResizeToolbarState();
        this.updateMediaAlignmentToolbarState();
        this.positionImageResizeToolbar();
      }
      if (this.selectedTableFigure && this.content.contains(this.selectedTableFigure)) {
        this.updateTableToolbarState();
        this.positionTableToolbar();
      }
      if (this.selectedBookmark && this.content.contains(this.selectedBookmark)) {
        this.positionBookmarkToolbar();
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
      if (this.isSourceMode()) {
        if (this.wrapper) {
          this.wrapper.classList.add("is-source-mode");
        }
        Array.from(this.wrapper.querySelectorAll(".nw-editor-toolbar button, .nw-editor-toolbar select, .nw-editor-toolbar input")).forEach((control) => {
          const action = control.dataset && control.dataset.action ? control.dataset.action : "";
          control.disabled = action !== "source-html" && !control.closest(".nw-toolbar-group--theme");
        });
        if (this.toolbarButtons["source-html"]) {
          this.toolbarButtons["source-html"].disabled = false;
          this.toolbarButtons["source-html"].classList.add("is-active");
        }
        return;
      }
      if (this.wrapper) {
        this.wrapper.classList.remove("is-source-mode");
        Array.from(this.wrapper.querySelectorAll(".nw-editor-toolbar button, .nw-editor-toolbar select, .nw-editor-toolbar input")).forEach((control) => {
          control.disabled = false;
        });
      }
      const inside = selectionInside(this.content);
      const hasEditorContext = inside || this.isFocused || Boolean(this.selectedMediaBlock);
      const states = {
        bold: inside && safeQueryState("bold"),
        italic: inside && safeQueryState("italic"),
        underline: inside && safeQueryState("underline"),
        strikethrough: inside && (safeQueryState("strikeThrough") || safeQueryState("strikethrough")),
        subscript: inside && safeQueryState("subscript"),
        superscript: inside && safeQueryState("superscript"),
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

      const isInsidePullQuote = Boolean(
        block && block.matches && block.matches("blockquote.nw-pull-quote, blockquote[data-type='pull-quote']")
      );
      const bookmarkAncestor = ancestor && ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;
      const isInsideBookmark = Boolean(
        this.selectedBookmark
          || (bookmarkAncestor && bookmarkAncestor.closest && bookmarkAncestor.closest(`.${BOOKMARK_CLASS}[data-bookmark="true"]`))
      );

      ["bold", "italic", "underline", "strikethrough", "subscript", "superscript", "link", "quote", "bulleted-list", "numbered-list", "h2", "h3", "h4"].forEach((key) => {
        const button = this.toolbarButtons[key];
        if (button) {
          button.classList.toggle("is-active", Boolean(states[key]));
        }
      });

      if (this.formatPainterButton) {
        this.formatPainterButton.classList.toggle("is-active", Boolean(this.formatPainterState && this.formatPainterState.active));
      }
      if (this.wrapper) {
        this.wrapper.classList.toggle("is-format-painter-active", Boolean(this.formatPainterState && this.formatPainterState.active));
      }

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

      this.updateStylesToolbarState();
      this.updateFontToolbarState();
      this.updateColorToolbarState();
      this.updateHighlightToolbarState();
      [
        ["pull-quote", isInsidePullQuote],
        ["bookmark", isInsideBookmark],
      ].forEach(([action, isActive]) => {
        const button = this.toolbarButtons[action];
        if (!button) return;
        button.classList.toggle("is-active", Boolean(isActive));
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      if (this.toolbarButtons["source-html"]) {
        this.toolbarButtons["source-html"].classList.remove("is-active");
      }
    }

    updateMetrics() {
      const text = (this.content.textContent || "").trim().replace(/\s+/g, " ");
      const words = text ? text.split(" ").length : 0;
      const minutes = Math.max(1, Math.ceil(words / DEFAULT_READ_SPEED));
      this.statusWordCount.textContent = String(words);
      this.statusReadTime.textContent = `${words ? minutes : 0} min`;
    }

    updateMetricsFromHTML(html) {
      const probe = document.createElement("div");
      probe.innerHTML = this.sanitizeHTML(html);
      const text = (probe.textContent || "").trim().replace(/\s+/g, " ");
      const words = text ? text.split(" ").length : 0;
      const minutes = Math.max(1, Math.ceil(words / DEFAULT_READ_SPEED));
      this.statusWordCount.textContent = String(words);
      this.statusReadTime.textContent = `${words ? minutes : 0} min`;
    }

    updateStatus() {
      this.statusActive.textContent = this.isSourceMode()
        ? "Source mode active"
        : this.isFocused
          ? "Story body active"
          : "Story body inactive";
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
      if (this.isSourceMode()) {
        return this.getSourceHTML();
      }
      const clone = this.content.cloneNode(true);
      Array.from(clone.querySelectorAll(`span.${FIND_REPLACE_HIGHLIGHT_CLASS}`)).forEach((span) => {
        const text = clone.ownerDocument.createTextNode(span.textContent || "");
        span.replaceWith(text);
      });
      Array.from(clone.querySelectorAll("*")).forEach((element) => {
        element.classList.remove(...TEMP_SELECTION_CLASSES);
        element.classList.remove("is-selected-cell", "is-selected-cell-primary");
        element.classList.remove(FIND_REPLACE_HIGHLIGHT_CLASS, FIND_REPLACE_CURRENT_CLASS);
      });
      return this.sanitizeHTML(clone.innerHTML);
    }

    setHTML(html, options) {
      const config = options || {};
      const source = String(html || "").trim();
      const clean = source ? this.sanitizeHTML(source) : "";
      this.content.innerHTML = clean;
      if (this.sourceTextarea) {
        this.sourceTextarea.value = formatHtmlForSource(clean);
      }
      this.closeFindReplacePanel();
      this.clearMediaSelection();
      this.clearTableSelection();
      this.clearBookmarkSelection();
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

    importMarkdown(markdown, options) {
      const mode = options && options.mode === "insert" ? "insert" : "replace";
      const generated = parseMarkdownToHtml(markdown, this);
      const clean = generated ? this.sanitizeHTML(generated) : "";
      if (!clean) return "";
      if (mode === "insert") {
        this.insertHTML(clean);
        return clean;
      }
      this.content.innerHTML = clean;
      if (this.sourceTextarea) {
        this.sourceTextarea.value = formatHtmlForSource(clean);
      }
      this.closeFindReplacePanel();
      this.clearMediaSelection();
      this.clearTableSelection();
      this.clearBookmarkSelection();
      this.focus();
      this.handleContentChange();
      return clean;
    }

    exportMarkdown() {
      return exportHtmlToMarkdown(this.getHTML());
    }

    focus() {
      if (this.isSourceMode() && this.sourceTextarea) {
        this.sourceTextarea.focus();
        return;
      }
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
      this.textarea.value = this.isSourceMode() ? this.getSourceHTML() : this.getHTML();
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
        this.emit("sync", { editor: this, html: this.textarea.value });
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
      document.removeEventListener("keydown", this.boundDocumentKeydown);
      if (this.systemThemeQuery) {
        if (typeof this.systemThemeQuery.removeEventListener === "function") {
          this.systemThemeQuery.removeEventListener("change", this.boundSystemThemeChange);
        } else if (typeof this.systemThemeQuery.removeListener === "function") {
          this.systemThemeQuery.removeListener(this.boundSystemThemeChange);
        }
      }
      window.removeEventListener("resize", this.boundRepositionImageToolbar);
      window.removeEventListener("scroll", this.boundRepositionImageToolbar, true);
      window.removeEventListener("resize", this.boundRepositionTableToolbar);
      window.removeEventListener("scroll", this.boundRepositionTableToolbar, true);
      window.removeEventListener("resize", this.boundRepositionBookmarkToolbar);
      window.removeEventListener("scroll", this.boundRepositionBookmarkToolbar, true);
      window.removeEventListener("resize", this.boundViewportChange);
      window.removeEventListener("orientationchange", this.boundViewportChange);
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
      this.emit("destroy", { editor: this });
      this.showSource();
      instances.delete(this.textarea);
    }
  }

  function normalizeOptions(textarea, options) {
    const config = Object.assign({}, options || {});
    config.placeholder = config.placeholder || textarea.getAttribute("placeholder") || textarea.dataset.placeholder || DEFAULT_PLACEHOLDER;
    config.autosaveDelay = Number(config.autosaveDelay || textarea.dataset.autosaveDelay || DEFAULT_AUTOSAVE_DELAY) || DEFAULT_AUTOSAVE_DELAY;
    const explicitTheme = config.theme || textarea.dataset.theme || "";
    if (typeof config.persistTheme === "undefined") {
      if (typeof textarea.dataset.persistTheme !== "undefined") {
        config.persistTheme = textarea.dataset.persistTheme === "true";
      } else {
        config.persistTheme = false;
      }
    }
    config.themeStorageKey = config.themeStorageKey || textarea.dataset.themeStorageKey || DEFAULT_THEME_STORAGE_KEY;
    const storedTheme = config.persistTheme && !explicitTheme ? readStoredTheme(config.themeStorageKey) : "";
    const resolvedTheme = explicitTheme || storedTheme || "light";
    config.theme = ["light", "dark", "auto"].includes(resolvedTheme) ? resolvedTheme : "light";
    const uploadConfig = Object.assign({}, config.upload || {});
    uploadConfig.imageUrl = uploadConfig.imageUrl || textarea.dataset.imageUploadUrl || config.uploadUrl || "";
    uploadConfig.galleryUrl = uploadConfig.galleryUrl || textarea.dataset.galleryUploadUrl || "";
    uploadConfig.attachmentUrl = uploadConfig.attachmentUrl || textarea.dataset.attachmentUploadUrl || "";
    if (typeof uploadConfig.allowFallback === "undefined") {
      if (typeof textarea.dataset.uploadAllowFallback !== "undefined") {
        uploadConfig.allowFallback = textarea.dataset.uploadAllowFallback === "true";
      } else {
        uploadConfig.allowFallback = false;
      }
    }
    uploadConfig.headers = Object.assign({}, config.uploadHeaders || {}, uploadConfig.headers || {});
    uploadConfig.method = uploadConfig.method || config.uploadMethod || "POST";
    uploadConfig.credentials = uploadConfig.credentials || "same-origin";
    if (!uploadConfig.csrfHeaderValue && config.uploadHeaders && config.uploadHeaders["X-CSRFToken"]) {
      uploadConfig.csrfHeaderValue = config.uploadHeaders["X-CSRFToken"];
    }
    config.upload = uploadConfig;
    return config;
  }

  const api = {
    registerPlugin(name, factory) {
      if (!name || typeof factory !== "function") {
        return null;
      }
      if (pluginRegistry.has(name)) {
        console.warn(`OllowEditor plugin "${name}" is already registered.`);
        return pluginRegistry.get(name);
      }
      pluginRegistry.set(name, factory);
      return factory;
    },

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
  window.OllowEditor = api;
})();
