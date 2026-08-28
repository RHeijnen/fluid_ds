import { test, expect, type Locator, type Page } from "@playwright/test";
import { attachWarningOccurrences, captureErrors } from "./browser-console.js";

type SchedulerHost = HTMLElement & {
  value: string;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  bookings: { start: string }[];
  readonly validationMessage: string;
  readonly validity: ValidityState;
  formStateRestoreCallback(state: string, mode: "restore" | "autocomplete"): void;
};

declare global {
  interface Window {
    schedulerEvents: {
      value: string;
      start: string;
      end: string;
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

async function openScheduler(page: Page, mode: string) {
  const errors = captureErrors(page);
  const response = await page.goto(`/form-focus/scheduler/${mode}`);
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
    window.schedulerEvents = [];
    document.querySelector("#field")!.addEventListener("fluid-change", (event) => {
      const detail = (event as CustomEvent<{ value: string; start: string; end: string }>).detail;
      window.schedulerEvents.push({
        value: detail.value,
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

async function selectFutureDay(field: Locator) {
  const day = field
    .locator("fluid-calendar")
    .locator("button.day:not(:disabled)")
    .last();
  await day.click();
  await expect(field.locator("fluid-time-slots")).toBeVisible();
  return field.locator("fluid-time-slots button.slot:not(:disabled)").first();
}

async function deepActiveClass(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active?.getAttribute("class") ?? active?.localName ?? null;
  });
}

for (const mode of ["client", "dsd"] as const) {
  test(
    `scheduler ${mode}: validation focus follows the correction target and localizes live`,
    { tag: "@scheduler-focus" },
    async ({ page }) => {
      const { errors, field } = await openScheduler(page, mode);
      await activate(page, actions[0]);
      await expect.poll(() => deepActiveClass(page)).toMatch(/day/);
      expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(1);
      // Firefox keeps its native validation bubble modal until dismissed; the
      // first pointer click otherwise closes the bubble without activating a day.
      // Continue from the correction target by keyboard and choose tomorrow.
      await page.keyboard.press("Escape");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await expect(field.locator("fluid-time-slots")).toBeVisible();
      const firstSlot = field.locator("fluid-time-slots button.slot:not(:disabled)").first();
      await activate(page, actions[0]);
      await expect(firstSlot).toBeFocused();
      await field.evaluate((host) => host.setAttribute("lang", "nl"));
      await expect
        .poll(() => field.evaluate((host) => (host as SchedulerHost).validationMessage))
        .toBe("Kies een afspraak.");
      await field.evaluate((host) =>
        (host as HTMLElement & { setCustomValidity(message: string): void }).setCustomValidity(
          "Choose an approved slot"
        )
      );
      await activate(page, actions[0]);
      await expect(firstSlot).toBeFocused();
      expect(await field.evaluate((host) => (host as SchedulerHost).validationMessage)).toBe(
        "Choose an approved slot"
      );
      await field.evaluate((host) =>
        (host as HTMLElement & { setCustomValidity(message: string): void }).setCustomValidity("")
      );
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `scheduler ${mode}: actual day and slot selection synchronizes events, FormData and reset`,
    { tag: "@scheduler-focus" },
    async ({ page }) => {
      const { errors, field } = await openScheduler(page, mode);
      const firstSlot = await selectFutureDay(field);
      await firstSlot.click();
      const selected = await field.evaluate((host) => (host as SchedulerHost).value);
      expect(selected).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(await page.evaluate(() => window.schedulerEvents)).toEqual([
        expect.objectContaining({
          value: selected,
          start: selected,
          data: [["answer", selected]],
          bubbles: true,
          composed: true
        })
      ]);
      for (const action of actions) await activate(page, action);
      expect(await page.evaluate(() => window.formFocusFixture.submissions.slice(-4))).toEqual(
        actions.map(({ submitter }) => ({ submitter, data: [["answer", selected]] }))
      );
      await page.locator("#native-form").evaluate((form) => (form as HTMLFormElement).reset());
      expect(
        await page.locator("#native-form").evaluate((form) => [...new FormData(form as HTMLFormElement)])
      ).toEqual([]);
      await expect(field.locator('[part="prompt"]')).toContainText("Select a day");
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `scheduler ${mode}: restored and externally-booked slots preserve inert-state and node contracts`,
    { tag: "@scheduler-focus" },
    async ({ page }) => {
      const { errors, field } = await openScheduler(page, mode);
      const firstSlot = await selectFutureDay(field);
      await firstSlot.click();
      const selected = await field.evaluate((host) => (host as SchedulerHost).value);
      for (const state of ["disabled", "readonly", "loading"] as const) {
        await field.evaluate((host, key) => ((host as SchedulerHost)[key] = true), state);
        await field.evaluate((host, start) => {
          host.shadowRoot!.querySelector("fluid-time-slots")!.dispatchEvent(
            new CustomEvent("fluid-change", {
              detail: {
                slot: { start, end: start, state: "available", remaining: 1 }
              },
              bubbles: true,
              composed: true
            })
          );
        }, selected);
        expect(await field.evaluate((host) => (host as SchedulerHost).value)).toBe(selected);
        await field.evaluate((host, key) => ((host as SchedulerHost)[key] = false), state);
      }
      await field.evaluate((host, start) => {
        (host as SchedulerHost).bookings = [{ start }];
      }, selected);
      await expect
        .poll(() => field.evaluate((host) => (host as SchedulerHost).validity.customError))
        .toBe(true);
      await activate(page, actions[0]);
      await expect(field.locator("fluid-time-slots button.slot.selected")).toBeFocused();
      await field.evaluate((host) => {
        const scheduler = host as SchedulerHost;
        scheduler.bookings = [];
        scheduler.formStateRestoreCallback("2035-06-18T10:00", "restore");
      });
      await expect.poll(() => field.evaluate((host) => (host as SchedulerHost).value)).toBe(
        "2035-06-18T10:00"
      );
      await field.evaluate((host) => {
        const parent = host.parentNode!;
        host.remove();
        parent.append(host);
      });
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );
}
