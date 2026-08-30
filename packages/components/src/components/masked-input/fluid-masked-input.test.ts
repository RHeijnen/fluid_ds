import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidMaskedInput } from "./fluid-masked-input.js";

/** Simulate the user typing `text` into the inner input one character at a
 * time, replaying the browser's insert-at-caret behavior so the formatter and
 * caret logic run exactly as they would for real keystrokes. */
async function type(el: FluidMaskedInput, text: string): Promise<void> {
  const input = el.shadowRoot!.querySelector("input")!;
  for (const ch of text) {
    const caret = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, caret) + ch + input.value.slice(caret);
    input.setSelectionRange(caret + 1, caret + 1);
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await elementUpdated(el);
  }
}

describe("<fluid-masked-input>", () => {
  describe("<fluid-masked-input> localized validation", () => {
    for (const [locale, message] of [
      ["nl", "Vul dit veld volledig in."],
      ["de", "Bitte füllen Sie dieses Feld vollständig aus."],
      ["fr", "Veuillez compléter ce champ."],
      ["es", "Completa todo el campo."],
      ["ar", "يرجى إكمال هذا الحقل."],
      ["fr-CA", "Veuillez compléter ce champ."]
    ] as const) {
      it(`updates an existing valueMissing error in ${locale} without discarding the input`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-masked-input
              required
              mask="###"
              value="12"
              aria-label="Application label"
            ></fluid-masked-input>
          </div>
        `);
        const control = wrapper.querySelector<FluidMaskedInput>("fluid-masked-input")!;
        await control.updateComplete;
        expect(control.validity.valueMissing).to.equal(true);
        const value = control.value;
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(control.validationMessage).to.equal(message);
        expect(control.validity.valueMissing).to.equal(true);
        expect(control.value).to.equal(value);
        control.setCustomValidity("Application correction");
        wrapper.lang = "nl";
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(control.validationMessage).to.equal("Application correction");
        control.setCustomValidity("");
        expect(control.validationMessage).to.equal("Vul dit veld volledig in.");
      });
    }

    for (const [locale, message] of [
      ["nl", "Vul dit veld in."],
      ["de", "Bitte füllen Sie dieses Feld aus."],
      ["fr", "Veuillez renseigner ce champ."],
      ["es", "Completa este campo."],
      ["ar", "يرجى ملء هذا الحقل."],
      ["fr-CA", "Veuillez renseigner ce champ."]
    ] as const) {
      it(`refreshes current required validation in ${locale}`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-masked-input
              required
              aria-label="Application label"
              mask="###"
            ></fluid-masked-input>
          </div>
        `);
        const control = wrapper.querySelector<FluidMaskedInput>("fluid-masked-input")!;
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
      const control = document.createElement("fluid-masked-input") as FluidMaskedInput;
      control.setAttribute("aria-label", "Application label");
      control.mask = "###";
      wrapper.append(control);
      root.append(wrapper);
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      control.required = true;
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Vul dit veld in.");
      control.setCustomValidity("Application validation");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Application validation");
      expect(control.validity.customError).to.equal(true);
      control.setCustomValidity("");
      expect(control.validationMessage).to.equal("Bitte füllen Sie dieses Feld aus.");
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
          <fluid-masked-input
            lang="fr"
            required
            aria-label="Application label"
            mask="###"
          ></fluid-masked-input>
        </div>
      `);
      const control = wrapper.querySelector<FluidMaskedInput>("fluid-masked-input")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez renseigner ce champ.");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez renseigner ce champ.");
      control.removeAttribute("lang");
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Bitte füllen Sie dieses Feld aus.");
      control.remove();
      wrapper.lang = "ar";
      wrapper.append(control);
      await control.updateComplete;
      expect(control.validationMessage).to.equal("يرجى ملء هذا الحقل.");
      expect(control.validity.valueMissing).to.equal(true);
    });

    it("keeps submitted data canonical and restores current-language validation after form reset", async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form lang="nl">
          <fluid-masked-input
            name="control"
            required
            aria-label="Application label"
            mask="###"
          ></fluid-masked-input>
        </form>
      `);
      const control = form.querySelector<FluidMaskedInput>("fluid-masked-input")!;
      await control.updateComplete;
      control.value = "123";
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      expect(new FormData(form).get("control")).to.equal("123");
      form.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      form.reset();
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Bitte füllen Sie dieses Feld aus.");
    });
  });

  it("renders with defaults", async () => {
    const el = await fixture<FluidMaskedInput>(html`<fluid-masked-input></fluid-masked-input>`);
    expect(el.size).to.equal("md");
    expect(el.value).to.equal("");
    expect(el.mask).to.equal("");
  });

  it("renders required validity in the same update as value, mask, and reset changes", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-masked-input name="answer" mask="##/##" aria-label="Expiry"></fluid-masked-input>
      </form>
    `);
    const el = form.querySelector<FluidMaskedInput>("fluid-masked-input")!;
    const input = el.shadowRoot!.querySelector("input")!;
    el.required = true;
    expect(await el.updateComplete).to.equal(true);
    expect(el.validity.valueMissing).to.equal(true);
    expect(input.getAttribute("aria-invalid")).to.equal("false");

    input.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(input.getAttribute("aria-invalid")).to.equal("true");

    el.value = "1234";
    expect(await el.updateComplete).to.equal(true);
    expect(el.value).to.equal("12/34");
    expect(el.validity.valid).to.equal(true);
    expect(input.getAttribute("aria-invalid")).to.equal("false");
    expect(new FormData(form).get("answer")).to.equal("12/34");

    el.mask = "##/###";
    expect(await el.updateComplete).to.equal(true);
    expect(el.validity.valueMissing).to.equal(true);
    expect(input.getAttribute("aria-invalid")).to.equal("false");
    expect(el.validationMessage).to.equal("Please complete the field.");

    form.reset();
    expect(await el.updateComplete).to.equal(true);
    expect(el.value).to.equal("");
    expect(el.validity.valueMissing).to.equal(true);
    expect(input.getAttribute("aria-invalid")).to.equal("false");
    expect(el.validationMessage).to.equal("Please fill out this field.");

    el.required = false;
    expect(await el.updateComplete).to.equal(true);
    expect(el.validity.valid).to.equal(true);
    expect(input.getAttribute("aria-invalid")).to.equal("false");
  });

  it("formats input against the mask as the user types", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="(###) ###-####" aria-label="Phone"></fluid-masked-input>`
    );
    await type(el, "5551234567");
    expect(el.value).to.equal("(555) 123-4567");
  });

  it("does not turn leading mask literals into a value before typing", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="(###) ###-####" aria-label="Phone"></fluid-masked-input>`
    );
    expect(el.value).to.equal("");
    expect(el.shadowRoot!.querySelector<HTMLInputElement>("input")!.value).to.equal("");

    await type(el, "5");
    expect(el.value).to.equal("(5");
  });

  it("exposes the raw characters as unmaskedValue", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="(###) ###-####" aria-label="Phone"></fluid-masked-input>`
    );
    await type(el, "5551234567");
    expect(el.unmaskedValue).to.equal("5551234567");
  });

  it("only accepts characters matching the next placeholder token", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="###" aria-label="Digits"></fluid-masked-input>`
    );
    await type(el, "1a2b3");
    expect(el.value).to.equal("123");
    expect(el.unmaskedValue).to.equal("123");
  });

  it("supports letter (A) and alphanumeric (*) tokens", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="AA-*#" aria-label="Code"></fluid-masked-input>`
    );
    await type(el, "ab9c5");
    // AA consumes a,b; literal "-" auto-inserted; * takes 9; # takes 5. "c"
    // was offered to # which rejects a letter, so it is dropped.
    expect(el.value).to.equal("ab-95");
  });

  it("normalizes a programmatically set value against the mask", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="(###) ###-####" aria-label="Phone"></fluid-masked-input>`
    );
    el.value = "5551234567";
    await elementUpdated(el);
    expect(el.value).to.equal("(555) 123-4567");
  });

  it("fires fluid-input with formatted + unmasked detail", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="##/##" aria-label="Expiry"></fluid-masked-input>`
    );
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "12";
    setTimeout(() => input.dispatchEvent(new InputEvent("input", { bubbles: true })));
    const event = await oneEvent(el, "fluid-input");
    expect((event as CustomEvent).detail.value).to.equal("12/");
    expect((event as CustomEvent).detail.unmaskedValue).to.equal("12");
  });

  it("fires fluid-change on blur after edit", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="####" aria-label="Pin"></fluid-masked-input>`
    );
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "1234";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    setTimeout(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    const event = await oneEvent(el, "fluid-change");
    expect((event as CustomEvent).detail.value).to.equal("1234");
  });

  it("submits the formatted string as the form value", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-masked-input name="phone" mask="(###) ###-####" value="5551234567">
        </fluid-masked-input>
      </form>
    `);
    await elementUpdated(form.querySelector("fluid-masked-input")!);
    const data = new FormData(form);
    expect(data.get("phone")).to.equal("(555) 123-4567");
  });

  it("respects disabled", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input disabled mask="###"></fluid-masked-input>`
    );
    expect(el.shadowRoot!.querySelector("input")!.disabled).to.be.true;
  });

  it("reports invalid when required and incomplete", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input required mask="(###) ###-####" aria-label="x"></fluid-masked-input>`
    );
    await type(el, "555");
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("blur"));
    await elementUpdated(el);
    expect(el.checkValidity()).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
  });

  it("becomes valid once every placeholder is filled", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input required mask="##/##" aria-label="x"></fluid-masked-input>`
    );
    await type(el, "1225");
    await elementUpdated(el);
    expect(el.checkValidity()).to.be.true;
  });

  it("derives a visual placeholder from the mask", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="##/##" aria-label="x"></fluid-masked-input>`
    );
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("input")!.placeholder).to.equal("__/__");
  });

  it("styled properties read the --fluid-masked-input-* override ladder", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="###" aria-label="x"></fluid-masked-input>`
    );
    el.style.setProperty("--fluid-masked-input-bg", "rgb(1, 2, 3)");
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("uses the sans typography token by default and allows a component font override", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input
        mask="###"
        aria-label="x"
        style="--fluid-font-family-sans: 'Masked Sans';"
      ></fluid-masked-input>`
    );
    const input = el.shadowRoot!.querySelector("input")!;
    expect(getComputedStyle(input).fontFamily).to.contain("Masked Sans");
    expect(getComputedStyle(input).fontVariantNumeric).to.equal("tabular-nums");

    el.style.setProperty("--fluid-masked-input-font-family", "'Masked Override'");
    await elementUpdated(el);
    expect(getComputedStyle(input).fontFamily).to.contain("Masked Override");
  });

  it("isolates typography, geometry and motion with component-scoped hooks", async () => {
    const el = await fixture<FluidMaskedInput>(html`
      <fluid-masked-input
        size="md"
        mask="###"
        aria-label="x"
        style="
          --fluid-masked-input-font-size-md: 18px;
          --fluid-masked-input-line-height: 20px;
          --fluid-masked-input-height-md: 50px;
          --fluid-masked-input-padding-x-md: 17px;
          --fluid-masked-input-duration: 3ms;
        "
      ></fluid-masked-input>
    `);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const inputStyle = getComputedStyle(input);
    expect(inputStyle.fontSize).to.equal("18px");
    expect(inputStyle.getPropertyValue("--fluid-masked-input-line-height").trim()).to.equal("20px");
    expect(inputStyle.paddingInlineStart).to.equal("17px");
    expect(base.getBoundingClientRect().height).to.be.closeTo(50, 1.5);
    expect(
      getComputedStyle(base).getPropertyValue("--fluid-masked-input-duration").trim()
    ).to.equal("3ms");
  });

  it("uses shared and component-scoped focus-ring colors in the override ladder", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input
        mask="###"
        aria-label="x"
        style="--fluid-focus-ring-color: rgb(255, 0, 0); --fluid-focus-ring-width: 2px;"
      ></fluid-masked-input>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    input.focus();
    await elementUpdated(el);
    const sharedRing = getComputedStyle(base).boxShadow;
    expect(sharedRing).not.to.equal("none");

    el.style.setProperty("--fluid-masked-input-focus-ring-color", "rgb(0, 0, 255)");
    await elementUpdated(el);
    expect(getComputedStyle(base).boxShadow).not.to.equal(sharedRing);
  });

  it("omits autocomplete by default and forwards a consumer hint", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="###" aria-label="x"></fluid-masked-input>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.hasAttribute("autocomplete")).to.equal(false);

    el.autocomplete = "tel";
    await elementUpdated(el);
    expect(input.getAttribute("autocomplete")).to.equal("tel");
  });

  it("renders prefix and suffix content in full-height component-owned affix boxes", async () => {
    const el = await fixture<FluidMaskedInput>(html`
      <fluid-masked-input mask="###" aria-label="Code">
        <span slot="prefix" style="height: 8px;">#</span>
        <span slot="suffix">EU</span>
      </fluid-masked-input>
    `);
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const prefix = el.shadowRoot!.querySelector<HTMLElement>(".prefix")!;
    const suffix = el.shadowRoot!.querySelector<HTMLElement>(".suffix")!;
    expect(prefix.hasAttribute("hidden")).to.equal(false);
    expect(suffix.hasAttribute("hidden")).to.equal(false);
    expect(prefix.getBoundingClientRect().height).to.be.closeTo(
      base.getBoundingClientRect().height,
      1.5
    );
    expect(suffix.getBoundingClientRect().height).to.be.closeTo(
      base.getBoundingClientRect().height,
      1.5
    );
  });

  it("keeps affixes out of the masked and submitted values", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-masked-input name="code" mask="###" value="123" aria-label="Code">
          <span slot="prefix">ID</span>
          <span slot="suffix">EU</span>
        </fluid-masked-input>
      </form>
    `);
    const el = form.querySelector<FluidMaskedInput>("fluid-masked-input")!;
    await elementUpdated(el);
    expect(el.value).to.equal("123");
    expect(new FormData(form).get("code")).to.equal("123");
  });

  it("allows affix colors to be isolated per masked input", async () => {
    const el = await fixture<FluidMaskedInput>(html`
      <fluid-masked-input
        mask="###"
        aria-label="Code"
        style="
          --fluid-masked-input-affix-bg: rgb(1, 2, 3);
          --fluid-masked-input-affix-fg: rgb(4, 5, 6);
          --fluid-masked-input-affix-border: rgb(7, 8, 9);
          --fluid-masked-input-border-width: 1px;
        "
      >
        <span slot="suffix">EU</span>
      </fluid-masked-input>
    `);
    await elementUpdated(el);
    const suffix = el.shadowRoot!.querySelector<HTMLElement>(".suffix")!;
    const style = getComputedStyle(suffix);
    expect(style.backgroundColor).to.equal("rgb(1, 2, 3)");
    expect(style.color).to.equal("rgb(4, 5, 6)");
    expect(style.borderInlineStartColor).to.equal("rgb(7, 8, 9)");
  });

  it("invalid border uses the danger TOKEN, not a hard-coded red", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input required mask="###" aria-label="x"></fluid-masked-input>`
    );
    el.style.setProperty("--fluid-danger-base", "rgb(10, 20, 30)");
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("blur"));
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.classList.contains("invalid")).to.be.true;
    expect(getComputedStyle(base).borderColor).to.equal("rgb(10, 20, 30)");
  });

  it("min height respects --fluid-target-min as a floor (AAA scaling)", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input size="sm" mask="###" aria-label="x"></fluid-masked-input>`
    );
    el.style.setProperty("--fluid-target-min", "60px");
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(60);
  });

  it("always exposes aria-invalid on the inner input", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="###" aria-label="x"></fluid-masked-input>`
    );
    expect(el.shadowRoot!.querySelector("input")!.getAttribute("aria-invalid")).to.equal("false");
  });

  it("passes a11y audit", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-subtle:#f4f4f5; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-border-strong:#a1a1aa; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-danger-base:#dc2626; --fluid-danger-text:#ffffff;"
      >
        <fluid-masked-input mask="(###) ###-####" aria-label="Phone number"></fluid-masked-input>
      </div>
    `);
    const el = wrapper.querySelector<FluidMaskedInput>("fluid-masked-input")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
