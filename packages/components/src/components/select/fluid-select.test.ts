import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidOption } from "./fluid-option.js";
import type { FluidSelect } from "./fluid-select.js";

const sampleOptions = html`
  <fluid-option value="apple">Apple</fluid-option>
  <fluid-option value="banana">Banana</fluid-option>
  <fluid-option value="cherry" disabled>Cherry</fluid-option>
  <fluid-option value="date">Date</fluid-option>
`;

describe("<fluid-select>", () => {
  describe("<fluid-select> localized validation", () => {
    for (const [locale, message] of [
      ["nl", "Kies een optie."],
      ["de", "Bitte wählen Sie eine Option aus."],
      ["fr", "Veuillez sélectionner une option."],
      ["es", "Selecciona una opción."],
      ["ar", "يرجى اختيار أحد الخيارات."],
      ["fr-CA", "Veuillez sélectionner une option."]
    ] as const) {
      it(`refreshes current required validation in ${locale}`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-select required aria-label="Application label"
              ><fluid-option value="apple">Application option</fluid-option></fluid-select
            >
          </div>
        `);
        const control = wrapper.querySelector<FluidSelect>("fluid-select")!;
        await control.updateComplete;
        expect(control.validity.valueMissing).to.equal(true);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(control.validationMessage).to.equal(message);
        expect(control.validity.valueMissing).to.equal(true);
        expect(control.checkValidity()).to.equal(false);
        expect(control.getAttribute("aria-label")).to.equal("Application label");
      });
    }

    it("tracks dynamic required and preserves custom validity in a changing closed-shadow language context", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const root = host.attachShadow({ mode: "closed" });
      const wrapper = document.createElement("section");
      wrapper.lang = "nl";
      const control = document.createElement("fluid-select") as FluidSelect;
      control.setAttribute("aria-label", "Application label");

      wrapper.append(control);
      root.append(wrapper);
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      control.required = true;
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Kies een optie.");
      control.setCustomValidity("Application validation");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Application validation");
      expect(control.validity.customError).to.equal(true);
      control.setCustomValidity("");
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Option aus.");
      expect(control.validity.customError).to.equal(false);
      expect(control.validity.valueMissing).to.equal(true);
      control.required = false;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("");
      expect(control.checkValidity()).to.equal(true);
      expect(control.getAttribute("aria-label")).to.equal("Application label");
    });

    it("preserves a scoped language override and refreshes invalid text after reconnect", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="nl">
          <fluid-select lang="fr" required aria-label="Application label"
            ><fluid-option value="apple">Application option</fluid-option></fluid-select
          >
        </div>
      `);
      const control = wrapper.querySelector<FluidSelect>("fluid-select")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez sélectionner une option.");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez sélectionner une option.");
      control.removeAttribute("lang");
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Option aus.");
      control.remove();
      wrapper.lang = "ar";
      wrapper.append(control);
      await control.updateComplete;
      expect(control.validationMessage).to.equal("يرجى اختيار أحد الخيارات.");
      expect(control.validity.valueMissing).to.equal(true);
    });

    it("keeps submitted data canonical and restores current-language validation after form reset", async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form lang="nl">
          <fluid-select name="control" required aria-label="Application label"
            ><fluid-option value="apple">Application option</fluid-option></fluid-select
          >
        </form>
      `);
      const control = form.querySelector<FluidSelect>("fluid-select")!;
      await control.updateComplete;
      control.value = "apple";
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      expect(new FormData(form).get("control")).to.equal("apple");
      form.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      form.reset();
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Option aus.");
    });
  });

  it("resolves the active slotted option through element reflection and clears it on close", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.open = true;
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector("button")! as HTMLButtonElement & {
      ariaActiveDescendantElement: Element | null;
    };
    expect(trigger.ariaActiveDescendantElement).to.equal(el.querySelector("fluid-option"));
    el.open = false;
    await el.updateComplete;
    expect(trigger.ariaActiveDescendantElement).to.equal(null);
  });

  it("opens at the first enabled option and does not activate disabled options on hover", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">
        <fluid-option value="apple" disabled>Apple</fluid-option>
        <fluid-option value="banana">Banana</fluid-option>
      </fluid-select>
    `);
    el.open = true;
    await el.updateComplete;
    await aTimeout(0);
    const [disabled, enabled] = el.querySelectorAll("fluid-option");
    expect(enabled!.hasAttribute("active")).to.be.true;
    disabled!.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(disabled!.hasAttribute("active")).to.be.false;
    expect(enabled!.hasAttribute("active")).to.be.true;
  });

  it("has no active option when every option is disabled", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit"
        ><fluid-option disabled>Unavailable</fluid-option></fluid-select
      >
    `);
    el.open = true;
    await el.updateComplete;
    await aTimeout(0);
    expect(el.querySelector("fluid-option[active]")).to.equal(null);
    expect(el.shadowRoot!.querySelector("button")!.hasAttribute("aria-activedescendant")).to.be
      .false;
  });

  it("renders closed by default", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    expect(el.open).to.be.false;
    expect(el.shadowRoot!.querySelector(".trigger")!.getAttribute("aria-expanded")).to.equal(
      "false"
    );
  });

  it("associates an optional visible label and help text with the trigger", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select label="Country" help-text="Used for billing.">${sampleOptions}</fluid-select>
    `);
    const label = el.shadowRoot!.querySelector<HTMLLabelElement>('[part="label"]')!;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    const help = el.shadowRoot!.querySelector<HTMLElement>('[part="help-text"]')!;
    expect(label.htmlFor).to.equal("trigger");
    expect(label.textContent?.trim()).to.equal("Country");
    expect(trigger.getAttribute("aria-describedby")).to.equal(help.id);
  });

  it("keeps an untouched required select visually neutral until blur or validation", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select required aria-label="Country">${sampleOptions}</fluid-select>
    `);
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    expect(el.validity.valueMissing).to.equal(true);
    expect(trigger.classList.contains("invalid")).to.equal(false);
    expect(trigger.getAttribute("aria-invalid")).to.equal("false");

    trigger.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(trigger.classList.contains("invalid")).to.equal(true);
    expect(trigger.getAttribute("aria-invalid")).to.equal("true");
  });

  it("retires a revealed error inside the same update that selects an option", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select required aria-label="Country">${sampleOptions}</fluid-select>
    `);
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    trigger.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(trigger.classList.contains("invalid")).to.equal(true);

    el.value = "apple";
    /*
     * `updateComplete` resolves false when the update scheduled another one.
     * Un-painting the resolved error used to happen in `updated()`, so it did
     * exactly that, and Lit logged its change-in-update warning: an error the
     * SSR browser suite fails on. The state now derives in `willUpdate`, so the
     * one pass both records the selection and clears the error.
     */
    expect(await el.updateComplete).to.equal(true);
    expect(trigger.classList.contains("invalid")).to.equal(false);
    expect(trigger.getAttribute("aria-invalid")).to.equal("false");
    expect(el.validity.valueMissing).to.equal(false);
  });

  it("seeds and clears the active option in the popup's opening and closing update", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select value="banana" aria-label="Fruit">
        <fluid-option value="apple">Apple</fluid-option>
        <fluid-option value="banana">Banana</fluid-option>
      </fluid-select>
    `);
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    el.open = true;
    expect(await el.updateComplete).to.equal(true);
    expect(trigger.ariaActiveDescendantElement).to.equal(el.querySelector('[value="banana"]'));
    expect(trigger.getAttribute("aria-expanded")).to.equal("true");
    el.open = false;
    expect(await el.updateComplete).to.equal(true);
    expect(trigger.ariaActiveDescendantElement).to.equal(null);
    expect(trigger.getAttribute("aria-expanded")).to.equal("false");
    el.value = "";
    await el.updateComplete;
    el.open = true;
    expect(await el.updateComplete).to.equal(true);
    expect(trigger.ariaActiveDescendantElement).to.equal(el.querySelector('[value="apple"]'));
  });

  it("shows the placeholder when nothing is selected", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select placeholder="Pick one" aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    expect(el.shadowRoot!.querySelector(".label")?.textContent?.trim()).to.equal("Pick one");
  });

  it("shows the selected option label when value is set", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select value="banana" aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".label")?.textContent?.trim()).to.equal("Banana");
  });

  it("opens on click", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!.click();
    await el.updateComplete;
    expect(el.open).to.be.true;
    expect(el.shadowRoot!.querySelector(".listbox")!.getAttribute("popover")).to.equal("manual");
  });

  it("selects an option by clicking it", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.open = true;
    await el.updateComplete;
    const banana = el.querySelector<HTMLElement>('fluid-option[value="banana"]')!;
    setTimeout(() => banana.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail).to.deep.equal({ value: "banana" });
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.value).to.equal("banana");
    expect(el.open).to.be.false;
  });

  it("keyboard: ArrowDown opens, Enter selects", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.focus();
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.true;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const changed = oneEvent(el, "fluid-change");
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    const event = await changed;
    expect(event.detail).to.deep.equal({ value: "banana" });
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    await el.updateComplete;
    expect(el.value).to.equal("banana");
  });

  it("keyboard: Escape closes", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.open = true;
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.false;
  });

  it("skips disabled options when navigating", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit" value="banana">${sampleOptions}</fluid-select>
    `);
    el.open = true;
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    // banana → date (skipping cherry which is disabled)
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    const active = el.querySelector<HTMLElement>("fluid-option[active]");
    expect(active?.getAttribute("value")).to.equal("date");
  });

  it("type-ahead jumps to matching option", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.focus();
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.true;
    await aTimeout(10);
    const active = el.querySelector<HTMLElement>("fluid-option[active]");
    expect(active?.getAttribute("value")).to.equal("date");
  });

  it("cycles repeated-character typeahead through matching enabled options", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">
        <fluid-option value="banana">Banana</fluid-option>
        <fluid-option value="blackberry" disabled>Blackberry</fluid-option>
        <fluid-option value="blueberry">Blueberry</fluid-option>
      </fluid-select>
    `);
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    const [banana, , blueberry] = el.querySelectorAll<FluidOption>("fluid-option");
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }));
    await el.updateComplete;
    expect(banana!.active).to.equal(true);
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }));
    await el.updateComplete;
    expect(banana!.active).to.equal(false);
    expect(blueberry!.active).to.equal(true);
  });

  it("closes when clicking outside", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div>
        <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
        <span class="outside">outside</span>
      </div>
    `);
    const el = wrapper.querySelector<FluidSelect>("fluid-select")!;
    el.open = true;
    await el.updateComplete;
    wrapper
      .querySelector<HTMLElement>(".outside")!
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.open).to.be.false;
  });

  it("participates in form submission", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-select name="fruit" value="apple" aria-label="Fruit">${sampleOptions}</fluid-select>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("fruit")).to.equal("apple");
  });

  it("preserves validity and canonical data when reconnected to a new form owner", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <form id="first">
          <fluid-select name="fruit" value="apple" required aria-label="Fruit">
            <fluid-option value="apple">Apple</fluid-option>
            <fluid-option value="banana">Banana</fluid-option>
          </fluid-select>
        </form>
        <form id="second"></form>
      </div>
    `);
    const first = wrapper.querySelector<HTMLFormElement>("#first")!;
    const second = wrapper.querySelector<HTMLFormElement>("#second")!;
    const el = wrapper.querySelector<FluidSelect>("fluid-select")!;
    el.setCustomValidity("Application validation");
    el.remove();
    el.name = "choice";
    second.append(el);
    await aTimeout(0);
    await el.updateComplete;
    expect(el.form).to.equal(second);
    expect(new FormData(first).has("fruit")).to.equal(false);
    expect(new FormData(second).get("choice")).to.equal("apple");
    expect(el.validity.customError).to.equal(true);
    expect(el.validationMessage).to.equal("Application validation");
    el.setCustomValidity("");
    expect(el.checkValidity()).to.equal(true);
  });

  it("preserves authored disabled state through disabled fieldset ownership", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset>
          <fluid-select disabled aria-label="Authored disabled">${sampleOptions}</fluid-select>
          <fluid-select aria-label="Owner disabled only">${sampleOptions}</fluid-select>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const [authored, enabled] = form.querySelectorAll<FluidSelect>("fluid-select");
    fieldset.disabled = true;
    await aTimeout(0);
    expect(authored!.disabled).to.equal(true);
    expect(enabled!.disabled).to.equal(true);
    fieldset.disabled = false;
    await aTimeout(0);
    expect(authored!.disabled).to.equal(true);
    expect(authored!.shadowRoot!.querySelector("button")!.disabled).to.equal(true);
    expect(enabled!.disabled).to.equal(false);
  });

  it("silently falls back when the selected option is removed", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-select name="fruit" value="banana" aria-label="Fruit">${sampleOptions}</fluid-select>
      </form>
    `);
    const el = form.querySelector<FluidSelect>("fluid-select")!;
    const changes: string[] = [];
    el.addEventListener("fluid-change", (event) =>
      changes.push((event as CustomEvent<{ value: string }>).detail.value)
    );
    await el.updateComplete;

    el.querySelector('fluid-option[value="banana"]')!.remove();
    await aTimeout(0);
    await el.updateComplete;

    expect(el.value).to.equal("apple");
    expect(el.querySelector<FluidOption>('fluid-option[value="apple"]')!.selected).to.equal(true);
    expect(new FormData(form).get("fruit")).to.equal("apple");
    expect(changes).to.deep.equal([]);
  });

  it("reports invalid when required and empty", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select required aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
  });

  it("passes a11y audit (closed)", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("trigger background reads the --fluid-select-* override ladder", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="x">${sampleOptions}</fluid-select>
    `);
    el.style.setProperty("--fluid-select-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLElement>(".trigger")!;
    expect(getComputedStyle(trigger).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("isolates trigger sizing, typography, chevron and disabled styling", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select
        size="sm"
        disabled
        aria-label="x"
        style="
          --fluid-select-height-sm: 44px;
          --fluid-select-padding-x-sm: 17px;
          --fluid-select-font-size-sm: 13px;
          --fluid-select-gap: 11px;
          --fluid-select-chevron-size: 18px;
          --fluid-select-chevron-fg: rgb(1, 2, 3);
          --fluid-select-disabled-bg: rgb(4, 5, 6);
          --fluid-select-disabled-fg: rgb(7, 8, 9);
          --fluid-select-disabled-opacity: 0.7;
        "
        >${sampleOptions}</fluid-select
      >
    `);
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    const label = el.shadowRoot!.querySelector<HTMLElement>(".label")!;
    const chevron = el.shadowRoot!.querySelector<HTMLElement>(".chevron")!;
    const styles = getComputedStyle(trigger);
    expect(trigger.getBoundingClientRect().height).to.be.closeTo(46, 0.5);
    expect(getComputedStyle(label).paddingInlineStart).to.equal("17px");
    expect(styles.fontSize).to.equal("13px");
    expect(getComputedStyle(chevron).marginInlineEnd).to.equal("11px");
    expect(styles.backgroundColor).to.equal("rgb(4, 5, 6)");
    expect(styles.color).to.equal("rgb(7, 8, 9)");
    expect(styles.opacity).to.equal("0.7");
    expect(chevron.getBoundingClientRect().width).to.be.closeTo(18, 0.5);
    expect(getComputedStyle(chevron).color).to.equal("rgb(1, 2, 3)");
  });

  it("renders text and icon prefix/suffix slots as full-height affixes", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="x">
        <fluid-icon slot="prefix" name="search" aria-hidden="true"></fluid-icon>
        <span slot="suffix">per month</span>
        ${sampleOptions}
      </fluid-select>
    `);
    await el.updateComplete;

    const trigger = el.shadowRoot!.querySelector<HTMLElement>(".trigger")!;
    const prefix = el.shadowRoot!.querySelector<HTMLElement>(".prefix")!;
    const suffix = el.shadowRoot!.querySelector<HTMLElement>(".suffix")!;
    expect(prefix.hidden).to.equal(false);
    expect(suffix.hidden).to.equal(false);
    expect(prefix.getBoundingClientRect().height).to.be.closeTo(
      trigger.getBoundingClientRect().height,
      0.5
    );
    expect(suffix.getBoundingClientRect().height).to.be.closeTo(
      trigger.getBoundingClientRect().height,
      0.5
    );
  });

  it("hides empty affix boxes and isolates their component tokens", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select
        aria-label="x"
        style="
          --fluid-select-affix-bg: rgb(1, 2, 3);
          --fluid-select-affix-fg: rgb(4, 5, 6);
          --fluid-select-affix-border: rgb(7, 8, 9);
        "
      >
        <span slot="prefix">€</span>
        ${sampleOptions}
      </fluid-select>
    `);
    await el.updateComplete;

    const prefix = el.shadowRoot!.querySelector<HTMLElement>(".prefix")!;
    const suffix = el.shadowRoot!.querySelector<HTMLElement>(".suffix")!;
    const styles = getComputedStyle(prefix);
    expect(prefix.hidden).to.equal(false);
    expect(suffix.hidden).to.equal(true);
    expect(styles.backgroundColor).to.equal("rgb(1, 2, 3)");
    expect(styles.color).to.equal("rgb(4, 5, 6)");
    expect(styles.borderInlineEndColor).to.equal("rgb(7, 8, 9)");
  });

  it("isolates listbox geometry", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select
        aria-label="x"
        style="
          --fluid-select-listbox-radius: 13px;
          --fluid-select-listbox-padding: 7px;
          --fluid-select-listbox-max-height: 140px;
        "
        >${sampleOptions}</fluid-select
      >
    `);
    const listbox = el.shadowRoot!.querySelector<HTMLElement>(".listbox")!;
    const styles = getComputedStyle(listbox);
    expect(styles.borderRadius).to.equal("13px");
    expect(styles.paddingTop).to.equal("7px");
    expect(styles.maxHeight).to.equal("140px");
  });

  it("trigger min-height respects --fluid-target-min (AAA scaling)", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select size="sm" aria-label="x">${sampleOptions}</fluid-select>
    `);
    el.style.setProperty("--fluid-target-min", "60px");
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLElement>(".trigger")!;
    expect(trigger.getBoundingClientRect().height).to.be.greaterThanOrEqual(60);
  });

  it("includes visible borders in its field height without a transparent host wrapper", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select
        aria-label="x"
        style="--fluid-field-height-md:36px; --fluid-field-border-width:1px; --fluid-target-min:24px;"
      >
        ${sampleOptions}
      </fluid-select>
    `);
    const trigger = el.shadowRoot!.querySelector<HTMLElement>(".trigger")!;

    expect(trigger.getBoundingClientRect().height).to.be.closeTo(38, 0.1);
    expect(el.getBoundingClientRect().height).to.be.closeTo(
      trigger.getBoundingClientRect().height,
      0.1
    );

    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    expect(trigger.getBoundingClientRect().height).to.be.closeTo(46, 0.1);
    expect(el.getBoundingClientRect().height).to.be.closeTo(
      trigger.getBoundingClientRect().height,
      0.1
    );
  });
  it("places the listbox by where the trigger is on screen, not in the document", async () => {
    const holder = document.createElement("div");
    holder.style.cssText = "position:absolute;top:1800px;left:20px;width:260px;height:2400px";
    document.body.append(holder);
    const el = await fixture<FluidSelect>(html`
      <fluid-select><fluid-option value="a">Alpha</fluid-option></fluid-select>
    `);
    holder.append(el);

    // Scrolled so the trigger is high on screen with room below it. Measuring
    // overflow in document coordinates kept the placement it would have had at
    // scroll zero, so it opened upwards over an empty screen.
    window.scrollTo(0, 1700);
    await aTimeout(60);
    el.open = true;
    await el.updateComplete;
    await aTimeout(80);

    expect(window.innerHeight - el.getBoundingClientRect().bottom).to.be.greaterThan(200);
    expect(el.getAttribute("data-placement")).to.equal("bottom");

    el.open = false;
    window.scrollTo(0, 0);
    holder.remove();
  });
});

describe("<fluid-select> listbox width", () => {
  it("stays the width of the trigger however long an option is", async () => {
    // A listbox that grew to its longest label read as a second, unrelated
    // panel rather than the continuation of the trigger the borders draw, and
    // once it was wide enough to reach the edge of the viewport, flip answered
    // by re-aligning it to the right, so the two no longer shared an edge.
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Firmware" style="width: 220px">
        <fluid-option value="short">Short</fluid-option>
        <fluid-option value="long">
          Update Apollo modem firmware to SWI9X07H_00.09.10.00 everywhere
        </fluid-option>
      </fluid-select>
    `);
    const trigger = el.shadowRoot!.querySelector(".trigger") as HTMLElement;
    (el.shadowRoot!.querySelector(".trigger") as HTMLElement).click();
    await el.updateComplete;
    await aTimeout(50);
    const listbox = el.shadowRoot!.querySelector(".listbox") as HTMLElement;
    expect(listbox.getBoundingClientRect().width).to.be.closeTo(
      trigger.getBoundingClientRect().width,
      1
    );
  });

  it("truncates a label it cannot fit and keeps the whole of it on the title", async () => {
    const label = "Update Apollo modem firmware to SWI9X07H_00.09.10.00 everywhere";
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Firmware" style="width: 220px">
        <fluid-option value="long">${label}</fluid-option>
      </fluid-select>
    `);
    (el.shadowRoot!.querySelector(".trigger") as HTMLElement).click();
    await el.updateComplete;
    await aTimeout(50);
    const option = el.querySelector("fluid-option")!;
    const text = option.shadowRoot!.querySelector(".label") as HTMLElement;
    expect(text.scrollWidth).to.be.greaterThan(text.clientWidth);
    expect(getComputedStyle(text).textOverflow).to.equal("ellipsis");
    expect(option.getAttribute("title")).to.equal(label);
  });
});
