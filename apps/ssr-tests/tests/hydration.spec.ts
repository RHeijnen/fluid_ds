import { test, expect, type Page } from "@playwright/test";
import {
  attachWarningOccurrences,
  captureErrors,
  renderCycleMessage,
  warningOccurrences
} from "./browser-console.js";

test.afterEach(async ({ page }, testInfo) => {
  await attachWarningOccurrences(page, testInfo);
});

async function hydrated(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.fluidHydrated === true || window.fluidHydrationError !== null
  );
  expect(await page.evaluate(() => window.fluidHydrationError)).toBeNull();
  expect(await page.evaluate(() => window.assertFluidServerNodes())).toBe(18);
}

test("the server response contains declarative shadow DOM for the full catalog", async ({
  request
}) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  const markup = await response.text();
  const expectedShadowRoots = markup.match(
    /<meta name="fluid-ssr-shadow-root-count" content="(\d+)">/
  );
  expect(expectedShadowRoots, "generated SSR shadow-root inventory").not.toBeNull();
  expect((markup.match(/shadowrootmode="open"/g) ?? []).length).toBe(
    Number(expectedShadowRoots![1])
  );
  expect(markup).toContain("Hydrated action");
  expect(markup).toMatch(
    /<fluid-input(?=[^>]*id="stateful")[^>]*>\s*<template[^>]*shadowrootdelegatesfocus/
  );
});

test("registers the catalog and retains the named form's server nodes without browser errors", async ({
  page
}) => {
  const errors = captureErrors(page);
  await page.goto("/");
  await hydrated(page);

  const result = await page.locator("#catalog").evaluate((catalog) => {
    const elements = [...catalog.children] as HTMLElement[];
    return {
      count: elements.length,
      undefinedTags: elements
        .map((element) => element.localName)
        .filter((tag) => !customElements.get(tag)),
      shadowRoots: elements.filter((element) => element.shadowRoot).length,
      mismatches: window.fluidHydrationMismatches
    };
  });
  expect(result.count).toBe(155);
  expect(result.undefinedTags).toEqual([]);
  expect(result.shadowRoots).toBe(154);
  expect(result.mismatches).toEqual([]);
  expect(await page.evaluate(() => window.assertFluidServerNodes())).toBe(18);
  expect(errors).toEqual([]);
});

test("preserves user input entered before hydration", async ({ page }) => {
  const errors = captureErrors(page);
  await page.goto("/?hydrate=manual");

  const input = page.locator("#stateful").locator("input");
  await input.fill("typed before hydration");
  await page.keyboard.press("Home");
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Shift+ArrowRight");
  const selection = await input.evaluate((element) => {
    const control = element as HTMLInputElement;
    return [control.selectionStart, control.selectionEnd, control.selectionDirection];
  });
  expect(selection).toEqual([0, 2, "forward"]);
  await page.evaluate(() => window.hydrateFluid());
  await hydrated(page);

  await expect(input).toHaveValue("typed before hydration");
  await expect(input).toBeFocused();
  expect(
    await input.evaluate((element) => {
      const control = element as HTMLInputElement;
      return [control.selectionStart, control.selectionEnd, control.selectionDirection];
    })
  ).toEqual(selection);
  await expect(page.locator("#choice").locator("input")).toBeChecked();
  expect(errors).toEqual([]);
});

test("survives a reload with deterministic server state", async ({ page }) => {
  const errors = captureErrors(page);
  await page.goto("/");
  await hydrated(page);
  await page.reload();
  await hydrated(page);
  await expect(page.locator("#stateful").locator("input")).toHaveValue("server");
  expect(errors).toEqual([]);
});

