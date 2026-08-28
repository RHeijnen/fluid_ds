import { expect, test, type Page } from "@playwright/test";

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

test("Dialog story opener supports pointer and keyboard modal lifecycles", async ({ page }) => {
  const errors = diagnostics(page);
  const response = await page.goto(
    "/iframe.html?id=components-feedback-dialog--default&viewMode=story",
    { waitUntil: "networkidle" }
  );
  expect(response?.status()).toBe(200);

  const root = page.locator("#storybook-root");
  const story = root.locator("[data-story]");
  const opener = story.getByRole("button", { name: "Open dialog" });
  const host = story.locator("fluid-dialog");
  await expect(opener, "the opener and dialog must share the lookup scope").toBeAttached();
  await expect(host).toBeAttached();
  await expect
    .poll(() =>
      host.evaluate((element) => {
        const definition = customElements.get(element.localName);
        return Boolean(definition && element instanceof definition);
      })
    )
    .toBe(true);

  const dialog = page.getByRole("dialog", { name: "Confirm action" });
  const close = page.getByRole("button", { name: "Close dialog" });

  await opener.click();
  await expect(host).toHaveAttribute("open");
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(host).not.toHaveAttribute("open");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(host).toHaveAttribute("open");
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(host).not.toHaveAttribute("open");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(errors).toEqual([]);
});
