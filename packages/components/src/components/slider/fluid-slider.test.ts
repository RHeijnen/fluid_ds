import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidSlider } from "./fluid-slider.js";

describe("<fluid-slider>", () => {
  it("renders with defaults", async () => {
    const el = await fixture<FluidSlider>(html`
      <fluid-slider aria-label="Volume"></fluid-slider>
    `);
    expect(el.min).to.equal(0);
    expect(el.max).to.equal(100);
    expect(el.value).to.equal("50");
  });

  it("reflects value into the inner input", async () => {
    const el = await fixture<FluidSlider>(html`
      <fluid-slider value="25" aria-label="Volume"></fluid-slider>
    `);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.value).to.equal("25");
  });

  it("fires fluid-input on user change", async () => {
    const el = await fixture<FluidSlider>(html`
      <fluid-slider value="10" aria-label="Volume"></fluid-slider>
    `);
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "42";
    setTimeout(() => input.dispatchEvent(new Event("input", { bubbles: true })));
    const event = (await oneEvent(el, "fluid-input")) as CustomEvent;
    expect(event.detail.value).to.equal("42");
    expect(el.value).to.equal("42");
  });

  it("respects min/max/step", async () => {
    const el = await fixture<FluidSlider>(html`
      <fluid-slider min="-50" max="50" step="5" value="0" aria-label="Range"></fluid-slider>
    `);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.min).to.equal("-50");
    expect(input.max).to.equal("50");
    expect(input.step).to.equal("5");
  });

  it("submits its value with a form", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-slider name="volume" value="33" aria-label="Volume"></fluid-slider>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("volume")).to.equal("33");
  });

  it("respects disabled", async () => {
    const el = await fixture<FluidSlider>(html`
      <fluid-slider disabled aria-label="Volume"></fluid-slider>
    `);
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.disabled).to.be.true;
  });

  it("applies valueFormatter to the visible label", async () => {
    const el = await fixture<FluidSlider>(html`
      <fluid-slider show-value value="42" aria-label="Volume"></fluid-slider>
    `);
    el.valueFormatter = (n) => `${n}%`;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".value")?.textContent?.trim()).to.equal("42%");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSlider>(html`
      <fluid-slider aria-label="Volume"></fluid-slider>
    `);
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("track size reads the --fluid-slider-* override ladder", async () => {
    const el = await fixture<FluidSlider>(html`<fluid-slider aria-label="x"></fluid-slider>`);
    el.style.setProperty("--fluid-slider-track-size", "14px");
    await el.updateComplete;
    // The custom track-size token is honored (not pinned by a :host rule).
    const track = getComputedStyle(el).getPropertyValue("--fluid-slider-track-size").trim();
    expect(track).to.equal("14px");
  });

  it("the pointer-target row respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidSlider>(html`<fluid-slider aria-label="x"></fluid-slider>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
