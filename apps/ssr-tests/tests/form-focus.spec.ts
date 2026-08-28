import { test, expect, type Page } from "@playwright/test";
import { attachWarningOccurrences, captureErrors } from "./browser-console.js";

test.afterEach(async ({ page }, testInfo) => {
  await attachWarningOccurrences(page, testInfo);
});

const names = [
  "input",
  "checkbox",
  "switch",
  "textarea",
  "number-input",
  "typeahead",
  "masked-input",
  "select",
  "time-picker",
  "date-picker",
  "color-picker"
] as const;
const activations = [
  { name: "Native submit", kind: "pointer", submitter: "native-submit" },
  { name: "Fluid submit", kind: "keyboard", submitter: null },
  { name: "Fluid submit", kind: "pointer", submitter: null },
  { name: "Native submit", kind: "keyboard", submitter: "native-submit" }
] as const;

async function activate(page: Page, action: (typeof activations)[number]): Promise<void> {
  const button = page.getByRole("button", { name: action.name, exact: true });
  if (action.kind === "pointer") await button.click();
  else {
    await button.focus();
    await page.keyboard.press("Enter");
  }
}

for (const name of names) {
  for (const mode of ["client", "dsd"] as const) {
    test(
      `fluid-${name} ${mode}: native validation focuses the field and submits real edited values`,
      {
        tag:
          name === "color-picker"
            ? "@color-focus"
            : name === "date-picker"
              ? "@date-focus"
              : name === "masked-input" || name === "select" || name === "time-picker"
                ? "@composite-focus"
                : "@basic-focus"
      },
      async ({ page, request }) => {
        const errors = captureErrors(page);
        const path = `/form-focus/${name}/${mode}`;
        const response = await request.get(path);
        expect(response.ok()).toBe(true);
        const markup = await response.text();
        expect(markup.includes('shadowrootmode="open"')).toBe(mode === "dsd");
        await page.goto(path);
        await page.waitForFunction(
          () => window.formFocusFixture?.ready || window.formFocusFixture?.error
        );
        expect(await page.evaluate(() => window.formFocusFixture.error)).toBeNull();
        expect(await page.evaluate(() => window.formFocusFixture.initialShadowRoots)).toBe(
          mode === "dsd" ? 2 : 0
        );
        const field = page.locator("#field");
        const control = field.locator(
          name === "color-picker"
            ? "fluid-input input"
            : name === "select"
              ? 'button[part="trigger"]'
              : name === "textarea"
                ? "textarea"
                : "input"
        );
        const toggled = name === "checkbox" || name === "switch";
        expect(
          await field.evaluate(
            (host) => (host as HTMLElement & { validity: ValidityState }).validity.valueMissing
          )
        ).toBe(true);

        for (const [index, action] of activations.entries()) {
          await test.step(`invalid ${action.name} ${action.kind}`, async () => {
            await activate(page, action);
            await expect(control).toBeFocused();
            expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(
              index + 1
            );
            expect(await page.evaluate(() => window.formFocusFixture.submissions)).toEqual([]);
          });
        }
        expect(await field.evaluate((host) => host.shadowRoot?.delegatesFocus)).toBe(true);
        if (mode === "dsd") {
          const template = markup.match(
            new RegExp(`<fluid-${name}[^>]*id="field"[^>]*>\\s*<template([^>]*)>`)
          );
          expect(template?.[1]).toContain("shadowrootdelegatesfocus");
        }

        let answer: string;
        if (toggled) {
          // Validation left the native checkbox focused. Use real keyboard input.
          await page.keyboard.press("Space");
          await expect(control).toBeChecked();
          answer = "accepted";
        } else if (name === "color-picker") {
          await expect(control).toHaveAccessibleName("Accent hex");
          await control.fill("ff00aa");
          await page.keyboard.press("Tab");
          await expect(control).toHaveValue("#ff00aa");
          answer = "#ff00aa";
        } else if (name === "masked-input") {
          await control.fill("1234");
          await expect(control).toHaveValue("12/34");
          expect(
            await field.evaluate(
              (host) => (host as HTMLElement & { unmaskedValue: string }).unmaskedValue
            )
          ).toBe("1234");
          answer = "12/34";
        } else if (name === "select") {
          await page.keyboard.press("ArrowDown");
          await expect(control).toHaveAttribute("aria-expanded", "true");
          await page.keyboard.press("Enter");
          await expect(control).toHaveAttribute("aria-expanded", "false");
          expect(
            await page
              .locator("#native-form")
              .evaluate((form) => [...new FormData(form as HTMLFormElement)])
          ).toEqual([["answer", "apple"]]);
          await control.click();
          await field.getByRole("option", { name: "Banana", exact: true }).click();
          await expect(control).toHaveAttribute("aria-expanded", "false");
          answer = "banana";
        } else if (name === "time-picker") {
          await control.fill("9:30 AM");
          await page.keyboard.press("Enter");
          await expect(control).toHaveAttribute("aria-expanded", "false");
          await expect(control).toHaveValue("9:30 AM");
          answer = "09:30";
        } else if (name === "date-picker") {
          expect(
            await field.evaluate((host) => (host as HTMLElement & { value: string | null }).value)
          ).toBeNull();
          expect(await page.evaluate(() => window.formFocusFixture.dateChanges)).toEqual([]);
          await control.fill("2026-08-26");
          await page.keyboard.press("Tab");
          await expect(control).toHaveValue("2026-08-26");
          await expect
            .poll(() => page.evaluate(() => window.formFocusFixture.dateChanges.length))
            .toBeGreaterThan(0);
          const change = await page.evaluate(() => window.formFocusFixture.dateChanges.at(-1));
          const timestamp = await page.evaluate(() => new Date(2026, 7, 26).getTime());
          expect(change).toEqual({
            value: "2026-08-26",
            dateParts: [2026, 8, 26],
            dateTimestamp: timestamp,
            timestamp,
            bubbles: true,
            composed: true
          });
          const committedEvents = await page.evaluate(
            () => window.formFocusFixture.dateChanges.length
          );
          await control.fill("2026-09-15");
          await page.keyboard.press("Tab");
          await expect(control).toHaveValue("2026-08-26");
          expect(await page.evaluate(() => window.formFocusFixture.dateChanges.length)).toBe(
            committedEvents
          );
          expect(
            await field.evaluate((host) => (host as HTMLElement & { value: string | null }).value)
          ).toBe("2026-08-26");
          answer = "2026-08-26";
        } else {
          await control.fill(name === "number-input" ? "7" : "A valid answer");
          if (name === "typeahead") await page.keyboard.press("Escape");
          answer = name === "number-input" ? "7" : "A valid answer";
        }
        await expect
          .poll(() =>
            field.evaluate(
              (host) => (host as HTMLElement & { validity: ValidityState }).validity.valid
            )
          )
          .toBe(true);
        expect(
          await page
            .locator("#native-form")
            .evaluate((form) => [...new FormData(form as HTMLFormElement)])
        ).toEqual([["answer", answer]]);

        if (
          name === "color-picker" ||
          name === "masked-input" ||
          name === "select" ||
          name === "time-picker" ||
          name === "date-picker"
        ) {
          await field.evaluate((host) =>
            (host as HTMLElement & { setCustomValidity(message: string): void }).setCustomValidity(
              "Application correction"
            )
          );
          await activate(page, activations[0]);
          await expect(control).toBeFocused();
          expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(5);
          expect(await page.evaluate(() => window.formFocusFixture.submissions)).toEqual([]);
          await field.evaluate(async (host) => {
            (host as HTMLElement).lang = "nl";
            await new Promise((resolve) => setTimeout(resolve, 0));
            await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
          });
          expect(
            await field.evaluate((host) => {
              const control = host as HTMLElement & {
                validity: ValidityState;
                validationMessage: string;
              };
              return [control.validity.customError, control.validationMessage];
            })
          ).toEqual([true, "Application correction"]);
          await activate(page, activations[3]);
          await expect(control).toBeFocused();
          expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(6);
          expect(await page.evaluate(() => window.formFocusFixture.submissions)).toEqual([]);
          await field.evaluate((host) =>
            (host as HTMLElement & { setCustomValidity(message: string): void }).setCustomValidity(
              ""
            )
          );
          expect(
            await field.evaluate(
              (host) => (host as HTMLElement & { validity: ValidityState }).validity.valid
            )
          ).toBe(true);
          expect(
            await page
              .locator("#native-form")
              .evaluate((form) => [...new FormData(form as HTMLFormElement)])
          ).toEqual([["answer", answer]]);
        }

        for (const [index, action] of activations.entries()) {
          await test.step(`valid ${action.name} ${action.kind}`, async () => {
            await activate(page, action);
            await expect
              .poll(() => page.evaluate(() => window.formFocusFixture.submissions.length))
              .toBe(index + 1);
            expect(await page.evaluate(() => window.formFocusFixture.submissions.at(-1))).toEqual({
              submitter: action.submitter,
              data: [["answer", answer]]
            });
          });
        }
        if (
          name === "color-picker" ||
          name === "masked-input" ||
          name === "select" ||
          name === "time-picker" ||
          name === "date-picker"
        ) {
          const dateEventsBeforeReset =
            name === "date-picker"
              ? await page.evaluate(() => window.formFocusFixture.dateChanges.length)
              : null;
          await page.locator("#native-form").evaluate((form) => (form as HTMLFormElement).reset());
          await expect
            .poll(() =>
              field.evaluate(
                (host) => (host as HTMLElement & { validity: ValidityState }).validity.valueMissing
              )
            )
            .toBe(true);
          expect(
            await page
              .locator("#native-form")
              .evaluate((form) => new FormData(form as HTMLFormElement).get("answer"))
          ).toBe(name === "time-picker" || name === "date-picker" ? null : "");
          if (name === "select") {
            await expect(control).toHaveAttribute("aria-expanded", "false");
            await expect(field.locator("fluid-option[selected]")).toHaveCount(0);
          } else await expect(control).toHaveValue("");
          if (name === "date-picker") {
            expect(
              await field.evaluate((host) => (host as HTMLElement & { value: string | null }).value)
            ).toBeNull();
            await expect(control).toHaveAttribute("aria-expanded", "false");
            expect(await page.evaluate(() => window.formFocusFixture.dateChanges.length)).toBe(
              dateEventsBeforeReset
            );
          }
          await activate(page, activations[0]);
          await expect(control).toBeFocused();
          expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(7);
          expect(await page.evaluate(() => window.formFocusFixture.submissions.length)).toBe(4);
        }
        await page.evaluate(() => window.formFocusFixture.assertServerNodes());
        expect(errors).toEqual([]);
      }
    );
  }
}
