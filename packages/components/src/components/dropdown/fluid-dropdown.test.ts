import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../button/define.js";
import type { FluidDropdown } from "./fluid-dropdown.js";
import type { FluidDropdownItem } from "./fluid-dropdown-item.js";

const sample = html`
  <fluid-dropdown>
    <button slot="trigger">Open</button>
    <fluid-dropdown-item value="edit">Edit</fluid-dropdown-item>
    <fluid-dropdown-item value="duplicate">Duplicate</fluid-dropdown-item>
    <fluid-dropdown-item type="separator"></fluid-dropdown-item>
    <fluid-dropdown-item value="delete">Delete</fluid-dropdown-item>
  </fluid-dropdown>
`;

describe("<fluid-dropdown>", () => {
  it("starts closed", async () => {
    const el = await fixture<FluidDropdown>(sample);
    expect(el.open).to.be.false;
  });

  it("opens on trigger click", async () => {
    const el = await fixture<FluidDropdown>(sample);
    await el.updateComplete;
    const trigger = el.querySelector<HTMLButtonElement>("button")!;
    setTimeout(() => trigger.click());
    await oneEvent(el, "fluid-show");
    expect(el.open).to.be.true;
  });

  it("commits selection on click + closes", async () => {
    const el = await fixture<FluidDropdown>(sample);
    el.open = true;
    await el.updateComplete;
    const item = el.querySelector<HTMLElement>('fluid-dropdown-item[value="edit"]')!;
    setTimeout(() => item.click());
    const event = (await oneEvent(el, "fluid-select")) as CustomEvent;
    expect(event.detail.value).to.equal("edit");
    expect(el.open).to.be.false;
  });

  it("Escape closes the menu", async () => {
    const el = await fixture<FluidDropdown>(sample);
    el.open = true;
    await el.updateComplete;
    const menu = el.shadowRoot!.querySelector<HTMLElement>(".menu")!;
    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await aTimeout(20);
    expect(el.open).to.be.false;
  });

  it("ArrowDown moves the active item", async () => {
    const el = await fixture<FluidDropdown>(sample);
    el.open = true;
    await el.updateComplete;
    await aTimeout(40);
    const menu = el.shadowRoot!.querySelector<HTMLElement>(".menu")!;
    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    const active = el.querySelector("fluid-dropdown-item[active]");
    expect(active?.getAttribute("value")).to.equal("duplicate");
  });

  it("type-ahead jumps to a matching item", async () => {
    const el = await fixture<FluidDropdown>(sample);
    el.open = true;
    await el.updateComplete;
    await aTimeout(40);
    const menu = el.shadowRoot!.querySelector<HTMLElement>(".menu")!;
    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }));
    await el.updateComplete;
    const active = el.querySelector("fluid-dropdown-item[active]");
    expect(active?.getAttribute("value")).to.equal("duplicate");
  });

  it("checkbox items toggle but don't close", async () => {
    const el = await fixture<FluidDropdown>(html`
      <fluid-dropdown>
        <button slot="trigger">x</button>
        <fluid-dropdown-item type="checkbox" value="bold">Bold</fluid-dropdown-item>
      </fluid-dropdown>
    `);
    el.open = true;
    await el.updateComplete;
    const item = el.querySelector<HTMLElement>("fluid-dropdown-item")!;
    item.click();
    await el.updateComplete;
    expect(item.hasAttribute("checked")).to.be.true;
    expect(el.open).to.be.true;
  });

  /* Rework: override ladder + AAA target floor. */

  it("item text color reads the --fluid-dropdown-item-* override ladder", async () => {
    const el = await fixture<FluidDropdownItem>(
      html`<fluid-dropdown-item>Edit</fluid-dropdown-item>`
    );
    el.style.setProperty("--fluid-dropdown-item-fg", "rgb(1, 2, 3)");
    await el.updateComplete;
    expect(getComputedStyle(el).color).to.equal("rgb(1, 2, 3)");
  });

  it("interactive items respect --fluid-target-min (AAA), separators don't", async () => {
    const item = await fixture<FluidDropdownItem>(
      html`<fluid-dropdown-item>Edit</fluid-dropdown-item>`
    );
    item.style.setProperty("--fluid-target-min", "44px");
    await item.updateComplete;
    expect(item.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);

    const sep = await fixture<FluidDropdownItem>(
      html`<fluid-dropdown-item type="separator"></fluid-dropdown-item>`
    );
    sep.style.setProperty("--fluid-target-min", "44px");
    await sep.updateComplete;
    expect(sep.getBoundingClientRect().height).to.be.lessThan(44);
  });
});
