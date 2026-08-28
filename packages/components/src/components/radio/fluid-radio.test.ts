import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidRadioGroup } from "./fluid-radio-group.js";
import type { FluidRadio } from "./fluid-radio.js";

describe("<fluid-radio-group>", () => {
  for (const [locale, message] of [
    ["nl", "Kies een optie."],
    ["de", "Bitte wählen Sie eine Option aus."],
    ["fr-CA", "Veuillez sélectionner une option."],
    ["es", "Selecciona una opción."],
    ["ar", "يرجى اختيار أحد الخيارات."]
  ] as const) {
    it(`updates current required validation when switching to ${locale}`, async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en">
          <fluid-radio-group required aria-label="Required control"></fluid-radio-group>
        </div>
      `);
      const control = wrapper.querySelector<FluidRadioGroup>("fluid-radio-group")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Please pick an option.");
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
    const control = document.createElement("fluid-radio-group") as FluidRadioGroup;
    control.required = true;
    control.ariaLabel = "Application label";
    wrapper.append(control);
    root.append(wrapper);
    await control.updateComplete;
    expect(control.validationMessage).to.equal("Kies een optie.");
    control.setCustomValidity("Application validation");
    wrapper.lang = "de";
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
    expect(control.validationMessage).to.equal("Application validation");
    expect(control.validity.customError).to.equal(true);
    expect(control.ariaLabel).to.equal("Application label");
    control.setCustomValidity("");
    expect(control.validationMessage).to.equal("Bitte wählen Sie eine Option aus.");
    expect(control.validity.customError).to.equal(false);
    expect(control.validity.valueMissing).to.equal(true);
    control.required = false;
    await control.updateComplete;
    expect(control.validationMessage).to.equal("");
    expect(control.checkValidity()).to.equal(true);
  });

  it("selects the radio matching value", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size" value="md">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md">Medium</fluid-radio>
        <fluid-radio value="lg">Large</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    const checked = el.querySelectorAll<HTMLElement>("fluid-radio[checked]");
    expect(checked.length).to.equal(1);
    expect(checked[0]!.getAttribute("value")).to.equal("md");
  });

  it("clicking a radio updates value and fires fluid-change", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md">Medium</fluid-radio>
      </fluid-radio-group>
    `);
    const md = el.querySelector<HTMLElement>('fluid-radio[value="md"]')!;
    setTimeout(() => md.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail).to.deep.equal({ value: "md" });
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.value).to.equal("md");
  });

  it("synchronizes FormData before fluid-change", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-radio-group name="size" aria-label="Size">
          <fluid-radio value="sm">Small</fluid-radio>
          <fluid-radio value="md">Medium</fluid-radio>
        </fluid-radio-group>
      </form>
    `);
    const group = form.querySelector<FluidRadioGroup>("fluid-radio-group")!;
    let snapshot: string | null = null;
    group.addEventListener("fluid-change", () => {
      snapshot = new FormData(form).get("size") as string | null;
    });
    group.querySelector<HTMLElement>('fluid-radio[value="md"]')!.click();
    expect(snapshot).to.equal("md");
  });

  it("focuses the first enabled radio when native required validation fails", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-radio-group name="size" required aria-label="Size">
          <fluid-radio value="none" disabled>Unavailable</fluid-radio>
          <fluid-radio value="sm">Small</fluid-radio>
        </fluid-radio-group>
        <button type="submit">Submit</button>
      </form>
    `);
    const group = form.querySelector<FluidRadioGroup>("fluid-radio-group")!;
    await group.updateComplete;
    form.querySelector<HTMLButtonElement>("button")!.click();
    expect(document.activeElement).to.equal(
      group.querySelector<HTMLElement>('fluid-radio[value="sm"]')
    );
  });

  it("clears a selected option when it is disabled or removed", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-radio-group name="size" value="md" required aria-label="Size">
          <fluid-radio value="sm">Small</fluid-radio>
          <fluid-radio value="md">Medium</fluid-radio>
        </fluid-radio-group>
      </form>
    `);
    const group = form.querySelector<FluidRadioGroup>("fluid-radio-group")!;
    const medium = group.querySelector<FluidRadio>('fluid-radio[value="md"]')!;
    await group.updateComplete;
    medium.disabled = true;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(group.value).to.equal("");
    expect(new FormData(form).get("size")).to.equal(null);
    group.querySelector<FluidRadio>('fluid-radio[value="sm"]')!.click();
    await group.updateComplete;
    group.querySelector('fluid-radio[value="sm"]')!.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(group.value).to.equal("");
    expect(new FormData(form).get("size")).to.equal(null);
  });

  it("moves focus to the enabled fallback when the focused selection is disabled", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size" value="md">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md">Medium</fluid-radio>
        <fluid-radio value="lg">Large</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    const small = el.querySelector<FluidRadio>('[value="sm"]')!;
    const medium = el.querySelector<FluidRadio>('[value="md"]')!;
    const changes: Event[] = [];
    el.addEventListener("fluid-change", (event) => changes.push(event));
    medium.focus();
    medium.disabled = true;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(el.value).to.equal("");
    expect(medium.checked).to.be.false;
    expect(medium.tabIndex).to.equal(-1);
    expect(small.checked).to.be.false;
    expect(small.tabIndex).to.equal(0);
    expect(document.activeElement).to.equal(small);
    expect(changes).to.have.length(0);
  });

  it("adopts selected-option removal that happened while disconnected", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <form>
          <fluid-radio-group name="size" aria-label="Size" value="md">
            <fluid-radio value="sm">Small</fluid-radio>
            <fluid-radio value="md">Medium</fluid-radio>
          </fluid-radio-group>
        </form>
      </div>
    `);
    const form = wrapper.querySelector("form")!;
    const group = wrapper.querySelector<FluidRadioGroup>("fluid-radio-group")!;
    await group.updateComplete;
    group.remove();
    group.querySelector<FluidRadio>('[value="md"]')!.remove();
    form.append(group);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const small = group.querySelector<FluidRadio>('[value="sm"]')!;
    expect(group.value).to.equal("");
    expect(new FormData(form).get("size")).to.equal(null);
    expect(small.checked).to.be.false;
    expect(small.tabIndex).to.equal(0);
  });

  it("propagates and restores disabled state for options added under a disabled fieldset", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <fluid-radio-group name="size" aria-label="Size">
            <fluid-radio value="sm">Small</fluid-radio>
          </fluid-radio-group>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const group = form.querySelector<FluidRadioGroup>("fluid-radio-group")!;
    await group.updateComplete;
    const added = document.createElement("fluid-radio") as FluidRadio;
    added.value = "md";
    added.textContent = "Medium";
    group.append(added);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(added.disabled).to.be.true;
    expect(added.getAttribute("aria-disabled")).to.equal("true");
    expect(added.tabIndex).to.equal(-1);

    fieldset.disabled = false;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(added.disabled).to.be.false;
    expect(added.getAttribute("aria-disabled")).to.equal("false");
    expect(group.querySelectorAll("fluid-radio[tabindex='0']")).to.have.length(1);
  });

  it("restores authored option disabled states after fieldset propagation", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset>
          <fluid-radio-group name="size" value="sm" aria-label="Size">
            <fluid-radio value="none" disabled>Unavailable</fluid-radio>
            <fluid-radio value="sm">Small</fluid-radio>
          </fluid-radio-group>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const radios = form.querySelectorAll<FluidRadio>("fluid-radio");
    fieldset.disabled = true;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect([...radios].every((radio) => radio.disabled)).to.be.true;
    fieldset.disabled = false;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(radios[0]!.disabled).to.be.true;
    expect(radios[1]!.disabled).to.be.false;
  });

  it("ArrowDown moves selection to the next radio", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size" value="sm">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md">Medium</fluid-radio>
        <fluid-radio value="lg">Large</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    el.querySelector<HTMLElement>('fluid-radio[value="sm"]')!.focus();
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("md");
  });

  it("skips disabled radios", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size" value="sm">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md" disabled>Medium</fluid-radio>
        <fluid-radio value="lg">Large</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    el.querySelector<HTMLElement>('fluid-radio[value="sm"]')!.focus();
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("lg");
  });

  it("submits its value with a form", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-radio-group name="size" value="md" aria-label="Size">
          <fluid-radio value="sm">S</fluid-radio>
          <fluid-radio value="md">M</fluid-radio>
        </fluid-radio-group>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("size")).to.equal("md");
  });

  it("reports invalid when required and no selection", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group required aria-label="Size">
        <fluid-radio value="a">A</fluid-radio>
        <fluid-radio value="b">B</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
  });

  it("defers required error styling until validation is presented", async () => {
    const group = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group required aria-label="Size">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="lg">Large</fluid-radio>
      </fluid-radio-group>
    `);
    await group.updateComplete;

    expect(group.validity.valueMissing).to.be.true;
    expect(group.getAttribute("aria-invalid")).to.equal("false");
    expect(group.shadowRoot!.querySelector(".base")!.classList.contains("invalid")).to.be.false;

    expect(group.checkValidity()).to.be.false;
    await group.updateComplete;
    expect(group.getAttribute("aria-invalid")).to.equal("true");
    expect(group.shadowRoot!.querySelector(".base")!.classList.contains("invalid")).to.be.true;
  });

  it("recovers required validity, focus, and FormData after the selected radio is disabled", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-radio-group name="size" value="md" required aria-label="Size">
          <fluid-radio value="sm">Small</fluid-radio>
          <fluid-radio value="md">Medium</fluid-radio>
        </fluid-radio-group>
      </form>
    `);
    const group = form.querySelector<FluidRadioGroup>("fluid-radio-group")!;
    const small = group.querySelector<FluidRadio>('[value="sm"]')!;
    const medium = group.querySelector<FluidRadio>('[value="md"]')!;
    await group.updateComplete;

    expect(group.checkValidity()).to.be.true;
    expect(new FormData(form).get("size")).to.equal("md");

    medium.disabled = true;
    await aTimeout(0);
    await group.updateComplete;

    expect(group.value).to.equal("");
    expect(group.validity.valueMissing).to.be.true;
    expect(new FormData(form).get("size")).to.equal(null);
    expect(group.reportValidity()).to.be.false;
    expect(document.activeElement).to.equal(small);

    small.click();
    await group.updateComplete;
    expect(group.value).to.equal("sm");
    expect(group.checkValidity()).to.be.true;
    expect(new FormData(form).get("size")).to.equal("sm");
  });

  for (const [key, expected] of [
    ["ArrowRight", "sm"],
    ["ArrowLeft", "lg"]
  ] as const) {
    it(`${key} follows the rendered radio order in inherited RTL`, async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form dir="rtl">
          <fluid-radio-group name="size" value="md" aria-label="Size">
            <fluid-radio value="sm">Small</fluid-radio>
            <fluid-radio value="md">Medium</fluid-radio>
            <fluid-radio value="lg">Large</fluid-radio>
          </fluid-radio-group>
        </form>
      `);
      const group = form.querySelector<FluidRadioGroup>("fluid-radio-group")!;
      const medium = group.querySelector<FluidRadio>('[value="md"]')!;
      const changes: CustomEvent[] = [];
      group.addEventListener("fluid-change", (event) => changes.push(event as CustomEvent));
      await aTimeout(0);
      medium.focus();
      medium.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      await group.updateComplete;

      const selected = group.querySelector<FluidRadio>(`[value="${expected}"]`)!;
      expect(group.value).to.equal(expected);
      expect(document.activeElement).to.equal(selected);
      expect(selected.checked).to.be.true;
      expect(new FormData(form).get("size")).to.equal(expected);
      expect(changes.map((event) => event.detail)).to.deep.equal([{ value: expected }]);
    });
  }

  it("keeps a standalone radio inert and out of the tab order through reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div><fluid-radio value="orphan">Orphan</fluid-radio></div>
    `);
    const radio = wrapper.querySelector<FluidRadio>("fluid-radio")!;
    const changes: Event[] = [];
    radio.addEventListener("fluid-change", (event) => changes.push(event));
    radio.click();
    expect(radio.checked).to.equal(false);
    expect(radio.tabIndex).to.equal(-1);

    radio.remove();
    wrapper.append(radio);
    await radio.updateComplete;
    radio.click();
    expect(radio.checked).to.equal(false);
    expect(radio.tabIndex).to.equal(-1);
    expect(changes).to.have.length(0);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size" value="md">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md">Medium</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("checked accent reads the --fluid-radio-* override ladder", async () => {
    const el = await fixture<FluidRadio>(html`<fluid-radio checked value="x">x</fluid-radio>`);
    el.style.setProperty("--fluid-radio-accent", "rgb(1, 2, 3)");
    await el.updateComplete;
    const control = el.shadowRoot!.querySelector<HTMLElement>(".control")!;
    expect(getComputedStyle(control).borderColor).to.equal("rgb(1, 2, 3)");
  });

  it("keeps the radio geometry stable when selection changes", async () => {
    const el = await fixture<FluidRadio>(html`<fluid-radio value="x">Option</fluid-radio>`);
    const control = el.shadowRoot!.querySelector<HTMLElement>(".control")!;
    const uncheckedRect = control.getBoundingClientRect();

    el.checked = true;
    await el.updateComplete;
    const checkedRect = control.getBoundingClientRect();

    expect(getComputedStyle(control).boxSizing).to.equal("border-box");
    expect(checkedRect.width).to.equal(uncheckedRect.width);
    expect(checkedRect.height).to.equal(uncheckedRect.height);
  });

  it("the clickable target respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidRadio>(html`<fluid-radio value="x">x</fluid-radio>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
