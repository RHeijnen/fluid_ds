import assert from "node:assert/strict";
import { test } from "node:test";
import { expectedSnapshots, reconcileSnapshots } from "./baseline-inventory.mjs";

const catalog = [
  { id: "gallery--default", tags: ["fluid-one"], representative: true },
  { id: "gallery--invalid", tags: ["fluid-two"], representative: false }
];

test("requires all five modes for representatives and light for every retained story", () => {
  assert.deepEqual(
    expectedSnapshots(catalog).map(({ name }) => name),
    [
      "gallery--default-light.png",
      "gallery--default-dark.png",
      "gallery--default-forced-colors.png",
      "gallery--default-rtl.png",
      "gallery--default-reduced-motion.png",
      "gallery--invalid-light.png"
    ]
  );
});

test("fails gaps closed and attributes missing images only to their verified fixture tags", () => {
  const result = reconcileSnapshots(catalog, [
    "gallery--default-light.png",
    "gallery--default-dark.png",
    "gallery--invalid-light.png",
    "stale.png"
  ]);
  assert.equal(result.expectedCount, 6);
  assert.equal(result.acceptedCount, 3);
  assert.equal(result.missingCount, 3);
  assert.deepEqual(result.missingTags, ["fluid-one"]);
  assert.deepEqual(result.orphaned, ["stale.png"]);
});

test("an image count cannot substitute for exact expected snapshot names", () => {
  const accepted = expectedSnapshots(catalog).map(({ name }) => name);
  accepted[0] = "unrelated-but-counted.png";
  const result = reconcileSnapshots(catalog, accepted);
  assert.equal(result.missingCount, 1);
  assert.equal(result.orphanedCount, 1);
});
