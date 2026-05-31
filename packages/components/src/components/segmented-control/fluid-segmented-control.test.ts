import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidSegmentedControl } from "./fluid-segmented-control.js";

const sample = html`
  <fluid-segmented-control aria-label="View" value="grid">
    <fluid-segment value="list">List</fluid-segment>
    <fluid-segment value="grid">Grid</fluid-segment>
    <fluid-segment value="kanban" disabled>Kanban</fluid-segment>
  </fluid-segmented-control>
`;

describe("<fluid-segmented-control>", () => {
  it("renders with the value's segment selected", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    const selected = el.querySelector("fluid-segment[selected]");
    expect(selected?.getAttribute("value")).to.equal("grid");
  });

  it("clicking a segment updates the value", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    const list = el.querySelector<HTMLElement>('fluid-segment[value="list"]')!;
    setTimeout(() => list.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("list");
    expect(el.value).to.equal("list");
  });

  it("ArrowRight cycles to next non-disabled segment", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    // disabled "kanban" should be skipped, wrap back to list
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("list");
  });

  it("Home jumps to first segment", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("list");
  });

  it("ignores clicks on disabled segments", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    const kanban = el.querySelector<HTMLElement>('fluid-segment[value="kanban"]')!;
    kanban.click();
    await el.updateComplete;
    expect(el.value).to.equal("grid");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("the sliding thumb fill reads --fluid-segmented-thumb-bg", async () => {
    // The selected "raised" surface is now the sliding .thumb (so it animates
    // between segments), not a per-segment background.
    const el = await fixture<FluidSegmentedControl>(sample);
    el.style.setProperty("--fluid-segmented-thumb-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const thumb = el.shadowRoot!.querySelector<HTMLElement>('[part="thumb"]')!;
    expect(getComputedStyle(thumb).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("each segment respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const seg = el.querySelector<HTMLElement>("fluid-segment")!;
    expect(seg.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
