import { test, expect } from "@playwright/test";

test("menu-item native activation does not poison subsequent typeahead", async ({ page }) => {
  await page.goto("/iframe.html?id=components-navigation-menu--default&viewMode=story");
  const first = page.getByRole("menuitem", { name: "New file", exact: true });
  const open = page.getByRole("menuitem", { name: "Open…", exact: true });
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(open).toBeFocused();
  await page.locator("fluid-menu").evaluate((menu) => {
    menu.addEventListener("fluid-select", (event) => {
      menu.setAttribute(
        "data-last-selection",
        (event as CustomEvent<{ value: string }>).detail.value
      );
    });
  });
  await page.keyboard.press("Space");
  await expect(page.locator("fluid-menu")).toHaveAttribute("data-last-selection", "open");
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  await page.keyboard.press("o");
  await expect(open).toBeFocused();
});

test("segment native arrows update selection and skip disabled options", async ({ page }) => {
  await page.goto("/iframe.html?id=components-navigation-segmentedcontrol--default&viewMode=story");
  const segments = page.locator("fluid-segment");
  await expect(segments.first()).toHaveAttribute("aria-checked", "true");
  await segments.nth(1).evaluate((element) => {
    (element as HTMLElement & { disabled: boolean }).disabled = true;
  });
  await expect(segments.nth(1)).toHaveAttribute("aria-disabled", "true");
  await segments.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(segments.nth(2)).toBeFocused();
  await expect(segments.nth(2)).toHaveAttribute("aria-checked", "true");
  await expect(segments.first()).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("ArrowRight");
  await expect(segments.first()).toBeFocused();
  await expect(segments.first()).toHaveAttribute("aria-checked", "true");
});
