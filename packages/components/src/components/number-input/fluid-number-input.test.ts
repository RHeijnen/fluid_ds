import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../input/define.js";
import type { FluidNumberInput } from "./fluid-number-input.js";

describe("<fluid-number-input>", () => {
  it("platform focus reaches the numeric input without the JavaScript focus override", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input label="Quantity"></fluid-number-input>`
    );
    HTMLElement.prototype.focus.call(el);
    expect(el.shadowRoot!.activeElement).to.equal(el.shadowRoot!.querySelector("input"));
  });

  it("renders an empty number input", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x"></fluid-number-input>`
    );
    expect(el.shadowRoot!.querySelector("input")!.type).to.equal("number");
  });

  it("renders an optional label and associates help text with the input", async () => {
    const el = await fixture<FluidNumberInput>(html`
      <fluid-number-input
        label="Quantity"
        help-text="Choose from 1 through 10."
      ></fluid-number-input>
    `);
    const label = el.shadowRoot!.querySelector<HTMLLabelElement>('[part="label"]')!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const help = el.shadowRoot!.querySelector<HTMLElement>('[part="help-text"]')!;

    expect(label.textContent?.trim()).to.equal("Quantity");
    expect(label.htmlFor).to.equal("input");
    expect(input.id).to.equal("input");
    expect(input.getAttribute("aria-describedby")).to.equal(help.id);
    expect(help.textContent?.trim()).to.equal("Choose from 1 through 10.");
  });

  it("renders prefix and suffix as full-height component-owned affix boxes", async () => {
    const el = await fixture<FluidNumberInput>(html`
      <fluid-number-input aria-label="Weight" value="25">
        <span slot="prefix">≈</span>
        <span slot="suffix">kg</span>
      </fluid-number-input>
    `);
    await aTimeout(0);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const prefix = el.shadowRoot!.querySelector<HTMLElement>('[part="prefix"]')!;
    const suffix = el.shadowRoot!.querySelector<HTMLElement>('[part="suffix"]')!;

    expect(prefix.hidden).to.equal(false);
    expect(suffix.hidden).to.equal(false);
    expect(prefix.getBoundingClientRect().height).to.be.closeTo(base.clientHeight, 0.1);
    expect(suffix.getBoundingClientRect().height).to.be.closeTo(base.clientHeight, 0.1);
  });

  it("keeps an untouched required field visually neutral until blur or validation", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input required aria-label="Quantity"></fluid-number-input>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(el.validity.valueMissing).to.equal(true);
    expect(base.classList.contains("invalid")).to.equal(false);
    expect(input.getAttribute("aria-invalid")).to.equal("false");

    input.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(base.classList.contains("invalid")).to.equal(true);
    expect(input.getAttribute("aria-invalid")).to.equal("true");
  });

  it("preserves authored disabled state through disabled fieldset ownership", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset>
          <fluid-number-input disabled aria-label="Authored disabled"></fluid-number-input>
          <fluid-number-input aria-label="Owner disabled only"></fluid-number-input>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const [authored, enabled] = form.querySelectorAll<FluidNumberInput>("fluid-number-input");
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

  it("recomputes range and step validity after live constraint changes", async () => {
    const el = await fixture<FluidNumberInput>(html`
      <fluid-number-input value="7" min="0" max="10" step="1"></fluid-number-input>
    `);
    expect(el.checkValidity()).to.equal(true);

    el.max = 6;
    await el.updateComplete;
    expect(el.validity.rangeOverflow).to.equal(true);
    el.max = 10;
    el.step = 2;
    await el.updateComplete;
    expect(el.validity.rangeOverflow).to.equal(false);
    expect(el.validity.stepMismatch).to.equal(true);
    el.value = "8";
    await el.updateComplete;
    expect(el.checkValidity()).to.equal(true);
  });

  it("canonicalizes a malformed programmatic edit instead of submitting non-numeric text", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-number-input name="quantity" value="5"></fluid-number-input></form>
    `);
    const el = form.querySelector<FluidNumberInput>("fluid-number-input")!;
    el.value = "not-a-number";
    await el.updateComplete;
    const native = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    expect(native.value).to.equal("");
    expect(el.value).to.equal("");
    expect(new FormData(form).get("quantity")).to.equal("");
  });

  it("treats non-positive live step values as the native default step", async () => {
    const el = await fixture<FluidNumberInput>(html`
      <fluid-number-input value="4" step="0"></fluid-number-input>
    `);
    el.stepUp();
    await el.updateComplete;
    expect(el.value).to.equal("5");
    el.step = -2;
    el.stepDown();
    await el.updateComplete;
    expect(el.value).to.equal("4");
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

  it("renders decrement then increment as full-height horizontal steppers", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x" value="1"></fluid-number-input>`
    );
    const steppers = el.shadowRoot!.querySelector<HTMLElement>('[part="steppers"]')!;
    const buttons = [...steppers.querySelectorAll<HTMLButtonElement>("button")];

    expect(getComputedStyle(steppers).flexDirection).to.equal("row");
    expect(buttons.map((button) => button.getAttribute("part"))).to.deep.equal([
      "stepper-down",
      "stepper-up"
    ]);
    expect(buttons.map((button) => button.getAttribute("aria-label"))).to.deep.equal([
      "Decrease",
      "Increase"
    ]);
    for (const button of buttons) {
      expect(button.type).to.equal("button");
      expect(button.tabIndex).to.equal(-1);
    }
    expect(buttons[0]!.querySelector("fluid-icon")!.getAttribute("name")).to.equal(
      "number-input-minus"
    );
    expect(buttons[1]!.querySelector("fluid-icon")!.getAttribute("name")).to.equal(
      "number-input-plus"
    );
  });

  it("offers compact native-style stacked chevrons without changing field height", async () => {
    const el = await fixture<FluidNumberInput>(html`
      <fluid-number-input aria-label="x" value="1" stepper-variant="chevrons"></fluid-number-input>
    `);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const steppers = el.shadowRoot!.querySelector<HTMLElement>(".steppers")!;
    const buttons = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".stepper")];
    expect(getComputedStyle(steppers).flexDirection).to.equal("column");
    expect(buttons[0]!.getAttribute("part")).to.equal("stepper-up");
    expect(buttons[0]!.querySelector("fluid-icon")!.getAttribute("name")).to.equal(
      "number-input-chevron-up"
    );
    expect(buttons[1]!.getAttribute("part")).to.equal("stepper-down");
    expect(buttons[1]!.querySelector("fluid-icon")!.getAttribute("name")).to.equal(
      "number-input-chevron-down"
    );
    expect(
      buttons.reduce((height, button) => height + button.getBoundingClientRect().height, 0)
    ).to.be.closeTo(base.clientHeight, 0.1);
    expect(buttons[0]!.getBoundingClientRect().width).to.be.closeTo(
      buttons[1]!.getBoundingClientRect().width,
      0.1
    );
  });

  it("matches Input geometry for every shared size", async () => {
    const row = await fixture<HTMLElement>(html`
      <div style="display:grid; grid-template-columns:repeat(2, 240px);">
        <fluid-input size="sm" aria-label="Small text"></fluid-input>
        <fluid-number-input size="sm" aria-label="Small number"></fluid-number-input>
        <fluid-input size="md" aria-label="Medium text"></fluid-input>
        <fluid-number-input size="md" aria-label="Medium number"></fluid-number-input>
        <fluid-input size="lg" aria-label="Large text"></fluid-input>
        <fluid-number-input size="lg" aria-label="Large number"></fluid-number-input>
      </div>
    `);
    const controls = [...row.children] as HTMLElement[];
    for (let index = 0; index < controls.length; index += 2) {
      expect(controls[index + 1]!.getBoundingClientRect().height).to.be.closeTo(
        controls[index]!.getBoundingClientRect().height,
        0.1
      );
    }
  });

  it("matches the standard Input height at AA and at a raised target floor", async () => {
    const row = await fixture<HTMLElement>(html`
      <div
        style="display:flex; align-items:flex-start; --fluid-field-height-md:36px; --fluid-field-border-width:1px; --fluid-target-min:24px;"
      >
        <fluid-input aria-label="Text"></fluid-input>
        <fluid-number-input aria-label="Number"></fluid-number-input>
      </div>
    `);
    const input = row.querySelector<HTMLElement>("fluid-input")!;
    const numberInput = row.querySelector<FluidNumberInput>("fluid-number-input")!;
    const heights = () =>
      [input, numberInput].map((control) => control.getBoundingClientRect().height);
    const base = numberInput.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!;
    const buttons = numberInput.shadowRoot!.querySelectorAll<HTMLButtonElement>("button");

    expect(heights()[1]).to.be.closeTo(heights()[0]!, 0.1);
    for (const button of buttons) {
      expect(button.getBoundingClientRect().height).to.be.closeTo(base.clientHeight, 0.1);
      expect(button.getBoundingClientRect().width).to.be.greaterThanOrEqual(24);
    }

    row.style.setProperty("--fluid-target-min", "44px");
    await numberInput.updateComplete;
    expect(heights()[1]).to.be.closeTo(heights()[0]!, 0.1);
    for (const button of buttons) {
      const rect = button.getBoundingClientRect();
      expect(rect.height).to.be.closeTo(base.clientHeight, 0.1);
      expect(rect.height).to.be.greaterThanOrEqual(44);
      expect(rect.width).to.be.greaterThanOrEqual(44);
    }
  });

  it("disables both steppers when readonly", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x" value="5" readonly></fluid-number-input>`
    );
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button");
    expect([...buttons].every((button) => button.disabled)).to.be.true;
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

  it("uses medium field typography and allows component font overrides", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input
        aria-label="x"
        style="--fluid-font-family-sans: 'Number Sans'; --fluid-font-size-md: 14px;"
      ></fluid-number-input>`
    );
    const input = el.shadowRoot!.querySelector("input")!;
    expect(getComputedStyle(input).fontFamily).to.contain("Number Sans");
    expect(getComputedStyle(input).fontSize).to.equal("14px");
    expect(getComputedStyle(input).fontVariantNumeric).to.equal("tabular-nums");

    el.style.setProperty("--fluid-number-input-font-family", "'Number Override'");
    el.style.setProperty("--fluid-number-input-font-size", "15px");
    await el.updateComplete;
    expect(getComputedStyle(input).fontFamily).to.contain("Number Override");
    expect(getComputedStyle(input).fontSize).to.equal("15px");
  });

  it("isolates geometry, line-height, target sizing and disabled opacity", async () => {
    const el = await fixture<FluidNumberInput>(html`
      <fluid-number-input
        disabled
        aria-label="x"
        style="
          --fluid-number-input-height: 50px;
          --fluid-number-input-padding-x: 17px;
          --fluid-number-input-line-height: 20px;
          --fluid-number-input-stepper-size: 42px;
          --fluid-number-input-stepper-icon-size: 18px;
          --fluid-number-input-disabled-opacity: 0.7;
        "
      ></fluid-number-input>
    `);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const stepper = el.shadowRoot!.querySelector<HTMLButtonElement>(".stepper")!;
    const icon = stepper.querySelector<HTMLElement>("fluid-icon")!;
    expect(base.getBoundingClientRect().height).to.be.closeTo(50, 1.5);
    expect(getComputedStyle(input).paddingInlineStart).to.equal("17px");
    expect(
      getComputedStyle(input).getPropertyValue("--fluid-number-input-line-height").trim()
    ).to.equal("20px");
    expect(stepper.getBoundingClientRect().width).to.be.closeTo(42, 1.5);
    expect(icon.getBoundingClientRect().width).to.be.closeTo(18, 1.5);
    expect(getComputedStyle(base).opacity).to.equal("0.7");
  });

  it("isolates size-specific typography, geometry, affixes and disabled colors", async () => {
    const el = await fixture<FluidNumberInput>(html`
      <fluid-number-input
        size="sm"
        disabled
        aria-label="x"
        style="
          --fluid-number-input-font-size-sm: 13px;
          --fluid-number-input-height-sm: 46px;
          --fluid-number-input-padding-x-sm: 19px;
          --fluid-number-input-stepper-size-sm: 41px;
          --fluid-number-input-affix-bg: rgb(1, 2, 3);
          --fluid-number-input-affix-fg: rgb(4, 5, 6);
          --fluid-number-input-disabled-bg: rgb(7, 8, 9);
          --fluid-number-input-disabled-fg: rgb(10, 11, 12);
        "
      >
        <span slot="prefix">€</span>
      </fluid-number-input>
    `);
    await aTimeout(0);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const prefix = el.shadowRoot!.querySelector<HTMLElement>('[part="prefix"]')!;
    const stepper = el.shadowRoot!.querySelector<HTMLButtonElement>(".stepper")!;

    expect(getComputedStyle(input).fontSize).to.equal("13px");
    expect(base.getBoundingClientRect().height).to.be.closeTo(46, 1.5);
    expect(getComputedStyle(input).paddingInlineStart).to.equal("19px");
    expect(stepper.getBoundingClientRect().width).to.be.closeTo(41, 1.5);
    expect(getComputedStyle(prefix).backgroundColor).to.equal("rgb(1, 2, 3)");
    expect(getComputedStyle(prefix).color).to.equal("rgb(4, 5, 6)");
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(7, 8, 9)");
    expect(getComputedStyle(base).color).to.equal("rgb(10, 11, 12)");
  });

  it("omits autocomplete by default and forwards name and autocomplete metadata", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input name="quantity" aria-label="Quantity"></fluid-number-input>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.name).to.equal("quantity");
    expect(input.hasAttribute("autocomplete")).to.equal(false);

    el.autocomplete = "transaction-amount";
    await el.updateComplete;
    expect(input.getAttribute("autocomplete")).to.equal("transaction-amount");
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

  it("each stepper button honors --fluid-target-min as its own pointer-target floor", async () => {
    const el = await fixture<FluidNumberInput>(
      html`<fluid-number-input aria-label="x"></fluid-number-input>`
    );
    // Lift to an AAA-style 44px target floor.
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const up = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="stepper-up"]')!;
    const down = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="stepper-down"]')!;
    for (const btn of [up, down]) {
      const rect = btn.getBoundingClientRect();
      // Side-by-side controls each keep the full target floor on both axes.
      expect(rect.height).to.be.greaterThanOrEqual(44);
      expect(rect.width).to.be.greaterThanOrEqual(44);
    }
  });
});
