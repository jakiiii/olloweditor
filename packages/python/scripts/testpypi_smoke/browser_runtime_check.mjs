import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value == null) {
      throw new Error("Invalid arguments.");
    }
    args[key.slice(2)] = value;
  }
  return args;
}

function createDom(markup, bundleSource, initSource) {
  const dom = new JSDOM(markup, {
    runScripts: "dangerously",
    url: "http://localhost/"
  });
  dom.window.eval(bundleSource);
  dom.window.eval(initSource);
  dom.window.document.dispatchEvent(
    new dom.window.Event("DOMContentLoaded", { bubbles: true })
  );
  return dom;
}

async function main() {
  const args = parseArgs(process.argv);
  const bundlePath = path.resolve(args.bundle);
  const initPath = path.resolve(args.init);
  const cssPath = path.resolve(args.css);
  const repoRoot = path.resolve(args.repoRoot);

  for (const filePath of [bundlePath, initPath, cssPath]) {
    if (filePath.startsWith(repoRoot)) {
      throw new Error(`Browser runtime test resolved a repository path: ${filePath}`);
    }
  }

  const [bundleSource, initSource, cssSource] = await Promise.all([
    fs.readFile(bundlePath, "utf8"),
    fs.readFile(initPath, "utf8"),
    fs.readFile(cssPath, "utf8")
  ]);

  assert.ok(bundleSource.trim().length > 0, "Browser bundle is empty.");
  assert.ok(initSource.trim().length > 0, "Initializer is empty.");
  assert.ok(cssSource.trim().length > 0, "CSS is empty.");
  assert.equal(/^[ \t]*(import|export)\s/m.test(bundleSource), false, "Browser bundle contains top-level import/export statements.");
  assert.ok(bundleSource.includes("window.OllowEditor") || bundleSource.includes("global.OllowEditor"));
  assert.ok(initSource.includes('textarea[data-olloweditor="true"]'));

  const singleDom = createDom(
    '<!doctype html><form id="article-form"><textarea id="content" name="content" data-olloweditor="true"><p>Hello</p></textarea></form>',
    bundleSource,
    initSource
  );

  assert.ok(singleDom.window.OllowEditor);
  const editor = singleDom.window.OllowEditor.get("#content");
  assert.ok(editor);
  assert.equal(singleDom.window.OllowEditor.instances().length, 1);
  assert.match(editor.getHTML(), /Hello/);

  editor.setHTML("<p>Updated</p>");
  const form = singleDom.window.document.getElementById("article-form");
  form.dispatchEvent(new singleDom.window.Event("submit", { bubbles: true, cancelable: true }));
  const textarea = singleDom.window.document.getElementById("content");
  assert.equal(textarea.value, "<p>Updated</p>");
  const formData = new singleDom.window.FormData(form);
  assert.equal(formData.get("content"), "<p>Updated</p>");

  singleDom.window.bootOllowEditor(singleDom.window.document);
  singleDom.window.bootOllowEditor(singleDom.window.document);
  assert.equal(singleDom.window.OllowEditor.instances().length, 1);

  const multiDom = createDom(
    '<!doctype html><textarea id="first" data-olloweditor="true"></textarea><textarea id="second" data-olloweditor="true"></textarea>',
    bundleSource,
    initSource
  );
  assert.ok(multiDom.window.OllowEditor.get("#first"));
  assert.ok(multiDom.window.OllowEditor.get("#second"));
  assert.equal(multiDom.window.OllowEditor.instances().length, 2);

  const result = {
    browser_global: true,
    creation_api: typeof singleDom.window.OllowEditor.create === "function",
    automatic_initialization: Boolean(editor),
    multiple_instances: multiDom.window.OllowEditor.instances().length,
    textarea_sync: textarea.value,
    form_submission_value: formData.get("content"),
    css_size: cssSource.length,
    bundle_size: bundleSource.length,
    initializer_size: initSource.length
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
