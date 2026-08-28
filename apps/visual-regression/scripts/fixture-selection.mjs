import { selectFixtures, fixtureOverrides } from "../../a11y/scripts/fixture-selection.mjs";

export const visualFixtureOverrides = {
  ...fixtureOverrides,
  "fluid-button": { storyId: "components-forms-button--keyboard-focus" }
};

export const visualFixtureMetadata = {
  "fluid-celebrate": { settleMethod: "stop" },
  "fluid-bar-chart": { settleMethod: "finishChartAnimation" },
  "fluid-bubble-chart": { settleMethod: "finishChartAnimation" },
  "fluid-chart": { settleMethod: "finishChartAnimation" },
  "fluid-doughnut-chart": { settleMethod: "finishChartAnimation" },
  "fluid-line-chart": { settleMethod: "finishChartAnimation" },
  "fluid-pie-chart": { settleMethod: "finishChartAnimation" },
  "fluid-polar-area-chart": { settleMethod: "finishChartAnimation" },
  "fluid-radar-chart": { settleMethod: "finishChartAnimation" },
  "fluid-scatter-chart": { settleMethod: "finishChartAnimation" },
  "fluid-button": {
    focusTarget: {
      selector: "button",
      accessibleName: "Keyboard focus target",
      modality: "keyboard"
    }
  }
};

/** Preserve every story, but credit elements only to their verified fixture mapping. */
export function selectVisualFixtures(components, index, overrides = visualFixtureOverrides) {
  const selected = selectFixtures(components, index, overrides);
  const sources = new Set(
    components.map((component) => component.files.story.replaceAll("\\", "/"))
  );
  const bySource = new Map();
  for (const entry of Object.values(index.entries)) {
    if (entry.type !== "story") continue;
    const source = String(entry.importPath)
      .replaceAll("\\", "/")
      .replace(/^\.\.\/\.\.\//, "");
    if (!sources.has(source)) continue;
    const stories = bySource.get(source) ?? [];
    stories.push(entry);
    bySource.set(source, stories);
  }
  return [...bySource]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([source, stories]) =>
      stories.map((story, index) => {
        const fixtures = selected.filter((fixture) => fixture.storyId === story.id);
        return {
          id: story.id,
          title: story.title,
          name: story.name,
          source,
          tags: fixtures.map((fixture) => fixture.tag),
          fixtures: fixtures.map((fixture) => ({
            ...fixture,
            ...(visualFixtureMetadata[fixture.tag] ?? {})
          })),
          // Keep existing representative screenshots, and add the explicit
          // per-element fixtures to every mode. New images require human review.
          representative: index === 0 || fixtures.length > 0
        };
      })
    );
}
