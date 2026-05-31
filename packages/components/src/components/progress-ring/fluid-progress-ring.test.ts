import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidProgressRing } from "./fluid-progress-ring.js";

describe("<fluid-progress-ring>", () => {
  it("renders as a progressbar with aria-valuenow", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="33"></fluid-progress-ring>`
    );
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("progressbar");
    expect(el.getAttribute("aria-valuenow")).to.equal("33");
  });

  it("clamps value into 0-100", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="999"></fluid-progress-ring>`
    );
    await el.updateComplete;
    expect(el.getAttribute("aria-valuenow")).to.equal("100");
  });

  it("renders the center label when show-value is set", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="42" show-value></fluid-progress-ring>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".label")!.textContent?.trim()).to.equal("42%");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="50" aria-label="Saved"></fluid-progress-ring>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + thickness drives geometry. */

  it("indicator stroke reads the --fluid-progress-ring-* override ladder", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="50" aria-label="x"></fluid-progress-ring>`
    );
    el.style.setProperty("--fluid-progress-ring-fill", "rgb(1, 2, 3)");
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<SVGElement>(".indicator")!;
    expect(getComputedStyle(indicator).stroke).to.equal("rgb(1, 2, 3)");
  });

  it("thickness drives the stroke-width and arc radius", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="50" thickness="20" aria-label="x"></fluid-progress-ring>`
    );
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<SVGCircleElement>(".indicator")!;
    expect(indicator.getAttribute("stroke-width")).to.equal("20");
    // radius = 50 - thickness/2 = 40
    expect(indicator.getAttribute("r")).to.equal("40");
  });
});
