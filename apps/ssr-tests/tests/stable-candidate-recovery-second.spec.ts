import { expect, test, type Page } from "@playwright/test";
import { attachWarningOccurrences, captureErrors } from "./browser-console.js";

test.afterEach(async ({ page }, testInfo) => {
  await attachWarningOccurrences(page, testInfo);
});

async function openFixture(page: Page): Promise<string[]> {
  const errors = captureErrors(page);
  page.on("requestfailed", (request) =>
    errors.push(`request failed: ${request.url()} ${request.failure()?.errorText ?? ""}`)
  );
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  const response = await page.goto("/recovery.html", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await page.waitForFunction(() => window.fluidRecoveryReady === true);
  return errors;
}

async function expectUpgraded(page: Page, tags: string[]): Promise<void> {
  for (const tag of tags) {
    await expect
      .poll(() =>
        page.evaluate((name) => {
          const host = document.querySelector(name);
          const definition = customElements.get(name);
          return Boolean(host && definition && host instanceof definition && host.shadowRoot);
        }, tag)
      )
      .toBe(true);
  }
}

test("Select recovers selected option removal, validity and reconnect without duplicate form events", async ({
  page
}) => {
  const errors = await openFixture(page);
  await page.evaluate(() => {
    const root = document.querySelector("#recovery-root")!;
    root.innerHTML = `<form id="select-form"><fluid-select id="candidate-select" name="choice" value="beta" required aria-label="Choice">
      <fluid-option value="alpha">Alpha</fluid-option>
      <fluid-option value="beta">Beta</fluid-option>
      <fluid-option value="blocked" disabled>Blocked</fluid-option>
    </fluid-select></form>`;
    const host = document.querySelector("#candidate-select")!;
    const events: string[] = [];
    host.addEventListener("fluid-change", (event) =>
      events.push((event as CustomEvent<{ value: string }>).detail.value)
    );
    window.selectEvents = events;
  });
  await expectUpgraded(page, ["fluid-select", "fluid-option"]);
  const host = page.locator("#candidate-select");
  const trigger = host.getByRole("combobox");
  await expect(host.locator('fluid-option[value="beta"]')).toHaveAttribute("aria-selected", "true");
  expect(
    await page.evaluate(() =>
      new FormData(document.querySelector<HTMLFormElement>("#select-form")!).get("choice")
    )
  ).toBe("beta");

  await page.evaluate(async () => {
    const host = document.querySelector<HTMLElement & { updateComplete: Promise<unknown> }>(
      "#candidate-select"
    )!;
    host.querySelector('fluid-option[value="beta"]')!.remove();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await host.updateComplete;
  });
  await expect(host).toHaveJSProperty("value", "alpha");
  await expect(host.locator('fluid-option[value="alpha"]')).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(await page.evaluate(() => window.selectEvents)).toEqual([]);

  await host.evaluate(async (element) => {
    const select = element as HTMLElement & {
      disabled: boolean;
      updateComplete: Promise<unknown>;
    };
    select.disabled = true;
    await select.updateComplete;
  });
  await expect(trigger).toBeDisabled();
  await host.evaluate(async (element) => {
    const select = element as HTMLElement & {
      disabled: boolean;
      updateComplete: Promise<unknown>;
    };
    select.disabled = false;
    element.insertAdjacentHTML("beforeend", '<fluid-option value="gamma">Gamma</fluid-option>');
    await select.updateComplete;
  });
  await expect(trigger).toBeEnabled();
  await trigger.click();
  await host.getByRole("option", { name: "Gamma" }).click();
  await expect(host).toHaveJSProperty("value", "gamma");

  await host.evaluate(async (element) => {
    const select = element as HTMLElement & {
      value: string;
      updateComplete: Promise<unknown>;
      checkValidity(): boolean;
    };
    const parent = element.parentElement!;
    element.remove();
    parent.append(element);
    await select.updateComplete;
    select.value = "";
    await select.updateComplete;
  });
  expect(
    await host.evaluate((element) =>
      (element as HTMLElement & { checkValidity(): boolean }).checkValidity()
    )
  ).toBe(false);
  await trigger.focus();
  await trigger.click();
  await host.getByRole("option", { name: "Alpha" }).click();
  await expect(trigger).toBeFocused();
  await expect
    .poll(() =>
      host.evaluate((element) =>
        (element as HTMLElement & { checkValidity(): boolean }).checkValidity()
      )
    )
    .toBe(true);
  expect(
    await page.evaluate(() => ({
      events: window.selectEvents,
      formValue: new FormData(document.querySelector<HTMLFormElement>("#select-form")!).get(
        "choice"
      )
    }))
  ).toEqual({ events: ["gamma", "alpha"], formValue: "alpha" });
  expect(errors).toEqual([]);
});

test("Dialog closes with focus return and restores an open modal after reconnect without duplicate lifecycle events", async ({
  page
}) => {
  const errors = await openFixture(page);
  await page.evaluate(() => {
    const root = document.querySelector("#recovery-root")!;
    root.innerHTML = `<button id="dialog-opener">Open dialog</button><fluid-dialog id="candidate-dialog" label="Recovery dialog"><button id="inside-action" autofocus>Inside action</button></fluid-dialog>`;
    const opener = document.querySelector<HTMLButtonElement>("#dialog-opener")!;
    const host = document.querySelector<HTMLElement & { show(): void }>("#candidate-dialog")!;
    const events: string[] = [];
    opener.addEventListener("click", () => host.show());
    host.addEventListener("fluid-show", () => events.push("show"));
    host.addEventListener("fluid-hide", () => events.push("hide"));
    window.dialogEvents = events;
  });
  await expectUpgraded(page, ["fluid-dialog"]);
  const opener = page.locator("#dialog-opener");
  const host = page.locator("#candidate-dialog");
  const native = host.locator("dialog");
  await opener.focus();
  await opener.click();
  await expect(native).toHaveJSProperty("open", true);
  await expect(host.locator("#inside-action")).toBeFocused();
  await host.locator(".close").click();
  await expect(native).toHaveJSProperty("open", false);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => window.dialogEvents)).toEqual(["show", "hide"]);

  await opener.click();
  await expect(native).toHaveJSProperty("open", true);
  await host.evaluate(async (element) => {
    const parent = element.parentElement!;
    element.remove();
    parent.append(element);
    await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
  await expect(host).toHaveJSProperty("open", true);
  await expect(native).toHaveJSProperty("open", true);
  expect(await native.evaluate((element) => element.matches(":modal"))).toBe(true);
  await expect(host.locator("#inside-action")).toBeFocused();
  expect(await page.evaluate(() => window.dialogEvents)).toEqual(["show", "hide", "show"]);
  await host.locator(".close").click();
  await expect(native).toHaveJSProperty("open", false);
  expect(await page.evaluate(() => window.dialogEvents)).toEqual(["show", "hide", "show", "hide"]);
  expect(errors).toEqual([]);
});

test("Pagination clamps a shrinking page range and reconnects without duplicate navigation events", async ({
  page
}) => {
  const errors = await openFixture(page);
  await page.evaluate(() => {
    const root = document.querySelector("#recovery-root")!;
    root.innerHTML = `<fluid-pagination id="candidate-pagination" total-pages="10" page="8" label="Search results"></fluid-pagination>`;
    const host = document.querySelector("#candidate-pagination")!;
    const events: number[] = [];
    host.addEventListener("fluid-page-change", (event) =>
      events.push((event as CustomEvent<{ page: number }>).detail.page)
    );
    window.paginationEvents = events;
  });
  await expectUpgraded(page, ["fluid-pagination"]);
  const host = page.locator("#candidate-pagination");
  await expect(host.getByRole("navigation", { name: "Search results" })).toBeAttached();
  await host.getByRole("button", { name: "Next page" }).click();
  await expect(host).toHaveJSProperty("page", 9);

  await host.evaluate(async (element) => {
    const pagination = element as HTMLElement & {
      updateComplete: Promise<unknown>;
      totalPages: number;
    };
    const parent = element.parentElement!;
    element.remove();
    parent.append(element);
    await pagination.updateComplete;
  });
  await host.getByRole("button", { name: "Next page" }).click();
  await expect(host).toHaveJSProperty("page", 10);
  await host.evaluate(async (element) => {
    const pagination = element as HTMLElement & {
      updateComplete: Promise<unknown>;
      totalPages: number;
    };
    pagination.totalPages = 3;
    await pagination.updateComplete;
  });
  await expect(host).toHaveJSProperty("page", 3);
  await expect(host.getByRole("button", { name: "Page 3" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(host.getByRole("button", { name: "Next page" })).toBeDisabled();
  await host.evaluate(async (element) => {
    const pagination = element as HTMLElement & {
      updateComplete: Promise<unknown>;
      totalPages: number;
    };
    pagination.totalPages = 5;
    await pagination.updateComplete;
  });
  const fourth = host.getByRole("button", { name: "Page 4" });
  await fourth.click();
  await expect(fourth).toBeFocused();
  await expect(host).toHaveJSProperty("page", 4);
  expect(await page.evaluate(() => window.paginationEvents)).toEqual([9, 10, 4]);
  expect(errors).toEqual([]);
});
