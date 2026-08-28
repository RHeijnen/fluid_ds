import { test, expect, type Page } from "@playwright/test";
import { attachWarningOccurrences, captureErrors } from "./browser-console.js";

type DateRangePickerHost = HTMLElement & {
  start: string | null;
  end: string | null;
};

declare global {
  interface Window {
    rangeEvents: {
      start: string | null;
      end: string | null;
      data: [string, FormDataEntryValue][];
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

async function openRange(page: Page, mode: string) {
  const errors = captureErrors(page);
  const response = await page.goto(`/form-focus/date-range-picker/${mode}`);
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
    window.rangeEvents = [];
    document.querySelector("#field")!.addEventListener("fluid-change", (event) => {
      const detail = (event as CustomEvent<{ start: string | null; end: string | null }>).detail;
      window.rangeEvents.push({
        start: detail.start,
        end: detail.end,
        data: [...new FormData(document.querySelector<HTMLFormElement>("#native-form")!)],
        bubbles: event.bubbles,
        composed: event.composed
      });
    });
  });
  return { errors, field: page.locator("#field") };
}

async function deepActivePart(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active?.getAttribute("part") ?? active?.getAttribute("class") ?? active?.localName ?? null;
  });
}

for (const mode of ["client", "dsd"] as const) {
  test(
    `date-range-picker ${mode}: native validation reveals and focuses the non-typeable chooser`,
    { tag: "@date-range-focus" },
    async ({ page }) => {
      const { errors, field } = await openRange(page, mode);
      for (const [index, action] of actions.entries()) {
        await activate(page, action);
        await expect(field).toHaveAttribute("open");
        await expect.poll(() => deepActivePart(page)).toMatch(/dialog|preset/);
        expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(index + 1);
        expect(await page.evaluate(() => window.formFocusFixture.submissions)).toEqual([]);
        await page.keyboard.press("Escape");
      }
      await field.evaluate((host) =>
        (host as HTMLElement & { setCustomValidity(message: string): void }).setCustomValidity(
          "Choose approved travel dates"
        )
      );
      await activate(page, actions[0]);
      await expect.poll(() => deepActivePart(page)).toMatch(/dialog|preset/);
      expect(
        await field.evaluate((host) => {
          const picker = host as HTMLElement & { validity: ValidityState; validationMessage: string };
          return [picker.validity.customError, picker.validationMessage];
        })
      ).toEqual([true, "Choose approved travel dates"]);
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `date-range-picker ${mode}: Cancel preserves and Apply atomically commits the draft range`,
    { tag: "@date-range-focus" },
    async ({ page }) => {
      const { errors, field } = await openRange(page, mode);
      await field.locator("input").focus();
      await expect(field).toHaveAttribute("open");
      await field
        .locator("fluid-calendar")
        .first()
        .locator("button.day:not(.outside):not(:disabled)")
        .first()
        .click();
      await expect(field.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
      await field.getByRole("button", { name: "Cancel", exact: true }).click();
      expect(
        await field.evaluate((host) => {
          const range = host as DateRangePickerHost;
          return [range.start, range.end];
        })
      ).toEqual([null, null]);
      expect(
        await page.locator("#native-form").evaluate((form) => [...new FormData(form as HTMLFormElement)])
      ).toEqual([]);
      expect(await page.evaluate(() => window.rangeEvents)).toEqual([]);

      await field.locator("button.trigger").click();
      await field.getByRole("button", { name: "Last 7 days", exact: true }).click();
      await field.getByRole("button", { name: "Apply", exact: true }).click();
      const committed = await field.evaluate((host) => {
        const range = host as DateRangePickerHost;
        return [range.start, range.end];
      });
      expect(committed[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(committed[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(await page.evaluate(() => window.rangeEvents)).toEqual([
        {
          start: committed[0],
          end: committed[1],
          data: [["answer", `${committed[0]}/${committed[1]}`]],
          bubbles: true,
          composed: true
        }
      ]);
      await expect(field.locator("input")).toBeFocused();
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `date-range-picker ${mode}: typeable input commits synchronously, restores, and retains server nodes`,
    { tag: "@date-range-focus" },
    async ({ page }) => {
      const { errors, field } = await openRange(page, mode);
      await field.evaluate((host) => host.setAttribute("typeable", ""));
      const input = field.locator("input");
      await input.fill("2026-08-10 to 2026-08-14");
      await input.press("Enter");
      await expect(input).toBeFocused();
      expect(await page.evaluate(() => window.rangeEvents)).toEqual([
        {
          start: "2026-08-10",
          end: "2026-08-14",
          data: [["answer", "2026-08-10/2026-08-14"]],
          bubbles: true,
          composed: true
        }
      ]);
      for (const action of actions) await activate(page, action);
      expect(await page.evaluate(() => window.formFocusFixture.submissions.slice(-4))).toEqual(
        actions.map(({ submitter }) => ({
          submitter,
          data: [["answer", "2026-08-10/2026-08-14"]]
        }))
      );
      await page.locator("#native-form").evaluate((form) => (form as HTMLFormElement).reset());
      await expect(input).toHaveValue("");
      expect(
        await page.locator("#native-form").evaluate((form) => [...new FormData(form as HTMLFormElement)])
      ).toEqual([]);
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );
}
