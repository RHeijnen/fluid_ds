import { expect, test, type Locator, type Page } from "@playwright/test";

type Foundation = {
  tag: string;
  storyId: string;
};

const foundations: readonly Foundation[] = [
  {
    tag: "fluid-aspect-ratio",
    storyId: "components-layout-aspect-ratio--default"
  },
  {
    tag: "fluid-avatar",
    storyId: "components-content-avatar--initials"
  },
  {
    tag: "fluid-avatar-group",
    storyId: "components-content-avatar-group--default"
  },
  {
    tag: "fluid-badge",
    storyId: "components-content-badge--default"
  },
  {
    tag: "fluid-card",
    storyId: "components-layout-card--default"
  }
];

function collectDiagnostics(page: Page): string[] {
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

async function loadFoundation(page: Page, fixture: Foundation): Promise<Locator> {
  const response = await page.goto(`/iframe.html?id=${fixture.storyId}&viewMode=story`, {
    waitUntil: "domcontentloaded"
  });
  expect(response?.status(), `${fixture.storyId} must return HTTP 200`).toBe(200);
  const host = page.locator("#storybook-root").locator(fixture.tag).first();
  await expect(host, `${fixture.storyId} must render ${fixture.tag}`).toBeAttached();
  await expect
    .poll(
      () =>
        host.evaluate((element) => {
          const definition = customElements.get(element.localName);
          return Boolean(definition && element instanceof definition);
        }),
      { message: `${fixture.tag} must be upgraded` }
    )
    .toBe(true);
  await host.evaluate(async (element) => {
    await (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;
  });
  await page.evaluate(async () => document.fonts?.ready);
  await page.waitForLoadState("networkidle");
  return host;
}

test("foundation fixtures expose their supported public semantics", async ({ page }) => {
  const errors = collectDiagnostics(page);

  let host = await loadFoundation(page, foundations[0]!);
  await expect(host).toContainText("16/9");
  await expect(host.locator("[part=base]")).toBeVisible();

  host = await loadFoundation(page, foundations[1]!);
  await expect(host.getByRole("img", { name: "Ada Lovelace" })).toBeVisible();
  await expect(host.locator("[part=initials]")).toHaveText("AL");

  host = await loadFoundation(page, foundations[2]!);
  await expect(host.getByRole("group", { name: "5 members" })).toBeVisible();
  await expect(host.locator("fluid-avatar")).toHaveCount(5);

  host = await loadFoundation(page, foundations[3]!);
  await expect(host).toContainText("New");

  host = await loadFoundation(page, foundations[4]!);
  await expect(host.getByRole("article")).toBeVisible();
  await expect(host).toContainText("Project status");
  await expect(host.getByRole("button", { name: "Details" })).toBeVisible();
  await expect(host.getByRole("button", { name: "Deploy again" })).toBeVisible();

  expect(errors).toEqual([]);
});

test("foundation fixtures reflow without page-level overflow at 200 percent equivalence", async ({
  page
}) => {
  const errors = collectDiagnostics(page);
  await page.setViewportSize({ width: 640, height: 900 });

  for (const fixture of foundations) {
    const host = await loadFoundation(page, fixture);
    const layout = await host.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        hostRight: box.right,
        hostWidth: box.width,
        viewportWidth: document.documentElement.clientWidth
      };
    });
    expect(layout.viewportWidth).toBe(640);
    expect(layout.documentWidth, `${fixture.tag} creates horizontal overflow`).toBeLessThanOrEqual(
      641
    );
    expect(layout.hostRight).toBeLessThanOrEqual(641);
    expect(layout.hostWidth).toBeGreaterThan(0);
  }

  expect(errors).toEqual([]);
});

test("badge content remains distinguishable in forced-colors mode", async ({ page }) => {
  const errors = collectDiagnostics(page);
  await page.emulateMedia({ forcedColors: "active" });
  const badge = await loadFoundation(page, foundations[3]!);
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
  const base = badge.locator("[part=base]");
  await expect(badge).toContainText("New");
  const colors = await base.evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, foreground: style.color };
  });
  expect(colors.foreground).not.toBe(colors.background);
  expect(errors).toEqual([]);
});
