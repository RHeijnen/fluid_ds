import assert from "node:assert/strict";
import { test } from "node:test";
import { interactionContractTagsFromSource as collect } from "./interaction-contracts.mjs";

const meta = `const meta = { tags: ["interaction-contract"] }; export default meta;`;
test("respects a story opting out of an inherited runner tag", () => {
  assert.deepEqual(
    [
      ...collect(`${meta}
    export const Fixture = { tags: ["!interaction-contract"], parameters: { quality: { componentTag: "fluid-fixture" } }, play: async () => {} };`)
    ],
    []
  );
});
test("attributes an exported tagged story with its own play function", () => {
  assert.deepEqual(
    [
      ...collect(`${meta}
    export const Example = { parameters: { quality: { componentTag: "fluid-button" } }, play: async () => {} };`)
    ],
    ["fluid-button"]
  );
});
test("does not borrow play from the next story or commented source", () => {
  assert.deepEqual(
    [
      ...collect(`${meta}
    // componentTag: "fluid-comment", play: async () => {}
    export const Static = { parameters: { quality: { componentTag: "fluid-static" } } };
    export const Other = { play: async () => {} };`)
    ],
    []
  );
});
test("requires the runner tag and a literal function, not an unexecuted helper", () => {
  assert.deepEqual(
    [
      ...collect(`const Helper = { tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-helper" } }, play: async () => {} };
    export const Untagged = { parameters: { quality: { componentTag: "fluid-untagged" } }, play: async () => {} };
    export const Placeholder = { tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-placeholder" } }, play: "later" };`)
    ],
    []
  );
});
test("supports per-story tags and arbitrarily long render templates", () => {
  assert.deepEqual(
    [
      ...collect(
        `export const Example = { tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-example" } }, render: () => "${"x".repeat(2500)}", play: async () => {} };`
      )
    ],
    ["fluid-example"]
  );
});
