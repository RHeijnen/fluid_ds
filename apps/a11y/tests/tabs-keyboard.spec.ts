import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/iframe.html?id=components-navigation-tabs--manual&viewMode=story");
  await expect(page.getByRole("tab", { name: "Overview", exact: true })).toHaveAttribute(
    "aria-selected",
    "true"
  );
});

test("manual tabs move focus, skip disabled tabs, and activate with native keys", async ({
  page
}) => {
  const overview = page.getByRole("tab", { name: "Overview", exact: true });
  const usage = page.getByRole("tab", { name: "Usage", exact: true });
  const api = page.getByRole("tab", { name: "API", exact: true });
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(usage).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(api).toBeFocused();
  await expect(overview).toHaveAttribute("aria-selected", "true");
  await expect(api).toHaveAttribute("tabindex", "0");
  await expect(overview).toHaveAttribute("tabindex", "-1");
  await page.keyboard.press("ArrowRight");
  await expect(overview).toBeFocused();
  await page.keyboard.press("End");
  await expect(api).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(api).toHaveAttribute("aria-selected", "true");
  const panel = page.getByRole("tabpanel", { name: "API", exact: true });
  await expect(panel).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(panel).toBeFocused();
});

test("arrow keys inside panel inputs retain native caret behavior", async ({ page }) => {
  await page.locator('fluid-tab-panel[name="overview"]').evaluate((panel) => {
    const input = document.createElement("input");
    input.setAttribute("aria-label", "Panel notes");
    input.value = "hello";
    panel.append(input);
  });
  const input = page.getByRole("textbox", { name: "Panel notes" });
  await input.focus();
  await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(1, 1));
  await page.keyboard.press("ArrowRight");
  await expect(input).toBeFocused();
  expect(await input.evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(2);
  await expect(page.getByRole("tab", { name: "Overview", exact: true })).toHaveAttribute(
    "aria-selected",
    "true"
  );
});

test("manual Space activation works within a consumer shadow root", async ({ page }) => {
  await page.locator("fluid-tabs").evaluate((tabs) => {
    const wrapper = document.createElement("div");
    tabs.before(wrapper);
    wrapper.attachShadow({ mode: "open" }).append(tabs);
  });
  const overview = page.getByRole("tab", { name: "Overview", exact: true });
  const usage = page.getByRole("tab", { name: "Usage", exact: true });
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(usage).toBeFocused();
  await page.keyboard.press("Space");
  await expect(usage).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Usage", exact: true })).toBeVisible();
});
