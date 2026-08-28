import { test } from "node:test";
import assert from "node:assert/strict";
import { selectFixtures } from "./fixture-selection.mjs";

const components = [{ tag: "fluid-example", files: { story: "packages/example.stories.ts" } }];
const index = {
  entries: {
    first: { id: "example--first", type: "story", importPath: "../../packages/example.stories.ts" },
    second: {
      id: "example--second",
      type: "story",
      importPath: "../../packages/example.stories.ts"
    },
    docs: { id: "example--docs", type: "docs", importPath: "../../packages/example.stories.ts" },
    other: { id: "other--first", type: "story", importPath: "../../packages/other.stories.ts" }
  }
};

test("defaults to a source-matched story with no setup", () => {
  assert.deepEqual(selectFixtures(components, index, {}), [
    {
      tag: "fluid-example",
      storyId: "example--first",
      source: "packages/example.stories.ts",
      setupButtons: []
    }
  ]);
});
test("explicitly selects a non-first story and preserves setup", () => {
  const result = selectFixtures(components, index, {
    "fluid-example": { storyId: "example--second", setupButtons: ["Open"] }
  });
  assert.equal(result[0].storyId, "example--second");
  assert.deepEqual(result[0].setupButtons, ["Open"]);
});
for (const id of ["missing", "other--first", "example--docs"]) {
  test(`rejects invalid or wrong-source story ${id}`, () => {
    assert.throws(
      () => selectFixtures(components, index, { "fluid-example": { storyId: id } }),
      /Cannot find built fixture/
    );
  });
}
test("rejects stale overrides", () => {
  assert.throws(
    () => selectFixtures(components, index, { "fluid-removed": {} }),
    /Stale fixture override/
  );
});
test("rejects duplicate tags", () => {
  assert.throws(() => selectFixtures([...components, ...components], index, {}), /Duplicate/);
});
test("rejects unnamed setup actions", () => {
  assert.throws(
    () =>
      selectFixtures(components, index, {
        "fluid-example": { storyId: "example--first", setupButtons: [""] }
      }),
    /Invalid setup/
  );
});
test("rejects absent story attribution", () => {
  assert.throws(
    () => selectFixtures([{ tag: "fluid-example", files: {} }], index, {}),
    /no Storybook story/
  );
});
