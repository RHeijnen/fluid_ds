import { expect, fixture, html, aTimeout } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import type { FluidTree } from "./fluid-tree.js";
import type { FluidTreeItem } from "./fluid-tree-item.js";

const sample = html`
  <fluid-tree>
    <fluid-tree-item id="src">
      src
      <fluid-tree-item id="index">index.ts</fluid-tree-item>
      <fluid-tree-item id="app">app.ts</fluid-tree-item>
    </fluid-tree-item>
    <fluid-tree-item id="readme">README.md</fluid-tree-item>
  </fluid-tree>
`;

describe("<fluid-tree>", () => {
  it("delivers one selection event per pointer or keyboard activation", async () => {
    const el = await fixture<FluidTree>(sample);
    const item = el.querySelector<FluidTreeItem>("#readme")!;
    const events: Event[] = [];
    // Bound a broken recursive dispatch so the regression fails without a stack overflow.
    el.addEventListener(
      "fluid-select",
      (event) => {
        events.push(event);
        if (events.length > 3) event.stopImmediatePropagation();
      },
      { capture: true }
    );
    item.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!.click();
    await item.updateComplete;
    expect(events.length).to.equal(1);
    expect(item.selected).to.be.true;
    expect(document.activeElement).to.equal(item);
    await sendKeys({ press: "Enter" });
    expect(events.length).to.equal(2);
    expect(events.every((event) => event.bubbles && event.composed)).to.be.true;
  });

  it("has one tab stop and skips disabled items for navigation and activation", async () => {
    const el = await fixture<FluidTree>(sample);
    const src = el.querySelector<FluidTreeItem>("#src")!;
    const readme = el.querySelector<FluidTreeItem>("#readme")!;
    src.disabled = true;
    await src.updateComplete;
    await aTimeout(0);
    el.focus();
    expect(document.activeElement).to.equal(readme);
    expect(el.tabIndex).to.equal(-1);
    expect(el.hasAttribute("tabindex")).to.be.false;
    expect(src.getAttribute("aria-disabled")).to.equal("true");
    src.focus();
    await sendKeys({ press: "Enter" });
    expect(src.selected).to.be.false;
  });

  it("exposes expansion only on branches and the correct level on descendants", async () => {
    const el = await fixture<FluidTree>(sample);
    const src = el.querySelector<FluidTreeItem>("#src")!;
    const leaf = el.querySelector<FluidTreeItem>("#index")!;
    await aTimeout(0);
    expect(src.getAttribute("aria-expanded")).to.equal("false");
    expect(leaf.hasAttribute("aria-expanded")).to.be.false;
    expect(leaf.getAttribute("aria-level")).to.equal("2");
  });

  it("clears prior selection even when two activations occur before rendering", async () => {
    const el = await fixture<FluidTree>(sample);
    const src = el.querySelector<FluidTreeItem>("#src")!;
    const readme = el.querySelector<FluidTreeItem>("#readme")!;
    src.dispatchEvent(new CustomEvent("fluid-select", { detail: { item: src }, bubbles: true }));
    readme.dispatchEvent(
      new CustomEvent("fluid-select", { detail: { item: readme }, bubbles: true })
    );
    expect(src.selected).to.be.false;
    expect(readme.selected).to.be.true;
  });

  it("restores focus to a visible ancestor when a branch is collapsed", async () => {
    const el = await fixture<FluidTree>(sample);
    const src = el.querySelector<FluidTreeItem>("#src")!;
    src.expanded = true;
    await src.updateComplete;
    const child = el.querySelector<FluidTreeItem>("#index")!;
    child.focus();
    src.expanded = false;
    await src.updateComplete;
    await aTimeout(0);
    expect(document.activeElement).to.equal(src);
    expect(src.tabIndex).to.equal(0);
    expect(child.tabIndex).to.equal(-1);
  });

  it("routes newly added children after disconnect and reconnect", async () => {
    const el = await fixture<FluidTree>(sample);
    const src = el.querySelector<FluidTreeItem>("#src")!;
    src.remove();
    el.append(src);
    const child = document.createElement("fluid-tree-item");
    src.append(child);
    await aTimeout(0);
    expect(child.slot).to.equal("children");
    expect(child.getAttribute("aria-level")).to.equal("2");
  });

  it("renders as role=tree with treeitem children", async () => {
    const el = await fixture<FluidTree>(sample);
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("tree");
    const items = el.querySelectorAll("fluid-tree-item");
    expect(items.length).to.equal(4);
    items.forEach((i) => expect(i.getAttribute("role")).to.equal("treeitem"));
  });

  it("nests child items into the children group", async () => {
    const el = await fixture<FluidTree>(sample);
    await el.updateComplete;
    const src = el.querySelector<FluidTreeItem>("#src")!;
    const nested = src.querySelectorAll('fluid-tree-item[slot="children"]');
    expect(nested.length).to.equal(2);
  });

  it("clicking the chevron toggles expanded", async () => {
    const el = await fixture<FluidTree>(sample);
    await el.updateComplete;
    const src = el.querySelector<FluidTreeItem>("#src")!;
    expect(src.expanded).to.be.false;
    src.shadowRoot!.querySelector<HTMLElement>(".chevron")!.click();
    await src.updateComplete;
    expect(src.expanded).to.be.true;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTree>(sample);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("selected accent reads the --fluid-tree-item-* ladder (regression: was --fluid-color-primary)", async () => {
    const el = await fixture<FluidTreeItem>(html`<fluid-tree-item selected>x</fluid-tree-item>`);
    el.style.setProperty("--fluid-tree-item-selected-accent", "rgb(1, 2, 3)");
    await el.updateComplete;
    const row = el.shadowRoot!.querySelector<HTMLElement>(".row")!;
    expect(getComputedStyle(row).color).to.equal("rgb(1, 2, 3)");
  });

  it("each row respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidTreeItem>(html`<fluid-tree-item>x</fluid-tree-item>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const row = el.shadowRoot!.querySelector<HTMLElement>(".row")!;
    expect(row.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });

  /* Lifecycle: the child MutationObserver is torn down on removal. */

  it("stops observing child mutations after the item is removed (regression: observer leak)", async () => {
    const el = await fixture<FluidTreeItem>(html`<fluid-tree-item>parent</fluid-tree-item>`);
    await el.updateComplete;

    // Spy on routeChildren via the observable side effect: adding a child
    // tree-item gets routed to the children slot while connected.
    const live = document.createElement("fluid-tree-item");
    el.appendChild(live);
    // Let the MutationObserver microtask flush.
    await new Promise((r) => setTimeout(r, 0));
    expect(live.getAttribute("slot")).to.equal("children");

    // Remove the item: disconnectedCallback must disconnect the observer.
    el.remove();
    await new Promise((r) => setTimeout(r, 0));

    // A child added after removal must NOT be routed (observer is dead).
    const stale = document.createElement("fluid-tree-item");
    el.appendChild(stale);
    await new Promise((r) => setTimeout(r, 0));
    expect(stale.getAttribute("slot")).to.equal(null);
  });
});
