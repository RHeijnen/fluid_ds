import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidDivider } from "./fluid-divider.js";

describe("<fluid-divider>", () => {
  it("renders with role=separator", async () => {
    const el = await fixture<FluidDivider>(html`<fluid-divider></fluid-divider>`);
    expect(el.getAttribute("role")).to.equal("separator");
    expect(el.getAttribute("aria-orientation")).to.equal("horizontal");
  });

  it("defaults to horizontal", async () => {
    const el = await fixture<FluidDivider>(html`<fluid-divider></fluid-divider>`);
    expect(el.orientation).to.equal("horizontal");
  });

  it("supports vertical orientation", async () => {
    const el = await fixture<FluidDivider>(
      html`<fluid-divider orientation="vertical"></fluid-divider>`
    );
    expect(el.orientation).to.equal("vertical");
    expect(el.getAttribute("aria-orientation")).to.equal("vertical");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidDivider>(html`<fluid-divider></fluid-divider>`);
    await expect(el).to.be.accessible();
  });
});
