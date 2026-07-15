import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const bundlePath = path.join(process.cwd(), "dist", "olloweditor.browser.js");
const initPath = path.join(
  process.cwd(),
  "src",
  "olloweditor",
  "static",
  "olloweditor",
  "olloweditor-init.js"
);
const bundleSource = await fs.readFile(bundlePath, "utf8");
const initSource = await fs.readFile(initPath, "utf8");

function createDom(markup, options = {}) {
  const dom = new JSDOM(markup, {
    runScripts: "dangerously",
    url: "http://localhost/"
  });

  const errors = [];
  dom.window.console.error = (...args) => {
    errors.push(args.map(String).join(" "));
  };

  if (options.includeBundle !== false) {
    dom.window.eval(bundleSource);
  }
  dom.window.eval(initSource);

  return { dom, errors };
}

function fireDomReady(dom) {
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded", { bubbles: true }));
}

test("one textarea initializes automatically", () => {
  const { dom } = createDom(`<!doctype html><textarea id="content" data-olloweditor="true"></textarea>`);
  fireDomReady(dom);

  const instance = dom.window.OllowEditor.get("#content");
  assert.ok(instance);
  assert.equal(dom.window.OllowEditor.instances().length, 1);
});

test("multiple textareas initialize automatically", () => {
  const { dom } = createDom(`<!doctype html>
    <textarea id="first" data-olloweditor="true"></textarea>
    <textarea id="second" data-olloweditor="true"></textarea>`);
  fireDomReady(dom);

  assert.ok(dom.window.OllowEditor.get("#first"));
  assert.ok(dom.window.OllowEditor.get("#second"));
  assert.equal(dom.window.OllowEditor.instances().length, 2);
});

test("invalid JSON logs an error and other editors still initialize", () => {
  const { dom, errors } = createDom(`<!doctype html>
    <textarea id="bad" data-olloweditor="true" data-olloweditor-options='{"theme":'></textarea>
    <textarea id="good" data-olloweditor="true"></textarea>`);
  fireDomReady(dom);

  assert.equal(dom.window.OllowEditor.get("#bad"), null);
  assert.ok(dom.window.OllowEditor.get("#good"));
  assert.equal(dom.window.OllowEditor.instances().length, 1);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Invalid JSON/);
});

test("duplicate boot calls do not create duplicate instances", () => {
  const { dom } = createDom(`<!doctype html><textarea id="content" data-olloweditor="true"></textarea>`);
  fireDomReady(dom);
  dom.window.bootOllowEditor(dom.window.document);
  dom.window.bootOllowEditor(dom.window.document);

  assert.equal(dom.window.OllowEditor.instances().length, 1);
});

test("dynamic content can be initialized through bootOllowEditor(root)", () => {
  const { dom } = createDom(`<!doctype html><div id="modal"></div>`);
  fireDomReady(dom);

  const modal = dom.window.document.getElementById("modal");
  modal.innerHTML = '<textarea id="dynamic" data-olloweditor="true" data-olloweditor-options=\'{"theme":"auto"}\'></textarea>';
  const booted = dom.window.bootOllowEditor(modal);

  assert.equal(booted.length, 1);
  assert.ok(dom.window.OllowEditor.get("#dynamic"));
});

test("django admin inline additions initialize on formset:added", () => {
  const { dom } = createDom(`<!doctype html><div id="inline-group"></div>`);
  fireDomReady(dom);

  const row = dom.window.document.createElement("div");
  row.innerHTML = '<textarea id="inline-content" data-olloweditor="true"></textarea>';
  dom.window.document.getElementById("inline-group").appendChild(row);
  row.dispatchEvent(new dom.window.CustomEvent("formset:added", { bubbles: true }));

  assert.ok(dom.window.OllowEditor.get("#inline-content"));
  assert.equal(dom.window.OllowEditor.instances().length, 1);
});

test("missing OllowEditor global reports an error without crashing", () => {
  const { dom, errors } = createDom(
    `<!doctype html><textarea id="content" data-olloweditor="true"></textarea>`,
    { includeBundle: false }
  );
  let eventDetail = null;
  dom.window.document.getElementById("content").addEventListener("olloweditor:error", (event) => {
    eventDetail = event.detail;
  });

  fireDomReady(dom);

  assert.equal(typeof dom.window.bootOllowEditor, "function");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Load olloweditor\.browser\.js before olloweditor-init\.js/);
  assert.equal(eventDetail.phase, "missing-global");
});

test("lifecycle events are dispatched with target and instance", () => {
  const { dom } = createDom(`<!doctype html><textarea id="content" data-olloweditor="true"></textarea>`);
  const target = dom.window.document.getElementById("content");
  const seen = [];

  target.addEventListener("olloweditor:before-init", (event) => {
    seen.push(["before", event.detail.target === target, event.detail.instance]);
  });
  target.addEventListener("olloweditor:ready", (event) => {
    seen.push(["ready", event.detail.target === target, Boolean(event.detail.instance)]);
  });

  fireDomReady(dom);

  assert.deepEqual(seen, [
    ["before", true, null],
    ["ready", true, true]
  ]);
});
