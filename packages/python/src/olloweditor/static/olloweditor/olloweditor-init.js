(function (global) {
  var SELECTOR = 'textarea[data-olloweditor="true"]';
  var OPTIONS_ATTRIBUTE = "data-olloweditor-options";
  var initialized = new WeakMap();

  function describeTarget(target) {
    if (!target) {
      return "<unknown>";
    }
    var identifier = target.getAttribute("id") || target.getAttribute("name") || "";
    return identifier ? 'textarea "' + identifier + '"' : "<textarea>";
  }

  function dispatchLifecycleEvent(target, name, detail) {
    if (!target || typeof target.dispatchEvent !== "function" || typeof global.CustomEvent !== "function") {
      return;
    }
    return target.dispatchEvent(new global.CustomEvent(name, {
      bubbles: true,
      cancelable: name === "olloweditor:before-init",
      detail: detail
    }));
  }

  function getCoreApi() {
    return global.OllowEditor && typeof global.OllowEditor.create === "function"
      ? global.OllowEditor
      : null;
  }

  function getTargets(root) {
    var scope = root || global.document;
    if (!scope || typeof scope.querySelectorAll !== "function") {
      return [];
    }

    var targets = Array.prototype.slice.call(scope.querySelectorAll(SELECTOR));
    if (
      scope !== global.document &&
      scope.matches &&
      scope.matches(SELECTOR)
    ) {
      targets.unshift(scope);
    }

    return targets;
  }

  function parseOptions(target) {
    var raw = target.getAttribute(OPTIONS_ATTRIBUTE);
    if (!raw) {
      return {};
    }

    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Options JSON must decode to an object.");
      }
      return parsed;
    } catch (error) {
      console.error("[olloweditor-init] Invalid JSON in data-olloweditor-options for " + describeTarget(target) + ".", error);
      dispatchLifecycleEvent(target, "olloweditor:error", {
        target: target,
        instance: null,
        error: error,
        phase: "parse-options"
      });
      return null;
    }
  }

  function resolveExistingInstance(api, target) {
    if (initialized.has(target)) {
      return initialized.get(target);
    }
    if (typeof api.get === "function") {
      var existing = api.get(target);
      if (existing) {
        initialized.set(target, existing);
        return existing;
      }
    }
    return null;
  }

  function initTarget(target, api) {
    if (!target || target.disabled) {
      return null;
    }

    var existing = resolveExistingInstance(api, target);
    if (existing) {
      return existing;
    }

    var options = parseOptions(target);
    if (options === null) {
      return null;
    }

    var proceed = dispatchLifecycleEvent(target, "olloweditor:before-init", {
      target: target,
      instance: null,
      options: options
    });
    if (proceed === false) {
      return null;
    }

    try {
      var instance = api.create(target, options);
      if (instance) {
        initialized.set(target, instance);
      }
      dispatchLifecycleEvent(target, "olloweditor:ready", {
        target: target,
        instance: instance,
        options: options
      });
      return instance;
    } catch (error) {
      console.error("[olloweditor-init] Failed to initialize OllowEditor for " + describeTarget(target) + ".", error);
      dispatchLifecycleEvent(target, "olloweditor:error", {
        target: target,
        instance: null,
        error: error,
        options: options,
        phase: "init"
      });
      return null;
    }
  }

  function bootOllowEditor(root) {
    var api = getCoreApi();
    var targets = getTargets(root);

    if (!api) {
      var missingError = new Error("window.OllowEditor.create is not available. Load olloweditor.browser.js before olloweditor-init.js.");
      console.error("[olloweditor-init] " + missingError.message);
      targets.forEach(function (target) {
        dispatchLifecycleEvent(target, "olloweditor:error", {
          target: target,
          instance: null,
          error: missingError,
          phase: "missing-global"
        });
      });
      return [];
    }

    return targets.map(function (target) {
      return initTarget(target, api);
    }).filter(Boolean);
  }

  function scheduleBoot() {
    if (!global.document) {
      return;
    }
    global.document.addEventListener("formset:added", function (event) {
      if (event && event.target) {
        bootOllowEditor(event.target);
      }
    });
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", function onReady() {
        global.document.removeEventListener("DOMContentLoaded", onReady);
        bootOllowEditor(global.document);
      });
      return;
    }
    bootOllowEditor(global.document);
  }

  global.bootOllowEditor = bootOllowEditor;
  scheduleBoot();
})(typeof window !== "undefined" ? window : globalThis);
