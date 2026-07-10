import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const rootDir = process.cwd();
const sourceRoot = path.join(rootDir, "dist");
const targetRoot = path.join(rootDir, "python", "src", "olloweditor", "static", "olloweditor");
const manifestPath = path.join(targetRoot, ".asset-manifest.json");
const generatedNoticePath = path.join(targetRoot, "GENERATED.txt");

const requiredAssets = [
  "olloweditor.browser.js",
  "olloweditor.css"
];

const optionalDirectories = [];
const ignoredExtensions = new Set([".map"]);

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function ensureFile(filePath) {
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error(`Required frontend asset is missing: ${path.relative(rootDir, filePath)}`);
  }
}

async function listFilesRecursive(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(absolute));
      continue;
    }
    if (ignoredExtensions.has(path.extname(entry.name))) {
      continue;
    }
    files.push(absolute);
  }

  return files;
}

async function removeStaleFiles(manifest) {
  const stale = [];
  for (const relative of manifest.files || []) {
    const targetPath = path.join(targetRoot, relative);
    const exists = await fs.stat(targetPath).catch(() => null);
    if (exists && exists.isFile()) {
      await fs.unlink(targetPath);
      stale.push(relative);
    }
  }

  return stale;
}

async function pruneEmptyDirectories(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    await pruneEmptyDirectories(path.join(dirPath, entry.name));
  }

  if (dirPath === targetRoot) {
    return;
  }

  const remaining = await fs.readdir(dirPath).catch(() => []);
  if (remaining.length === 0) {
    await fs.rmdir(dirPath);
  }
}

async function copyAsset(relative) {
  const sourcePath = path.join(sourceRoot, relative);
  const targetPath = path.join(targetRoot, relative);
  const targetDir = path.dirname(targetPath);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.copyFile(sourcePath, targetPath);

  const content = await fs.readFile(targetPath);
  return {
    relative,
    bytes: content.byteLength,
    sha256: sha256(content)
  };
}

async function sync() {
  for (const asset of requiredAssets) {
    await ensureFile(path.join(sourceRoot, asset));
  }

  const filesToCopy = [...requiredAssets];

  for (const directory of optionalDirectories) {
    const absolute = path.join(sourceRoot, directory);
    const stat = await fs.stat(absolute).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      continue;
    }
    const nestedFiles = await listFilesRecursive(absolute);
    for (const filePath of nestedFiles) {
      filesToCopy.push(path.relative(sourceRoot, filePath));
    }
  }

  const oldManifest = JSON.parse(
    await fs.readFile(manifestPath, "utf8").catch(() => JSON.stringify({ files: [] }))
  );

  await fs.mkdir(targetRoot, { recursive: true });
  const removedFiles = await removeStaleFiles(oldManifest);
  await pruneEmptyDirectories(targetRoot);

  const copied = [];
  for (const relative of [...new Set(filesToCopy)].sort()) {
    copied.push(await copyAsset(relative));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot: "dist",
    targetRoot: "python/src/olloweditor/static/olloweditor",
    files: copied.map((entry) => entry.relative)
  };

  const notice = [
    "Generated asset directory for the Python package.",
    "Do not edit files here manually.",
    "Source of truth:",
    "  - dist/olloweditor.browser.js",
    "  - dist/olloweditor.css",
    "Regenerate with:",
    "  npm run build",
    "  npm run build:python-assets"
  ].join("\n");

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await fs.writeFile(generatedNoticePath, `${notice}\n`, "utf8");

  console.log("Synchronized Python assets:");
  for (const entry of copied) {
    console.log(`- ${entry.relative} (${entry.bytes} bytes, sha256 ${entry.sha256.slice(0, 12)}...)`);
  }
  if (removedFiles.length > 0) {
    console.log("Removed stale files:");
    for (const relative of removedFiles) {
      console.log(`- ${relative}`);
    }
  }
  console.log(`Wrote ${path.relative(rootDir, manifestPath)}`);
  console.log(`Wrote ${path.relative(rootDir, generatedNoticePath)}`);
}

sync().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
