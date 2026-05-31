import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import "../input/define.js";
import type { FluidColorPicker } from "./fluid-color-picker.js";

/**
 * The hex input is now a child <fluid-input>; we drive it through the public
 * `fluid-input` event so tests don't depend on its internal shadow DOM.
 */
function dispatchHexInput(el: FluidColorPicker, value: string) {
  const inner = el.shadowRoot!.querySelector("fluid-input") as HTMLElement & {
    value: string;
  };
  inner.value = value;
  inner.dispatchEvent(
    new CustomEvent("fluid-input", {
      detail: { value },
      bubbles: true,
      composed: true
    })
  );
}

describe("<fluid-color-picker>", () => {
  it("renders with default black", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker aria-label="Color"></fluid-color-picker>
    `);
    expect(el.value).to.equal("#000000");
  });

  it("syncs hex value into the inner input", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker value="#ff8800" aria-label="Color"></fluid-color-picker>
    `);
    await el.updateComplete;
    const inner = el.shadowRoot!.querySelector("fluid-input") as HTMLElement & {
      value: string;
    };
    expect(inner.value).to.equal("#ff8800");
  });

  it("flags invalid hex", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker aria-label="Color"></fluid-color-picker>
    `);
    el.value = "#notavalidhex";
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
    expect(el.validity.patternMismatch).to.be.true;
  });

  it("accepts a valid 3-char hex", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker value="#f0c" aria-label="Color"></fluid-color-picker>
    `);
    await el.updateComplete;
    expect(el.checkValidity()).to.be.true;
  });

  it("fires fluid-input when the hex value changes", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker aria-label="Color"></fluid-color-picker>
    `);
    await el.updateComplete;
    setTimeout(() => dispatchHexInput(el, "#abcdef"));
    const event = (await oneEvent(el, "fluid-input")) as CustomEvent;
    expect(event.detail.value).to.equal("#abcdef");
    expect(el.value).to.equal("#abcdef");
  });

  it("auto-prefixes # when value lacks it", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker aria-label="Color"></fluid-color-picker>
    `);
    await el.updateComplete;
    dispatchHexInput(el, "abcdef");
    expect(el.value).to.equal("#abcdef");
  });

  it("clicking a preset sets the value", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker .palette=${["#ff0000", "#00ff00", "#0000ff"]} aria-label="Color">
      </fluid-color-picker>
    `);
    await el.updateComplete;
    const presets = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".preset");
    setTimeout(() => presets[1]!.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("#00ff00");
    expect(el.value).to.equal("#00ff00");
  });

  it("submits in a form", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-color-picker
          name="accent"
          value="#ff8800"
          aria-label="Color"
        ></fluid-color-picker>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("accent")).to.equal("#ff8800");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker aria-label="Accent color"></fluid-color-picker>
    `);
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("preset size reads the --fluid-color-picker-* override ladder", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker .palette=${["#ff0000"]} aria-label="Color"></fluid-color-picker>
    `);
    el.style.setProperty("--fluid-color-picker-preset-size", "32px");
    await el.updateComplete;
    const preset = el.shadowRoot!.querySelector<HTMLElement>(".preset")!;
    expect(preset.getBoundingClientRect().width).to.equal(32);
  });

  it("presets respect --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker .palette=${["#ff0000"]} aria-label="Color"></fluid-color-picker>
    `);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const preset = el.shadowRoot!.querySelector<HTMLElement>(".preset")!;
    expect(preset.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
