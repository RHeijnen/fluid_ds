import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidSpinner } from "./fluid-spinner.js";

describe("<fluid-spinner>", () => {
  it("renders an SVG", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    expect(el.shadowRoot!.querySelector("svg")).to.exist;
  });

  it("has role=progressbar with an accessible name", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    expect(el.getAttribute("role")).to.equal("progressbar");
    expect(el.getAttribute("aria-label")).to.equal("Loading");
  });

  it("respects a custom aria-label", async () => {
    const el = await fixture<FluidSpinner>(
      html`<fluid-spinner aria-label="Fetching"></fluid-spinner>`
    );
    expect(el.getAttribute("aria-label")).to.equal("Fetching");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder. */

  it("indicator stroke reads the --fluid-spinner-* override ladder", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    el.style.setProperty("--fluid-spinner-color", "rgb(1, 2, 3)");
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<SVGElement>(".indicator")!;
    expect(getComputedStyle(indicator).stroke).to.equal("rgb(1, 2, 3)");
  });
});
