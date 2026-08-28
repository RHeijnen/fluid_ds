import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import type { FluidCheckbox } from "./fluid-checkbox.js";

describe("<fluid-checkbox>", () => {
  it("platform focus reaches the checkbox without the JavaScript focus override", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox>Consent</fluid-checkbox>`);
    HTMLElement.prototype.focus.call(el);
    expect(el.shadowRoot!.activeElement).to.equal(el.shadowRoot!.querySelector("input"));
  });

  it("restores the explicit mixed-state default after interaction", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><fluid-checkbox indeterminate>Mixed</fluid-checkbox></form>`
    );
    const el = form.querySelector<FluidCheckbox>("fluid-checkbox")!;
    el.shadowRoot!.querySelector<HTMLInputElement>("input")!.click();
    await el.updateComplete;
    expect(el.indeterminate).to.equal(false);
    form.reset();
    await el.updateComplete;
    expect(el.indeterminate).to.equal(true);
    expect(el.checked).to.equal(false);
  });

  it("refreshes required validation on locale changes and preserves custom errors", async () => {
    const el = await fixture<FluidCheckbox>(
      html`<fluid-checkbox lang="nl" required>Choice</fluid-checkbox>`
    );
    const dutch = el.validationMessage;
    expect(dutch).not.to.equal("Please check this box.");
    expect(dutch).not.to.equal("");
    el.lang = "de";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.validationMessage).not.to.equal(dutch);
    const german = el.validationMessage;
    el.setCustomValidity("Application error");
    el.lang = "nl";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.validationMessage).to.equal("Application error");
    el.setCustomValidity("");
    expect(el.validationMessage).to.equal(dutch);
    expect(el.validationMessage).not.to.equal(german);
  });

  it("resets to the explicit checked default after user changes and reconnect", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><fluid-checkbox name="terms" checked required>Agree</fluid-checkbox></form>`
    );
    const el = form.querySelector<FluidCheckbox>("fluid-checkbox")!;
    el.shadowRoot!.querySelector<HTMLInputElement>("input")!.click();
    await el.updateComplete;
    expect(el.checked).to.equal(false);
    expect(new FormData(form).has("terms")).to.equal(false);
    el.remove();
    form.append(el);
    form.reset();
    await el.updateComplete;
    expect(el.checked).to.equal(true);
    expect(new FormData(form).get("terms")).to.equal("on");
    expect(el.checkValidity()).to.equal(true);
  });

  it("uses explicit attribute changes as reset defaults without confusing property reflection", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><fluid-checkbox>Agree</fluid-checkbox></form>`
    );
    const el = form.querySelector<FluidCheckbox>("fluid-checkbox")!;
    el.setAttribute("checked", "");
    await el.updateComplete;
    el.checked = false;
    await el.updateComplete;
    form.reset();
    await el.updateComplete;
    expect(el.checked).to.equal(true);
    el.removeAttribute("checked");
    await el.updateComplete;
    el.checked = true;
    await el.updateComplete;
    form.reset();
    await el.updateComplete;
    expect(el.checked).to.equal(false);
  });

  it("preserves authored disabled state through disabled fieldset ownership", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset>
          <fluid-checkbox disabled>Authored disabled</fluid-checkbox>
          <fluid-checkbox>Owner disabled only</fluid-checkbox>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const [authored, enabled] = form.querySelectorAll<FluidCheckbox>("fluid-checkbox");
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

  it("releases and reacquires nested fieldset ownership across reconnect", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled data-owner="outer">
          <fieldset disabled data-owner="inner">
            <fluid-checkbox>Reconnect owner</fluid-checkbox>
          </fieldset>
        </fieldset>
      </form>
    `);
    const outer = form.querySelector<HTMLFieldSetElement>('[data-owner="outer"]')!;
    const inner = form.querySelector<HTMLFieldSetElement>('[data-owner="inner"]')!;
    const el = form.querySelector<FluidCheckbox>("fluid-checkbox")!;

    await aTimeout(0);
    expect(el.disabled).to.be.true;

    el.remove();
    await aTimeout(0);
    expect(el.disabled).to.be.false;

    // The disconnected controller must not retain observers that can restore
    // its former authored value after the consumer makes a new detached edit.
    el.disabled = true;
    inner.disabled = false;
    outer.disabled = false;
    await aTimeout(0);
    expect(el.disabled).to.be.true;

    el.disabled = false;
    inner.disabled = true;
    outer.disabled = true;
    inner.append(el);
    await aTimeout(0);
    expect(el.disabled).to.be.true;

    // Releasing only the nearest owner must not restore while the outer
    // fieldset still owns the effective disabled state.
    inner.disabled = false;
    await aTimeout(0);
    expect(el.disabled).to.be.true;
    outer.disabled = false;
    await aTimeout(0);
    expect(el.disabled).to.be.false;
    expect(el.shadowRoot!.querySelector("input")!.disabled).to.be.false;
  });

  it("renders unchecked by default", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox>Agree</fluid-checkbox>`);
    expect(el.checked).to.be.false;
  });

  it("reflects the checked attribute", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox checked>Agree</fluid-checkbox>`);
    expect(el.checked).to.be.true;
    expect(el.shadowRoot!.querySelector("input")!.checked).to.be.true;
  });

  it("sets indeterminate on the inner input", async () => {
    const el = await fixture<FluidCheckbox>(
      html`<fluid-checkbox indeterminate>Mixed</fluid-checkbox>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("input")!.indeterminate).to.be.true;
  });

  it("recovers combined indeterminate and required validity across disconnect", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-checkbox name="choice" required indeterminate>Choose</fluid-checkbox></form>
    `);
    const el = form.querySelector<FluidCheckbox>("fluid-checkbox")!;
    let input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(el.checkValidity()).to.be.false;
    expect(input.indeterminate).to.be.true;
    expect(input.getAttribute("aria-checked")).to.equal("mixed");

    el.remove();
    el.checked = true;
    el.indeterminate = true;
    form.append(el);
    await el.updateComplete;
    input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(el.checkValidity()).to.be.true;
    expect(new FormData(form).get("choice")).to.equal("on");
    expect(input.indeterminate).to.be.true;
    expect(input.getAttribute("aria-checked")).to.equal("mixed");

    input.click();
    await el.updateComplete;
    expect(el.checked).to.be.false;
    expect(el.indeterminate).to.be.false;
    expect(el.checkValidity()).to.be.false;
    expect(input.getAttribute("aria-checked")).to.equal("false");
    expect(new FormData(form).has("choice")).to.be.false;
  });

  it("fires fluid-change on toggle and clears indeterminate", async () => {
    const el = await fixture<FluidCheckbox>(
      html`<fluid-checkbox indeterminate>Mixed</fluid-checkbox>`
    );
    const input = el.shadowRoot!.querySelector("input")!;
    setTimeout(() => input.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail).to.deep.equal({ checked: true });
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.checked).to.be.true;
    expect(el.indeterminate).to.be.false;
  });

  it("aria-checked is 'mixed' when indeterminate", async () => {
    const el = await fixture<FluidCheckbox>(
      html`<fluid-checkbox indeterminate aria-label="x"></fluid-checkbox>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("input")!.getAttribute("aria-checked")).to.equal("mixed");
  });

  it("submits value when checked", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-checkbox name="terms" checked></fluid-checkbox>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("terms")).to.equal("on");
  });

  it("does not submit when unchecked", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-checkbox name="terms"></fluid-checkbox></form>
    `);
    const data = new FormData(form);
    expect(data.get("terms")).to.be.null;
  });

  it("reports invalid when required and not checked", async () => {
    const el = await fixture<FluidCheckbox>(
      html`<fluid-checkbox required aria-label="x"></fluid-checkbox>`
    );
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
  });

  it("does not paint an untouched required checkbox until validation is presented", async () => {
    const el = await fixture<FluidCheckbox>(html`
      <fluid-checkbox required>Accept terms</fluid-checkbox>
    `);
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector(".base")!;
    const input = el.shadowRoot!.querySelector("input")!;

    expect(el.validity.valueMissing).to.equal(true);
    expect(base.classList.contains("invalid")).to.equal(false);
    expect(input.getAttribute("aria-invalid")).to.equal("false");

    expect(el.checkValidity()).to.equal(false);
    await el.updateComplete;
    expect(base.classList.contains("invalid")).to.equal(true);
    expect(input.getAttribute("aria-invalid")).to.equal("true");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox>Agree</fluid-checkbox>`);
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("checked-box color reads the --fluid-checkbox-* override ladder", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox checked>x</fluid-checkbox>`);
    el.style.setProperty("--fluid-checkbox-bg-on", "rgb(1, 2, 3)");
    await el.updateComplete;
    const control = el.shadowRoot!.querySelector<HTMLElement>(".control")!;
    expect(getComputedStyle(control).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the clickable target respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox aria-label="x"></fluid-checkbox>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
