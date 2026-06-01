import {
  expect,
  fixture,
  html,
  oneEvent,
  elementUpdated,
  aTimeout
} from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import type { FluidMenu } from "./fluid-menu.js";
import type { FluidMenuItem } from "./fluid-menu-item.js";

const basicMenu = () => html`
  <fluid-menu aria-label="Actions">
    <fluid-menu-item value="new">New</fluid-menu-item>
    <fluid-menu-item value="open">Open</fluid-menu-item>
    <fluid-menu-item value="save" disabled>Save</fluid-menu-item>
    <fluid-menu-item value="delete">Delete</fluid-menu-item>
  </fluid-menu>
`;

const items = (el: FluidMenu): FluidMenuItem[] =>
  Array.from(el.querySelectorAll<FluidMenuItem>("fluid-menu-item"));

describe("<fluid-menu>", () => {
  it("renders role=menu and items as role=menuitem", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    expect(el.shadowRoot!.querySelector('[role="menu"]')).to.exist;
    for (const item of items(el)) {
      expect(item.getAttribute("role")).to.equal("menuitem");
    }
  });

  it("uses the aria-label as the menu's accessible name", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    const menu = el.shadowRoot!.querySelector('[role="menu"]')!;
    expect(menu.getAttribute("aria-label")).to.equal("Actions");
  });

  it("seeds a roving tabindex (only one item tabbable)", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    const tabbable = items(el).filter((i) => i.tabIndex === 0);
    expect(tabbable.length).to.equal(1);
    // First enabled item is the initial tab stop.
    expect(tabbable[0]!.value).to.equal("new");
  });

  it("reflects aria-disabled on disabled items", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    const save = items(el).find((i) => i.value === "save")!;
    expect(save.getAttribute("aria-disabled")).to.equal("true");
    expect(save.tabIndex).to.equal(-1);
  });

  it("fires fluid-select with the item value on click", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    const open = items(el).find((i) => i.value === "open")!;
    setTimeout(() => open.click());
    const event = await oneEvent(el, "fluid-select");
    expect(event.detail.value).to.equal("open");
  });

  it("fires fluid-select exactly once on click (no double dispatch)", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    let count = 0;
    el.addEventListener("fluid-select", () => count++);
    items(el).find((i) => i.value === "open")!.click();
    await aTimeout(0);
    expect(count).to.equal(1);
  });

  it("does not fire fluid-select when a disabled item is clicked", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    let fired = false;
    el.addEventListener("fluid-select", () => (fired = true));
    items(el).find((i) => i.value === "save")!.click();
    await aTimeout(0);
    expect(fired).to.be.false;
  });

  it("ArrowDown moves the active item, skipping disabled", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus();
    await sendKeys({ press: "ArrowDown" }); // new -> open
    expect(items(el).find((i) => i.active)!.value).to.equal("open");
    await sendKeys({ press: "ArrowDown" }); // open -> (skip save) -> delete
    expect(items(el).find((i) => i.active)!.value).to.equal("delete");
  });

  it("ArrowUp wraps to the last enabled item", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus(); // active = new
    await sendKeys({ press: "ArrowUp" }); // wrap to last enabled = delete
    expect(items(el).find((i) => i.active)!.value).to.equal("delete");
  });

  it("Home/End jump to first and last enabled items", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus();
    await sendKeys({ press: "End" });
    expect(items(el).find((i) => i.active)!.value).to.equal("delete");
    await sendKeys({ press: "Home" });
    expect(items(el).find((i) => i.active)!.value).to.equal("new");
  });

  it("Enter activates the focused item", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus(); // active = new
    setTimeout(() => sendKeys({ press: "Enter" }));
    const event = await oneEvent(el, "fluid-select");
    expect(event.detail.value).to.equal("new");
  });

  it("type-ahead jumps to the next matching item", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus();
    await sendKeys({ press: "d" }); // -> delete
    expect(items(el).find((i) => i.active)!.value).to.equal("delete");
  });

  it("treats fluid-menu-label as presentational (skipped)", async () => {
    const el = await fixture<FluidMenu>(html`
      <fluid-menu aria-label="Grouped">
        <fluid-menu-label>Group</fluid-menu-label>
        <fluid-menu-item value="a">A</fluid-menu-item>
        <fluid-menu-item value="b">B</fluid-menu-item>
      </fluid-menu>
    `);
    await elementUpdated(el);
    const label = el.querySelector("fluid-menu-label")!;
    expect(label.getAttribute("role")).to.equal("presentation");
    el.focus();
    await sendKeys({ press: "ArrowDown" }); // a -> b, never lands on the label
    expect(items(el).find((i) => i.active)!.value).to.equal("b");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidMenu>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-motion:0;"
      >
        <fluid-menu aria-label="Actions">
          <fluid-menu-label>Group</fluid-menu-label>
          <fluid-menu-item value="new">New</fluid-menu-item>
          <fluid-menu-item value="open">Open</fluid-menu-item>
          <fluid-menu-item value="save" disabled>Save</fluid-menu-item>
        </fluid-menu>
      </div>
    `);
    const menu = el.querySelector<FluidMenu>("fluid-menu")!;
    await elementUpdated(menu);
    await aTimeout(20);
    await expect(menu).to.be.accessible();
  });
});
