import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import "../input/define.js";
import type { FluidColorPicker } from "./fluid-color-picker.js";
import type { FluidInput } from "../input/fluid-input.js";

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
  describe("<fluid-color-picker> localized validation", () => {
    for (const [locale, message] of [
      ["nl", "Voer een geldige hexkleur in (bijv. #ff00aa)."],
      ["de", "Geben Sie eine gültige Hex-Farbe ein (z. B. #ff00aa)."],
      ["fr", "Saisissez une couleur hexadécimale valide (par ex. #ff00aa)."],
      ["es", "Introduce un color hexadecimal válido (p. ej., #ff00aa)."],
      ["ar", "أدخل لونًا سداسيًا عشريًا صالحًا (مثل #ff00aa)."],
      ["fr-CA", "Saisissez une couleur hexadécimale valide (par ex. #ff00aa)."]
    ] as const) {
      it(`updates an existing patternMismatch error in ${locale} without discarding the input`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-color-picker
              value="#invalid"
              aria-label="Application label"
            ></fluid-color-picker>
          </div>
        `);
        const control = wrapper.querySelector<FluidColorPicker>("fluid-color-picker")!;
        await control.updateComplete;
        expect(control.validity.patternMismatch).to.equal(true);
        const value = control.value;
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(control.validationMessage).to.equal(message);
        expect(control.validity.patternMismatch).to.equal(true);
        expect(control.value).to.equal(value);
        control.setCustomValidity("Application correction");
        wrapper.lang = "nl";
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(control.validationMessage).to.equal("Application correction");
        control.setCustomValidity("");
        expect(control.validationMessage).to.equal("Voer een geldige hexkleur in (bijv. #ff00aa).");
      });
    }

    for (const [locale, message] of [
      ["nl", "Kies een kleur."],
      ["de", "Bitte wählen Sie eine Farbe."],
      ["fr", "Veuillez choisir une couleur."],
      ["es", "Elige un color."],
      ["ar", "يرجى اختيار لون."],
      ["fr-CA", "Veuillez choisir une couleur."]
    ] as const) {
      it(`refreshes current required validation in ${locale}`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-color-picker
              required
              aria-label="Application label"
              value=""
            ></fluid-color-picker>
          </div>
        `);
        const control = wrapper.querySelector<FluidColorPicker>("fluid-color-picker")!;
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
      const control = document.createElement("fluid-color-picker") as FluidColorPicker;
      control.setAttribute("aria-label", "Application label");
      control.value = "";
      wrapper.append(control);
      root.append(wrapper);
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      control.required = true;
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Kies een kleur.");
      control.setCustomValidity("Application validation");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Application validation");
      expect(control.validity.customError).to.equal(true);
      control.setCustomValidity("");
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Farbe.");
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
          <fluid-color-picker
            lang="fr"
            required
            aria-label="Application label"
            value=""
          ></fluid-color-picker>
        </div>
      `);
      const control = wrapper.querySelector<FluidColorPicker>("fluid-color-picker")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez choisir une couleur.");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez choisir une couleur.");
      control.removeAttribute("lang");
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Farbe.");
      control.remove();
      wrapper.lang = "ar";
      wrapper.append(control);
      await control.updateComplete;
      expect(control.validationMessage).to.equal("يرجى اختيار لون.");
      expect(control.validity.valueMissing).to.equal(true);
    });

    it("keeps submitted data canonical and restores current-language validation after form reset", async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form lang="nl">
          <fluid-color-picker
            name="control"
            required
            aria-label="Application label"
            value=""
          ></fluid-color-picker>
        </form>
      `);
      const control = form.querySelector<FluidColorPicker>("fluid-color-picker")!;
      await control.updateComplete;
      control.value = "#ff00aa";
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      expect(new FormData(form).get("control")).to.equal("#ff00aa");
      form.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      form.reset();
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Farbe.");
    });
  });

  it("renders with default black", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker aria-label="Color"></fluid-color-picker>
    `);
    expect(el.value).to.equal("#000000");
  });

  it("anchors required and application validation to the nested hex field", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker required value="" aria-label="Color"></fluid-color-picker>
    `);
    const child = el.shadowRoot!.querySelector("fluid-input")!;
    await (child as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
    const input = child.shadowRoot!.querySelector("input")!;
    expect(el.shadowRoot!.delegatesFocus).to.equal(true);
    expect(el.reportValidity()).to.equal(false);
    expect(child.shadowRoot!.activeElement).to.equal(input);
    el.value = "#abcdef";
    await el.updateComplete;
    el.setCustomValidity("Application correction");
    input.blur();
    expect(el.reportValidity()).to.equal(false);
    expect(child.shadowRoot!.activeElement).to.equal(input);
    expect(el.validationMessage).to.equal("Application correction");
    el.setCustomValidity("");
    expect(el.checkValidity()).to.equal(true);
  });

  it("emits only normalized parent input events, including invalid edits", async () => {
    const el = await fixture<FluidColorPicker>(html`<fluid-color-picker></fluid-color-picker>`);
    const events: { value: string; origin: EventTarget | undefined }[] = [];
    el.addEventListener("fluid-input", (event) => {
      events.push({ value: (event as CustomEvent).detail.value, origin: event.composedPath()[0] });
    });
    dispatchHexInput(el, "abcdef");
    dispatchHexInput(el, "not-hex");
    expect(events).to.deep.equal([
      { value: "#abcdef", origin: el },
      { value: "#not-hex", origin: el }
    ]);
  });

  it("disables every editing surface and ignores child edits while disabled", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker disabled value="#abcdef" .palette=${["#ff0000"]}></fluid-color-picker>
    `);
    const preset = el.shadowRoot!.querySelector<HTMLButtonElement>(".preset")!;
    expect(preset.disabled).to.equal(true);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>(".native")!.disabled).to.equal(true);
    let events = 0;
    el.addEventListener("fluid-input", () => events++);
    preset.click();
    dispatchHexInput(el, "#000000");
    expect(el.value).to.equal("#abcdef");
    expect(events).to.equal(0);
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
    expect(el.shadowRoot!.querySelector<HTMLInputElement>(".native")!.value).to.equal("#ff00cc");
    expect(el.value).to.equal("#f0c");
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
        <fluid-color-picker name="accent" value="#ff8800" aria-label="Color"></fluid-color-picker>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("accent")).to.equal("#ff8800");
  });

  it("does not add an inline-baseline gap below the composed input", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker value="#ff8800" aria-label="Color"></fluid-color-picker>
    `);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector<HTMLElement>("fluid-input")!;
    await (input as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;

    expect(
      getComputedStyle(el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!).display
    ).to.equal("flex");
    expect(el.getBoundingClientRect().height).to.be.closeTo(
      input.getBoundingClientRect().height,
      0.1
    );
  });

  it("keeps the input row height stable when a palette is present", async () => {
    const comparison = await fixture<HTMLDivElement>(html`
      <div>
        <fluid-color-picker value="#ff8800" aria-label="Color"></fluid-color-picker>
        <fluid-color-picker
          value="#ff8800"
          .palette=${["#ff8800", "#3b82f6"]}
          aria-label="Color"
        ></fluid-color-picker>
      </div>
    `);
    const controls = [...comparison.querySelectorAll<FluidColorPicker>("fluid-color-picker")];
    const withoutPalette = controls[0]!;
    const withPalette = controls[1]!;
    await Promise.all([withoutPalette.updateComplete, withPalette.updateComplete]);
    const plainInput = withoutPalette.shadowRoot!.querySelector<HTMLElement>("fluid-input")!;
    const paletteInput = withPalette.shadowRoot!.querySelector<HTMLElement>("fluid-input")!;
    await Promise.all([
      (plainInput as FluidInput).updateComplete,
      (paletteInput as FluidInput).updateComplete
    ]);

    expect(paletteInput.getBoundingClientRect().height).to.be.closeTo(
      plainInput.getBoundingClientRect().height,
      0.1
    );
  });

  it("uses the selected color for the composed field border and focus hooks when opted in", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker value="#3b82f6" colorize-border aria-label="Color"></fluid-color-picker>
    `);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector<FluidInput>("fluid-input")!;
    await input.updateComplete;
    const styles = getComputedStyle(input);

    expect(styles.getPropertyValue("--fluid-input-border").trim()).to.equal("#3b82f6");
    expect(styles.getPropertyValue("--fluid-input-border-focus").trim()).to.equal("#3b82f6");
    expect(styles.getPropertyValue("--fluid-input-focus-ring-color").trim()).to.equal("#3b82f6");
  });

  it("uses the scoped fallback-border hook for an invalid colorized value", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker
        value="#invalid"
        colorize-border
        aria-label="Color"
        style="--fluid-color-picker-field-fallback-border: rgb(1, 2, 3); --fluid-duration-fast: 0ms;"
      ></fluid-color-picker>
    `);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector<FluidInput>("fluid-input")!;
    await input.updateComplete;

    expect(el.value).to.equal("#invalid");
    expect(
      getComputedStyle(input).getPropertyValue("--fluid-color-picker-field-fallback-border").trim()
    ).to.equal("rgb(1, 2, 3)");
    expect(getComputedStyle(input).getPropertyValue("--fluid-input-border").trim()).to.equal(
      "rgb(1, 2, 3)"
    );
  });

  it("keeps the standard input border treatment by default", async () => {
    const el = await fixture<FluidColorPicker>(html`
      <fluid-color-picker value="#3b82f6" aria-label="Color"></fluid-color-picker>
    `);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector<FluidInput>("fluid-input")!;
    await input.updateComplete;

    expect(el.colorizeBorder).to.equal(false);
    expect(input.style.getPropertyValue("--fluid-input-border")).to.equal("");
    expect(input.style.getPropertyValue("--fluid-input-border-focus")).to.equal("");
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
