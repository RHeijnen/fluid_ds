import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";

const inventoryUrl = new URL("../quality/ssr-state-adoption.json", import.meta.url);
const packagesUrl = new URL("../packages/", import.meta.url);
const allowedStatuses = new Set(["supported", "applicable-gap", "not-applicable"]);

async function publishedFormAssociatedTags() {
  const tags = [];
  for (const directory of await readdir(packagesUrl, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue;
    let manifest;
    try {
      manifest = JSON.parse(
        await readFile(new URL(`${directory.name}/custom-elements.json`, packagesUrl), "utf8")
      );
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    for (const module of manifest.modules ?? []) {
      for (const declaration of module.declarations ?? []) {
        const associated = (declaration.members ?? []).some(
          (member) =>
            member.kind === "field" &&
            member.name === "formAssociated" &&
            member.static === true &&
            String(member.default) === "true"
        );
        if (declaration.customElement && associated) tags.push(declaration.tagName);
      }
    }
  }
  return tags.sort();
}

test("state-adoption inventory exactly covers every published form-associated element", async () => {
  const inventory = JSON.parse(await readFile(inventoryUrl, "utf8"));
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(typeof inventory.scope, "string");
  assert.ok(inventory.scope.length > 20);

  const tags = inventory.entries.map((entry) => entry.tag);
  assert.deepEqual(tags, [...new Set(tags)].sort(), "inventory tags must be unique and sorted");
  assert.deepEqual(tags, await publishedFormAssociatedTags());

  for (const entry of inventory.entries) {
    assert.ok(allowedStatuses.has(entry.status), `${entry.tag}: invalid status`);
    assert.ok(entry.surface?.length > 5, `${entry.tag}: missing concrete surface`);
    if (entry.status === "supported") {
      assert.ok(entry.contract?.length > 20, `${entry.tag}: missing supported contract`);
      assert.ok(entry.evidence?.length > 10, `${entry.tag}: missing evidence`);
      assert.equal(
        entry.reason,
        undefined,
        `${entry.tag}: supported entries cannot use gap rationale`
      );
    } else {
      assert.ok(entry.reason?.length > 20, `${entry.tag}: missing boundary rationale`);
      assert.equal(entry.evidence, undefined, `${entry.tag}: gaps cannot claim passing evidence`);
    }
  }
});

test("baseline denominator cannot hide applicable gaps behind catalog totals", async () => {
  const { entries } = JSON.parse(await readFile(inventoryUrl, "utf8"));
  const applicable = entries.filter((entry) => entry.status !== "not-applicable");
  const supported = applicable.filter((entry) => entry.status === "supported");
  const gaps = applicable.filter((entry) => entry.status === "applicable-gap");
  assert.deepEqual(
    {
      catalog: entries.length,
      applicable: applicable.length,
      supported: supported.length,
      gaps: gaps.length
    },
    { catalog: 22, applicable: 14, supported: 14, gaps: 0 }
  );
});