test("pre-hydration edits update host properties and submitted form values", async ({ page }) => {
  const errors = captureErrors(page);
  await page.goto("/?hydrate=manual");
  await page.locator("#stateful input").fill("edited before registration");
  await page.locator("#choice label").click();
  await expect(page.locator("#choice input")).not.toBeChecked();
  await page.locator("#stateful input").focus();
  await page.evaluate(() => window.hydrateFluid());
  await hydrated(page);
  expect(
    await page.locator("#hydration-form").evaluate((form) => ({
      value: (form.querySelector("#stateful") as HTMLElement & { value: string }).value,
      checked: (form.querySelector("#choice") as HTMLElement & { checked: boolean }).checked,
      submitted: [...new FormData(form as HTMLFormElement)]
    }))
  ).toEqual({
    value: "edited before registration",
    checked: false,
    submitted: [
      ["note", "edited before registration"],
      ["amount", "2"],
      ["contact", "fluid@example.com"]
    ]
  });
  expect(await page.evaluate(() => window.fluidFormEvents)).toEqual([]);
  expect(
    await page
      .locator("#hydration-form")
      .evaluate((form) => (form as HTMLFormElement).checkValidity())
  ).toBe(false);
  await page.locator("#stateful").evaluate(async (host) => {
    const input = host as HTMLElement & { placeholder: string; updateComplete: Promise<boolean> };
    input.placeholder = "Updated after hydration";
    await input.updateComplete;
  });
  await expect(page.locator("#stateful input")).toHaveValue("edited before registration");
  await page.locator("#choice label").click();
  await page.locator("#stateful input").fill("edited after hydration");
  await page.getByRole("button", { name: "Hydrated action", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.fluidSubmissions))
    .toEqual([
      [
        ["note", "edited after hydration"],
        ["remember", "yes"],
        ["amount", "2"],
        ["contact", "fluid@example.com"]
      ]
    ]);
  expect(
    await page.evaluate(() =>
      window.fluidFormEvents.some(
        (event) =>
          event.id === "stateful" &&
          event.type === "fluid-input" &&
          (event.detail as { value: string }).value === "edited after hydration"
      )
    )
  ).toBe(true);
  const eventsBeforeReset = await page.evaluate(() => window.fluidFormEvents.length);
  await page.getByRole("button", { name: "Reset form", exact: true }).click();
  await expect(page.locator("#stateful input")).toHaveValue("server");
  await expect(page.locator("#choice input")).toBeChecked();
  expect(await page.evaluate(() => window.fluidFormEvents.length)).toBe(eventsBeforeReset);
  expect(
    await page
      .locator("#hydration-form")
      .evaluate((form) => [...new FormData(form as HTMLFormElement)])
  ).toEqual([
    ["note", "server"],
    ["remember", "yes"],
    ["amount", "2"],
    ["contact", "fluid@example.com"]
  ]);
  expect(await page.evaluate(() => window.assertFluidServerNodes())).toBe(18);
  expect(errors).toEqual([]);
});

test("direct scalar and boolean adapters reconcile delayed-registration state without events", async ({
  page
}) => {
  const errors = captureErrors(page);
  await page.goto("/?hydrate=manual");
  await page.locator("#adopt-masked input").fill("captured mask");
  await page.locator("#adopt-number input").fill("7");
  await page.locator("#adopt-slider input").evaluate((input) => {
    (input as HTMLInputElement).value = "70";
  });
  await page.locator("#adopt-switch input").check({ force: true });
  await page.locator("#adopt-typeahead input").fill("Rotterdam");
  const textarea = page.locator("#adopt-textarea textarea");
  await textarea.fill("captured notes");
  await textarea.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Shift+ArrowRight");
  const selection = await textarea.evaluate((control) => [
    (control as HTMLTextAreaElement).selectionStart,
    (control as HTMLTextAreaElement).selectionEnd,
    (control as HTMLTextAreaElement).selectionDirection
  ]);

  await page.evaluate(() => window.hydrateFluid());
  await hydrated(page);

  expect(
    await page.locator("#adoption-form").evaluate((form) => {
      const value = (id: string) =>
        (form.querySelector(id) as HTMLElement & { value: string }).value;
      return {
        masked: value("#adopt-masked"),
        quantity: value("#adopt-number"),
        volume: value("#adopt-slider"),
        alerts: (form.querySelector("#adopt-switch") as HTMLElement & { checked: boolean }).checked,
        notes: value("#adopt-textarea"),
        city: value("#adopt-typeahead"),
        data: [...new FormData(form as HTMLFormElement)]
      };
    })
  ).toEqual({
    masked: "captured mask",
    quantity: "7",
    volume: "70",
    alerts: true,
    notes: "captured notes",
    city: "Rotterdam",
    data: [
      ["masked", "captured mask"],
      ["quantity", "7"],
      ["volume", "70"],
      ["alerts", "enabled"],
      ["notes", "captured notes"],
      ["city", "Rotterdam"]
    ]
  });
  await expect(textarea).toBeFocused();
  expect(
    await textarea.evaluate((control) => [
      (control as HTMLTextAreaElement).selectionStart,
      (control as HTMLTextAreaElement).selectionEnd,
      (control as HTMLTextAreaElement).selectionDirection
    ])
  ).toEqual(selection);
  expect(await page.evaluate(() => window.fluidFormEvents)).toEqual([]);
  expect(await page.evaluate(() => window.assertFluidServerNodes())).toBe(18);
  expect(errors).toEqual([]);
});

