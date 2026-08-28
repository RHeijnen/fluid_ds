import { test, expect, type Page } from "@playwright/test";

async function mount(page: Page, story: string, tag: string, markup: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`/iframe.html?id=${story}&viewMode=story`);
  await expect(page.locator(tag).first()).toBeAttached();
  await page.waitForFunction((name) => Boolean(document.querySelector(name)?.shadowRoot), tag);
  await page.evaluate((html) => {
    const template = document.createElement("template");
    template.innerHTML = html;
    document.querySelector("#storybook-root")!.replaceChildren(template.content);
  }, markup);
  return errors;
}

test("dropdown items toggle, report active focus and let native Tab leave in either direction", async ({
  page
}) => {
  const errors = await mount(
    page,
    "components-navigation-dropdown--default",
    "fluid-dropdown",
    `
    <button>Before actions</button>
    <fluid-dropdown>
      <button slot="trigger">Project actions</button>
      <fluid-dropdown-item disabled value="blocked">Unavailable</fluid-dropdown-item>
      <fluid-dropdown-item type="checkbox" value="pin">Pin project</fluid-dropdown-item>
      <fluid-dropdown-item type="separator"></fluid-dropdown-item>
      <fluid-dropdown-item value="archive">Archive project</fluid-dropdown-item>
    </fluid-dropdown>
    <button>After actions</button>
  `
  );
  const dropdown = page.locator("fluid-dropdown");
  await dropdown.evaluate((element) =>
    element.addEventListener("fluid-select", (event) => {
      element.setAttribute(
        "data-values",
        `${element.getAttribute("data-values") ?? ""}${(event as CustomEvent).detail.value},`
      );
    })
  );
  const trigger = page.getByRole("button", { name: "Project actions" });
  await page.getByRole("button", { name: "Before actions" }).focus();
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeFocused();
  const pin = page.getByRole("menuitemcheckbox", { name: "Pin project" });
  await expect(pin).toHaveAttribute("active", "");
  expect(
    await menu.evaluate((element) =>
      (
        element as HTMLElement & { ariaActiveDescendantElement: Element | null }
      ).ariaActiveDescendantElement?.getAttribute("value")
    )
  ).toBe("pin");
  await page.keyboard.press("Space");
  await expect(pin).toHaveAttribute("aria-checked", "true");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitem", { name: "Archive project" })).toHaveAttribute(
    "active",
    ""
  );
  await page.keyboard.press("Enter");
  await expect(trigger).toBeFocused();
  await expect(dropdown).toHaveAttribute("data-values", "pin,archive,");
  await page.keyboard.press("ArrowDown");
  await expect(menu).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After actions" })).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Shift+Tab");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Before actions" })).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(errors).toEqual([]);
});

test("list row and trailing action have separate native keyboard targets and link semantics", async ({
  page
}) => {
  const errors = await mount(
    page,
    "components-content-list--interactive",
    "fluid-list",
    `
    <button>Before projects</button>
    <fluid-list label="Projects" style="--fluid-list-item-focus-ring-color: rgb(18, 52, 86); --fluid-focus-ring-width: 3px">
      <fluid-list-item interactive>Alpha<button slot="trailing">Archive Alpha</button></fluid-list-item>
      <fluid-list-item interactive disabled>Unavailable project</fluid-list-item>
      <fluid-list-item href="#project-details">Project details</fluid-list-item>
    </fluid-list>
    <button>After projects</button>
  `
  );
  await page.locator("fluid-list").evaluate((list) => {
    list.addEventListener("fluid-select", () =>
      list.setAttribute(
        "data-selections",
        String(Number(list.getAttribute("data-selections") ?? 0) + 1)
      )
    );
    list
      .querySelector("button")!
      .addEventListener("click", () => list.setAttribute("data-archived", "true"));
  });
  await page.getByRole("button", { name: "Before projects" }).focus();
  await page.keyboard.press("Tab");
  const alpha = page.getByRole("button", { name: "Alpha", exact: true });
  await expect(alpha).toBeFocused();
  await expect(alpha).toHaveCSS("outline-width", "3px");
  await expect(alpha).toHaveCSS("outline-color", "rgb(18, 52, 86)");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(page.locator("fluid-list")).toHaveAttribute("data-selections", "2");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Archive Alpha" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("fluid-list")).toHaveAttribute("data-archived", "true");
  await expect(page.locator("fluid-list")).toHaveAttribute("data-selections", "2");
  await page.keyboard.press("Tab");
  const link = page.getByRole("link", { name: "Project details" });
  await expect(link).toBeFocused();
  const before = page.url();
  await page.keyboard.press("Space");
  expect(page.url()).toBe(before);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#project-details$/);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After projects" })).toBeFocused();
  expect(errors).toEqual([]);
});

test("navigation lists keep natural link order across landmarks and dynamic items", async ({
  page
}) => {
  const errors = await mount(
    page,
    "components-navigation-nav-list--default",
    "fluid-nav-list",
    `
    <button>Before navigation</button>
    <fluid-nav-list label="Workspace navigation">
      <fluid-nav-item href="#overview" current>Overview</fluid-nav-item>
      <fluid-nav-item>No destination</fluid-nav-item>
    </fluid-nav-list>
    <fluid-nav-list label="Account navigation"><fluid-nav-item href="#profile">Profile</fluid-nav-item></fluid-nav-list>
    <button>After navigation</button>
  `
  );
  await page
    .locator("fluid-nav-list")
    .first()
    .evaluate((list) => {
      const item = document.createElement("fluid-nav-item");
      item.setAttribute("href", "#settings");
      item.textContent = "Settings";
      list.append(item);
      list.setAttribute("label", "Project navigation");
    });
  await expect(page.getByRole("navigation", { name: "Project navigation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Account navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Before navigation" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Overview" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Settings" })).toBeFocused();
  const before = page.url();
  await page.keyboard.press("Space");
  expect(page.url()).toBe(before);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#settings$/);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Profile" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After navigation" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("link", { name: "Profile" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("link", { name: "Settings" })).toBeFocused();
  expect(errors).toEqual([]);
});

test("clickable steps request changes once per native activation and preserve controlled state", async ({
  page
}) => {
  const errors = await mount(
    page,
    "components-navigation-steps--clickable",
    "fluid-steps",
    `
    <button>Before checkout</button>
    <fluid-steps clickable current="1" aria-label="Checkout">
      <fluid-step>Account</fluid-step><fluid-step>Delivery</fluid-step><fluid-step>Payment</fluid-step>
    </fluid-steps>
    <button>After checkout</button>
  `
  );
  const steps = page.locator("fluid-steps");
  await steps.evaluate((element) =>
    element.addEventListener("fluid-step-change", (event) => {
      element.setAttribute(
        "data-indices",
        `${element.getAttribute("data-indices") ?? ""}${(event as CustomEvent).detail.index},`
      );
    })
  );
  await page.getByRole("button", { name: "Before checkout" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Account", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(steps).toHaveAttribute("data-indices", "0,");
  await expect(steps).toHaveAttribute("current", "1");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /Payment/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(steps).toHaveAttribute("data-indices", "0,2,");
  await steps.evaluate((element) => element.setAttribute("current", "2"));
  await expect(page.locator("fluid-step").nth(2)).toHaveAttribute("aria-current", "step");
  await expect(page.locator("fluid-step").nth(1)).not.toHaveAttribute("aria-current");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After checkout" })).toBeFocused();
  await steps.evaluate((element) => element.removeAttribute("clickable"));
  await expect(steps.getByRole("button")).toHaveCount(0);
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Before checkout" })).toBeFocused();
  expect(errors).toEqual([]);
});
