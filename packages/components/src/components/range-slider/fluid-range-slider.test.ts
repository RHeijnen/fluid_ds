import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidRangeSlider } from "./fluid-range-slider.js";

const TOKENS = [
  "--fluid-surface-base:#ffffff",
  "--fluid-surface-muted:#f4f4f5",
  "--fluid-text-primary:#18181b",
  "--fluid-text-secondary:#3f3f46",
  "--fluid-border-default:#e4e4e7",
  "--fluid-accent-base:#4f46e5",
  "--fluid-accent-text:#ffffff",
  "--fluid-color-neutral-200:#e4e4e7",
  "--fluid-motion:0"
].join(";");

describe("<fluid-range-slider>", () => {
  it("renders with defaults", async () => {
    const el = await fixture<FluidRangeSlider>(html`<fluid-range-slider></fluid-range-slider>`);
    expect(el.min).to.equal(0);
    expect(el.max).to.equal(100);
    expect(el.valueMin).to.equal(25);
    expect(el.valueMax).to.equal(75);
  });

  it("exposes two role=slider thumbs with distinct names", async () => {
    const el = await fixture<FluidRangeSlider>(html`<fluid-range-slider></fluid-range-slider>`);
    const thumbs = el.shadowRoot!.querySelectorAll('[role="slider"]');
    expect(thumbs.length).to.equal(2);
    expect(thumbs[0]!.getAttribute("aria-label")).to.equal("Minimum");
    expect(thumbs[1]!.getAttribute("aria-label")).to.equal("Maximum");
  });

  it("constrains aria-valuemin/max so thumbs cannot cross", async () => {
    const el = await fixture<FluidRangeSlider>(
      html`<fluid-range-slider value-min="30" value-max="70"></fluid-range-slider>`
    );
    await elementUpdated(el);
    const [minThumb, maxThumb] = el.shadowRoot!.querySelectorAll('[role="slider"]');
    expect(minThumb!.getAttribute("aria-valuemax")).to.equal("70");
    expect(maxThumb!.getAttribute("aria-valuemin")).to.equal("30");
    expect(minThumb!.getAttribute("aria-valuenow")).to.equal("30");
    expect(maxThumb!.getAttribute("aria-valuenow")).to.equal("70");
  });

  it("arrow key moves the minimum thumb by step", async () => {
    const el = await fixture<FluidRangeSlider>(
      html`<fluid-range-slider value-min="30" value-max="70" step="5"></fluid-range-slider>`
    );
    const minThumb = el.shadowRoot!.querySelector<HTMLElement>('[part~="thumb-min"]')!;
    minThumb.focus();
    setTimeout(() => minThumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    await oneEvent(el, "fluid-change");
    expect(el.valueMin).to.equal(35);
  });

  it("the minimum thumb cannot pass the maximum thumb", async () => {
    const el = await fixture<FluidRangeSlider>(
      html`<fluid-range-slider value-min="69" value-max="70" step="5"></fluid-range-slider>`
    );
    const minThumb = el.shadowRoot!.querySelector<HTMLElement>('[part~="thumb-min"]')!;
    minThumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    await elementUpdated(el);
    expect(el.valueMin).to.equal(70);
    expect(el.valueMax).to.equal(70);
  });

  it("Home/End jump to the bound for each thumb", async () => {
    const el = await fixture<FluidRangeSlider>(
      html`<fluid-range-slider value-min="30" value-max="70"></fluid-range-slider>`
    );
    const minThumb = el.shadowRoot!.querySelector<HTMLElement>('[part~="thumb-min"]')!;
    const maxThumb = el.shadowRoot!.querySelector<HTMLElement>('[part~="thumb-max"]')!;
    minThumb.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
    await elementUpdated(el);
    expect(el.valueMin).to.equal(0);
    maxThumb.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
    await elementUpdated(el);
    expect(el.valueMax).to.equal(100);
  });

  it("fires fluid-input then fluid-change with { min, max }", async () => {
    const el = await fixture<FluidRangeSlider>(
      html`<fluid-range-slider value-min="30" value-max="70"></fluid-range-slider>`
    );
    const maxThumb = el.shadowRoot!.querySelector<HTMLElement>('[part~="thumb-max"]')!;
    setTimeout(() => maxThumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" })));
    const ev = (await oneEvent(el, "fluid-input")) as CustomEvent;
    expect(ev.detail.min).to.equal(30);
    expect(ev.detail.max).to.equal(69);
  });

  it("submits its value as 'valueMin,valueMax' with a form", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-range-slider name="price" value-min="200" value-max="800"></fluid-range-slider>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("price")).to.equal("200,800");
  });

  it("respects disabled (thumbs not in tab order, no movement)", async () => {
    const el = await fixture<FluidRangeSlider>(
      html`<fluid-range-slider disabled value-min="30" value-max="70"></fluid-range-slider>`
    );
    const minThumb = el.shadowRoot!.querySelector<HTMLElement>('[part~="thumb-min"]')!;
    expect(minThumb.getAttribute("tabindex")).to.equal("-1");
    minThumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    await elementUpdated(el);
    expect(el.valueMin).to.equal(30);
  });

  it("track-color reads the --fluid-range-slider-* override ladder", async () => {
    const el = await fixture<FluidRangeSlider>(html`<fluid-range-slider></fluid-range-slider>`);
    el.style.setProperty("--fluid-range-slider-track-color", "rgb(1, 2, 3)");
    await elementUpdated(el);
    const track = el.shadowRoot!.querySelector<HTMLElement>('[part~="track"]')!;
    expect(getComputedStyle(track).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the target row respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidRangeSlider>(html`<fluid-range-slider></fluid-range-slider>`);
    el.style.setProperty("--fluid-target-min", "44px");
    el.style.display = "block";
    el.style.width = "300px";
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>('[part~="base"]')!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidRangeSlider>(html`
      <div style="${TOKENS}">
        <fluid-range-slider value-min="30" value-max="70"></fluid-range-slider>
      </div>
    `);
    const slider = el.querySelector<FluidRangeSlider>("fluid-range-slider")!;
    await elementUpdated(slider);
    await aTimeout(20);
    await expect(slider).to.be.accessible();
  });
});
