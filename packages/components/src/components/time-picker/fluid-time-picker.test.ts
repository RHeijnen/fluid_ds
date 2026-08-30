import { expect, fixture, html, oneEvent, aTimeout, elementUpdated } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidTimePicker } from "./fluid-time-picker.js";

describe("<fluid-time-picker>", () => {
  describe("<fluid-time-picker> localized validation", () => {
    for (const [locale, message] of [
      ["nl", "Kies een tijd."],
      ["de", "Bitte wählen Sie eine Uhrzeit."],
      ["fr", "Veuillez choisir une heure."],
      ["es", "Elige una hora."],
      ["ar", "يرجى اختيار وقت."],
      ["fr-CA", "Veuillez choisir une heure."]
    ] as const) {
      it(`refreshes current required validation in ${locale}`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-time-picker required aria-label="Application label"></fluid-time-picker>
          </div>
        `);
        const control = wrapper.querySelector<FluidTimePicker>("fluid-time-picker")!;
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
      const control = document.createElement("fluid-time-picker") as FluidTimePicker;
      control.setAttribute("aria-label", "Application label");

      wrapper.append(control);
      root.append(wrapper);
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      control.required = true;
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Kies een tijd.");
      control.setCustomValidity("Application validation");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Application validation");
      expect(control.validity.customError).to.equal(true);
      control.setCustomValidity("");
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Uhrzeit.");
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
          <fluid-time-picker lang="fr" required aria-label="Application label"></fluid-time-picker>
        </div>
      `);
      const control = wrapper.querySelector<FluidTimePicker>("fluid-time-picker")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez choisir une heure.");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez choisir une heure.");
      control.removeAttribute("lang");
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Uhrzeit.");
      control.remove();
      wrapper.lang = "ar";
      wrapper.append(control);
      await control.updateComplete;
      expect(control.validationMessage).to.equal("يرجى اختيار وقت.");
      expect(control.validity.valueMissing).to.equal(true);
    });

    it("keeps submitted data canonical and restores current-language validation after form reset", async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form lang="nl">
          <fluid-time-picker
            name="control"
            required
            aria-label="Application label"
          ></fluid-time-picker>
        </form>
      `);
      const control = form.querySelector<FluidTimePicker>("fluid-time-picker")!;
      await control.updateComplete;
      control.value = "09:30";
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      expect(new FormData(form).get("control")).to.equal("09:30");
      form.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      form.reset();
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Uhrzeit.");
    });
  });

  it("renders closed by default", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker aria-label="Time"></fluid-time-picker>`
    );
    expect(el.open).to.be.false;
  });

  it("renders the active option in the popup's opening and closing update", async () => {
    const el = await fixture<FluidTimePicker>(html`
      <fluid-time-picker
        value="09:30"
        min="09:00"
        max="10:00"
        step="30"
        label="Time"
      ></fluid-time-picker>
    `);
    const input = el.shadowRoot!.querySelector("input")!;
    el.open = true;
    expect(await el.updateComplete).to.equal(true);
    expect(input.getAttribute("aria-activedescendant")).to.equal(
      el.shadowRoot!.querySelector('[aria-selected="true"]')!.id
    );
    expect(input.getAttribute("aria-expanded")).to.equal("true");
    el.open = false;
    expect(await el.updateComplete).to.equal(true);
    expect(input.getAttribute("aria-activedescendant")).to.equal("");
    expect(input.getAttribute("aria-expanded")).to.equal("false");
    el.value = null;
    await el.updateComplete;
    el.open = true;
    expect(await el.updateComplete).to.equal(true);
    expect(input.getAttribute("aria-activedescendant")).to.equal(
      el.shadowRoot!.querySelector('[role="option"]')!.id
    );
  });

  it("is form-associated: submits the canonical 24h value", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-time-picker name="start" value="09:30"></fluid-time-picker>
      </form>
    `);
    const el = form.querySelector<FluidTimePicker>("fluid-time-picker")!;
    await elementUpdated(el);
    expect(new FormData(form).get("start")).to.equal("09:30");
  });

  it("12h format shows a 12-hour label but keeps the 24h form value", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-time-picker name="t" value="13:30" format="12h"></fluid-time-picker>
      </form>
    `);
    const el = form.querySelector<FluidTimePicker>("fluid-time-picker")!;
    await elementUpdated(el);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.value).to.equal("1:30 PM");
    expect(new FormData(form).get("t")).to.equal("13:30");
  });

  it("clicking the trigger opens the listbox", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker aria-label="Time"></fluid-time-picker>`
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!.click();
    await elementUpdated(el);
    expect(el.open).to.be.true;
  });

  it("clicking the field opens the picker and selects its value by default", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker value="09:30" aria-label="Field"></fluid-time-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    input.focus();
    input.click();
    await elementUpdated(el);
    expect(el.open).to.be.true;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(input.selectionStart).to.equal(0);
    expect(input.selectionEnd).to.equal(input.value.length);
  });

  it("no-auto-open keeps the picker closed while a focus still selects the value", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker value="09:30" no-auto-open aria-label="Field"></fluid-time-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    input.focus();
    await elementUpdated(el);
    expect(el.open).to.be.false;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(input.selectionEnd).to.equal(input.value.length);
  });

  it("no-select-on-focus opens on click without selecting the value", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker
        value="09:30"
        no-select-on-focus
        aria-label="Field"
      ></fluid-time-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    input.focus();
    input.click();
    await elementUpdated(el);
    expect(el.open).to.be.true;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(input.selectionStart).to.equal(input.selectionEnd);
  });

  it("fills its field wrapper and shrinks with it instead of overflowing", async () => {
    const holder = await fixture<HTMLDivElement>(html`
      <div style="width: 320px">
        <fluid-time-picker value="09:30" aria-label="Sizing"></fluid-time-picker>
      </div>
    `);
    const el = holder.querySelector<FluidTimePicker>("fluid-time-picker")!;
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;

    expect(base.getBoundingClientRect().width).to.be.closeTo(320, 1);

    /* The control has to squeeze into a narrow track rather than keep its
       intrinsic width and spill over whatever sits next to it. Regression
       guard: an inline-block host with no max-width stayed 216px wide and
       overlapped its neighbour in a two-column row. */
    holder.style.width = "150px";
    await elementUpdated(el);
    await aTimeout(0);
    expect(base.getBoundingClientRect().width).to.be.closeTo(150, 1);
    expect(base.getBoundingClientRect().right).to.be.at.most(
      holder.getBoundingClientRect().right + 1
    );
  });

  it("generates options from min/max/step", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker min="09:00" max="10:00" step="30"></fluid-time-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const options = el.shadowRoot!.querySelectorAll('[role="option"]');
    // 09:00, 09:30, 10:00
    expect(options.length).to.equal(3);
    expect(options[0]!.textContent!.trim()).to.equal("09:00");
    expect(options[2]!.textContent!.trim()).to.equal("10:00");
  });

  it("reports the listbox placement so the popover can fuse to the field", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker value="09:30" aria-label="Time"></fluid-time-picker>`
    );
    expect(el.hasAttribute("data-placement")).to.be.false;

    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    // The CSS that squares off the shared edge keys on this attribute, so the
    // popover reads as one shape with the field instead of a floating panel.
    expect(el.getAttribute("data-placement")).to.be.oneOf(["bottom", "top"]);

    el.open = false;
    await elementUpdated(el);
    expect(el.hasAttribute("data-placement")).to.be.false;
  });

  it("selecting an option commits the value, fires fluid-change, and closes", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker min="09:00" max="10:00" step="30"></fluid-time-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const option = Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (o) => o.textContent?.trim() === "09:30"
    )!;
    setTimeout(() => option.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("09:30");
    expect(el.value).to.equal("09:30");
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("ArrowDown opens, then moves the active option, Enter commits", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker min="09:00" max="10:00" step="30"></fluid-time-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    expect(el.open).to.be.true;
    // First ArrowDown opened + seeded active at index 0; move to index 1.
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    setTimeout(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("09:30");
  });

  it("type-to-filter narrows the option list", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker min="09:00" max="11:00" step="60"></fluid-time-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.value = "10";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await elementUpdated(el);
    await aTimeout(20);
    const options = el.shadowRoot!.querySelectorAll('[role="option"]');
    expect(options.length).to.equal(1);
    expect(options[0]!.textContent!.trim()).to.equal("10:00");
  });

  it("Escape closes the listbox", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker value="09:30"></fluid-time-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("sets aria-expanded and aria-controls on the combobox", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker aria-label="Time"></fluid-time-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.getAttribute("role")).to.equal("combobox");
    expect(input.getAttribute("aria-expanded")).to.equal("false");
    const listbox = el.shadowRoot!.querySelector('[role="listbox"]')!;
    expect(input.getAttribute("aria-controls")).to.equal(listbox.id);
    el.open = true;
    await elementUpdated(el);
    expect(input.getAttribute("aria-expanded")).to.equal("true");
  });

  it("required + empty reports valueMissing", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker name="t" required></fluid-time-picker>`
    );
    await elementUpdated(el);
    expect(el.checkValidity()).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
  });

  it("disconnect tears down the document pointerdown listener and positioning autoUpdate", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker min="09:00" max="10:00" step="30"></fluid-time-picker>`
    );
    // Open the listbox so openListbox() assigns the autoUpdate cleanup.
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);

    // Remove the element: disconnectedCallback must run the manual teardown
    // (the base class does nothing), so it should not throw.
    expect(() => el.remove()).to.not.throw();

    // The outside-pointerdown handler is detached: an outside pointerdown
    // must no longer flip `open` back to false or error.
    el.open = true;
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await aTimeout(0);
    expect(el.open).to.be.true;
  });

  it("localizes time labels live while preserving canonical form values and empty prompts", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form lang="en" dir="rtl">
        <fluid-time-picker
          name="time"
          value="13:30"
          format="12h"
          min="13:30"
          max="14:30"
          step="60"
          placeholder=""
        ></fluid-time-picker>
      </form>
    `);
    const el = form.querySelector<FluidTimePicker>("fluid-time-picker")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const expected = (locale: string, hour: number, minute: number) =>
      new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
        hourCycle: "h12"
      }).format(new Date(2000, 0, 1, hour, minute));
    expect(input.value).to.equal(expected("en", 13, 30));
    form.lang = "ar";
    await elementUpdated(el);
    expect(input.value).to.equal(expected("ar", 13, 30));
    expect(input.getAttribute("placeholder")).to.equal("");
    expect(new FormData(form).get("time")).to.equal("13:30");

    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await elementUpdated(el);
    const options = [...el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((option) => option.textContent?.trim())).to.deep.equal([
      expected("ar", 13, 30),
      expected("ar", 14, 30)
    ]);
    options[1]!.click();
    await elementUpdated(el);
    expect(el.value).to.equal("14:30");
    expect(new FormData(form).get("time")).to.equal("14:30");
  });

  it("keeps an explicit display locale independent from inherited control language", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-time-picker value="09:15" format="24h" locale="de"></fluid-time-picker>
      </div>
    `);
    const el = wrapper.querySelector<FluidTimePicker>("fluid-time-picker")!;
    // A literal, not a second Intl call: rebuilding the expectation from a copy
    // of the component's format options only asserts that the copy still
    // matches, and drifts silently when ICU changes underneath both.
    const expected = "09:15";
    expect(el.shadowRoot!.querySelector<HTMLInputElement>("input")!.value).to.equal(expected);
    wrapper.lang = "nl";
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>("input")!.value).to.equal(expected);
  });

  it("passes a11y audit (closed)", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker aria-label="Time"></fluid-time-picker>`
    );
    await elementUpdated(el);
    await expect(el).to.be.accessible();
  });

  it("passes a11y audit (open)", async () => {
    const host = await fixture<HTMLElement>(html`
      <div
        style="
          --fluid-surface-base: #ffffff;
          --fluid-surface-muted: #f4f4f5;
          --fluid-text-primary: #18181b;
          --fluid-text-secondary: #3f3f46;
          --fluid-border-default: #e4e4e7;
          --fluid-accent-base: #4f46e5;
          --fluid-accent-text: #ffffff;
          --fluid-motion: 0;
        "
      >
        <fluid-time-picker
          value="09:30"
          aria-label="Time"
          min="09:00"
          max="11:00"
          step="30"
        ></fluid-time-picker>
      </div>
    `);
    const el = host.querySelector<FluidTimePicker>("fluid-time-picker")!;
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
