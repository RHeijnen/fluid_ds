import { aTimeout, expect, fixture, html } from "@open-wc/testing";
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

  it("updates base and breakpoint columns live and recovers from invalid counts", async () => {
    const el = await fixture<FluidGrid>(html`
      <fluid-grid cols="2" style="width: 320px"
        ><div>a</div>
        <div>b</div></fluid-grid
      >
    `);
    el.colsSm = 4;
    await el.updateComplete;
    expect(el.style.getPropertyValue("--_cols-sm")).to.equal("4");
    const expectedTracks = matchMedia("(min-width: 40rem)").matches ? 4 : 2;
    expect(getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean)).to.have.length(
      expectedTracks
    );

    el.cols = 0;
    el.colsSm = Number.NaN;
    await el.updateComplete;
    expect(el.hasAttribute("data-grid-mode")).to.equal(false);
    expect(el.style.getPropertyValue("--_cols")).to.equal("");
    expect(el.style.getPropertyValue("--_cols-sm")).to.equal("");

    el.cols = 1;
    await el.updateComplete;
    expect(el.getAttribute("data-grid-mode")).to.equal("fixed");
    expect(getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean)).to.have.length(1);
  });

  it("rejects invalid layout tokens and restores deterministic defaults", async () => {
    const el = await fixture<FluidGrid>(html`
      <fluid-grid
        gap="not-a-gap"
        min-col-width="not-a-width"
        align="not-an-alignment"
        justify="not-an-alignment"
        style="--fluid-space-4: 16px; width: 240px"
      >
        <div>content</div>
      </fluid-grid>
    `);
    expect(getComputedStyle(el).gap).to.equal("16px");
    expect(getComputedStyle(el).alignItems).to.equal("stretch");
    expect(getComputedStyle(el).justifyItems).to.equal("stretch");
    expect(el.style.getPropertyValue("--fluid-grid-min-col")).to.equal("");

    el.gap = "8px";
    el.minColWidth = "80px";
    el.align = "center";
    el.justify = "end";
    await el.updateComplete;
    expect(getComputedStyle(el).gap).to.equal("8px");
    expect(getComputedStyle(el).alignItems).to.equal("center");
    expect(getComputedStyle(el).justifyItems).to.equal("end");
  });

  it("preserves RTL placement and avoids narrow horizontal overflow", async () => {
    const el = await fixture<FluidGrid>(html`
      <fluid-grid cols="2" gap="0px" dir="rtl" style="width: 120px">
        <div data-cell="first">VeryLongUnbrokenGridContentThatMustWrap</div>
        <div data-cell="second">second</div>
      </fluid-grid>
    `);
    await aTimeout(0);
    const first = el.querySelector<HTMLElement>("[data-cell='first']")!;
    const second = el.querySelector<HTMLElement>("[data-cell='second']")!;
    expect(first.offsetLeft).to.be.greaterThan(second.offsetLeft);
    expect(el.scrollWidth).to.be.at.most(el.clientWidth);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidGrid>(html`
      <fluid-grid cols="2"
        ><div>a</div>
        <div>b</div></fluid-grid
      >
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

  it("falls back for invalid span, start and row-span values and recovers", async () => {
    const el = await fixture<FluidCol>(html`
      <fluid-col span="0" start="-2" row-span="NaN">content</fluid-col>
    `);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--_span")).to.equal("1");
    expect(el.hasAttribute("data-has-start")).to.equal(false);
    expect(el.style.getPropertyValue("--_row")).to.equal("");

    el.span = 2;
    el.start = 1;
    el.rowSpan = 3;
    await el.updateComplete;
    expect(el.style.getPropertyValue("--_span")).to.equal("2");
    expect(el.style.getPropertyValue("--_start")).to.equal("1");
    expect(el.style.getPropertyValue("--_row")).to.equal("span 3");
  });

  it("uses logical grid placement in RTL and contains narrow content", async () => {
    const grid = await fixture<FluidGrid>(html`
      <fluid-grid cols="2" gap="0px" dir="rtl" style="width: 120px">
        <fluid-col start="1">VeryLongUnbrokenColumnContentThatMustWrap</fluid-col>
      </fluid-grid>
    `);
    const col = grid.querySelector<FluidCol>("fluid-col")!;
    await aTimeout(0);
    expect(col.getBoundingClientRect().right).to.be.closeTo(
      grid.getBoundingClientRect().right,
      0.5
    );
    expect(grid.scrollWidth).to.be.at.most(grid.clientWidth);
  });
});
