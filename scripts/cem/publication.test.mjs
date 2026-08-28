import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzePackage } from "./canonical.mjs";
import { eventFixture } from "./fixtures.mjs";
import { validatePackedCem } from "./publication.mjs";

function fixture() {
  const record = {
    packageName: "@fluid-ds/fixture",
    version: "0.4.0",
    manifest: analyzePackage("@fluid-ds/fixture", eventFixture)
  };
  const packed = {
    descriptor: {
      name: record.packageName,
      version: record.version,
      customElements: "custom-elements.json",
      exports: { "./custom-elements.json": "./custom-elements.json" },
      files: ["src", "custom-elements.json"]
    },
    entries: ["package/package.json", "package/custom-elements.json", "package/src/index.ts"],
    manifestText: `${JSON.stringify(record.manifest, null, 2)}\n`
  };
  return { record, packed };
}

test("published descriptor and exact canonical manifest contents validate independently of workspace exports", () => {
  const { record, packed } = fixture();
  const result = validatePackedCem(packed, record);
  assert.equal(result.tags, 1);
  assert.equal(result.package, record.packageName);
  assert.match(result.manifestSha256, /^[a-f0-9]{64}$/);
});

test("missing, redirected or incorrectly identified publication metadata fails", () => {
  for (const key of ["name", "version", "customElements", "exports", "files"]) {
    const { record, packed } = fixture();
    delete packed.descriptor[key];
    assert.throws(() => validatePackedCem(packed, record));
  }
  const { record, packed } = fixture();
  packed.descriptor.exports["./custom-elements.json"] = "./stale.json";
  assert.throws(() => validatePackedCem(packed, record), /omit or redirect/);
});

test("metadata alone cannot hide omitted manifest files or nonexistent module references", () => {
  for (const path of [
    "package/package.json",
    "package/custom-elements.json",
    "package/src/index.ts"
  ]) {
    const { record, packed } = fixture();
    packed.entries = packed.entries.filter((entry) => entry !== path);
    assert.throws(() => validatePackedCem(packed, record), /does not contain|absent source module/);
  }
});

test("stale, tampered or malformed packed manifests cannot preserve a green tag count", () => {
  for (const mutate of [
    (text) => text.replace("fluid-fixture", "fluid-wrong"),
    (text) => `${text} `,
    () => "{broken"
  ]) {
    const { record, packed } = fixture();
    packed.manifestText = mutate(packed.manifestText);
    assert.throws(() => validatePackedCem(packed, record), /manifest bytes differ/);
  }
});

test("duplicate or escaping archive paths cannot shadow validated files", () => {
  for (const path of [
    "package/custom-elements.json",
    "../custom-elements.json",
    "package/../custom-elements.json",
    "C:/outside.json",
    "package\\custom-elements.json"
  ]) {
    const { record, packed } = fixture();
    packed.entries.push(path);
    assert.throws(
      () => validatePackedCem(packed, record),
      /Duplicate archive paths|Unsafe or unexpected/
    );
  }
});
