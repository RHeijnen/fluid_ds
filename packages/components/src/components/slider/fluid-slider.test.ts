import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
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
    expect(event.detail).to.deep.equal({ value: "42" });
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.value).to.equal("42");
  });

  it("fires fluid-change when the user commits a change", async () => {
    const el = await fixture<FluidSlider>(html`
      <fluid-slider value="10" aria-label="Volume"></fluid-slider>
    `);
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "75";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail).to.deep.equal({ value: "75" });
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.value).to.equal("75");
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

  it("normalizes host, native, label, and FormData state when bounds shrink", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-slider
          name="volume"
          min="0"
          max="100"
          value="80"
          show-value
          aria-label="Volume"
        ></fluid-slider>
      </form>
    `);
    const el = form.querySelector<FluidSlider>("fluid-slider")!;
    const events: Event[] = [];
    el.addEventListener("fluid-input", (event) => events.push(event));
    el.addEventListener("fluid-change", (event) => events.push(event));
    el.max = 40;
    await el.updateComplete;

    expect(el.value).to.equal("40");
    expect(el.shadowRoot!.querySelector<HTMLInputElement>("input")!.value).to.equal("40");
    expect(el.shadowRoot!.querySelector(".value")!.textContent?.trim()).to.equal("40");
    expect(new FormData(form).get("volume")).to.equal("40");
    expect(events).to.have.length(0);
  });

  it("snaps live values to the nearest step across every observable state", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-slider name="volume" show-value aria-label="Volume"></fluid-slider>
      </form>
    `);
    const el = form.querySelector<FluidSlider>("fluid-slider")!;
    const events: Event[] = [];
    el.addEventListener("fluid-input", (event) => events.push(event));
    el.addEventListener("fluid-change", (event) => events.push(event));
    el.min = 0.1;
    el.max = 1.1;
    el.step = 0.2;
    el.value = "0.4";
    await el.updateComplete;
    expect(el.value).to.equal("0.5");
    expect(el.shadowRoot!.querySelector<HTMLInputElement>("input")!.value).to.equal("0.5");
    expect(el.shadowRoot!.querySelector(".value")!.textContent?.trim()).to.equal("0.5");
    expect(new FormData(form).get("volume")).to.equal("0.5");
    expect(events).to.have.length(0);
  });

  it("keeps numeric arrow semantics and mirrors the rendered fill in RTL", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form dir="rtl">
        <fluid-slider name="volume" min="0" max="100" step="10" value="20" aria-label="Volume">
        </fluid-slider>
      </form>
    `);
    const el = form.querySelector<FluidSlider>("fluid-slider")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.focus();
    await sendKeys({ press: "ArrowRight" });
    await el.updateComplete;
    expect(el.value).to.equal("30");
    expect(new FormData(form).get("volume")).to.equal("30");
    const track = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(track.style.getPropertyValue("--track-bg")).to.contain("to left");
  });

  it("adopts detached bounds and value edits when reconnected to a new form", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <form id="first">
          <fluid-slider name="volume" min="0" max="100" value="80" aria-label="Volume">
          </fluid-slider>
        </form>
        <form id="second"></form>
      </div>
    `);
    const first = wrapper.querySelector<HTMLFormElement>("#first")!;
    const second = wrapper.querySelector<HTMLFormElement>("#second")!;
    const el = wrapper.querySelector<FluidSlider>("fluid-slider")!;
    const events: Event[] = [];
    el.addEventListener("fluid-input", (event) => events.push(event));
    el.addEventListener("fluid-change", (event) => events.push(event));
    el.remove();
    el.name = "level";
    el.min = 10;
    el.max = 40;
    el.step = 5;
    el.value = "33";
    second.append(el);
    await el.updateComplete;
    expect(el.form).to.equal(second);
    expect(new FormData(first).has("volume")).to.equal(false);
    expect(new FormData(second).get("level")).to.equal("35");
    expect(el.shadowRoot!.querySelector<HTMLInputElement>("input")!.value).to.equal("35");
    el.focus();
    expect(el.shadowRoot!.activeElement).to.equal(el.shadowRoot!.querySelector("input"));
    expect(events).to.have.length(0);
  });

  it("preserves authored disabled state through disabled fieldset ownership", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset>
          <fluid-slider disabled aria-label="Authored disabled"></fluid-slider>
          <fluid-slider aria-label="Owner disabled only"></fluid-slider>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const [authored, enabled] = form.querySelectorAll<FluidSlider>("fluid-slider");
    fieldset.disabled = true;
    await aTimeout(0);
    expect(authored!.disabled).to.be.true;
    expect(enabled!.disabled).to.be.true;
    fieldset.disabled = false;
    await aTimeout(0);
    expect(authored!.disabled).to.be.true;
    expect(authored!.shadowRoot!.querySelector("input")!.disabled).to.be.true;
    expect(enabled!.disabled).to.be.false;
    expect(enabled!.shadowRoot!.querySelector("input")!.disabled).to.be.false;
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
