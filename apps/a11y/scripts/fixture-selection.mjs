// Shared story files need explicit element-to-story mappings. Runtime presence
// checks remain mandatory: a valid story ID alone does not prove coverage.
export const fixtureOverrides = {
  "fluid-bar-chart": { storyId: "charts-gallery--bar" },
  "fluid-bubble-chart": { storyId: "charts-gallery--bubble" },
  "fluid-chart": { storyId: "charts-gallery--generic" },
  "fluid-doughnut-chart": { storyId: "charts-gallery--doughnut" },
  "fluid-line-chart": { storyId: "charts-gallery--line" },
  "fluid-pie-chart": { storyId: "charts-gallery--pie" },
  "fluid-polar-area-chart": { storyId: "charts-gallery--polar-area" },
  "fluid-radar-chart": { storyId: "charts-gallery--radar" },
  "fluid-scatter-chart": { storyId: "charts-gallery--scatter" },
  "fluid-sparkline": { storyId: "charts-gallery--sparkline" },
  "fluid-celebrate": { storyId: "animations-effects--declarative-auto" },
  "fluid-col": { storyId: "components-layout-grid--spanning" },
  "fluid-menu-label": { storyId: "components-navigation-menu--with-labels" },
  "fluid-toast-item": {
    storyId: "components-feedback-toast--persistent",
    setupButtons: ["Show persistent toast"]
  }
};

export function selectFixtures(components, index, overrides = fixtureOverrides) {
  const tags = new Set(components.map(({ tag }) => tag));
  if (tags.size !== components.length) throw new Error("Duplicate component tags");
  for (const tag of Object.keys(overrides)) {
    if (!tags.has(tag)) throw new Error(`Stale fixture override: ${tag}`);
  }
  const stories = Object.values(index.entries).filter((entry) => entry.type === "story");
  return components.map((component) => {
    if (!component.files.story) throw new Error(`${component.tag} has no Storybook story`);
    const source = component.files.story.replaceAll("\\", "/");
    const candidates = stories.filter((entry) =>
      source.endsWith(
        String(entry.importPath)
          .replaceAll("\\", "/")
          .replace(/^\.\.\/\.\.\//, "")
      )
    );
    const override = overrides[component.tag];
    const story = override
      ? candidates.find((entry) => entry.id === override.storyId)
      : candidates[0];
    if (!story) {
      throw new Error(
        `Cannot find built fixture ${override?.storyId ?? "(default)"} for ${component.tag} in ${source}`
      );
    }
    const setupButtons = override?.setupButtons ?? [];
    if (
      !Array.isArray(setupButtons) ||
      setupButtons.some((name) => typeof name !== "string" || !name.trim())
    ) {
      throw new Error(`Invalid setup buttons for ${component.tag}`);
    }
    return { tag: component.tag, storyId: story.id, source: component.files.story, setupButtons };
  });
}
