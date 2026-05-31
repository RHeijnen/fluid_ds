import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidProgressBar } from "./fluid-progress-bar.js";

describe("<fluid-progress-bar>", () => {
  it("renders with role=progressbar and aria-valuenow", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="42"></fluid-progress-bar>`
    );
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("progressbar");
    expect(el.getAttribute("aria-valuenow")).to.equal("42");
  });

  it("clamps value to 0-100", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="150"></fluid-progress-bar>`
    );
    await el.updateComplete;
    expect(el.getAttribute("aria-valuenow")).to.equal("100");
  });

  it("becomes indeterminate when value is null", async () => {
    const el = await fixture<FluidProgressBar>(html`<fluid-progress-bar></fluid-progress-bar>`);
    el.value = null;
    await el.updateComplete;
    expect(el.indeterminate).to.be.true;
    expect(el.hasAttribute("aria-valuenow")).to.be.false;
  });

  it("shows the value text when show-value is set", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="33" show-value></fluid-progress-bar>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent?.trim()).to.equal("33%");
  });

  it("applies a custom formatter", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="33" show-value></fluid-progress-bar>`
    );
    el.valueFormatter = (v) => `${v} of 100`;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent?.trim()).to.equal(
      "33 of 100"
    );
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="42" aria-label="Upload"></fluid-progress-bar>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder. */

  it("indicator fill reads the --fluid-progress-bar-* override ladder", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="50" aria-label="x"></fluid-progress-bar>`
    );
    el.style.setProperty("--fluid-progress-bar-fill", "rgb(1, 2, 3)");
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<HTMLElement>(".indicator")!;
    expect(getComputedStyle(indicator).backgroundColor).to.equal("rgb(1, 2, 3)");
  });
});
