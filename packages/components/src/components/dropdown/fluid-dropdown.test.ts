import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../button/define.js";
import type {
  FluidDropdown,
  FluidDropdownHideEvent,
  FluidDropdownItem,
  FluidDropdownShowEvent
} from "../../index.js";

// @ts-expect-error Dropdown lifecycle detail is exactly null.
const invalidDropdownEvent: FluidDropdownHideEvent = new CustomEvent("fluid-hide", {
  detail: "closed"
});
void invalidDropdownEvent;

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
  it("keeps checkbox role and checked semantics in sync when type changes", async () => {
    const el = await fixture<FluidDropdownItem>(
      html`<fluid-dropdown-item type="checkbox">Pinned</fluid-dropdown-item>`
    );
    expect(el.getAttribute("role")).to.equal("menuitemcheckbox");
    expect(el.getAttribute("aria-checked")).to.equal("false");
    el.checked = true;
    await el.updateComplete;
    el.type = "item";
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("menuitem");
    expect(el.hasAttribute("aria-checked")).to.be.false;
    el.type = "checkbox";
    await el.updateComplete;
    expect(el.getAttribute("aria-checked")).to.equal("true");
    el.type = "separator";
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("separator");
    expect(el.hasAttribute("aria-checked")).to.be.false;
    expect(el.hasAttribute("aria-disabled")).to.be.false;
  });

  it("resolves the active item across the menu shadow boundary and clears it on close", async () => {
    // Reject an unsupported engine where assignment would merely create a JS
    // expando and falsely appear to verify accessibility element reflection.
    expect("ariaActiveDescendantElement" in Element.prototype).to.be.true;
    const el = await fixture<FluidDropdown>(sample);
    el.show();
    await el.updateComplete;
    await aTimeout(40);
    const menu = el.shadowRoot!.querySelector<HTMLElement>(".menu")! as HTMLElement & {
      ariaActiveDescendantElement: Element | null;
    };
    expect(menu.ariaActiveDescendantElement).to.equal(el.querySelector("fluid-dropdown-item"));
    expect(el.shadowRoot!.activeElement).to.equal(menu);
    el.hide();
    await el.updateComplete;
    expect(menu.ariaActiveDescendantElement).to.equal(null);
  });

  it("does not activate disabled items or separators even through programmatic clicks", async () => {
    const el = await fixture<FluidDropdown>(html`
      <fluid-dropdown>
        <button slot="trigger">Actions</button>
        <fluid-dropdown-item disabled value="blocked">Blocked</fluid-dropdown-item>
        <fluid-dropdown-item type="separator"></fluid-dropdown-item>
      </fluid-dropdown>
    `);
    el.show();
    await el.updateComplete;
    const events: Event[] = [];
    el.addEventListener("fluid-select", (event) => events.push(event));
    for (const item of el.querySelectorAll<HTMLElement>("fluid-dropdown-item")) item.click();
    expect(events).to.have.length(0);
    expect(el.open).to.be.true;
  });

  it("does not steal focus or emit hide on initial closed render", async () => {
    const wrapper = await fixture(html`<div><button>Before</button></div>`);
    const before = wrapper.querySelector("button")!;
    before.focus();
    const el = document.createElement("fluid-dropdown") as FluidDropdown;
    const trigger = document.createElement("button");
    trigger.slot = "trigger";
    trigger.textContent = "Actions";
    el.append(trigger);
    const hides: Event[] = [];
    el.addEventListener("fluid-hide", (event) => hides.push(event));
    wrapper.append(el);
    await el.updateComplete;
    expect(document.activeElement).to.equal(before);
    expect(hides).to.have.length(0);
  });

  it("cancels pending open focus after immediate close", async () => {
    const el = await fixture<FluidDropdown>(sample);
    el.show();
    await el.updateComplete;
    el.hide();
    await el.updateComplete;
    await aTimeout(50);
    expect(el.querySelector("fluid-dropdown-item[active]")).to.equal(null);
    expect(document.activeElement).to.equal(el.querySelector("button"));
  });

  it("passes a11y audits while closed and open", async () => {
    const el = await fixture<FluidDropdown>(sample);
    await expect(el).to.be.accessible();
    el.open = true;
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it("starts closed", async () => {
    const el = await fixture<FluidDropdown>(sample);
    expect(el.open).to.be.false;
  });

  it("opens on trigger click", async () => {
    const el = await fixture<FluidDropdown>(sample);
    await el.updateComplete;
    const trigger = el.querySelector<HTMLButtonElement>("button")!;
    setTimeout(() => trigger.click());
    const event = (await oneEvent(el, "fluid-show")) as FluidDropdownShowEvent;
    expect(event.detail).to.equal(null);
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
    setTimeout(() =>
      menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    );
    const event = (await oneEvent(el, "fluid-hide")) as FluidDropdownHideEvent;
    expect(event.detail).to.equal(null);
    expect(el.open).to.be.false;
  });

  it("ArrowDown moves the active item", async () => {
    const el = await fixture<FluidDropdown>(sample);
    const shown = oneEvent(el, "fluid-show");
    el.show();
    await shown;
    const menu = el.shadowRoot!.querySelector<HTMLElement>(".menu")!;
    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    const active = el.querySelector("fluid-dropdown-item[active]");
    expect(active?.getAttribute("value")).to.equal("duplicate");
  });

  it("recovers active-descendant state when the active item is disabled or removed", async () => {
    expect("ariaActiveDescendantElement" in Element.prototype).to.be.true;
    const el = await fixture<FluidDropdown>(sample);
    el.show();
    await el.updateComplete;
    await aTimeout(40);
    const menu = el.shadowRoot!.querySelector<HTMLElement>(".menu")! as HTMLElement & {
      ariaActiveDescendantElement: Element | null;
    };
    const [edit, duplicate, separator, remove] =
      el.querySelectorAll<FluidDropdownItem>("fluid-dropdown-item");

    edit!.disabled = true;
    await aTimeout(0);
    expect(edit!.active).to.be.false;
    expect(duplicate!.active).to.be.true;
    expect(menu.ariaActiveDescendantElement).to.equal(duplicate);

    duplicate!.remove();
    await aTimeout(0);
    expect(remove!.active).to.be.true;
    expect(menu.ariaActiveDescendantElement).to.equal(remove);

    remove!.type = "separator";
    await aTimeout(0);
    expect(remove!.active).to.be.false;
    expect(separator!.active).to.be.false;
    expect(menu.ariaActiveDescendantElement).to.equal(null);
  });

  it("preserves a valid active item when unrelated items are added", async () => {
    expect("ariaActiveDescendantElement" in Element.prototype).to.be.true;
    const el = await fixture<FluidDropdown>(sample);
    el.show();
    await el.updateComplete;
    await aTimeout(40);
    const menu = el.shadowRoot!.querySelector<HTMLElement>(".menu")! as HTMLElement & {
      ariaActiveDescendantElement: Element | null;
    };
    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const duplicate = el.querySelector<FluidDropdownItem>('[value="duplicate"]')!;
    expect(duplicate.active).to.be.true;

    const added = document.createElement("fluid-dropdown-item") as FluidDropdownItem;
    added.value = "archive";
    added.textContent = "Archive";
    el.append(added);
    await aTimeout(0);

    expect(duplicate.active).to.be.true;
    expect(added.active).to.be.false;
    expect(menu.ariaActiveDescendantElement).to.equal(duplicate);
  });

  it("restores an open dropdown after reconnect without emitting structural lifecycle events", async () => {
    expect("ariaActiveDescendantElement" in Element.prototype).to.be.true;
    const wrapper = await fixture<HTMLDivElement>(html`<div>${sample}</div>`);
    const el = wrapper.querySelector<FluidDropdown>("fluid-dropdown")!;
    const shows: Event[] = [];
    const hides: Event[] = [];
    el.addEventListener("fluid-show", (event) => shows.push(event));
    el.addEventListener("fluid-hide", (event) => hides.push(event));
    el.show();
    await el.updateComplete;
    await aTimeout(40);
    expect(shows).to.have.length(1);

    el.remove();
    wrapper.append(el);
    await aTimeout(40);
    const menu = el.shadowRoot!.querySelector<HTMLElement>(".menu")! as HTMLElement & {
      ariaActiveDescendantElement: Element | null;
      matches(selector: string): boolean;
    };
    const first = el.querySelector<FluidDropdownItem>('[value="edit"]')!;

    expect(el.open).to.be.true;
    expect(el.querySelector("button")!.getAttribute("aria-expanded")).to.equal("true");
    expect(menu.matches(":popover-open")).to.be.true;
    expect(menu.ariaActiveDescendantElement).to.equal(first);
    expect(first.active).to.be.true;
    expect(shows).to.have.length(1);
    expect(hides).to.have.length(0);
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

  /* Lifecycle: disconnect must tear down the document listener + autoUpdate. */

  it("disconnect tears down outside-click handling and autoUpdate cleanup", async () => {
    const el = await fixture<FluidDropdown>(sample);
    el.open = true;
    await el.updateComplete;
    await aTimeout(40);
    expect(el.open).to.be.true;

    // autoUpdate returned a cleanup that the component stored privately; wrap it
    // so we can assert disconnect invokes it.
    let cleanupCalls = 0;
    const original = (el as unknown as { cleanup?: () => void }).cleanup;
    expect(original, "autoUpdate cleanup should be registered while open").to.be.a("function");
    (el as unknown as { cleanup?: () => void }).cleanup = () => {
      cleanupCalls += 1;
      original?.();
    };

    el.remove();

    // (b) autoUpdate's cleanup ran on disconnect.
    expect(cleanupCalls).to.be.greaterThan(0);

    // (a) the captured document pointerdown listener was removed. If it were
    // still registered, this pointerdown (its path excludes the detached
    // element + trigger) would invoke handleOutsideClick -> hide(), flipping
    // open to false. It stays true, proving the listener is gone, and nothing
    // throws.
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await aTimeout(20);
    expect(el.open, "outside-click listener should be removed on disconnect").to.be.true;
  });

  it("settles an outside-pointer close during pending open focus exactly once", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        ${sample}
        <button id="outside">Outside</button>
      </div>
    `);
    const el = wrapper.querySelector<FluidDropdown>("fluid-dropdown")!;
    const outside = wrapper.querySelector<HTMLButtonElement>("#outside")!;
    const hides: Event[] = [];
    el.addEventListener("fluid-hide", (event) => hides.push(event));

    el.show();
    await el.updateComplete;
    outside.focus();
    outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await el.updateComplete;
    await aTimeout(50);

    const menu = el.shadowRoot!.querySelector<HTMLElement>(".menu")! as HTMLElement & {
      ariaActiveDescendantElement: Element | null;
      matches(selector: string): boolean;
    };
    expect(el.open).to.be.false;
    expect(hides).to.have.length(1);
    expect(document.activeElement).to.equal(outside);
    expect(menu.matches(":popover-open")).to.be.false;
    expect(menu.ariaActiveDescendantElement).to.equal(null);
    expect(el.querySelector("button")!.getAttribute("aria-expanded")).to.equal("false");
  });

  it("does not pre-close an inside pointer activation or duplicate its lifecycle events", async () => {
    const el = await fixture<FluidDropdown>(sample);
    const selections: Event[] = [];
    const hides: Event[] = [];
    el.addEventListener("fluid-select", (event) => selections.push(event));
    el.addEventListener("fluid-hide", (event) => hides.push(event));
    el.show();
    await el.updateComplete;
    await aTimeout(40);

    const item = el.querySelector<FluidDropdownItem>('[value="edit"]')!;
    item.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    expect(el.open).to.be.true;
    item.click();
    await el.updateComplete;

    expect(selections).to.have.length(1);
    expect((selections[0] as CustomEvent<{ value: string }>).detail.value).to.equal("edit");
    expect(hides).to.have.length(1);
    expect(el.open).to.be.false;
  });

  it("keeps a standalone item inert and adopts it when inserted into a dropdown", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <fluid-dropdown-item value="adopted">Adopted</fluid-dropdown-item>
        <fluid-dropdown><button slot="trigger">Actions</button></fluid-dropdown>
      </div>
    `);
    const item = wrapper.querySelector<FluidDropdownItem>("fluid-dropdown-item")!;
    const el = wrapper.querySelector<FluidDropdown>("fluid-dropdown")!;
    const selections: Event[] = [];
    wrapper.addEventListener("fluid-select", (event) => selections.push(event));
    item.click();
    item.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true })
    );
    expect(item.tabIndex).to.equal(-1);
    expect(selections).to.have.length(0);

    el.append(item);
    el.show();
    await el.updateComplete;
    await aTimeout(40);
    item.click();
    await el.updateComplete;

    expect(selections).to.have.length(1);
    expect((selections[0] as CustomEvent<{ value: string }>).detail.value).to.equal("adopted");
    expect(el.open).to.be.false;
  });
});
