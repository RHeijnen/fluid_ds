import { test, expect, type Page } from "@playwright/test";
import { attachWarningOccurrences, captureErrors } from "./browser-console.js";

declare global {
  interface Window {
    otpEvents: {
      type: string;
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

async function openOtp(page: Page, mode: string) {
  const errors = captureErrors(page);
  const response = await page.goto(`/form-focus/otp/${mode}`);
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
    window.otpEvents = [];
    const field = document.querySelector("#field")!;
    for (const type of ["fluid-input", "fluid-complete"]) {
      field.addEventListener(type, (event) => {
        window.otpEvents.push({
          type,
          value: (event as CustomEvent<{ value: string }>).detail.value,
          data: [...new FormData(document.querySelector<HTMLFormElement>("#native-form")!)],
          origin: (event.composedPath()[0] as Element).localName,
          bubbles: event.bubbles,
          composed: event.composed
        });
      });
    }
  });
  return {
    errors,
    markup,
    field: page.locator("#field"),
    boxes: page.locator("#field .box")
  };
}

const event = (type: string, value: string) => ({
  type,
  value,
  data: value ? [["answer", value]] : [],
  origin: "fluid-otp",
  bubbles: true,
  composed: true
});

for (const mode of ["client", "dsd"] as const) {
  test(
    `otp ${mode}: empty and partial native validation focus the first missing box`,
    { tag: "@otp-focus" },
    async ({ page }) => {
      const { errors, markup, field, boxes } = await openOtp(page, mode);
      await expect(boxes).toHaveCount(4);
      for (const [index, action] of actions.entries()) {
        await activate(page, action);
        await expect(boxes.nth(0)).toBeFocused();
        expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(index + 1);
        expect(await page.evaluate(() => window.formFocusFixture.submissions)).toEqual([]);
      }
      expect(await field.evaluate((host) => host.shadowRoot?.delegatesFocus)).toBe(true);
      if (mode === "dsd")
        expect(markup.match(/<fluid-otp[^>]*id="field"[^>]*>\s*<template([^>]*)>/)?.[1]).toContain(
          "shadowrootdelegatesfocus"
        );

      await boxes.nth(0).fill("1");
      await expect(boxes.nth(1)).toBeFocused();
      await activate(page, actions[0]);
      await expect(boxes.nth(1)).toBeFocused();
      expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(5);

      await field.evaluate(async (host) => {
        (host as HTMLElement & { setCustomValidity(message: string): void }).setCustomValidity(
          "Application correction"
        );
        host.setAttribute("lang", "nl");
        await new Promise((resolve) => setTimeout(resolve, 0));
        await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
      });
      await activate(page, actions[3]);
      await expect(boxes.nth(1)).toBeFocused();
      expect(
        await field.evaluate((host) => {
          const control = host as HTMLElement & {
            validity: ValidityState;
            validationMessage: string;
          };
          return [control.validity.customError, control.validationMessage];
        })
      ).toEqual([true, "Application correction"]);
      await field.evaluate((host) =>
        (host as HTMLElement & { setCustomValidity(message: string): void }).setCustomValidity("")
      );
      await boxes.nth(1).pressSequentially("234");
      await expect.poll(() => field.evaluate((host) => (host as HTMLElement & { value: string }).value)).toBe("1234");
      for (const action of actions) await activate(page, action);
      expect(await page.evaluate(() => window.formFocusFixture.submissions)).toEqual(
        actions.map(({ submitter }) => ({ submitter, data: [["answer", "1234"]] }))
      );
      await page.locator("#native-form").evaluate((form) => (form as HTMLFormElement).reset());
      await expect(boxes.nth(0)).toHaveValue("");
      expect(await page.evaluate(() => window.otpEvents.at(-1)?.value)).toBe("1234");
      await activate(page, actions[0]);
      await expect(boxes.nth(0)).toBeFocused();
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `otp ${mode}: typing, Backspace and native paste synchronize canonical events and form data`,
    { tag: "@otp-focus" },
    async ({ page }) => {
      const { errors, boxes } = await openOtp(page, mode);
      await boxes.nth(0).pressSequentially("12");
      await expect(boxes.nth(2)).toBeFocused();
      await page.keyboard.press("Backspace");
      await expect(boxes.nth(1)).toBeFocused();
      await expect(boxes.nth(1)).toHaveValue("");

      await page.evaluate(() => {
        const source = document.createElement("input");
        source.id = "otp-copy-source";
        source.value = "468";
        document.body.append(source);
        source.focus();
        source.select();
      });
      await page.keyboard.press("ControlOrMeta+c");
      await boxes.nth(1).focus();
      await page.keyboard.press("ControlOrMeta+v");
      await expect.poll(() => page.locator("#field").evaluate((host) => (host as HTMLElement & { value: string }).value)).toBe("1468");
      await expect(boxes.nth(3)).toBeFocused();
      expect(await page.evaluate(() => window.otpEvents.slice(-2))).toEqual([
        event("fluid-input", "1468"),
        event("fluid-complete", "1468")
      ]);
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `otp ${mode}: length changes, disabled state and reconnect retain form semantics`,
    { tag: "@otp-focus" },
    async ({ page }) => {
      const { errors, field, boxes } = await openOtp(page, mode);
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      await boxes.nth(0).pressSequentially("1234");
      await field.evaluate(async (host) => {
        const otp = host as HTMLElement & { length: number; updateComplete: Promise<boolean> };
        otp.length = 3;
        await otp.updateComplete;
      });
      await expect(boxes).toHaveCount(3);
      expect(
        await page
          .locator("#native-form")
          .evaluate((form) => [...new FormData(form as HTMLFormElement)])
      ).toEqual([["answer", "123"]]);
      await field.evaluate(async (host) => {
        host.setAttribute("disabled", "");
        await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
      });
      for (const box of await boxes.all()) await expect(box).toBeDisabled();
      await activate(page, actions[0]);
      expect(await page.evaluate(() => window.formFocusFixture.submissions.at(-1))).toEqual({
        submitter: "native-submit",
        data: []
      });
      await field.evaluate(async (host) => {
        host.removeAttribute("disabled");
        const parent = host.parentElement!;
        parent.removeChild(host);
        parent.append(host);
        await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
      });
      for (const box of await boxes.all()) await expect(box).toBeEnabled();
      await activate(page, actions[1]);
      expect(await page.evaluate(() => window.formFocusFixture.submissions.at(-1))).toEqual({
        submitter: null,
        data: [["answer", "123"]]
      });
      expect(errors).toEqual([]);
    }
  );
}