test("composite adapters preserve drafts and reconcile canonical delayed-registration state without events", async ({
  page
}) => {
  const errors = captureErrors(page);
  await page.goto("/?hydrate=manual");
  await page.locator("#adopt-color fluid-input input").fill("336699");
  await page.locator("#adopt-date input").fill("unfinished date");
  await page.locator("#adopt-date-range input").fill("unfinished range");
  await page.locator("#adopt-time input").fill("unfinished time");
  await page.locator("#adopt-tags input").fill("uncommitted tag");
  const otp = page.locator("#adopt-otp input");
  for (let index = 0; index < 4; index++) {
    await otp.nth(index).fill(String(index + 1));
  }
  await otp.nth(2).focus();

  await page.evaluate(() => window.hydrateFluid());
  await hydrated(page);

  expect(
    await page.locator("#composite-adoption-form").evaluate((form) => {
      const host = (id: string) => form.querySelector(id) as HTMLElement & { value: unknown };
      return {
        color: host("#adopt-color").value,
        date: host("#adopt-date").value,
        range: host("#adopt-date-range").value,
        otp: host("#adopt-otp").value,
        tags: host("#adopt-tags").value,
        time: host("#adopt-time").value,
        drafts: {
          color: form
            .querySelector("#adopt-color")!
            .shadowRoot!.querySelector("fluid-input")!
            .shadowRoot!.querySelector("input")!.value,
          date: form.querySelector("#adopt-date")!.shadowRoot!.querySelector("input")!.value,
          range: form.querySelector("#adopt-date-range")!.shadowRoot!.querySelector("input")!.value,
          tags: form.querySelector("#adopt-tags")!.shadowRoot!.querySelector("input")!.value,
          time: form.querySelector("#adopt-time")!.shadowRoot!.querySelector("input")!.value
        },
        data: [...new FormData(form as HTMLFormElement)]
      };
    })
  ).toEqual({
    color: "#336699",
    date: "2026-08-27",
    range: "2026-08-27/2026-08-28",
    otp: "1234",
    tags: ["alpha", "beta"],
    time: "09:30",
    drafts: {
      color: "336699",
      date: "unfinished date",
      range: "unfinished range",
      tags: "uncommitted tag",
      time: "unfinished time"
    },
    data: [
      ["color", "#336699"],
      ["date", "2026-08-27"],
      ["range", "2026-08-27/2026-08-28"],
      ["code", "1234"],
      ["tags", "alpha,beta"],
      ["time", "09:30"]
    ]
  });
  await expect(otp.nth(2)).toBeFocused();
  expect(await page.evaluate(() => window.fluidFormEvents)).toEqual([]);
  expect(await page.evaluate(() => window.assertFluidServerNodes())).toBe(18);
  expect(errors).toEqual([]);
});

test("native ancestor locale matches server output, hydration and reactive client inheritance", async ({
  page
}) => {
  const errors = captureErrors(page);
  await page.goto("/?hydrate=manual");
  const previous = page.locator("#localized-pagination button").first();
  await expect(previous).toHaveAttribute("aria-label", "Vorige pagina");
  await page.evaluate(() => window.hydrateFluid());
  await hydrated(page);
  await expect(previous).toHaveAttribute("aria-label", "Vorige pagina");
  await page.locator("#locale-context").evaluate((context) => context.setAttribute("lang", "de"));
  await expect(previous).toHaveAttribute("aria-label", "Vorherige Seite");
  expect(await page.evaluate(() => window.fluidHydrationMismatches)).toEqual([]);
  expect(await page.evaluate(() => window.assertFluidServerNodes())).toBe(18);
  expect(errors).toEqual([]);
});

