import { expect, test, type Locator, type Page } from "@playwright/test";

type Candidate = {
  tag: string;
  storyId: string;
  probe: string;
};

const candidates: Candidate[] = [
  {
    tag: "fluid-button",
    storyId: "components-forms-button--primary",
    probe: "button"
  },
  {
    tag: "fluid-input",
    storyId: "components-forms-input--default",
    probe: "input"
  },
  {
    tag: "fluid-checkbox",
    storyId: "components-forms-checkbox--default",
    probe: ".control"
  },
  {
    tag: "fluid-dialog",
    storyId: "components-feedback-dialog--default",
    probe: ".panel"
  },
  {
    tag: "fluid-tabs",
    storyId: "components-navigation-tabs--default",
    probe: "fluid-tab"
  }
];

function diagnostics(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      errors.push(`console ${message.type()}: ${message.text()}`);
    }
  });
  page.on("requestfailed", (request) =>
    errors.push(`request: ${request.url()} ${request.failure()?.errorText ?? ""}`)
  );
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  return errors;
}

async function loadCandidate(page: Page, candidate: Candidate) {
  const response = await page.goto(`/iframe.html?id=${candidate.storyId}&viewMode=story`, {
    waitUntil: "domcontentloaded"
  });
  expect(response?.status(), `${candidate.storyId} must return HTTP 200`).toBe(200);
  await page.waitForFunction(
    () => (document.getElementById("storybook-root")?.childElementCount ?? 0) > 0
  );
  const host = page.locator("#storybook-root").locator(candidate.tag).first();
  await expect(host, `${candidate.storyId} must render ${candidate.tag}`).toBeAttached();
  await expect
    .poll(
      () =>
        host.evaluate((element) => {
          const definition = customElements.get(element.localName);
          return Boolean(definition && element instanceof definition);
        }),
      { message: `${candidate.tag} must be upgraded` }
    )
    .toBe(true);
  await host.evaluate(async (element) => {
    await (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;
  });
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });
  await page.waitForLoadState("networkidle");
  return host;
}

async function appearance(probe: Locator) {
  return probe.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.backgroundColor, style.borderColor, style.color];
  });
}

test("candidate hosts upgrade and render distinct light and dark appearances", async ({ page }) => {
  const errors = diagnostics(page);
  for (const candidate of candidates) {
    const host = await loadCandidate(page, candidate);
    const probe = host.locator(candidate.probe).first();
    await expect(probe, `${candidate.tag} needs a rendered style probe`).toBeAttached();
    await page.evaluate(() => document.documentElement.setAttribute("data-fluid-theme", "light"));
    const light = await appearance(probe);
    await page.evaluate(() => document.documentElement.setAttribute("data-fluid-theme", "dark"));
    await expect
      .poll(() => appearance(probe), { message: `${candidate.tag} did not adopt dark tokens` })
      .not.toEqual(light);
  }
  expect(errors).toEqual([]);
});

test("forced-colors mode retains a distinguishable keyboard focus indicator", async ({ page }) => {
  const errors = diagnostics(page);
  await page.emulateMedia({ forcedColors: "active" });
  const host = await loadCandidate(page, candidates[0]!);
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
  const button = host.locator("button");
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  const focus = await button.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      color: style.color,
      outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth)
    };
  });
  expect(focus.color).not.toBe(focus.background);
  expect(focus.outlineStyle).not.toBe("none");
  expect(focus.outlineWidth).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("RTL changes tab geometry and logical arrow navigation without changing DOM order", async ({
  page
}) => {
  const errors = diagnostics(page);
  const tabs = await loadCandidate(page, candidates[4]!);
  await page.evaluate(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  });
  await expect
    .poll(() => tabs.evaluate((element) => getComputedStyle(element).direction))
    .toBe("rtl");
  const items = tabs.getByRole("tab");
  const overview = items.filter({ hasText: "Overview" });
  const usage = items.filter({ hasText: "Usage" });
  const [overviewBox, usageBox] = await Promise.all([overview.boundingBox(), usage.boundingBox()]);
  expect(overviewBox!.x).toBeGreaterThan(usageBox!.x);
  await overview.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(usage).toBeFocused();
  await expect(usage).toHaveAttribute("aria-selected", "true");
  expect(
    await tabs
      .locator("fluid-tab")
      .evaluateAll((elements) => elements.map((item) => item.textContent?.trim()))
  ).toEqual(["Overview", "Usage", "API", "Changelog"]);
  expect(errors).toEqual([]);
});

test("reduced-motion mode removes candidate control transitions", async ({ page }) => {
  const errors = diagnostics(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const checkbox = await loadCandidate(page, candidates[2]!);
  const control = checkbox.locator(".control");
  const normal = await control.evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(normal).not.toBe("0s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
    true
  );
  await expect
    .poll(() => control.evaluate((element) => getComputedStyle(element).transitionDuration))
    .toBe("0s");
  expect(errors).toEqual([]);
});

test("candidate fixtures reflow at a 200 percent zoom-equivalent viewport", async ({ page }) => {
  const errors = diagnostics(page);
  // A 640 CSS-pixel viewport is the layout viewport produced by 200% zoom
  // from the 1280px desktop baseline. Playwright has no cross-engine page-zoom
  // API, so this asserts reflow equivalence rather than claiming native zoom UI.
  await page.setViewportSize({ width: 640, height: 900 });
  for (const candidate of candidates) {
    await loadCandidate(page, candidate);
    const layout = await page.evaluate((tag) => {
      const element = document.querySelector(`#storybook-root ${tag}`)!;
      const box = element.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        hostRight: box.right,
        hostWidth: box.width,
        viewportWidth: document.documentElement.clientWidth
      };
    }, candidate.tag);
    expect(layout.viewportWidth).toBe(640);
    expect(
      layout.documentWidth,
      `${candidate.tag} creates page-level horizontal overflow`
    ).toBeLessThanOrEqual(641);
    expect(layout.hostRight).toBeLessThanOrEqual(641);
    if (candidate.tag !== "fluid-dialog") expect(layout.hostWidth).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});

test("candidate controls support keyboard-only operation", async ({ page }) => {
  const errors = diagnostics(page);

  let host = await loadCandidate(page, candidates[0]!);
  await host.evaluate((element) =>
    element.addEventListener("click", () => element.setAttribute("data-clicked", "true"))
  );
  await page.keyboard.press("Tab");
  await expect(host.locator("button")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(host).toHaveAttribute("data-clicked", "true");

  host = await loadCandidate(page, candidates[1]!);
  await page.keyboard.press("Tab");
  const input = host.locator("input");
  await expect(input).toBeFocused();
  await page.keyboard.type("Keyboard value");
  await expect(input).toHaveValue("Keyboard value");

  host = await loadCandidate(page, candidates[2]!);
  await page.keyboard.press("Tab");
  await expect(host.locator("input")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(host).toHaveAttribute("checked");

  host = await loadCandidate(page, candidates[4]!);
  await page.keyboard.press("Tab");
  const overview = host.getByRole("tab", { name: "Overview" });
  const usage = host.getByRole("tab", { name: "Usage" });
  await expect(overview).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(usage).toBeFocused();
  await expect(usage).toHaveAttribute("aria-selected", "true");
  expect(errors).toEqual([]);
});
