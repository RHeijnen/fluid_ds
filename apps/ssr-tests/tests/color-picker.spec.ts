import { test, expect, type Page } from "@playwright/test";
import { attachWarningOccurrences, captureErrors } from "./browser-console.js";

declare global {
  interface Window {
    colorEvents: {
      type: string;
      value: string;
      origin: string;
      bubbles: boolean;
      composed: boolean;
    }[];
  }
}

test.afterEach(async ({ page }, testInfo) => {
  await attachWarningOccurrences(page, testInfo);
});

async function openColor(page: Page, mode: string) {
  const errors = captureErrors(page);
  await page.goto(`/form-focus/color-picker/${mode}`);
  await page.waitForFunction(
    () => window.formFocusFixture?.ready || window.formFocusFixture?.error
  );
  expect(await page.evaluate(() => window.formFocusFixture.error)).toBeNull();
  await page.evaluate(() => {
    window.colorEvents = [];
    for (const type of ["fluid-input", "fluid-change"]) {
      document.querySelector("#field")!.addEventListener(type, (event) => {
        window.colorEvents.push({
          type: event.type,
          value: (event as CustomEvent<{ value: string }>).detail.value,
          origin: (event.composedPath()[0] as Element).localName,
          bubbles: event.bubbles,
          composed: event.composed
        });
      });
    }
  });
  return { errors, field: page.locator("#field"), input: page.locator("#field fluid-input input") };
}

const colorEvent = (type: string, value: string) => ({
  type,
  value,
  origin: "fluid-color-picker",
  bubbles: true,
  composed: true
});

for (const mode of ["client", "dsd"]) {
  test(
    `color-picker ${mode}: canonical events occur once per edit and commit`,
    { tag: "@color-focus" },
    async ({ page }) => {
      const { errors, field, input } = await openColor(page, mode);
      await input.fill("ff00aa");
      await expect(input).toHaveValue("#ff00aa");
      expect(await page.evaluate(() => window.colorEvents)).toEqual([
        colorEvent("fluid-input", "#ff00aa")
      ]);
      await page.getByRole("button", { name: "Native submit", exact: true }).focus();
      expect(await page.evaluate(() => window.colorEvents)).toEqual([
        colorEvent("fluid-input", "#ff00aa"),
        colorEvent("fluid-change", "#ff00aa")
      ]);
      await input.focus();
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => window.colorEvents.length)).toBe(2);
      await field.getByRole("option", { name: "#00ff00", exact: true }).click();
      await expect(input).toHaveValue("#00ff00");
      expect(await page.evaluate(() => window.colorEvents)).toEqual([
        colorEvent("fluid-input", "#ff00aa"),
        colorEvent("fluid-change", "#ff00aa"),
        colorEvent("fluid-input", "#00ff00"),
        colorEvent("fluid-change", "#00ff00")
      ]);
      await field.getByRole("option", { name: "#ff0000", exact: true }).focus();
      await page.keyboard.press("Space");
      await expect(input).toHaveValue("#ff0000");
      expect(await page.evaluate(() => window.colorEvents.slice(4))).toEqual([
        colorEvent("fluid-input", "#ff0000"),
        colorEvent("fluid-change", "#ff0000")
      ]);
      await page.locator("#native-form").evaluate((form) => (form as HTMLFormElement).reset());
      await expect(input).toHaveValue("");
      expect(await page.evaluate(() => window.colorEvents.length)).toBe(6);
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `color-picker ${mode}: disabled controls cannot change values and reconnect retains native validation`,
    { tag: "@color-focus" },
    async ({ page }) => {
      const { errors, field, input } = await openColor(page, mode);
      await field.evaluate(async (host) => {
        host.setAttribute("disabled", "");
        await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
      });
      await expect(input).toBeDisabled();
      await expect(field.locator('[part="swatch"]')).toBeDisabled();
      await expect(field.locator('input[type="color"]')).toBeDisabled();
      await expect(field.getByRole("option")).toHaveCount(2);
      for (const preset of await field.getByRole("option").all())
        await expect(preset).toBeDisabled();
      await page.getByRole("button", { name: "Native submit", exact: true }).click();
      expect(await page.evaluate(() => window.formFocusFixture.submissions)).toEqual([
        { submitter: "native-submit", data: [] }
      ]);
      expect(await page.evaluate(() => window.colorEvents)).toEqual([]);
      await field.evaluate(async (host) => {
        host.removeAttribute("disabled");
        const parent = host.parentElement!;
        host.remove();
        parent.append(host);
        await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
      });
      await expect(input).toBeEnabled();
      await input.fill("#not-hex");
      await page.getByRole("button", { name: "Native submit", exact: true }).click();
      await expect(input).toBeFocused();
      expect(
        await field.evaluate(
          (host) => (host as HTMLElement & { validity: ValidityState }).validity.patternMismatch
        )
      ).toBe(true);
      expect(await page.evaluate(() => window.formFocusFixture.submissions.length)).toBe(1);
      await input.fill("#abc");
      await page.getByRole("button", { name: "Fluid submit", exact: true }).focus();
      await page.keyboard.press("Enter");
      expect(await page.evaluate(() => window.formFocusFixture.submissions.at(-1))).toEqual({
        submitter: null,
        data: [["answer", "#abc"]]
      });
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );
}
