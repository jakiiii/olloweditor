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

function jsonResponse(payload, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === "content-type" ? "application/json" : null;
      }
    },
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    }
  };
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

test("image uploads use FormData, CSRF, and same-origin credentials", async () => {
  const dom = createDom(`<!doctype html><textarea id="content"></textarea>`);
  dom.window.document.cookie = "csrftoken=test-token";
  let seen = null;
  dom.window.fetch = async (url, options) => {
    seen = {
      url,
      method: options.method,
      credentials: options.credentials,
      csrf: options.headers["X-CSRFToken"],
      files: options.body.getAll("file").map((file) => file.name)
    };
    return jsonResponse({
      success: true,
      type: "image",
      url: "/media/olloweditor/images/2026/07/uploaded.png",
      name: "uploaded.png",
      size: 123
    });
  };

  const editor = dom.window.OllowEditor.create("#content", {
    upload: {
      imageUrl: "/olloweditor/upload/image/"
    }
  });
  const file = new dom.window.File(["png"], "photo.png", { type: "image/png" });
  const url = await editor.uploadFile(file, "image");

  assert.equal(url, "/media/olloweditor/images/2026/07/uploaded.png");
  assert.deepEqual(seen, {
    url: "/olloweditor/upload/image/",
    method: "POST",
    credentials: "same-origin",
    csrf: "test-token",
    files: ["photo.png"]
  });
});

test("gallery uploads use the files field and preserve response order", async () => {
  const dom = createDom(`<!doctype html><textarea id="content"></textarea>`);
  let seenNames = [];
  dom.window.fetch = async (_url, options) => {
    seenNames = options.body.getAll("files").map((file) => file.name);
    return jsonResponse({
      success: true,
      type: "gallery",
      files: [
        { url: "/media/one.png", name: "one.png", size: 10 },
        { url: "/media/two.png", name: "two.png", size: 20 }
      ]
    });
  };

  const editor = dom.window.OllowEditor.create("#content", {
    upload: {
      galleryUrl: "/olloweditor/upload/gallery/"
    }
  });
  const first = new dom.window.File(["a"], "one.png", { type: "image/png" });
  const second = new dom.window.File(["b"], "two.png", { type: "image/png" });
  const urls = await editor.uploadFiles([first, second], "gallery");

  assert.deepEqual(seenNames, ["one.png", "two.png"]);
  assert.deepEqual(urls, ["/media/one.png", "/media/two.png"]);
});

test("attachment uploads return metadata for link insertion", async () => {
  const dom = createDom(`<!doctype html><textarea id="content"></textarea>`);
  dom.window.fetch = async () => jsonResponse({
    success: true,
    type: "attachment",
    url: "/media/olloweditor/attachments/2026/07/report.pdf",
    name: "report.pdf",
    size: 456
  });

  const editor = dom.window.OllowEditor.create("#content", {
    upload: {
      attachmentUrl: "/olloweditor/upload/attachment/"
    }
  });
  const file = new dom.window.File(["pdf"], "report.pdf", { type: "application/pdf" });
  const uploaded = await editor.uploadFileDetails(file, "attachment");

  assert.equal(uploaded.url, "/media/olloweditor/attachments/2026/07/report.pdf");
  assert.equal(uploaded.name, "report.pdf");
  assert.equal(uploaded.size, 456);
});

test("server mode does not fall back to base64 when the endpoint fails", async () => {
  const dom = createDom(`<!doctype html><textarea id="content"></textarea>`);
  dom.window.fetch = async () => jsonResponse({
    success: false,
    error: { code: "permission_denied", message: "No permission" }
  }, { status: 403 });

  const editor = dom.window.OllowEditor.create("#content", {
    upload: {
      imageUrl: "/olloweditor/upload/image/",
      allowBase64: false,
      allowFallback: false
    }
  });
  const file = new dom.window.File(["png"], "photo.png", { type: "image/png" });

  await assert.rejects(
    () => editor.uploadFile(file, "image"),
    /No permission/
  );
});

test("network failures do not insert base64 in Django-style server mode", async () => {
  const dom = createDom(`<!doctype html><textarea id="content"></textarea>`);
  dom.window.fetch = async () => {
    throw new Error("network failed");
  };

  const editor = dom.window.OllowEditor.create("#content", {
    upload: {
      galleryUrl: "/olloweditor/upload/gallery/",
      allowBase64: false,
      allowFallback: false
    }
  });
  const file = new dom.window.File(["png"], "photo.png", { type: "image/png" });

  await assert.rejects(
    () => editor.uploadFiles([file], "gallery"),
    /network failed/
  );
});
