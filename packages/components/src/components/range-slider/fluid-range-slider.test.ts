import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
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
  describe("<fluid-range-slider> localized defaults", () => {
    it("keeps application value text while translating the two thumb names", async () => {
      const control = await fixture<FluidRangeSlider>(
        html`<fluid-range-slider lang="ar"></fluid-range-slider>`
      );
      control.valueFormatter = (value) => `Application value ${value}`;
      await control.updateComplete;
      const thumbs = Array.from(control.shadowRoot!.querySelectorAll('[role="slider"]'));
      expect(thumbs.map((thumb) => thumb.getAttribute("aria-label"))).to.deep.equal([
        "الحد الأدنى",
        "الحد الأقصى"
      ]);
      expect(thumbs.map((thumb) => thumb.getAttribute("aria-valuetext"))).to.deep.equal([
        "Application value 25",
        "Application value 75"
      ]);
    });

    const readLabels = (control: FluidRangeSlider) => [
      control.shadowRoot!.querySelector('[part~="thumb-min"]')!.getAttribute("aria-label"),
      control.shadowRoot!.querySelector('[part~="thumb-max"]')!.getAttribute("aria-label")
    ];
    for (const [locale, expected] of [
      ["nl", ["Minimum", "Maximum"]],
      ["de", ["Minimum", "Maximum"]],
      ["fr", ["Minimum", "Maximum"]],
      ["es", ["Mínimo", "Máximo"]],
      ["ar", ["الحد الأدنى", "الحد الأقصى"]],
      ["fr-CA", ["Minimum", "Maximum"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-range-slider></fluid-range-slider></div>
        `);
        const control = wrapper.querySelector<FluidRangeSlider>("fluid-range-slider")!;
        await control.updateComplete;

        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidRangeSlider>(
        html`<fluid-range-slider></fluid-range-slider>`
      );
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Minimum", "Maximum"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Minimum", "Maximum"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["الحد الأدنى", "الحد الأقصى"]);
    });
  });

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

  it("normalizes both thumbs, ARIA, and FormData when bounds shrink", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-range-slider
          name="price"
          min="0"
          max="100"
          value-min="20"
          value-max="80"
        ></fluid-range-slider>
      </form>
    `);
    const el = form.querySelector<FluidRangeSlider>("fluid-range-slider")!;
    const events: Event[] = [];
    el.addEventListener("fluid-input", (event) => events.push(event));
    el.addEventListener("fluid-change", (event) => events.push(event));
    el.min = 30;
    el.max = 60;
    await el.updateComplete;
    const [minThumb, maxThumb] = el.shadowRoot!.querySelectorAll('[role="slider"]');

    expect(el.valueMin).to.equal(30);
    expect(el.valueMax).to.equal(60);
    expect(el.value).to.equal("30,60");
    expect(minThumb!.getAttribute("aria-valuemin")).to.equal("30");
    expect(minThumb!.getAttribute("aria-valuenow")).to.equal("30");
    expect(maxThumb!.getAttribute("aria-valuemax")).to.equal("60");
    expect(maxThumb!.getAttribute("aria-valuenow")).to.equal("60");
    expect(new FormData(form).get("price")).to.equal("30,60");
    expect(events).to.have.length(0);
  });

  it("preserves authored disabled state and releases thumb focus through fieldset ownership", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset>
          <fluid-range-slider disabled></fluid-range-slider>
          <fluid-range-slider></fluid-range-slider>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const [authored, enabled] = form.querySelectorAll<FluidRangeSlider>("fluid-range-slider");
    enabled!.focus();
    expect(enabled!.shadowRoot!.activeElement).to.equal(
      enabled!.shadowRoot!.querySelector('[part~="thumb-min"]')
    );
    fieldset.disabled = true;
    await aTimeout(0);
    expect(enabled!.shadowRoot!.activeElement).to.equal(null);
    fieldset.disabled = false;
    await aTimeout(0);
    expect(authored!.disabled).to.be.true;
    expect(enabled!.disabled).to.be.false;
    expect(
      authored!.shadowRoot!.querySelector('[part~="thumb-min"]')!.getAttribute("tabindex")
    ).to.equal("-1");
    expect(
      enabled!.shadowRoot!.querySelector('[part~="thumb-min"]')!.getAttribute("tabindex")
    ).to.equal("0");
  });

  it("arrow key moves the minimum thumb by step", async () => {
    const el = await fixture<FluidRangeSlider>(
      html`<fluid-range-slider value-min="30" value-max="70" step="5"></fluid-range-slider>`
    );
    const minThumb = el.shadowRoot!.querySelector<HTMLElement>('[part~="thumb-min"]')!;
    minThumb.focus();
    setTimeout(() =>
      minThumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    );
    await oneEvent(el, "fluid-change");
    expect(el.valueMin).to.equal(35);
  });

  it("keeps numeric ArrowRight semantics when direction changes to RTL", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div dir="ltr">
        <fluid-range-slider value-min="30" value-max="70" step="5"></fluid-range-slider>
      </div>
    `);
    const el = wrapper.querySelector<FluidRangeSlider>("fluid-range-slider")!;
    wrapper.dir = "rtl";
    await aTimeout(0);
    await el.updateComplete;
    const minThumb = el.shadowRoot!.querySelector<HTMLElement>('[part~="thumb-min"]')!;
    minThumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;

    expect(el.valueMin).to.equal(35);
    expect(minThumb.getAttribute("aria-valuenow")).to.equal("35");
  });

  it("clears an interrupted pointer drag before reconnecting", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div><fluid-range-slider value-min="30" value-max="70"></fluid-range-slider></div>
    `);
    const el = wrapper.querySelector<FluidRangeSlider>("fluid-range-slider")!;
    const minThumb = el.shadowRoot!.querySelector<HTMLElement>('[part~="thumb-min"]')!;
    minThumb.setPointerCapture = () => undefined;
    minThumb.dispatchEvent(
      new PointerEvent("pointerdown", { pointerId: 1, clientX: 30, bubbles: true })
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part~="thumb-min"]')!.classList.contains("dragging")).to
      .be.true;

    el.remove();
    wrapper.append(el);
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('[part~="thumb-min"]')!.classList.contains("dragging")).to
      .be.false;
    expect(el.valueMin).to.equal(30);
    expect(el.valueMax).to.equal(70);
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

  it("optionally shows both live values using the value formatter", async () => {
    const el = await fixture<FluidRangeSlider>(
      html`<fluid-range-slider show-value value-min="20" value-max="80"></fluid-range-slider>`
    );
    el.valueFormatter = (value) => `$${value}`;
    await elementUpdated(el);
    const output = el.shadowRoot!.querySelector<HTMLOutputElement>('[part~="value"]')!;
    expect(output.textContent).to.equal("$20 – $80");

    el.valueMin = 25;
    await elementUpdated(el);
    expect(output.textContent).to.equal("$25 – $80");
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
