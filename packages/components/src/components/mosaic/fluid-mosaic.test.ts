import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidMosaic } from "./fluid-mosaic.js";
import type { FluidMosaicItem } from "./fluid-mosaic-item.js";

describe("<fluid-mosaic>", () => {
  it("is a dense grid container", async () => {
    const el = await fixture<FluidMosaic>(html`<fluid-mosaic></fluid-mosaic>`);
    const cs = getComputedStyle(el);
    expect(cs.display).to.equal("grid");
    expect(cs.gridAutoFlow).to.contain("dense");
  });

  it("renders a fixed column count when cols is set", async () => {
    const el = await fixture<FluidMosaic>(html`
      <fluid-mosaic cols="3" style="width: 300px;">
        <fluid-mosaic-item>a</fluid-mosaic-item>
        <fluid-mosaic-item>b</fluid-mosaic-item>
        <fluid-mosaic-item>c</fluid-mosaic-item>
      </fluid-mosaic>
    `);
    await el.updateComplete;
    expect(el.getAttribute("data-grid-mode")).to.equal("fixed");
    const tracks = getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean);
    expect(tracks.length).to.equal(3);
  });

  it("row-height + gap set the matching tokens per instance", async () => {
    const el = await fixture<FluidMosaic>(html`
      <fluid-mosaic row-height="8rem" gap="1rem"></fluid-mosaic>
    `);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--fluid-mosaic-row-height")).to.equal("8rem");
    expect(el.style.getPropertyValue("--fluid-mosaic-gap")).to.equal("1rem");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidMosaic>(html`
      <fluid-mosaic cols="2">
        <fluid-mosaic-item>a</fluid-mosaic-item>
        <fluid-mosaic-item>b</fluid-mosaic-item>
      </fluid-mosaic>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});

describe("<fluid-mosaic-item>", () => {
  it("maps the size preset to col/row spans", async () => {
    const el = await fixture<FluidMosaicItem>(
      html`<fluid-mosaic-item size="large">x</fluid-mosaic-item>`
    );
    await el.updateComplete;
    expect(el.style.getPropertyValue("--_col-span")).to.equal("2");
    expect(el.style.getPropertyValue("--_row-span")).to.equal("2");
  });

  it("defaults to a 1×1 tile", async () => {
    const el = await fixture<FluidMosaicItem>(html`<fluid-mosaic-item>x</fluid-mosaic-item>`);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--_col-span")).to.equal("1");
    expect(el.style.getPropertyValue("--_row-span")).to.equal("1");
  });

  it("explicit col-span / row-span override the preset", async () => {
    const el = await fixture<FluidMosaicItem>(
      html`<fluid-mosaic-item size="large" col-span="3">x</fluid-mosaic-item>`
    );
    await el.updateComplete;
    expect(el.style.getPropertyValue("--_col-span")).to.equal("3");
    // row-span still comes from the `large` preset
    expect(el.style.getPropertyValue("--_row-span")).to.equal("2");
  });
});