for (const id of ["choice", "amount", "contact"]) {
  test(`preserves a focused ${id} control without unsupported selection calls`, async ({
    page
  }) => {
    const errors = captureErrors(page);
    await page.goto("/?hydrate=manual");
    const control = page.locator(`#${id} input`);
    if (id === "amount") await control.fill("7");
    if (id === "contact") await control.fill("updated@example.com");
    if (id === "choice") await page.locator("#choice label").click();
    await control.focus();
    await page.evaluate(() => window.hydrateFluid());
    await hydrated(page);
    expect(errors).toEqual([]);
    await expect(control).toBeFocused();
    if (id === "choice") {
      await expect(control).not.toBeChecked();
      expect(
        await page
          .locator("#hydration-form")
          .evaluate((form) => new FormData(form as HTMLFormElement).has("remember"))
      ).toBe(false);
    } else {
      const value = id === "amount" ? "7" : "updated@example.com";
      await expect(control).toHaveValue(value);
      expect(
        await page
          .locator(`#${id}`)
          .evaluate((host) => (host as HTMLElement & { value: string }).value)
      ).toBe(value);
      expect(
        await page
          .locator("#hydration-form")
          .evaluate((form, name) => new FormData(form as HTMLFormElement).get(name), id)
      ).toBe(value);
    }
  });
}

test("restored empty required input blocks submission until a native edit makes it valid", async ({
  page
}) => {
  const errors = captureErrors(page);
  await page.goto("/?hydrate=manual");
  const input = page.locator("#stateful input");
  expect(await page.locator("#stateful").evaluate((host) => host.shadowRoot?.delegatesFocus)).toBe(
    true
  );
  await input.fill("");
  await page.evaluate(() => window.hydrateFluid());
  await hydrated(page);
  expect(
    await page
      .locator("#stateful")
      .evaluate((host) => (host as HTMLElement & { validity: ValidityState }).validity.valueMissing)
  ).toBe(true);
  await page.getByRole("button", { name: "Hydrated action", exact: true }).click();
  expect(await page.evaluate(() => window.fluidSubmissions)).toEqual([]);
  await expect(input).toBeFocused();
  await input.fill("Valid note");
  await page.getByRole("button", { name: "Hydrated action", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.fluidSubmissions.length)).toBe(1);
  expect(
    await page
      .locator("#hydration-form")
      .evaluate((form) => (form as HTMLFormElement).checkValidity())
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("server-node identity gate rejects a visually identical replacement", async ({ page }) => {
  const errors = captureErrors(page);
  await page.goto("/?hydrate=manual");
  await page.evaluate(() => window.hydrateFluid());
  await hydrated(page);
  await page
    .locator("#stateful input")
    .evaluate((input) => input.replaceWith(input.cloneNode(true)));
  await expect(page.evaluate(() => window.assertFluidServerNodes())).rejects.toThrow(
    "Hydration replaced or omitted a server control: stateful"
  );
  expect(errors).toEqual([]);
});

test("warning gate rejects render-cycle, unknown and changed messages", async ({ page }) => {
  const errors = captureErrors(page);
  await page.goto("/?hydrate=manual");
  const repaired = renderCycleMessage("fluid-input");
  const rejected = [
    repaired,
    "Unexpected warning negative control",
    `${repaired} unexpected suffix`,
    renderCycleMessage("fluid-unknown")
  ];
  await page.evaluate((rejected) => {
    for (const message of rejected) console.warn(message);
  }, rejected);
  await expect.poll(() => errors).toEqual(rejected);
  expect(warningOccurrences.get(page)).toContainEqual({
    text: repaired,
    classification: "unexpected"
  });
});

test("hydration warnings fail both the console gate and the hydration promise", async ({
  page
}) => {
  const errors = captureErrors(page);
  await page.goto("/?hydrate=manual");
  const warning = "Hydration mismatch: intentional negative control";
  await page.evaluate((message) => console.warn(message), warning);
  await expect(page.evaluate(() => window.hydrateFluid())).rejects.toThrow(warning);
  expect(errors).toContain(warning);
  expect(await page.evaluate(() => window.fluidHydrated)).toBe(false);
  expect(await page.evaluate(() => window.fluidHydrationError)).toContain(warning);
});
