import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { assertRenderCatalog, inventoryPublishedEntries } from "./ssr-entry-inventory.mjs";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "fluid-ssr-inventory-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const file of [
    "dist/index.js",
    "dist/one.js",
    "dist/two.js",
    "dist/index.d.ts",
    "dist/base.css",
    "src/tokens.ts"
  ]) {
    await mkdir(join(root, file, ".."), { recursive: true });
    await writeFile(join(root, file), "");
  }
  return root;
}

test("collects all published JS conditions and wildcard targets without priming aliases", async (t) => {
  const root = await fixture(t);
  const result = await inventoryPublishedEntries(root, {
    name: "fixture",
    main: "./dist/index.js",
    exports: { ".": "./src/not-published.ts" },
    publishConfig: {
      exports: {
        ".": { types: "./dist/index.d.ts", import: "./dist/index.js", node: "./dist/one.js" },
        "./helpers/*": "./dist/*.js",
        "./blocked": null,
        "./style": "./dist/base.css",
        "./source": "./src/tokens.ts"
      }
    }
  });
  assert.deepEqual(
    result.javascript,
    ["index", "one", "two"].map((name) => join(root, "dist", `${name}.js`))
  );
  assert.equal(
    result.classified.find((entry) => entry.exportPath === "exports/./source").kind,
    "typescript-source-not-plain-node-certified"
  );
  assert.ok(result.classified.some((entry) => entry.kind === "blocked"));
});

test("missing targets, empty wildcards, escaped paths and unclassified exports fail", async (t) => {
  const root = await fixture(t);
  for (const target of [
    "./dist/missing.js",
    "./missing/*.js",
    "../outside.js",
    "/outside.js",
    "node:fs"
  ]) {
    await assert.rejects(inventoryPublishedEntries(root, { exports: { ".": target } }), /target/);
  }
  await writeFile(join(root, "dist", "unknown.wasm"), "");
  await assert.rejects(
    inventoryPublishedEntries(root, { exports: { ".": "./dist/unknown.wasm" } }),
    /Unclassified/
  );
});

test("render registrations must exactly match the independent catalog", () => {
  const catalog = [{ tag: "fluid-one" }, { tag: "fluid-two" }];
  assert.doesNotThrow(() => assertRenderCatalog(new Set(["fluid-one", "fluid-two"]), catalog));
  // A computed registration omitted by literal-source discovery cannot shrink the gate.
  assert.throws(() => assertRenderCatalog(new Set(["fluid-one"]), catalog), /missing fluid-two/);
  assert.throws(
    () => assertRenderCatalog(new Set(["fluid-one", "fluid-two", "fluid-extra"]), catalog),
    /extra fluid-extra/
  );
  assert.throws(() => assertRenderCatalog(new Set(), []), /valid element/);
  assert.throws(
    () => assertRenderCatalog(new Set(), [{ tag: "fluid-one" }, { tag: "fluid-one" }]),
    /Duplicate/
  );
});
