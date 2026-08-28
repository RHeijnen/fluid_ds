import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { createWebsitePreview } from "./website-preview-harness.mjs";

let directory;
let preview;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), "fluid-website-preview-"));
  const landing = join(directory, "landing");
  const docs = join(directory, "docs");
  await mkdir(join(docs, "guide"), { recursive: true });
  await mkdir(landing, { recursive: true });
  await writeFile(join(landing, "index.html"), "<h1>Landing</h1>");
  await writeFile(join(landing, "favicon.svg"), "<svg></svg>");
  await writeFile(join(docs, "index.html"), "<h1>Docs</h1>");
  await writeFile(join(docs, "guide/index.html"), "<h1>Guide</h1>");
  await writeFile(join(docs, "404.html"), "<h1>Missing</h1>");
  preview = await createWebsitePreview({ landingDirectory: landing, docsDirectory: docs });
});

after(async () => {
  await preview?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("serves landing and mounted documentation with a canonical redirect", async () => {
  assert.match(await (await fetch(`${preview.origin}/`)).text(), /Landing/);
  const redirect = await fetch(`${preview.origin}/docs`, { redirect: "manual" });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("location"), "/docs/");
  assert.match(await (await fetch(`${preview.origin}/docs/guide/`)).text(), /Guide/);
});

test("returns an actual 404 status and contains malformed paths", async () => {
  const missing = await fetch(`${preview.origin}/not-here`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /Missing/);
  assert.equal((await fetch(`${preview.origin}/%E0%A4%A`)).status, 400);
  assert.equal((await fetch(`${preview.origin}/../outside`)).status, 404);
});
