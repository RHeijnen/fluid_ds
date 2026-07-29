import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidSplitPanel } from "./fluid-split-panel.js";

const divider = (el: FluidSplitPanel) =>
  el.shadowRoot!.querySelector<HTMLDivElement>(".divider")!;

describe("<fluid-split-panel>", () => {
  it("renders with defaults", async () => {
    const el = await fixture<FluidSplitPanel>(html`<fluid-split-panel></fluid-split-panel>`);
    expect(el.position).to.equal(50);
    expect(el.orientation).to.equal("horizontal");
    expect(el.disabled).to.equal(false);
  });

  it("fires fluid-reposition on keyboard resize", async () => {
    const el = await fixture<FluidSplitPanel>(html`<fluid-split-panel></fluid-split-panel>`);
    await el.updateComplete;
    setTimeout(() =>
      divider(el).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    );
    const event = (await oneEvent(el, "fluid-reposition")) as CustomEvent;
    expect(event.detail.position).to.equal(51);
    expect(el.position).to.equal(51);
  });

  it("fires fluid-reposition with Shift for a 10% step", async () => {
    const el = await fixture<FluidSplitPanel>(html`<fluid-split-panel></fluid-split-panel>`);
    await el.updateComplete;
    setTimeout(() =>
      divider(el).dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", shiftKey: true, bubbles: true })
      )
    );
    const event = (await oneEvent(el, "fluid-reposition")) as CustomEvent;
    expect(event.detail.position).to.equal(40);
  });

  it("Home / End fire fluid-reposition and snap to the bounds", async () => {
    const el = await fixture<FluidSplitPanel>(html`<fluid-split-panel></fluid-split-panel>`);
    await el.updateComplete;
    setTimeout(() =>
      divider(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }))
    );
    const home = (await oneEvent(el, "fluid-reposition")) as CustomEvent;
    expect(home.detail.position).to.equal(0);
    expect(el.position).to.equal(0);

    setTimeout(() =>
      divider(el).dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }))
    );
    const end = (await oneEvent(el, "fluid-reposition")) as CustomEvent;
    expect(end.detail.position).to.equal(100);
    expect(el.position).to.equal(100);
  });

  it("clamps to min-position / max-position", async () => {
    const el = await fixture<FluidSplitPanel>(
      html`<fluid-split-panel position="25" min-position="20" max-position="80"></fluid-split-panel>`
    );
    await el.updateComplete;
    // Hold ArrowLeft past the min; position should never drop below 20.
    for (let i = 0; i < 10; i++) {
      divider(el).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    }
    expect(el.position).to.equal(20);

    for (let i = 0; i < 100; i++) {
      divider(el).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    }
    expect(el.position).to.equal(80);
  });

  it("does not fire fluid-reposition when already at the bound", async () => {
    const el = await fixture<FluidSplitPanel>(
      html`<fluid-split-panel position="100"></fluid-split-panel>`
    );
    await el.updateComplete;
    let fired = false;
    el.addEventListener("fluid-reposition", () => (fired = true));
    // ArrowRight from 100 stays at 100 → no event.
    divider(el).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(fired).to.equal(false);
    expect(el.position).to.equal(100);
  });

  it("updates aria-valuenow on keyboard resize", async () => {
    const el = await fixture<FluidSplitPanel>(
      html`<fluid-split-panel position="50"></fluid-split-panel>`
    );
    await el.updateComplete;
    expect(divider(el).getAttribute("aria-valuenow")).to.equal("50");
    divider(el).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;
    expect(divider(el).getAttribute("aria-valuenow")).to.equal("51");
  });

  it("exposes the separator ARIA value semantics", async () => {
    const el = await fixture<FluidSplitPanel>(
      html`<fluid-split-panel min-position="10" max-position="90"></fluid-split-panel>`
    );
    await el.updateComplete;
    const d = divider(el);
    expect(d.getAttribute("role")).to.equal("separator");
    expect(d.getAttribute("aria-orientation")).to.equal("vertical");
    expect(d.getAttribute("aria-valuemin")).to.equal("10");
    expect(d.getAttribute("aria-valuemax")).to.equal("90");
    expect(d.getAttribute("tabindex")).to.equal("0");
  });

  it("gives the divider an accessible name", async () => {
    const el = await fixture<FluidSplitPanel>(html`<fluid-split-panel></fluid-split-panel>`);
    await el.updateComplete;
    expect(divider(el).getAttribute("aria-label")).to.equal("Resize panels");

    const named = await fixture<FluidSplitPanel>(
      html`<fluid-split-panel label="Resize sidebar"></fluid-split-panel>`
    );
    await named.updateComplete;
    expect(divider(named).getAttribute("aria-label")).to.equal("Resize sidebar");
  });

  it("vertical orientation flips aria-orientation", async () => {
    const el = await fixture<FluidSplitPanel>(
      html`<fluid-split-panel orientation="vertical"></fluid-split-panel>`
    );
    await el.updateComplete;
    expect(divider(el).getAttribute("aria-orientation")).to.equal("horizontal");
  });

  it("disabled blocks keyboard resize and removes the divider from tab order", async () => {
    const el = await fixture<FluidSplitPanel>(
      html`<fluid-split-panel disabled position="50"></fluid-split-panel>`
    );
    await el.updateComplete;
    expect(divider(el).getAttribute("tabindex")).to.equal("-1");
    let fired = false;
    el.addEventListener("fluid-reposition", () => (fired = true));
    divider(el).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(fired).to.equal(false);
    expect(el.position).to.equal(50);
  });

  it("passes an accessibility audit", async () => {
    const el = await fixture<FluidSplitPanel>(html`
      <fluid-split-panel>
        <div slot="start">A</div>
        <div slot="end">B</div>
      </fluid-split-panel>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
