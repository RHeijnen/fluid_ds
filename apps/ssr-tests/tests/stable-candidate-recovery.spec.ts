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

async function expectUpgraded(page: Page, tag: string): Promise<void> {
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

test("form candidate reconnects without duplicate events and recovers disabled, readonly and validity state", async ({
  page
}) => {
  const errors = await openFixture(page);
  await page.evaluate(() => {
    const root = document.querySelector("#recovery-root")!;
    root.innerHTML = `<form id="candidate-form"><fluid-input id="candidate-input" name="account" value="authored" required aria-label="Account"></fluid-input></form>`;
    const host = document.querySelector("#candidate-input")!;
    const events: Array<{ type: string; value: string }> = [];
    for (const type of ["fluid-input", "fluid-change"]) {
      host.addEventListener(type, (event) =>
        events.push({
          type,
          value: (event as CustomEvent<{ value: string }>).detail.value
        })
      );
    }
    window.candidateEvents = events;
  });
  await expectUpgraded(page, "fluid-input");

  const initial = await page.evaluate(async () => {
    const form = document.querySelector<HTMLFormElement>("#candidate-form")!;
    const host = document.querySelector<
      HTMLElement & { updateComplete: Promise<unknown>; value: string }
    >("#candidate-input")!;
    await host.updateComplete;
    const native = host.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    host.remove();
    form.append(host);
    await host.updateComplete;
    return {
      formValue: new FormData(form).get("account"),
      hostValue: host.value,
      nativeValue: native.value,
      sameNative: native === host.shadowRoot!.querySelector("input")
    };
  });
  expect(initial).toEqual({
    formValue: "authored",
    hostValue: "authored",
    nativeValue: "authored",
    sameNative: true
  });

  const host = page.locator("#candidate-input");
  const native = host.locator("input");
  await host.evaluate(async (element) => {
    const control = element as HTMLElement & {
      disabled: boolean;
      readonly: boolean;
      updateComplete: Promise<unknown>;
    };
    control.disabled = true;
    await control.updateComplete;
  });
  await expect(native).toBeDisabled();
  await host.evaluate(async (element) => {
    const control = element as HTMLElement & {
      disabled: boolean;
      readonly: boolean;
      updateComplete: Promise<unknown>;
    };
    control.disabled = false;
    control.readonly = true;
    await control.updateComplete;
  });
  await expect(native).toBeEnabled();
  await expect(native).toHaveAttribute("readonly", "");
  await host.evaluate(async (element) => {
    const control = element as HTMLElement & {
      readonly: boolean;
      value: string;
      updateComplete: Promise<unknown>;
    };
    control.readonly = false;
    control.value = "";
    await control.updateComplete;
  });
  await expect(native).not.toHaveAttribute("readonly");
  expect(
    await host.evaluate((element) =>
      (element as HTMLElement & { checkValidity(): boolean }).checkValidity()
    )
  ).toBe(false);

  await native.focus();
  await native.fill("recovered");
  await native.dispatchEvent("change");
  await expect(native).toBeFocused();
  await expect
    .poll(() =>
      host.evaluate((element) =>
        (element as HTMLElement & { checkValidity(): boolean }).checkValidity()
      )
    )
    .toBe(true);
  const recovered = await page.evaluate(() => ({
    events: window.candidateEvents,
    formValue: new FormData(document.querySelector<HTMLFormElement>("#candidate-form")!).get(
      "account"
    )
  }));
  expect(recovered).toEqual({
    events: [
      { type: "fluid-input", value: "recovered" },
      { type: "fluid-change", value: "recovered" }
    ],
    formValue: "recovered"
  });
  expect(errors).toEqual([]);
});

test("disclosure candidate preserves authored open state across reconnect and closes exactly once", async ({
  page
}) => {
  const errors = await openFixture(page);
  await page.evaluate(() => {
    const root = document.querySelector("#recovery-root")!;
    root.innerHTML = `<fluid-details id="candidate-details"><span slot="summary">Recovery details</span><button>Body action</button></fluid-details>`;
    const host = document.querySelector("#candidate-details")!;
    const events: boolean[] = [];
    host.addEventListener("fluid-toggle", (event) =>
      events.push((event as CustomEvent<{ open: boolean }>).detail.open)
    );
    window.detailsEvents = events;
  });
  await expectUpgraded(page, "fluid-details");
  const host = page.locator("#candidate-details");
  const summary = host.getByRole("button", { name: "Recovery details" });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(host).toHaveAttribute("open", "");
  await expect(summary).toHaveAttribute("aria-expanded", "true");

  await host.evaluate(async (element) => {
    const parent = element.parentElement!;
    element.remove();
    parent.append(element);
    await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
  });
  await expect(host).toHaveAttribute("open", "");
  await expect(summary).toHaveAttribute("aria-expanded", "true");
  await host.evaluate(async (element) => {
    const details = element as HTMLElement & {
      disabled: boolean;
      updateComplete: Promise<unknown>;
    };
    details.disabled = true;
    await details.updateComplete;
  });
  await summary.click({ force: true });
  await expect(host).toHaveAttribute("open", "");
  await host.evaluate(async (element) => {
    const details = element as HTMLElement & {
      disabled: boolean;
      updateComplete: Promise<unknown>;
    };
    details.disabled = false;
    await details.updateComplete;
  });
  await summary.focus();
  await page.keyboard.press("Space");
  await expect(host).not.toHaveAttribute("open");
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => window.detailsEvents)).toEqual([true, false]);
  expect(errors).toEqual([]);
});

