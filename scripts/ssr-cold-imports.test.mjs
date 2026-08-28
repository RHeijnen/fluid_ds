import assert from "node:assert/strict";
import test from "node:test";
import { coldImport, coldImportAll } from "./ssr-cold-imports.mjs";

const moduleUrl = (source) => `data:text/javascript,${encodeURIComponent(source)}`;

test("accepts a genuinely cold import without browser globals", async () => {
  await coldImport(moduleUrl("export const value = 1"));
});

test("rejects browser-global access rather than preloading a DOM shim", async () => {
  await assert.rejects(coldImport(moduleUrl("document.createElement('div')")), /document/);
});

test("does not let one entry prime another entry's browser globals", async () => {
  const results = await coldImportAll([
    moduleUrl("globalThis.document = { title: 'primed' }"),
    moduleUrl("export const title = document.title")
  ]);
  assert.equal(results.filter(({ status }) => status === "passed").length, 1);
  assert.equal(results.filter(({ status }) => status === "failed").length, 1);
});

test("rejects successful early exit without completed import", async () => {
  await assert.rejects(coldImport(moduleUrl("process.exit(0)")), /without reaching completion/);
});

test("bounds a hung import and rejects empty or invalid selections", async () => {
  await assert.rejects(
    coldImport(moduleUrl("await new Promise(() => setInterval(() => {}, 1000))"), {
      timeout: 500
    })
  );
  await assert.rejects(coldImportAll([]), /at least one/);
  await assert.rejects(coldImportAll([moduleUrl("")], 0), /concurrency/);
  for (const timeout of [0, -1, Infinity, NaN, 1.5, 120001])
    await assert.rejects(coldImport(moduleUrl(""), { timeout }), /timeout must/);
});

test("hard deadline cannot be intercepted by an imported SIGTERM handler", async () => {
  await assert.rejects(
    coldImport(
      moduleUrl(`
      process.on("SIGTERM", () => {});
      // Safety exit keeps a deliberately regressed SIGTERM implementation finite.
      setTimeout(() => process.exit(99), 2500);
      await new Promise(() => {});
    `),
      { timeout: 500 }
    ),
    (error) => error.killed === true && error.signal === "SIGKILL"
  );
});
