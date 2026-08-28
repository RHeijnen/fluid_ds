import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidSwitch } from "./fluid-switch.js";

describe("<fluid-switch>", () => {
  it("platform focus reaches the switch without the JavaScript focus override", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch>Enabled</fluid-switch>`);
    HTMLElement.prototype.focus.call(el);
    expect(el.shadowRoot!.activeElement).to.equal(el.shadowRoot!.querySelector("input"));
  });

  for (const [locale, message] of [
    ["nl", "Schakel deze schakelaar in."],
    ["de", "Bitte aktivieren Sie diesen Schalter."],
    ["fr-CA", "Veuillez activer cet interrupteur."],
    ["es", "Activa este interruptor."],
    ["ar", "يرجى تفعيل هذا المفتاح."]
  ] as const) {
    it(`updates current required validation when switching to ${locale}`, async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-switch required aria-label="Required control"></fluid-switch></div>
      `);
      const control = wrapper.querySelector<FluidSwitch>("fluid-switch")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Please toggle this switch.");
      wrapper.lang = locale;
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal(message);
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.checkValidity()).to.equal(false);
    });
  }

  it("preserves custom validity across shadow-context language changes and restores the current translation", async () => {
    const host = await fixture<HTMLDivElement>(html`<div></div>`);
    const root = host.attachShadow({ mode: "closed" });
    const wrapper = document.createElement("section");
    wrapper.lang = "nl";
    const control = document.createElement("fluid-switch") as FluidSwitch;
    control.required = true;
    control.ariaLabel = "Application label";
    wrapper.append(control);
    root.append(wrapper);
    await control.updateComplete;
    expect(control.validationMessage).to.equal("Schakel deze schakelaar in.");
    control.setCustomValidity("Application validation");
    wrapper.lang = "de";
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
    expect(control.validationMessage).to.equal("Application validation");
    expect(control.validity.customError).to.equal(true);
    expect(control.ariaLabel).to.equal("Application label");
    control.setCustomValidity("");
    expect(control.validationMessage).to.equal("Bitte aktivieren Sie diesen Schalter.");
    expect(control.validity.customError).to.equal(false);
    expect(control.validity.valueMissing).to.equal(true);
    control.required = false;
    await control.updateComplete;
    expect(control.validationMessage).to.equal("");
    expect(control.checkValidity()).to.equal(true);
  });

  it("renders with checked=false by default", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch>Wifi</fluid-switch>`);
    expect(el.checked).to.be.false;
  });

  it("reflects the checked attribute", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch checked>Wifi</fluid-switch>`);
    expect(el.checked).to.be.true;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.checked).to.be.true;
  });

  it("fires fluid-change on toggle", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch>Wifi</fluid-switch>`);
    const input = el.shadowRoot!.querySelector("input")!;
    setTimeout(() => input.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail).to.deep.equal({ checked: true });
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.checked).to.be.true;
  });

  it("toggles via keyboard (space)", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch>Wifi</fluid-switch>`);
    el.focus();
    await el.updateComplete;
    const [event] = await Promise.all([oneEvent(el, "fluid-change"), sendKeys({ press: "Space" })]);
    expect(event.detail.checked).to.be.true;
  });

  it("submits value=on when checked, omits when unchecked", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-switch name="wifi" checked></fluid-switch>
        <fluid-switch name="bt"></fluid-switch>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("wifi")).to.equal("on");
    expect(data.get("bt")).to.be.null;
  });

  it("submits a custom value when set", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-switch name="theme" checked value="dark"></fluid-switch>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("theme")).to.equal("dark");
  });

  it("preserves custom validity and canonical data across reconnect and form reassociation", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <form id="first">
          <fluid-switch name="theme" checked required aria-label="Theme"></fluid-switch>
        </form>
        <form id="second"></form>
      </div>
    `);
    const first = wrapper.querySelector<HTMLFormElement>("#first")!;
    const second = wrapper.querySelector<HTMLFormElement>("#second")!;
    const el = wrapper.querySelector<FluidSwitch>("fluid-switch")!;
    el.setCustomValidity("Application validation");
    el.remove();
    el.name = "preference";
    el.value = "dark";
    second.append(el);
    await aTimeout(0);
    await el.updateComplete;
    expect(el.form).to.equal(second);
    expect(new FormData(first).has("theme")).to.equal(false);
    expect(new FormData(second).get("preference")).to.equal("dark");
    expect(el.validity.customError).to.equal(true);
    expect(el.validationMessage).to.equal("Application validation");
    el.setCustomValidity("");
    expect(el.checkValidity()).to.equal(true);
    let changes = 0;
    el.addEventListener("fluid-change", () => (changes += 1));
    el.shadowRoot!.querySelector<HTMLInputElement>("input")!.click();
    await el.updateComplete;
    expect(changes).to.equal(1);
    expect(new FormData(second).has("preference")).to.equal(false);
  });

  it("resets live checked state to the explicit authored default", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-switch name="wifi">Wifi</fluid-switch>
        <fluid-switch name="bluetooth" checked>Bluetooth</fluid-switch>
      </form>
    `);
    const [wifi, bluetooth] = form.querySelectorAll<FluidSwitch>("fluid-switch");
    wifi!.shadowRoot!.querySelector<HTMLInputElement>("input")!.click();
    bluetooth!.shadowRoot!.querySelector<HTMLInputElement>("input")!.click();
    await Promise.all([wifi!.updateComplete, bluetooth!.updateComplete]);
    expect(new FormData(form).get("wifi")).to.equal("on");
    expect(new FormData(form).has("bluetooth")).to.be.false;

    form.reset();
    await Promise.all([wifi!.updateComplete, bluetooth!.updateComplete]);
    expect(wifi!.checked).to.be.false;
    expect(bluetooth!.checked).to.be.true;
    expect(wifi!.shadowRoot!.querySelector("input")!.getAttribute("aria-checked")).to.equal(
      "false"
    );
    expect(bluetooth!.shadowRoot!.querySelector("input")!.getAttribute("aria-checked")).to.equal(
      "true"
    );
    expect(new FormData(form).has("wifi")).to.be.false;
    expect(new FormData(form).get("bluetooth")).to.equal("on");
  });

  it("preserves authored disabled state through disabled fieldset ownership", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset>
          <fluid-switch disabled>Authored disabled</fluid-switch>
          <fluid-switch>Owner disabled only</fluid-switch>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const [authored, enabled] = form.querySelectorAll<FluidSwitch>("fluid-switch");
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

  it("respects disabled", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch disabled>Wifi</fluid-switch>`);
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.disabled).to.be.true;
  });

  it("reports invalid when required and not checked", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch required aria-label="Required"></fluid-switch>`
    );
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
  });

  it("becomes valid once checked", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch required aria-label="Required"></fluid-switch>`
    );
    el.checked = true;
    await el.updateComplete;
    expect(el.checkValidity()).to.be.true;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch aria-label="Enable wifi"></fluid-switch>`
    );
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("track-on color reads the --fluid-switch-* override ladder", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch checked aria-label="x"></fluid-switch>`
    );
    el.style.setProperty("--fluid-switch-track-bg-on", "rgb(1, 2, 3)");
    await el.updateComplete;
    const track = el.shadowRoot!.querySelector<HTMLElement>(".track")!;
    expect(getComputedStyle(track).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the clickable target respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch aria-label="x"></fluid-switch>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
