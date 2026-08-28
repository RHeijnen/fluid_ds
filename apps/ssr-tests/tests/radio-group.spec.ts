import { test, expect, type Page } from "@playwright/test";
import { attachWarningOccurrences, captureErrors } from "./browser-console.js";

declare global {
  interface Window {
    radioEvents: {
      value: string;
      data: [string, FormDataEntryValue][];
      origin: string;
      bubbles: boolean;
      composed: boolean;
    }[];
  }
}

const actions = [
  { name: "Native submit", keyboard: false, submitter: "native-submit" },
  { name: "Fluid submit", keyboard: true, submitter: null },
  { name: "Fluid submit", keyboard: false, submitter: null },
  { name: "Native submit", keyboard: true, submitter: "native-submit" }
] as const;

test.afterEach(async ({ page }, testInfo) => {
  await attachWarningOccurrences(page, testInfo);
});

async function activate(page: Page, action: (typeof actions)[number]) {
  const button = page.getByRole("button", { name: action.name, exact: true });
  if (!action.keyboard) await button.click();
  else {
    await button.focus();
    await page.keyboard.press("Enter");
  }
}

async function openRadioGroup(page: Page, mode: string) {
  const errors = captureErrors(page);
  const response = await page.goto(`/form-focus/radio-group/${mode}`);
  const markup = await response!.text();
  expect(markup.includes('shadowrootmode="open"')).toBe(mode === "dsd");
  await page.waitForFunction(
    () => window.formFocusFixture?.ready || window.formFocusFixture?.error
  );
  expect(await page.evaluate(() => window.formFocusFixture.error)).toBeNull();
  expect(await page.evaluate(() => window.formFocusFixture.initialShadowRoots)).toBe(
    mode === "dsd" ? 2 : 0
  );
  await page.evaluate(() => {
    window.radioEvents = [];
    document.querySelector("#field")!.addEventListener("fluid-change", (event) => {
      window.radioEvents.push({
        value: (event as CustomEvent<{ value: string }>).detail.value,
        data: [...new FormData(document.querySelector<HTMLFormElement>("#native-form")!)],
        origin: (event.composedPath()[0] as Element).localName,
        bubbles: event.bubbles,
        composed: event.composed
      });
    });
  });
  return {
    errors,
    field: page.locator("#field"),
    disabled: page.locator('#field fluid-radio[value="unavailable"]'),
    standard: page.locator('#field fluid-radio[value="standard"]'),
    express: page.locator('#field fluid-radio[value="express"]')
  };
}

for (const mode of ["client", "dsd"] as const) {
  test(
    `radio-group ${mode}: native and custom validation focus the selected or first enabled radio`,
    { tag: "@radio-focus" },
    async ({ page }) => {
      const { errors, field, disabled, standard, express } = await openRadioGroup(page, mode);
      await expect(disabled).toBeDisabled();
      await expect(disabled).toHaveAttribute("tabindex", "-1");
      await expect(standard).toHaveAttribute("tabindex", "0");
      for (const [index, action] of actions.entries()) {
        await activate(page, action);
        await expect(standard).toBeFocused();
        expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(index + 1);
        expect(await page.evaluate(() => window.formFocusFixture.submissions)).toEqual([]);
      }
      await express.click();
      await expect(express).toBeFocused();
      await field.evaluate((host) =>
        (host as HTMLElement & { setCustomValidity(message: string): void }).setCustomValidity(
          "Application correction"
        )
      );
      await activate(page, actions[0]);
      await expect(express).toBeFocused();
      expect(
        await field.evaluate((host) => {
          const group = host as HTMLElement & { validity: ValidityState; validationMessage: string };
          return [group.validity.customError, group.validationMessage];
        })
      ).toEqual([true, "Application correction"]);
      await field.evaluate((host) =>
        (host as HTMLElement & { setCustomValidity(message: string): void }).setCustomValidity("")
      );
      for (const action of actions) await activate(page, action);
      expect(await page.evaluate(() => window.formFocusFixture.submissions.slice(-4))).toEqual(
        actions.map(({ submitter }) => ({ submitter, data: [["answer", "express"]] }))
      );
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `radio-group ${mode}: pointer and keyboard selection synchronize roving focus, events and FormData`,
    { tag: "@radio-focus" },
    async ({ page }) => {
      const { errors, standard, express } = await openRadioGroup(page, mode);
      await standard.focus();
      await page.keyboard.press("Space");
      await expect(standard).toHaveAttribute("aria-checked", "true");
      await page.keyboard.press("ArrowDown");
      await expect(express).toBeFocused();
      await expect(express).toHaveAttribute("aria-checked", "true");
      await page.keyboard.press("ArrowDown");
      await expect(standard).toBeFocused();
      await expect(standard).toHaveAttribute("aria-checked", "true");
      await express.click();
      expect(await page.evaluate(() => window.radioEvents)).toEqual(
        ["standard", "express", "standard", "express"].map((value) => ({
          value,
          data: [["answer", value]],
          origin: "fluid-radio-group",
          bubbles: true,
          composed: true
        }))
      );
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `radio-group ${mode}: selected-option mutation, reset and fieldset disable preserve semantics`,
    { tag: "@radio-focus" },
    async ({ page }) => {
      const { errors, field, disabled, standard, express } = await openRadioGroup(page, mode);
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      await express.click();
      await express.evaluate((radio) => radio.setAttribute("disabled", ""));
      await expect.poll(() => field.evaluate((host) => (host as HTMLElement & { value: string }).value)).toBe("");
      expect(
        await page
          .locator("#native-form")
          .evaluate((form) => [...new FormData(form as HTMLFormElement)])
      ).toEqual([]);
      await expect(standard).toHaveAttribute("tabindex", "0");
      await standard.click();
      await standard.evaluate((radio) => radio.remove());
      await expect.poll(() => field.evaluate((host) => (host as HTMLElement & { value: string }).value)).toBe("");
      await page.locator("#field-shell").evaluate((fieldset) => {
        (fieldset as HTMLFieldSetElement).disabled = true;
      });
      await expect(express).toBeDisabled();
      await page.locator("#field-shell").evaluate((fieldset) => {
        (fieldset as HTMLFieldSetElement).disabled = false;
      });
      await expect(disabled).toBeDisabled();
      await expect(express).toBeDisabled();
      await page.locator("#native-form").evaluate((form) => (form as HTMLFormElement).reset());
      expect(
        await page
          .locator("#native-form")
          .evaluate((form) => [...new FormData(form as HTMLFormElement)])
      ).toEqual([]);
      await activate(page, actions[0]);
      await expect(field).toBeFocused();
      await expect(disabled).not.toBeFocused();
      expect(errors).toEqual([]);
    }
  );
}
