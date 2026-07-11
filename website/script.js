document.addEventListener("DOMContentLoaded", () => {
  const copyTextToClipboard = async (text) => {
    if (!text) return false;

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_error) {
        // Fall through to the textarea fallback on permission or browser failures.
      }
    }

    const fallbackTextarea = document.createElement("textarea");
    fallbackTextarea.value = text;
    fallbackTextarea.setAttribute("readonly", "");
    fallbackTextarea.style.position = "fixed";
    fallbackTextarea.style.top = "-9999px";
    fallbackTextarea.style.left = "-9999px";
    document.body.appendChild(fallbackTextarea);
    fallbackTextarea.focus();
    fallbackTextarea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      fallbackTextarea.remove();
    }

    return copied;
  };

  const menuToggle = document.querySelector(".menu-toggle");
  const siteNav = document.getElementById("site-nav");
  const mobileNavBreakpoint = window.matchMedia("(max-width: 767px)");

  const closeMenu = () => {
    if (!siteNav || !menuToggle) return;
    siteNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    const handleViewportChange = (event) => {
      if (!event.matches) {
        closeMenu();
      }
    };

    if (typeof mobileNavBreakpoint.addEventListener === "function") {
      mobileNavBreakpoint.addEventListener("change", handleViewportChange);
    } else if (typeof mobileNavBreakpoint.addListener === "function") {
      mobileNavBreakpoint.addListener(handleViewportChange);
    }
  }

  const hero = document.querySelector(".hero");
  if (hero) {
    const onScroll = () => {
      const offset = Math.min(window.scrollY * 0.16, 48);
      hero.style.setProperty("--hero-shift", `${offset}px`);
      const backdrop = hero.querySelector(".hero-backdrop");
      if (backdrop) {
        backdrop.style.transform = `translate3d(0, ${offset * 0.4}px, 0)`;
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const demoTextarea = document.getElementById("ollow-editor-demo-input");
  const editorApi = window.NationWireEditor;

  if (demoTextarea && editorApi && typeof editorApi.initAll === "function") {
    editorApi.initAll(document, {
      persistTheme: false,
      theme: "light",
      docx: {
        enabled: true
      }
    });

    const instance = editorApi.get("#ollow-editor-demo-input");
    if (instance && typeof instance.sync === "function") {
      instance.sync({ autosave: false, silent: true });
    }
  }

  const docsSidebar = document.getElementById("docs-sidebar");
  const docsToggle = document.querySelector(".docs-mobile-toggle");
  const docsSearch = document.querySelector("[data-docs-search]");
  const docsSidebarLinks = Array.from(document.querySelectorAll(".docs-sidebar-link"));
  const docsTocLinks = Array.from(document.querySelectorAll(".docs-toc-links a"));
  const docsSections = Array.from(document.querySelectorAll(".docs-article .docs-section[id]"));

  const closeDocsSidebar = () => {
    if (!docsSidebar || !docsToggle) return;
    docsSidebar.classList.remove("is-open");
    docsToggle.setAttribute("aria-expanded", "false");
  };

  if (docsToggle && docsSidebar) {
    docsToggle.addEventListener("click", () => {
      const isOpen = docsSidebar.classList.toggle("is-open");
      docsToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (docsSearch && docsSidebarLinks.length) {
    docsSearch.addEventListener("input", () => {
      const query = docsSearch.value.trim().toLowerCase();

      document.querySelectorAll(".docs-sidebar-group").forEach((group) => {
        let visibleCount = 0;
        group.querySelectorAll(".docs-sidebar-link").forEach((link) => {
          const matches = !query || link.textContent.toLowerCase().includes(query);
          link.hidden = !matches;
          if (matches) visibleCount += 1;
        });
        group.hidden = visibleCount === 0;
      });
    });
  }

  if (docsSections.length) {
    const setActiveDocsLink = (id) => {
      if (!id) return;

      docsSidebarLinks.forEach((link) => {
        const isMatch = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", isMatch);
        if (isMatch) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      docsTocLinks.forEach((link) => {
        const isMatch = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", isMatch);
        if (isMatch) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries.length) {
        setActiveDocsLink(visibleEntries[0].target.id);
      }
    }, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: [0.1, 0.25, 0.45]
    });

    docsSections.forEach((section) => observer.observe(section));

    const syncFromHash = () => {
      const hashId = window.location.hash.replace(/^#/, "");
      if (hashId) {
        setActiveDocsLink(hashId);
      } else if (docsSections[0]) {
        setActiveDocsLink(docsSections[0].id);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
  }

  [...docsSidebarLinks, ...docsTocLinks].forEach((link) => {
    link.addEventListener("click", () => {
      closeDocsSidebar();
    });
  });

  const copyButtons = document.querySelectorAll("[data-copy-command], [data-copy], [data-copy-target]");
  copyButtons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;

    const originalLabel = button.textContent ? button.textContent.trim() : "Copy";
    let resetTimeoutId = null;

    button.addEventListener("click", async () => {
      const explicitCopy = button.getAttribute("data-copy");
      const copyCommand = button.getAttribute("data-copy-command");
      const copyTarget = button.getAttribute("data-copy-target");

      let textToCopy = explicitCopy || copyCommand || "";
      if (!textToCopy && copyTarget) {
        const target = document.querySelector(copyTarget);
        textToCopy = target ? (target.textContent || "").trim() : "";
      }
      if (!textToCopy) return;

      try {
        const copied = await copyTextToClipboard(textToCopy);
        if (!copied) return;

        if (resetTimeoutId) {
          window.clearTimeout(resetTimeoutId);
        }
        button.textContent = "Copied!";
        resetTimeoutId = window.setTimeout(() => {
          button.textContent = originalLabel;
          resetTimeoutId = null;
        }, 1500);
      } catch (_error) {
        // Swallow clipboard failures to avoid noisy console errors on unsupported browsers.
      }
    });
  });
});
