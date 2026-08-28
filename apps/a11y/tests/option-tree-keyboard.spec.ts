import { test, expect } from "@playwright/test";

test("options skip disabled choices with native keys and preserve value on Escape", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/iframe.html?id=components-forms-select--with-disabled-option&viewMode=story");
  const trigger = page.getByRole("combobox", { name: "Plan" });
  await expect(trigger).toBeVisible();
  await page.locator('fluid-option[value="free"]').evaluate((option) => {
    (option as HTMLElement & { disabled: boolean }).disabled = true;
  });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const pro = page.getByRole("option", { name: "Pro", exact: true });
  await expect(pro).toHaveAttribute("active", "");
  expect(
    await trigger.evaluate((element) =>
      (
        element as HTMLElement & { ariaActiveDescendantElement: Element | null }
      ).ariaActiveDescendantElement?.textContent?.trim()
    )
  ).toBe("Pro");
  await page.keyboard.press("ArrowDown");
  await expect(pro).toHaveAttribute("active", "");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator('fluid-option[value="pro"]')).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Space");
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(
    await trigger.evaluate(
      (element) =>
        (element as HTMLElement & { ariaActiveDescendantElement: Element | null })
          .ariaActiveDescendantElement
    )
  ).toBeNull();
  expect(
    await page
      .locator("fluid-select")
      .evaluate((select) => (select as HTMLElement & { value: string }).value)
  ).toBe("pro");
  expect(errors).toEqual([]);
});

test("tree selection bubbles once and native Tab can leave in both directions", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/iframe.html?id=components-navigation-tree--default&viewMode=story");
  await expect(page.getByRole("tree")).toBeVisible();
  await page.getByRole("tree").evaluate((tree) => {
    const before = document.createElement("button");
    before.textContent = "Before tree";
    const after = document.createElement("button");
    after.textContent = "After tree";
    tree.before(before);
    tree.after(after);
    tree.addEventListener("fluid-select", () => {
      tree.setAttribute(
        "data-selections",
        String(Number(tree.getAttribute("data-selections") ?? 0) + 1)
      );
    });
  });
  await page.getByRole("button", { name: "Before tree" }).focus();
  await page.keyboard.press("Tab");
  const items = page.getByRole("treeitem");
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("End");
  const music = page.getByRole("treeitem", { name: "Music", exact: true });
  await expect(music).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(music).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tree")).toHaveAttribute("data-selections", "1");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After tree" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(music).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Before tree" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  const resume = page.getByRole("treeitem", { name: "Resume.pdf", exact: true });
  await expect(resume).toBeFocused();
  await page.keyboard.press("Space");
  await expect(resume).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tree")).toHaveAttribute("data-selections", "2");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After tree" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(resume).toBeFocused();
  expect(errors).toEqual([]);
});

test("tree keyboard selection and typeahead work inside a consumer shadow root", async ({
  page
}) => {
  await page.goto("/iframe.html?id=components-navigation-tree--default&viewMode=story");
  await expect(page.getByRole("tree")).toBeVisible();
  await page.getByRole("tree").evaluate((tree) => {
    const wrapper = document.createElement("div");
    tree.before(wrapper);
    wrapper.attachShadow({ mode: "open" }).append(tree);
  });
  await page.getByRole("treeitem").first().focus();
  await page.keyboard.press("m");
  const music = page.getByRole("treeitem", { name: "Music", exact: true });
  await expect(music).toBeFocused();
  await page.keyboard.press("Space");
  await expect(music).toHaveAttribute("aria-selected", "true");
  await expect(music).not.toHaveAttribute("aria-expanded");
});
