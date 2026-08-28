import { test, expect } from "@playwright/test";
import { prepareFixture } from "./fixture-helpers.js";

const fixture = { tag: "fluid-probe", storyId: "fixture-contract", setupButtons: [] };

test("rejects an absent host even when the story root has content", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><button>Unrelated content</button></div>');
  await expect(prepareFixture(page, fixture, 100)).rejects.toThrow(/must render fluid-probe/);
});

test("rejects an unregistered custom element", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><fluid-probe></fluid-probe></div>');
  await expect(prepareFixture(page, fixture, 100)).rejects.toThrow(/must be upgraded/);
});

test("accepts an upgraded hidden utility", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><fluid-probe hidden></fluid-probe></div>');
  await page.evaluate(() => customElements.define("fluid-probe", class extends HTMLElement {}));
  await expect(await prepareFixture(page, fixture)).toBeHidden();
});

test("finds an upgraded child in a shadow root", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><div id="parent"></div></div>');
  await page.evaluate(() => {
    customElements.define("fluid-probe", class extends HTMLElement {});
    document.querySelector("#parent")!.attachShadow({ mode: "open" }).innerHTML =
      "<fluid-probe></fluid-probe>";
  });
  await expect(await prepareFixture(page, fixture)).toBeAttached();
});

test("performs a named user action before checking transient content", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><button>Show notification</button></div>');
  await page.evaluate(() => {
    customElements.define("fluid-probe", class extends HTMLElement {});
    document.querySelector("button")!.addEventListener("click", () => {
      document.querySelector("#storybook-root")!.appendChild(document.createElement("fluid-probe"));
    });
  });
  await expect(
    await prepareFixture(page, { ...fixture, setupButtons: ["Show notification"] })
  ).toBeAttached();
});

test("rejects setup that never creates its advertised element", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><button>Show notification</button></div>');
  await expect(
    prepareFixture(page, { ...fixture, setupButtons: ["Show notification"] }, 1000)
  ).rejects.toThrow(/must render fluid-probe/);
});
