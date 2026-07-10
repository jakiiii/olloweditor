import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const rootDir = process.cwd();
const sourceRoot = path.join(rootDir, "dist");
const targetRoot = path.join(rootDir, "python", "src", "olloweditor", "static", "olloweditor");

const requiredAssets = [
  "olloweditor.browser.js",
  "olloweditor.css"
];

const packageSpecificAssets = [
  "olloweditor-init.js"
];

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function extractCssUrls(content) {
  const urls = [];
  const pattern = /url\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const raw = match[1].trim().replace(/^["']|["']$/g, "");
    if (!raw || raw.startsWith("data:") || raw.startsWith("http:") || raw.startsWith("https:") || raw.startsWith("//")) {
      continue;
    }
    urls.push(raw);
  }
  return urls;
}

function assertSafeRelativeAsset(reference, owner) {
  if (reference.includes("..")) {
    throw new Error(`${owner} contains an unsafe asset reference: ${reference}`);
  }
}

async function readFileChecked(baseDir, relative) {
  const absolute = path.join(baseDir, relative);
  const stat = await fs.stat(absolute).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error(`Missing asset: ${path.relative(rootDir, absolute)}`);
  }
  if (stat.size === 0) {
    throw new Error(`Asset is empty: ${path.relative(rootDir, absolute)}`);
  }
  const content = await fs.readFile(absolute);
  return { absolute, content };
}

async function verify() {
  const results = [];

  for (const relative of requiredAssets) {
    const source = await readFileChecked(sourceRoot, relative);
    const target = await readFileChecked(targetRoot, relative);
    const sourceHash = sha256(source.content);
    const targetHash = sha256(target.content);

    if (sourceHash !== targetHash) {
      throw new Error(`Packaged asset is out of sync with dist/${relative}`);
    }

    results.push(`verified ${relative} (${target.content.length} bytes)`);
  }

  const js = (await readFileChecked(targetRoot, "olloweditor.browser.js")).content.toString("utf8");
  if (!js.includes("window.OllowEditor") && !js.includes("global.OllowEditor")) {
    throw new Error("Packaged browser bundle does not expose the expected browser global.");
  }

  const initJs = (await readFileChecked(targetRoot, "olloweditor-init.js")).content.toString("utf8");
  if (!initJs.includes("bootOllowEditor")) {
    throw new Error("Packaged initializer does not expose bootOllowEditor.");
  }

  for (const relative of packageSpecificAssets) {
    const asset = await readFileChecked(targetRoot, relative);
    results.push(`verified ${relative} (${asset.content.length} bytes)`);
  }

  const cssContent = (await readFileChecked(targetRoot, "olloweditor.css")).content.toString("utf8");
  const cssUrls = extractCssUrls(cssContent);
  for (const reference of cssUrls) {
    assertSafeRelativeAsset(reference, "olloweditor.css");
    const resolved = path.normalize(path.join(targetRoot, reference));
    if (!resolved.startsWith(targetRoot)) {
      throw new Error(`CSS reference escapes the packaged static directory: ${reference}`);
    }
    const stat = await fs.stat(resolved).catch(() => null);
    if (!stat || !stat.isFile()) {
      throw new Error(`CSS references a missing packaged resource: ${reference}`);
    }
  }

  console.log("Verified Python asset package contents:");
  for (const line of results) {
    console.log(`- ${line}`);
  }
  console.log(`- browser global detected in olloweditor.browser.js`);
  console.log(`- bootOllowEditor detected in olloweditor-init.js`);
  console.log(`- CSS asset references validated (${cssUrls.length} references)`);
}

verify().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
