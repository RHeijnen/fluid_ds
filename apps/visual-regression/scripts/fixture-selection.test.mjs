import { test } from "node:test";
import assert from "node:assert/strict";
import { selectVisualFixtures, visualFixtureMetadata } from "./fixture-selection.mjs";

const source = "packages/gallery.stories.ts";
const components = ["fluid-first", "fluid-second"].map((tag) => ({
  tag,
  files: { story: source }
}));
const entry = (id) => ({
  id,
  type: "story",
  title: "Gallery",
  name: id,
  importPath: `../../${source}`
});
const index = {
  entries: {
    first: entry("gallery--first"),
    second: entry("gallery--second"),
    another: entry("gallery--another"),
    docs: { ...entry("gallery--docs"), type: "docs" },
    other: { ...entry("other--first"), importPath: "../../packages/other.stories.ts" }
  }
};
const overrides = { "fluid-second": { storyId: "gallery--second", setupButtons: ["Show child"] } };

test("credits only selected element fixtures instead of every source sibling", () => {
  const result = selectVisualFixtures(components, index, overrides);
  assert.deepEqual(
    result.map(({ id, tags }) => ({ id, tags })),
    [
      { id: "gallery--first", tags: ["fluid-first"] },
      { id: "gallery--second", tags: ["fluid-second"] },
      { id: "gallery--another", tags: [] }
    ]
  );
});
test("preserves unrelated sibling stories without awarding element coverage", () => {
  const result = selectVisualFixtures(components, index, overrides);
  assert.equal(result.length, 3);
  assert.deepEqual(result[2].fixtures, []);
});
test("tests explicit non-first positive fixtures in every mode and preserves their setup", () => {
  const result = selectVisualFixtures(components, index, overrides);
  assert.equal(result[0].representative, true);
  assert.equal(result[1].representative, true);
  assert.equal(result[2].representative, false);
  assert.deepEqual(result[1].fixtures[0].setupButtons, ["Show child"]);
});
test("keeps a prior first-story representative even when all elements map elsewhere", () => {
  const result = selectVisualFixtures(components.slice(1), index, overrides);
  assert.deepEqual(result[0].tags, []);
  assert.equal(result[0].representative, true);
});
test("fails closed for a claimed element whose selected story is absent", () => {
  assert.throws(
    () =>
      selectVisualFixtures(components, index, {
        "fluid-second": { storyId: "gallery--missing" }
      }),
    /Cannot find built fixture/
  );
});
test("never credits a different source's story to an element", () => {
  assert.throws(
    () =>
      selectVisualFixtures(components, index, {
        "fluid-second": { storyId: "other--first" }
      }),
    /Cannot find built fixture/
  );
});

test("attaches deterministic keyboard-focus metadata only to the attributed button fixture", () => {
  const buttonSource = "packages/components/src/components/button/fluid-button.stories.ts";
  const result = selectVisualFixtures(
    [{ tag: "fluid-button", files: { story: buttonSource } }],
    {
      entries: {
        primary: {
          ...entry("components-forms-button--primary"),
          importPath: `../../${buttonSource}`
        },
        focus: {
          ...entry("components-forms-button--keyboard-focus"),
          importPath: `../../${buttonSource}`
        }
      }
    },
    { "fluid-button": { storyId: "components-forms-button--keyboard-focus" } }
  );
  assert.deepEqual(result[0].fixtures, []);
  assert.deepEqual(result[1].fixtures[0].focusTarget, {
    selector: "button",
    accessibleName: "Keyboard focus target",
    modality: "keyboard"
  });
});

test("attaches the deterministic stop lifecycle only to the attributed celebrate fixture", () => {
  const celebrateSource = "packages/animations/src/effects/effects.stories.ts";
  const result = selectVisualFixtures(
    [{ tag: "fluid-celebrate", files: { story: celebrateSource } }],
    {
      entries: {
        gallery: {
          ...entry("animations-effects--gallery"),
          importPath: `../../${celebrateSource}`
        },
        automatic: {
          ...entry("animations-effects--declarative-auto"),
          importPath: `../../${celebrateSource}`
        }
      }
    },
    { "fluid-celebrate": { storyId: "animations-effects--declarative-auto" } }
  );
  assert.deepEqual(result[0].fixtures, []);
  assert.equal(result[1].fixtures[0].settleMethod, "stop");
});

test("attaches final-frame settling only to attributed animated chart fixtures", () => {
  const chartSource = "packages/charts/src/components/chart/fluid-charts.stories.ts";
  const result = selectVisualFixtures(
    [{ tag: "fluid-bar-chart", files: { story: chartSource } }],
    {
      entries: {
        generic: {
          ...entry("charts-gallery--generic"),
          importPath: `../../${chartSource}`
        },
        bar: {
          ...entry("charts-gallery--bar"),
          importPath: `../../${chartSource}`
        }
      }
    },
    { "fluid-bar-chart": { storyId: "charts-gallery--bar" } }
  );
  assert.deepEqual(result[0].fixtures, []);
  assert.equal(result[1].fixtures[0].settleMethod, "finishChartAnimation");
  assert.deepEqual(
    [
      "fluid-chart",
      "fluid-bar-chart",
      "fluid-bubble-chart",
      "fluid-doughnut-chart",
      "fluid-line-chart",
      "fluid-pie-chart",
      "fluid-polar-area-chart",
      "fluid-radar-chart",
      "fluid-scatter-chart"
    ].map((tag) => visualFixtureMetadata[tag]?.settleMethod),
    Array(9).fill("finishChartAnimation")
  );
  assert.equal(visualFixtureMetadata["fluid-sparkline"], undefined);
});
