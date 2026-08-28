import { test, expect } from "@playwright/test";
import { catalog } from "../.generated/catalog.js";
import { prepareVisualFixture } from "../fixtures/fixture-helpers.js";

// Fixture health checks never create images or approve visual baselines.
test.use({ screenshot: "off", trace: "off" });
for (const tag of [
  "fluid-bubble-chart",
  "fluid-toast-item",
  "fluid-col",
  "fluid-option",
  "fluid-mutation-observer"
]) {
  const fixture = catalog.find((entry) => [...entry.tags].some((candidate) => candidate === tag));
  if (!fixture) throw new Error(`No positive visual fixture for ${tag}`);
  test(`positive visual fixture prepares ${tag}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/iframe.html?id=${fixture.id}&viewMode=story`);
    const guard = await prepareVisualFixture(page, fixture);
    try {
      await guard.assertAttached();
      expect(fixture.tags).toContain(tag);
      expect(errors).toEqual([]);
    } finally {
      await guard.dispose();
    }
  });
}
