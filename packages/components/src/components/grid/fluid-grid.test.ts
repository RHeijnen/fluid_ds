import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidGrid } from "./fluid-grid.js";
import type { FluidCol } from "./fluid-col.js";

describe("<fluid-grid>", () => {
  it("is a grid container by default", async () => {
    const el = await fixture<FluidGrid>(html`<fluid-grid></fluid-grid>`);
    expect(getComputedStyle(el).display).to.equal("grid");
  });

  it("uses intrinsic auto-fill (no fixed mode) when no cols are set", async () => {
    const el = await fixture<FluidGrid>(html`<fluid-grid></fluid-grid>`);
    expect(el.hasAttribute("data-grid-mode")).to.be.false;
  });

  it("switches to fixed mode only when a cols attribute is present", async () => {
    const el = await fixture<FluidGrid>(html`<fluid-grid></fluid-grid>`);
    expect(el.hasAttribute("data-grid-mode")).to.be.false;
    el.cols = 2;
    await el.updateComplete;
    expect(el.getAttribute("data-grid-mode")).to.equal("fixed");
    el.cols = undefined;
    await el.updateComplete;
    expect(el.hasAttribute("data-grid-mode")).to.be.false;
  });

  it("renders an explicit column count in fixed mode", async () => {
    const el = await fixture<FluidGrid>(html`
      <fluid-grid cols="3" style="width: 300px;">
        <div>a</div>
        <div>b</div>
        <div>c</div>
      </fluid-grid>
    `);
    await el.updateComplete;
    expect(el.getAttribute("data-grid-mode")).to.equal("fixed");
    // Three resolved tracks.
    const tracks = getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean);
    expect(tracks.length).to.equal(3);
  });

  it("places slotted children as grid items (side by side at cols=2)", async () => {
    const el = await fixture<FluidGrid>(html`
      <fluid-grid cols="2" gap="0px" style="width: 400px;">
        <div data-cell="a">a</div>
        <div data-cell="b">b</div>
      </fluid-grid>
    `);
    await el.updateComplete;
    const a = el.querySelector<HTMLElement>('[data-cell="a"]')!;
    const b = el.querySelector<HTMLElement>('[data-cell="b"]')!;
    // Two columns → the second cell sits to the right of the first, same row.
    expect(b.offsetLeft).to.be.greaterThan(a.offsetLeft);
    expect(b.offsetTop).to.equal(a.offsetTop);
  });

  it("the gap attribute sets the --fluid-grid-gap token per instance", async () => {
    const el = await fixture<FluidGrid>(html`<fluid-grid gap="2rem"></fluid-grid>`);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--fluid-grid-gap")).to.equal("2rem");
  });

  it("min-col-width sets the intrinsic minimum token", async () => {
    const el = await fixture<FluidGrid>(html`<fluid-grid min-col-width="20rem"></fluid-grid>`);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--fluid-grid-min-col")).to.equal("20rem");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidGrid>(html`
      <fluid-grid cols="2"><div>a</div><div>b</div></fluid-grid>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});

describe("<fluid-col>", () => {
  it("spans the given number of columns", async () => {
    const el = await fixture<FluidCol>(html`<fluid-col span="2">x</fluid-col>`);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--_span")).to.equal("2");
    expect(getComputedStyle(el).gridColumn).to.contain("span 2");
  });

  it("pins a start line when `start` is set", async () => {
    const el = await fixture<FluidCol>(html`<fluid-col start="2" span="2">x</fluid-col>`);
    await el.updateComplete;
    expect(el.hasAttribute("data-has-start")).to.be.true;
    expect(el.style.getPropertyValue("--_start")).to.equal("2");
  });

  it("spans rows when `row-span` is set", async () => {
    const el = await fixture<FluidCol>(html`<fluid-col row-span="3">x</fluid-col>`);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--_row")).to.equal("span 3");
  });

  it("clears the start attribute when `start` is removed", async () => {
    const el = await fixture<FluidCol>(html`<fluid-col start="2">x</fluid-col>`);
    await el.updateComplete;
    expect(el.hasAttribute("data-has-start")).to.be.true;
    el.start = undefined;
    await el.updateComplete;
    expect(el.hasAttribute("data-has-start")).to.be.false;
  });
});
