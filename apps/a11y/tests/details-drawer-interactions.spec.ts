import { expect, test, type Locator, type Page } from "@playwright/test";

function diagnostics(page: Page): string[] {
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

async function loadStory(page: Page, storyId: string, tag: string): Promise<Locator> {
  const response = await page.goto(`/iframe.html?id=${storyId}&viewMode=story`, {
    waitUntil: "domcontentloaded"
  });
  expect(response?.status(), `${storyId} must return HTTP 200`).toBe(200);

  const host = page.locator("#storybook-root").locator(tag).first();
  await expect(host, `${storyId} must render ${tag}`).toBeAttached();
  await expect
    .poll(() =>
      host.evaluate((element) => {
        const definition = customElements.get(element.localName);
        return Boolean(definition && element instanceof definition);
      })
    )
    .toBe(true);
  await host.evaluate(async (element) => {
    await (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;
  });
  return host;
}

test("Details returns focus to its disclosure when focused content is collapsed", async ({
  page
}) => {
  const errors = diagnostics(page);
  const details = await loadStory(
    page,
    "components-navigation-accordion--default",
    "fluid-details"
  );

  const action = details.locator("button[data-focus-probe]");
  await details.evaluate((element) => {
    const button = document.createElement("button");
    button.dataset.focusProbe = "";
    button.textContent = "Focused action";
    element.append(button);
  });
  await action.focus();
  await expect(action).toBeFocused();

  await details.evaluate(async (element) => {
    const disclosure = element as HTMLElement & {
      hide(): void;
      updateComplete?: Promise<unknown>;
    };
    disclosure.hide();
    await disclosure.updateComplete;
  });

  await expect(details).not.toHaveAttribute("open");
  await expect(details.locator("[part=body]")).toBeHidden();
  await expect(details.locator("[part=summary]")).toBeFocused();
  expect(errors).toEqual([]);
});

test("Drawer gives authored autofocus content priority when it opens", async ({ page }) => {
  const errors = diagnostics(page);
  const drawer = await loadStory(
    page,
    "components-feedback-drawer--all-placements",
    "fluid-drawer"
  );

  const action = drawer.locator("button[data-autofocus-probe]");
  await drawer.evaluate((element) => {
    const button = document.createElement("button");
    button.autofocus = true;
    button.dataset.autofocusProbe = "";
    button.textContent = "Apply filters";
    element.append(button);
  });

  const opener = page
    .locator("#storybook-root [data-story]")
    .getByRole("button", { name: "Open start" });
  await opener.click();

  await expect(drawer).toHaveAttribute("open");
  await expect(action).toBeFocused();
  expect(errors).toEqual([]);
});
