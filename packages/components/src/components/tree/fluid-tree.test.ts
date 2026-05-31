import { expect, fixture, html } from "@open-wc/testing";
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
});
