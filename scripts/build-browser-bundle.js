import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceRuntimePath = path.join(rootDir, "ollow.js");
const sourceCssPath = path.join(rootDir, "ollow.css");
const distDir = path.join(rootDir, "dist");
const browserBundlePath = path.join(distDir, "olloweditor.browser.js");
const distCssPath = path.join(distDir, "olloweditor.css");

const browserFacade = `
(function (global) {
  var legacyApi = global && global.OllowEditor;
  if (!legacyApi || typeof legacyApi.init !== "function") {
    throw new Error("OllowEditor browser bundle could not find the core runtime.");
  }

  function describeTarget(target) {
    if (typeof target === "string") {
      return 'selector "' + target + '"';
    }
    if (!target) {
      return String(target);
    }
    if (target && target.tagName) {
      return "<" + String(target.tagName).toLowerCase() + ">";
    }
    return Object.prototype.toString.call(target);
  }

  function resolveTarget(target) {
    if (typeof target === "string") {
      return global.document ? global.document.querySelector(target) : null;
    }
    return target || null;
  }

  function assertTextareaTarget(target) {
    var resolved = resolveTarget(target);
    if (!resolved) {
      throw new Error("OllowEditor.create could not find a target for " + describeTarget(target) + ".");
    }
    if (!resolved.tagName || String(resolved.tagName).toUpperCase() !== "TEXTAREA") {
      throw new Error("OllowEditor.create expects an HTMLTextAreaElement or a selector that resolves to one. Received " + describeTarget(target) + ".");
    }
    return resolved;
  }

  function create(target, options) {
    var textarea = assertTextareaTarget(target);
    return legacyApi.init(textarea, options || {});
  }

  var browserApi = {
    create: create,
    init: create,
    initAll: legacyApi.initAll.bind(legacyApi),
    get: legacyApi.get.bind(legacyApi),
    instances: legacyApi.instances.bind(legacyApi),
    registerPlugin: legacyApi.registerPlugin.bind(legacyApi)
  };

  Object.defineProperty(browserApi, "version", {
    value: "0.1.0",
    enumerable: true
  });

  Object.defineProperty(browserApi, "legacy", {
    value: legacyApi,
    enumerable: false
  });

  global.OllowEditor = browserApi;
})(typeof window !== "undefined" ? window : globalThis);
`.trimStart();

await fs.mkdir(distDir, { recursive: true });

const [runtimeSource, cssSource] = await Promise.all([
  fs.readFile(sourceRuntimePath, "utf8"),
  fs.readFile(sourceCssPath, "utf8")
]);

const bundleOutput = `${runtimeSource}\n\n${browserFacade}\n`;

await Promise.all([
  fs.writeFile(browserBundlePath, bundleOutput, "utf8"),
  fs.writeFile(distCssPath, cssSource, "utf8")
]);

console.log(`Wrote ${path.relative(rootDir, browserBundlePath)}`);
console.log(`Wrote ${path.relative(rootDir, distCssPath)}`);
