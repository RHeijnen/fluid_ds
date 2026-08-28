import assert from "node:assert/strict";
import { test } from "node:test";
import {
  publishedTags,
  readInventory,
  validateInventory
} from "./check-localization-owned-strings.mjs";

function clone(value) {
  return structuredClone(value);
}

test("inventory exactly covers the published catalog and every ownership boundary", async () => {
  const inventory = await readInventory();
  assert.deepEqual(await validateInventory(inventory), []);
  assert.equal((await publishedTags()).length, 155);
});

test("a new or omitted catalog element cannot silently escape disposition review", async () => {
  const inventory = await readInventory();
  inventory.catalogDispositions[0].tags.shift();
  assert.ok(
    (await validateInventory(inventory)).includes(
      "catalog dispositions must exactly cover published custom elements"
    )
  );
});

test("every catalog and surface disposition requires retained evidence", async () => {
  const inventory = clone(await readInventory());
  delete inventory.catalogDispositions[0].evidence;
  delete inventory.surfaceRecords[0].evidence;
  const errors = await validateInventory(inventory);
  assert.ok(errors.some((error) => error.includes("missing audit evidence")));
  assert.ok((await validateInventory(inventory)).some((error) => error.includes("needs evidence")));
});

test("the inventory cannot be reframed as an English-literal completeness count", async () => {
  const inventory = clone(await readInventory());
  inventory.measurement = "English strings localized: 100%";
  assert.ok((await validateInventory(inventory)).some((error) => error.includes("raw English")));
});

test("all referenced runtime and evidence files remain resolvable", async () => {
  const inventory = clone(await readInventory());
  inventory.surfaceRecords[0].sources.push("packages/components/src/missing-file.ts");
  assert.ok((await validateInventory(inventory)).some((error) => error.includes("missing source")));
});
