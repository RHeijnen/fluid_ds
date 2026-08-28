import { test, expect } from "@playwright/test";

test("context menu opens with native keys, skips disabled activation, and closes on Tab", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-navigation-interaction-contracts--context-menu-keyboard-fixture&viewMode=story"
  );
  const context = page.locator("fluid-context-menu");
  const trigger = page.getByRole("button", { name: "Document actions", exact: true });
  await expect(trigger).toBeVisible();
  await context.evaluate((element) => {
    element.addEventListener("fluid-select", (event) => {
      element.setAttribute("data-value", (event as CustomEvent<{ value: string }>).detail.value);
      element.setAttribute(
        "data-select-count",
        String(Number(element.getAttribute("data-select-count") ?? 0) + 1)
      );
    });
  });
  await trigger.focus();
  await page.keyboard.press("Shift+F10");
  await expect(page.getByRole("menuitem", { name: "Cut", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  const copy = page.getByRole("menuitem", { name: "Copy", exact: true });
  await expect(copy).toBeFocused();
  await page.keyboard.press("Space");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await expect(context).toHaveAttribute("data-value", "copy");
  await expect(context).toHaveAttribute("data-select-count", "1");
  await trigger.click({ button: "right" });
  await expect(copy).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After context menu" })).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await page.keyboard.press("Shift+F10");
  await expect(copy).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(context).toHaveAttribute("data-select-count", "1");
  expect(errors).toEqual([]);
});

for (const direction of ["ltr", "rtl"] as const) {
  test(`scroller supports native horizontal keyboard scrolling and logical fades (${direction})`, async ({
    page
  }) => {
    await page.goto(
      "/iframe.html?id=quality-navigation-interaction-contracts--scroller-keyboard-fixture&viewMode=story"
    );
    const scroller = page.locator("fluid-scroller");
    await expect(scroller).toBeVisible();
    await scroller.evaluate((element, dir) => {
      element.setAttribute("dir", dir);
    }, direction);
    const container = scroller.locator(".container");
    const startFade = scroller.locator(".fade.start");
    const endFade = scroller.locator(".fade.end");
    await page.getByRole("button", { name: "Before scroller" }).focus();
    await page.keyboard.press("Tab");
    await expect(container).toBeFocused();
    await expect(startFade).not.toHaveAttribute("data-visible");
    await expect(endFade).toHaveAttribute("data-visible", "");
    await page.keyboard.press(direction === "rtl" ? "ArrowLeft" : "ArrowRight");
    await expect
      .poll(() => container.evaluate((element) => Math.abs(element.scrollLeft)))
      .toBeGreaterThan(0);
    await expect(startFade).toHaveAttribute("data-visible", "");
    // Native Tab focuses slotted controls and scrolls them into view.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "First scroll action" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Last scroll action" })).toBeFocused();
    await expect
      .poll(() => container.evaluate((element) => Math.abs(element.scrollLeft)))
      .toBeGreaterThan(600);
    await expect(startFade).toHaveAttribute("data-visible", "");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "After scroller" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "First scroll action" })).toBeFocused();
    await expect.poll(() => container.evaluate((element) => Math.abs(element.scrollLeft))).toBe(0);
    await expect(startFade).not.toHaveAttribute("data-visible");
  });
}

test("nonmodal tour lets native Tab leave, announces steps, finishes once and restores focus", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-navigation-interaction-contracts--tour-keyboard-fixture&viewMode=story"
  );
  const tour = page.locator("fluid-tour");
  const start = page.getByRole("button", { name: "Start tour" });
  await expect(start).toBeVisible();
  await tour.evaluate((element) => {
    element.addEventListener("fluid-finish", () => {
      element.setAttribute(
        "data-finish-count",
        String(Number(element.getAttribute("data-finish-count") ?? 0) + 1)
      );
    });
  });
  await start.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "First step" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription("Review the first target.");
  await expect(dialog).not.toHaveAttribute("aria-modal");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After tour", exact: true })).toBeFocused();
  await expect(tour).not.toHaveAttribute("open");
  await start.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Second step" })).toBeVisible();
  await expect(tour.getByRole("status")).toContainText("Second step");
  await expect(page.getByRole("button", { name: "Done", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tour).not.toHaveAttribute("open");
  await expect(start).toBeFocused();
  await expect(tour).toHaveAttribute("data-finish-count", "1");
  await start.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tour).not.toHaveAttribute("open");
  await expect(start).toBeFocused();
  await expect(tour).toHaveAttribute("data-finish-count", "1");
  expect(errors).toEqual([]);
});

test("mosaic preserves slotted DOM focus order through dynamic column reflow", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=quality-navigation-interaction-contracts--mosaic-layout-fixture&viewMode=story"
  );
  const mosaic = page.locator("fluid-mosaic");
  await expect(mosaic).toBeVisible();
  await expect
    .poll(() =>
      mosaic.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)
    )
    .toBe(2);
  for (const columns of [2, 1]) {
    if (columns === 1) {
      await page.getByRole("button", { name: "Use one column" }).click();
      await expect
        .poll(() =>
          mosaic.evaluate(
            (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length
          )
        )
        .toBe(1);
    }
    await page.getByRole("button", { name: "Before mosaic" }).focus();
    for (const name of [
      "First mosaic action",
      "Second mosaic action",
      "Third mosaic action",
      "After mosaic"
    ]) {
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name, exact: true })).toBeFocused();
    }
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Third mosaic action" })).toBeFocused();
  }
});
