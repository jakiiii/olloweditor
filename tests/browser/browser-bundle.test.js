import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const bundlePath = path.join(process.cwd(), "dist", "olloweditor.browser.js");
const bundleSource = await fs.readFile(bundlePath, "utf8");

function createDom(markup) {
  const dom = new JSDOM(markup, {
    runScripts: "dangerously",
    url: "http://localhost/"
  });

  dom.window.eval(bundleSource);
  return dom;
}

test("window.OllowEditor exists", () => {
  const dom = createDom(`<!doctype html><textarea id="content"></textarea>`);
  assert.ok(dom.window.OllowEditor);
  assert.equal(typeof dom.window.OllowEditor.create, "function");
});

test("editor initializes from a textarea and loads initial content", () => {
  const dom = createDom(`<!doctype html><textarea id="content"><p>Hello world</p></textarea>`);
  const textarea = dom.window.document.getElementById("content");
  const editor = dom.window.OllowEditor.create(textarea, {});

  assert.ok(editor);
  assert.match(editor.getHTML(), /Hello world/);
});

test("edited HTML is synchronized back to the textarea", () => {
  const dom = createDom(`<!doctype html><textarea id="content"></textarea>`);
  const textarea = dom.window.document.getElementById("content");
  const editor = dom.window.OllowEditor.create(textarea, {});

  editor.setHTML("<p>Updated body</p>");
  editor.sync({ autosave: false, silent: true });

  assert.equal(textarea.value, "<p>Updated body</p>");
});

test("two editors can initialize on one page", () => {
  const dom = createDom(`<!doctype html>
    <textarea id="first"><p>First</p></textarea>
    <textarea id="second"><p>Second</p></textarea>`);

  const first = dom.window.OllowEditor.create("#first", {});
  const second = dom.window.OllowEditor.create("#second", {});

  assert.notEqual(first, second);
  assert.equal(dom.window.OllowEditor.instances().length, 2);
});

test("reinitializing the same textarea returns the existing instance", () => {
  const dom = createDom(`<!doctype html><textarea id="content"></textarea>`);
  const first = dom.window.OllowEditor.create("#content", {});
  const second = dom.window.OllowEditor.create("#content", {});

  assert.equal(first, second);
  assert.equal(dom.window.OllowEditor.instances().length, 1);
});

test("invalid targets fail with a meaningful error", () => {
  const dom = createDom(`<!doctype html><div id="host"></div>`);

  assert.throws(
    () => dom.window.OllowEditor.create(dom.window.document.getElementById("host"), {}),
    /expects an HTMLTextAreaElement/
  );

  assert.throws(
    () => dom.window.OllowEditor.create("#missing", {}),
    /could not find a target/
  );
});
