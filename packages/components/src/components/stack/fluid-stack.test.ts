import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidStack } from "./fluid-stack.js";

describe("<fluid-stack>", () => {
  it("is a vertical flex container by default", async () => {
    const el = await fixture<FluidStack>(html`<fluid-stack></fluid-stack>`);
    const cs = getComputedStyle(el);
    expect(cs.display).to.equal("flex");
    expect(cs.flexDirection).to.equal("column");
  });

  it("lays children out in a column (stacked) by default", async () => {
    const el = await fixture<FluidStack>(html`
      <fluid-stack gap="0px" style="width: 200px;">
        <div data-i="a" style="height:20px">a</div>
        <div data-i="b" style="height:20px">b</div>
      </fluid-stack>
    `);
    await el.updateComplete;
    const a = el.querySelector<HTMLElement>('[data-i="a"]')!;
    const b = el.querySelector<HTMLElement>('[data-i="b"]')!;
    expect(b.offsetTop).to.be.greaterThan(a.offsetTop);
    expect(b.offsetLeft).to.equal(a.offsetLeft);
  });

  it("direction=horizontal flows along the row", async () => {
    const el = await fixture<FluidStack>(html`
      <fluid-stack direction="horizontal" gap="0px">
        <div data-i="a">a</div>
        <div data-i="b">b</div>
      </fluid-stack>
    `);
    await el.updateComplete;
    expect(getComputedStyle(el).flexDirection).to.equal("row");
    const a = el.querySelector<HTMLElement>('[data-i="a"]')!;
    const b = el.querySelector<HTMLElement>('[data-i="b"]')!;
    expect(b.offsetLeft).to.be.greaterThan(a.offsetLeft);
  });

  it("wrap enables flex-wrap", async () => {
    const el = await fixture<FluidStack>(html`<fluid-stack direction="horizontal" wrap></fluid-stack>`);
    await el.updateComplete;
    expect(getComputedStyle(el).flexWrap).to.equal("wrap");
  });

  it("the gap attribute sets the --fluid-stack-gap token per instance", async () => {
    const el = await fixture<FluidStack>(html`<fluid-stack gap="1.5rem"></fluid-stack>`);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--fluid-stack-gap")).to.equal("1.5rem");
  });

  it("maps friendly align / justify aliases to flex values", async () => {
    const el = await fixture<FluidStack>(html`<fluid-stack align="center" justify="between"></fluid-stack>`);
    await el.updateComplete;
    expect(el.style.getPropertyValue("--fluid-stack-align")).to.equal("center");
    expect(el.style.getPropertyValue("--fluid-stack-justify")).to.equal("space-between");
    expect(getComputedStyle(el).justifyContent).to.equal("space-between");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidStack>(html`
      <fluid-stack><div>a</div><div>b</div></fluid-stack>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
