import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
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
  it("navigates from direct keyboard focus instead of an unrelated hover highlight", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    const [first, open, , last] = items(el);
    first!.focus();
    await sendKeys({ press: "ArrowDown" });
    expect(document.activeElement).to.equal(open);
    last!.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, composed: true }));
    expect(last!.active).to.be.true;
    await sendKeys({ press: "ArrowDown" });
    expect(document.activeElement).to.equal(last);
    expect(last!.tabIndex).to.equal(0);
    expect(open!.tabIndex).to.equal(-1);
  });

  it("does not add an item activation Space to subsequent typeahead", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    const [first, open] = items(el);
    open!.focus();
    open!.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true, composed: true, cancelable: true })
    );
    first!.focus();
    first!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "o", bubbles: true, composed: true, cancelable: true })
    );
    expect(document.activeElement).to.equal(open);
  });
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
    items(el)
      .find((i) => i.value === "open")!
      .click();
    await aTimeout(0);
    expect(count).to.equal(1);
  });

  it("does not fire fluid-select when a disabled item is clicked", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    let fired = false;
    el.addEventListener("fluid-select", () => (fired = true));
    items(el)
      .find((i) => i.value === "save")!
      .click();
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

  it("moves active focus and the roving tab stop when the current item is disabled", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus();
    const [first, open] = items(el);
    expect(document.activeElement).to.equal(first);
    first!.disabled = true;
    await aTimeout(0);

    expect(first!.active).to.be.false;
    expect(first!.tabIndex).to.equal(-1);
    expect(first!.getAttribute("aria-disabled")).to.equal("true");
    expect(open!.active).to.be.true;
    expect(open!.tabIndex).to.equal(0);
    expect(document.activeElement).to.equal(open);
  });

  it("preserves the current roving item when unrelated items are inserted", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus();
    await sendKeys({ press: "ArrowDown" });
    const open = items(el).find((item) => item.value === "open")!;

    const added = document.createElement("fluid-menu-item") as FluidMenuItem;
    added.value = "archive";
    added.textContent = "Archive";
    el.prepend(added);
    await aTimeout(0);

    expect(open.active).to.be.true;
    expect(open.tabIndex).to.equal(0);
    expect(document.activeElement).to.equal(open);
    expect(added.active).to.be.false;
    expect(added.tabIndex).to.equal(-1);
    expect(items(el).filter((item) => item.tabIndex === 0)).to.deep.equal([open]);
  });

  it("adopts child state changed while disconnected on reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div>${basicMenu()}</div>`);
    const el = wrapper.querySelector<FluidMenu>("fluid-menu")!;
    await elementUpdated(el);
    el.focus();
    const [first, open] = items(el);
    el.remove();
    first!.disabled = true;
    const added = document.createElement("fluid-menu-item") as FluidMenuItem;
    added.value = "archive";
    added.textContent = "Archive";
    el.append(added);
    wrapper.append(el);
    await aTimeout(0);

    expect(first!.active).to.be.false;
    expect(first!.tabIndex).to.equal(-1);
    expect(open!.tabIndex).to.equal(0);
    expect(items(el).filter((item) => item.tabIndex === 0)).to.deep.equal([open]);

    let selected = "";
    el.addEventListener("fluid-select", (event) => {
      selected = (event as CustomEvent<{ value: string }>).detail.value;
    });
    open!.click();
    expect(selected).to.equal("open");
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
    const [event] = await Promise.all([oneEvent(el, "fluid-select"), sendKeys({ press: "Enter" })]);
    expect(event.detail.value).to.equal("new");
  });

  it("type-ahead jumps to the next matching item", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus();
    await sendKeys({ press: "d" }); // -> delete
    expect(items(el).find((i) => i.active)!.value).to.equal("delete");
  });

  it("clears the type-ahead timer on disconnect (no stray timer)", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus();
    // Start the 500ms type-ahead timer.
    await sendKeys({ press: "d" });
    const cleared: ReturnType<typeof setTimeout>[] = [];
    const realClearTimeout = window.clearTimeout;
    window.clearTimeout = ((id: ReturnType<typeof setTimeout>) => {
      cleared.push(id);
      return realClearTimeout(id);
    }) as typeof window.clearTimeout;
    try {
      el.remove();
    } finally {
      window.clearTimeout = realClearTimeout;
    }
    // disconnectedCallback must clear the pending type-ahead timer.
    expect(cleared.length).to.be.greaterThan(0);
    // Wait past the 500ms window: the timer must not run after teardown.
    await aTimeout(550);
    // Genuinely re-attach (appendChild fires connectedCallback) so focus + keys
    // reach the element; the type-ahead buffer must start clean, so a fresh "o"
    // selects "open" rather than continuing the stale "d" -> "delete" match.
    document.body.appendChild(el);
    await elementUpdated(el);
    el.focus();
    await sendKeys({ press: "o" });
    expect(items(el).find((i) => i.active)!.value).to.equal("open");
    el.remove();
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

  it("cycles repeated-character typeahead forward, wraps, and skips disabled matches", async () => {
    const el = await fixture<FluidMenu>(html`
      <fluid-menu aria-label="Destinations">
        <fluid-menu-item value="alpha">Alpha</fluid-menu-item>
        <fluid-menu-item value="open">Open</fluid-menu-item>
        <fluid-menu-item value="offline" disabled>Offline</fluid-menu-item>
        <fluid-menu-item value="options">Options</fluid-menu-item>
      </fluid-menu>
    `);
    await elementUpdated(el);
    el.focus();
    const press = (key: string) => {
      (document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent("keydown", {
          key,
          bubbles: true,
          composed: true,
          cancelable: true
        })
      );
    };

    press("o");
    expect((document.activeElement as FluidMenuItem | null)?.value).to.equal("open");
    press("o");
    expect((document.activeElement as FluidMenuItem | null)?.value).to.equal("options");
    press("o");
    expect((document.activeElement as FluidMenuItem | null)?.value).to.equal("open");
  });

  it("isolates outer roving state from pointer activity in a nested menu", async () => {
    const el = await fixture<FluidMenu>(html`
      <fluid-menu aria-label="Outer actions">
        <fluid-menu-item value="outer-a">Outer A</fluid-menu-item>
        <fluid-menu-item value="outer-b">Outer B</fluid-menu-item>
        <div>
          <fluid-menu aria-label="Nested actions">
            <fluid-menu-item value="nested-a">Nested A</fluid-menu-item>
            <fluid-menu-item value="nested-b">Nested B</fluid-menu-item>
          </fluid-menu>
        </div>
      </fluid-menu>
    `);
    await elementUpdated(el);
    el.focus();
    const outerItems = items(el).filter((item) => item.closest("fluid-menu") === el);
    const nested = el.querySelector<FluidMenu>("fluid-menu")!;
    const nestedItem = nested.querySelector<FluidMenuItem>('[value="nested-b"]')!;

    nestedItem.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, composed: true }));

    expect(outerItems[0]!.active).to.be.true;
    expect(outerItems[0]!.tabIndex).to.equal(0);
    expect(outerItems[1]!.active).to.be.false;
    expect(nestedItem.active).to.be.true;
  });

  it("moves active state, the tab stop, and focus after the focused item is removed", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus();
    const [first, open] = items(el);
    expect(document.activeElement).to.equal(first);

    first!.remove();
    await aTimeout(0);

    expect(open!.active).to.be.true;
    expect(open!.tabIndex).to.equal(0);
    expect((document.activeElement as FluidMenuItem | null)?.value).to.equal("open");
    expect(
      items(el)
        .filter((item) => item.tabIndex === 0)
        .map((item) => item.value)
    ).to.deep.equal(["open"]);
  });

  it("preserves roving focus while a presentational menu label is inserted, hidden, and removed", async () => {
    const el = await fixture<FluidMenu>(basicMenu());
    await elementUpdated(el);
    el.focus();
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
        composed: true,
        cancelable: true
      })
    );
    const open = items(el).find((item) => item.value === "open")!;
    const label = document.createElement("fluid-menu-label");
    label.textContent = "Dynamic group";

    el.insertBefore(label, open);
    await aTimeout(0);
    expect(label.getAttribute("role")).to.equal("presentation");
    expect((document.activeElement as FluidMenuItem | null)?.value).to.equal("open");
    expect(open.active).to.be.true;
    expect(open.tabIndex).to.equal(0);

    label.hidden = true;
    await aTimeout(0);
    label.remove();
    await aTimeout(0);
    expect((document.activeElement as FluidMenuItem | null)?.value).to.equal("open");
    expect(open.active).to.be.true;
    expect(
      items(el)
        .filter((item) => item.tabIndex === 0)
        .map((item) => item.value)
    ).to.deep.equal(["open"]);
  });
});
