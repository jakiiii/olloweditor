document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const siteNav = document.getElementById("site-nav");

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        siteNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
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
});
