/** Verify that a catalog-to-story mapping actually renders the named element. */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const root = new URL("../", import.meta.url);
const require = createRequire(new URL("apps/a11y/package.json", root));
const { chromium } = require("@playwright/test");
const source = await readFile(new URL("apps/a11y/.generated/catalog.ts", root), "utf8");
const catalog = JSON.parse(source.slice(source.indexOf("["), source.lastIndexOf("]") + 1));
const baseURL = process.argv[2] ?? "http://127.0.0.1:6010";
const stories = new Map();
for (const fixture of catalog) {
  if (!stories.has(fixture.storyId)) stories.set(fixture.storyId, []);
  stories.get(fixture.storyId).push(fixture);
}
const browser = await chromium.launch();
const missing = [];
try {
  const page = await browser.newPage();
  for (const [storyId, fixtures] of stories) {
    await page.goto(`${baseURL}/iframe.html?id=${storyId}&viewMode=story`);
    await page.locator("#storybook-root > *").first().waitFor({ state: "attached" });
    for (const { tag, setupButtons = [] } of fixtures) {
      for (const name of setupButtons) {
        await page.locator("#storybook-root").getByRole("button", { name, exact: true }).click();
      }
      const attached = await page
        .locator(`#storybook-root ${tag}`)
        .first()
        .waitFor({ state: "attached", timeout: 3000 })
        .then(
          () => true,
          () => false
        );
      if (!attached) {
        missing.push({ tag, storyId });
      }
    }
  }
  console.log(
    JSON.stringify(
      { browser: browser.version(), elements: catalog.length, stories: stories.size, missing },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
if (missing.length) process.exitCode = 1;
