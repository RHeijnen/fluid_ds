import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidNumberInput } from "./fluid-number-input.js";

describe("<fluid-number-input>", () => {
  it("renders an empty number input", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x"></fluid-number-input>`
    );
    expect(el.shadowRoot!.querySelector("input")!.type).to.equal("number");
  });

  it("stepUp increments the value", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x" value="3" step="2"></fluid-number-input>`
    );
    el.stepUp();
    await el.updateComplete;
    expect(el.value).to.equal("5");
  });

  it("stepDown decrements the value", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x" value="3"></fluid-number-input>`
    );
    el.stepDown();
    await el.updateComplete;
    expect(el.value).to.equal("2");
  });

  it("clamps to max on stepUp", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x" value="9" max="10"></fluid-number-input>`
    );
    el.stepUp();
    el.stepUp();
    await el.updateComplete;
    expect(el.value).to.equal("10");
  });

  it("clicking the stepper button emits fluid-change", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x" value="1"></fluid-number-input>`
    );
    const up = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="stepper-up"]')!;
    setTimeout(() => up.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("2");
  });

  it("hides steppers when no-steppers is set", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x" no-steppers></fluid-number-input>`
    );
    expect(el.shadowRoot!.querySelector('[part="steppers"]')).to.be.null;
  });

  it("submits its value with a form", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-number-input name="qty" value="7"></fluid-number-input>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("qty")).to.equal("7");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="Quantity"></fluid-number-input>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder, danger tone, AAA target floor. */

  it("styled properties read the --fluid-number-input-* override ladder", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x"></fluid-number-input>`
    );
    el.style.setProperty("--fluid-number-input-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("invalid border uses the danger TOKEN, not a hard-coded red", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input required aria-label="x"></fluid-number-input>`
    );
    el.style.setProperty("--fluid-danger-base", "rgb(10, 20, 30)");
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.classList.contains("invalid")).to.be.true;
    expect(getComputedStyle(base).borderColor).to.equal("rgb(10, 20, 30)");
  });

  it("min height respects --fluid-target-min as a floor (AAA scaling)", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x"></fluid-number-input>`
    );
    el.style.setProperty("--fluid-target-min", "60px");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(60);
  });
});
