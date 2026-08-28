import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("../public/fonts/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const css = await readFile(new URL("fonts.css", root), "utf8");
const urls = new Set([...css.matchAll(/url\(([^)]+)\)/g)].map((match) => match[1]));
assert.equal(urls.size, manifest.files.length, "Every stylesheet asset must be pinned");
for (const entry of manifest.files) {
  assert.match(entry.file, /^[A-Za-z0-9_-]+\.woff2$/);
  assert(urls.has(`./${entry.file}`), `Missing local reference: ${entry.file}`);
  const bytes = await readFile(new URL(entry.file, root));
  assert.equal(bytes.subarray(0, 4).toString(), "wOF2", "Asset must be WOFF2, not an error page");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256, entry.file);
}
for (const name of ["Inter", "JetBrains-Mono"]) {
  const license = await readFile(new URL(`${name}-OFL.txt`, root), "utf8");
  assert.match(license, /Copyright 2020/);
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
}
console.log(`Verified ${urls.size} pinned local font assets and both licenses.`);
