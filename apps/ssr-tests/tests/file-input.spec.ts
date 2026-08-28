import { test, expect, type Page } from "@playwright/test";
import { attachWarningOccurrences, captureErrors } from "./browser-console.js";

declare global {
  interface Window {
    fileEvents: {
      files: File[];
      value: string;
      data: [string, FormDataEntryValue][];
      origin: string;
      bubbles: boolean;
      composed: boolean;
    }[];
  }
}

const first = { name: "résumé.txt", mimeType: "text/plain", buffer: Buffer.from("Fluid upload\n") };
const second = {
  name: "sample.bin",
  mimeType: "application/octet-stream",
  buffer: Buffer.from([0, 1, 127, 128, 255])
};
const expectedFile = (file: typeof first) => ({
  name: file.name,
  type: file.mimeType,
  size: file.buffer.length,
  bytes: [...file.buffer]
});
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

async function openFile(page: Page, mode: string) {
  const errors = captureErrors(page);
  const response = await page.goto(`/form-focus/file-input/${mode}`);
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
    window.fileEvents = [];
    document.querySelector("#field")!.addEventListener("fluid-change", (event) => {
      const detail = (event as CustomEvent<{ files: File[]; value: string }>).detail;
      window.fileEvents.push({
        files: [...detail.files],
        value: detail.value,
        // Capture synchronously: waiting for the render would hide stale form data.
        data: [...new FormData(document.querySelector<HTMLFormElement>("#native-form")!)],
        origin: (event.composedPath()[0] as Element).localName,
        bubbles: event.bubbles,
        composed: event.composed
      });
    });
  });
  return {
    errors,
    markup,
    field: page.locator("#field"),
    zone: page.locator("#field .dropzone")
  };
}

async function choose(
  page: Page,
  files: (typeof first)[],
  activation: "click" | "Enter" | "Space" = "click"
) {
  const zone = page.locator("#field .dropzone");
  if (activation !== "click") await zone.focus();
  if (activation === "Space") {
    const opened: unknown[] = [];
    const observe = (chooser: unknown) => opened.push(chooser);
    page.on("filechooser", observe);
    await page.keyboard.down("Space");
    expect(opened).toEqual([]);
    page.off("filechooser", observe);
  }
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    activation === "click"
      ? zone.click()
      : activation === "Space"
        ? page.keyboard.up("Space")
        : page.keyboard.press(activation)
  ]);
  await chooser.setFiles(files);
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const file = async (value: File) => ({
      name: value.name,
      type: value.type,
      size: value.size,
      bytes: [...new Uint8Array(await value.arrayBuffer())]
    });
    const data = (entries: [string, FormDataEntryValue][]) =>
      Promise.all(
        entries.map(async ([name, value]) => [
          name,
          typeof value === "string" ? value : await file(value)
        ])
      );
    return {
      data: await data([...new FormData(document.querySelector<HTMLFormElement>("#native-form")!)]),
      events: await Promise.all(
        window.fileEvents.map(async (event) => ({
          ...event,
          files: await Promise.all(event.files.map(file)),
          data: await data(event.data)
        }))
      ),
      submissions: await Promise.all(
        window.formFocusFixture.submissions.map(async (entry) => ({
          ...entry,
          data: await data(entry.data)
        }))
      )
    };
  });
}