test("navigation candidate recovers when the selected child is removed and reconnects without duplicate changes", async ({
  page
}) => {
  const errors = await openFixture(page);
  await page.evaluate(() => {
    const root = document.querySelector("#recovery-root")!;
    root.innerHTML = `<fluid-tabs id="candidate-tabs">
      <fluid-tab slot="nav" panel="alpha">Alpha</fluid-tab>
      <fluid-tab slot="nav" panel="beta">Beta</fluid-tab>
      <fluid-tab-panel name="alpha">Alpha panel</fluid-tab-panel>
      <fluid-tab-panel name="beta">Beta panel</fluid-tab-panel>
    </fluid-tabs>`;
    const host = document.querySelector("#candidate-tabs")!;
    const events: string[] = [];
    host.addEventListener("fluid-change", (event) =>
      events.push((event as CustomEvent<{ value: string }>).detail.value)
    );
    window.tabEvents = events;
  });
  await expectUpgraded(page, "fluid-tabs");
  const host = page.locator("#candidate-tabs");
  await host.getByRole("tab", { name: "Beta" }).click();
  await expect(host).toHaveJSProperty("value", "beta");

  await page.evaluate(async () => {
    const host = document.querySelector<HTMLElement & { updateComplete: Promise<unknown> }>(
      "#candidate-tabs"
    )!;
    host.querySelector('fluid-tab[panel="beta"]')!.remove();
    host.querySelector('fluid-tab-panel[name="beta"]')!.remove();
    await host.updateComplete;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
  await expect(host).toHaveJSProperty("value", "alpha");
  await expect(host.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");

  await page.evaluate(async () => {
    const host = document.querySelector<HTMLElement & { updateComplete: Promise<unknown> }>(
      "#candidate-tabs"
    )!;
    host.insertAdjacentHTML(
      "beforeend",
      `<fluid-tab slot="nav" panel="gamma">Gamma</fluid-tab><fluid-tab-panel name="gamma">Gamma panel</fluid-tab-panel>`
    );
    await host.updateComplete;
    const parent = host.parentElement!;
    host.remove();
    parent.append(host);
    await host.updateComplete;
  });
  const alpha = host.getByRole("tab", { name: "Alpha" });
  const gamma = host.getByRole("tab", { name: "Gamma" });
  await alpha.focus();
  await page.keyboard.press("ArrowRight");
  await expect(gamma).toBeFocused();
  await expect(host).toHaveJSProperty("value", "gamma");
  expect(await page.evaluate(() => window.tabEvents)).toEqual(["beta", "alpha", "gamma"]);
  expect(errors).toEqual([]);
});