for (const mode of ["client", "dsd"]) {
  test(
    `file-input ${mode}: native validation focus, file bytes, custom error and silent reset`,
    { tag: "@file-focus" },
    async ({ page }) => {
      const { errors, markup, field, zone } = await openFile(page, mode);
      await expect(zone).toHaveAccessibleName("File input");
      for (const [index, action] of actions.entries()) {
        await activate(page, action);
        await expect(zone).toBeFocused();
        await expect(zone).toBeVisible();
        expect(await page.evaluate(() => window.formFocusFixture.invalidEvents)).toBe(index + 1);
        expect((await snapshot(page)).submissions).toEqual([]);
      }
      expect(await field.evaluate((host) => host.shadowRoot?.delegatesFocus)).toBe(true);
      if (mode === "dsd")
        expect(markup.match(/<fluid-file-input[^>]*>\s*<template([^>]*)>/)?.[1]).toContain(
          "shadowrootdelegatesfocus"
        );
      await choose(page, [first]);
      await expect(field.locator('[part="file"]')).toHaveCount(1);
      await field.evaluate(async (host) => {
        (host as HTMLElement & { setCustomValidity(value: string): void }).setCustomValidity(
          "Upload rejected by application"
        );
        host.setAttribute("lang", "nl");
        await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
      });
      await activate(page, actions[0]);
      await expect(zone).toBeFocused();
      expect(
        await field.evaluate(
          (host) => (host as HTMLElement & { validationMessage: string }).validationMessage
        )
      ).toBe("Upload rejected by application");
      expect((await snapshot(page)).submissions).toEqual([]);
      await field.evaluate((host) =>
        (host as HTMLElement & { setCustomValidity(value: string): void }).setCustomValidity("")
      );
      for (const action of actions) await activate(page, action);
      expect((await snapshot(page)).submissions).toEqual(
        actions.map(({ submitter }) => ({ submitter, data: [["answer", expectedFile(first)]] }))
      );
      await page.locator("#native-form").evaluate((form) => (form as HTMLFormElement).reset());
      await expect(field.locator('[part="file"]')).toHaveCount(0);
      expect(
        await field
          .locator('input[type="file"]')
          .evaluate((input) => (input as HTMLInputElement).files!.length)
      ).toBe(0);
      expect((await snapshot(page)).data).toEqual([]);
      expect((await snapshot(page)).events).toHaveLength(1);
      await activate(page, actions[0]);
      await expect(zone).toBeFocused();
      expect((await snapshot(page)).submissions).toHaveLength(4);
      await choose(page, [first], "Enter");
      expect((await snapshot(page)).data).toEqual([["answer", expectedFile(first)]]);
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `file-input ${mode}: replacement, multiple selection and removal synchronize events and focus`,
    { tag: "@file-focus" },
    async ({ page }) => {
      const { errors, field, zone } = await openFile(page, mode);
      await choose(page, [first], "Enter");
      const expectedEvent = (files: (typeof first)[]) => ({
        files: files.map(expectedFile),
        value: files.map((file) => file.name).join(", "),
        data: files.map((file) => ["answer", expectedFile(file)]),
        origin: "fluid-file-input",
        bubbles: true,
        composed: true
      });
      expect((await snapshot(page)).events).toEqual([expectedEvent([first])]);
      await choose(page, [second], "Space");
      await expect(field.locator('[part="file"]')).toHaveCount(1);
      expect((await snapshot(page)).data).toEqual([["answer", expectedFile(second)]]);
      await field.evaluate(async (host) => {
        host.setAttribute("multiple", "");
        await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
      });
      await choose(page, [first]);
      await expect(field.locator('[part="file"]')).toHaveCount(2);
      await field.locator(".file-remove").first().focus();
      await page.keyboard.press("Enter");
      await expect(field.locator(".file-remove")).toHaveCount(1);
      await expect(field.locator(".file-remove")).toBeFocused();
      await page.keyboard.press("Space");
      await expect(field.locator('[part="file"]')).toHaveCount(0);
      await expect(zone).toBeFocused();
      expect((await snapshot(page)).events).toEqual(
        [[first], [second], [second, first], [first], []].map(expectedEvent)
      );
      expect((await snapshot(page)).data).toEqual([]);
      await choose(page, [first, second]);
      await expect(field.locator('[part="file"]')).toHaveCount(2);
      expect((await snapshot(page)).events.at(-1)).toEqual(expectedEvent([first, second]));
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );

  test(
    `file-input ${mode}: disabled removal and picker are inert, reconnect preserves files`,
    { tag: "@file-focus" },
    async ({ page }) => {
      const { errors, field, zone } = await openFile(page, mode);
      await choose(page, [first]);
      await expect(field.locator(".file-remove")).toHaveCount(1);
      await field.evaluate(async (host) => {
        host.setAttribute("disabled", "");
        await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
      });
      await expect(field.locator(".file-remove")).toBeDisabled();
      await expect(field.locator('input[type="file"]')).toBeDisabled();
      await expect(zone).toHaveAttribute("tabindex", "-1");
      await expect(zone).toHaveAttribute("aria-disabled", "true");
      const choosers: unknown[] = [];
      page.on("filechooser", (chooser) => choosers.push(chooser));
      // Force bypasses Playwright's disabled actionability check, not browser semantics.
      await field.locator(".file-remove").click({ force: true });
      await zone.click({ force: true });
      await zone.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Space");
      await activate(page, actions[0]);
      expect((await snapshot(page)).events).toHaveLength(1);
      expect((await snapshot(page)).submissions).toEqual([
        { submitter: "native-submit", data: [] }
      ]);
      expect(choosers).toEqual([]);
      await field.evaluate(async (host) => {
        host.removeAttribute("disabled");
        const parent = host.parentElement!;
        host.remove();
        parent.append(host);
        await (host as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
      });
      await expect(field.locator(".file-remove")).toBeEnabled();
      await expect(field.locator('input[type="file"]')).toBeEnabled();
      await activate(page, actions[1]);
      expect((await snapshot(page)).submissions.at(-1)).toEqual({
        submitter: null,
        data: [["answer", expectedFile(first)]]
      });
      await page.evaluate(() => window.formFocusFixture.assertServerNodes());
      expect(errors).toEqual([]);
    }
  );
}
