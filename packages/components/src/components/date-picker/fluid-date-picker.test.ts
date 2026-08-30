import { expect, fixture, html, oneEvent, aTimeout, elementUpdated } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidDatePicker } from "./fluid-date-picker.js";
import type { FluidCalendar } from "../calendar/fluid-calendar.js";

describe("<fluid-date-picker>", () => {
  it("focuses the rendered input when native keyboard submission finds a required date missing", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <button type="submit">Submit</button>
        <fluid-date-picker name="date" label="Date" format="iso" required></fluid-date-picker>
      </form>
    `);
    const control = form.querySelector<FluidDatePicker>("fluid-date-picker")!;
    await control.updateComplete;
    const input = control.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const button = form.querySelector<HTMLButtonElement>("button")!;
    let submissions = 0;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submissions++;
    });
    expect(control.value).to.equal(null);
    expect(input.value).to.equal("");
    expect(control.validity.valueMissing).to.equal(true);
    expect(control.shadowRoot!.delegatesFocus).to.equal(true);
    button.focus();
    expect(document.activeElement).to.equal(button);
    const invalid = oneEvent(control, "invalid");
    await sendKeys({ press: "Enter" });
    await invalid;
    expect(submissions).to.equal(0);
    expect(document.activeElement).to.equal(control);
    expect(control.shadowRoot!.activeElement).to.equal(input);
    expect(control.value).to.equal(null);
    expect(new FormData(form).get("date")).to.equal(null);
  });

  it("keeps the input anchor for custom errors after a valid date and a locale change", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <button type="submit">Submit</button>
        <fluid-date-picker
          name="date"
          label="Date"
          format="iso"
          value="2026-08-26"
          required
        ></fluid-date-picker>
      </form>
    `);
    const control = form.querySelector<FluidDatePicker>("fluid-date-picker")!;
    await control.updateComplete;
    const input = control.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const button = form.querySelector<HTMLButtonElement>("button")!;
    const submissions: FormData[] = [];
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submissions.push(new FormData(form));
    });
    expect(control.validity.valid).to.equal(true);
    control.setCustomValidity("Application correction");
    control.lang = "nl";
    await aTimeout(0);
    await control.updateComplete;
    expect(control.validity.customError).to.equal(true);
    expect(control.validationMessage).to.equal("Application correction");
    button.focus();
    expect(document.activeElement).to.equal(button);
    const invalid = oneEvent(control, "invalid");
    await sendKeys({ press: "Enter" });
    await invalid;
    expect(submissions).to.have.length(0);
    expect(control.shadowRoot!.activeElement).to.equal(input);
    expect(input.value).to.equal("2026-08-26");
    control.setCustomValidity("");
    expect(control.validity.valid).to.equal(true);
    button.focus();
    await sendKeys({ press: "Enter" });
    expect(submissions).to.have.length(1);
    expect(submissions[0]!.get("date")).to.equal("2026-08-26");
  });

  describe("<fluid-date-picker> localized validation", () => {
    for (const [locale, message] of [
      ["nl", "Kies een datum."],
      ["de", "Bitte wählen Sie ein Datum."],
      ["fr", "Veuillez choisir une date."],
      ["es", "Elige una fecha."],
      ["ar", "يرجى اختيار تاريخ."],
      ["fr-CA", "Veuillez choisir une date."]
    ] as const) {
      it(`refreshes current required validation in ${locale}`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-date-picker required aria-label="Application label"></fluid-date-picker>
          </div>
        `);
        const control = wrapper.querySelector<FluidDatePicker>("fluid-date-picker")!;
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
      const control = document.createElement("fluid-date-picker") as FluidDatePicker;
      control.setAttribute("aria-label", "Application label");

      wrapper.append(control);
      root.append(wrapper);
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      control.required = true;
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Kies een datum.");
      control.setCustomValidity("Application validation");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Application validation");
      expect(control.validity.customError).to.equal(true);
      control.setCustomValidity("");
      expect(control.validationMessage).to.equal("Bitte wählen Sie ein Datum.");
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
          <fluid-date-picker lang="fr" required aria-label="Application label"></fluid-date-picker>
        </div>
      `);
      const control = wrapper.querySelector<FluidDatePicker>("fluid-date-picker")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez choisir une date.");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez choisir une date.");
      control.removeAttribute("lang");
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Bitte wählen Sie ein Datum.");
      control.remove();
      wrapper.lang = "ar";
      wrapper.append(control);
      await control.updateComplete;
      expect(control.validationMessage).to.equal("يرجى اختيار تاريخ.");
      expect(control.validity.valueMissing).to.equal(true);
    });

    it("keeps submitted data canonical and restores current-language validation after form reset", async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form lang="nl">
          <fluid-date-picker
            name="control"
            required
            aria-label="Application label"
          ></fluid-date-picker>
        </form>
      `);
      const control = form.querySelector<FluidDatePicker>("fluid-date-picker")!;
      await control.updateComplete;
      control.value = "2026-08-26";
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      expect(new FormData(form).get("control")).to.equal("2026-08-26");
      form.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      form.reset();
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Bitte wählen Sie ein Datum.");
    });
  });

  it("renders closed by default", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker aria-label="Date"></fluid-date-picker>`
    );
    expect(el.open).to.be.false;
  });

  it("is form-associated: submits the ISO value", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-date-picker name="dob" value="2026-06-15" aria-label="Date"></fluid-date-picker>
      </form>
    `);
    const el = form.querySelector<FluidDatePicker>("fluid-date-picker")!;
    await elementUpdated(el);
    expect(new FormData(form).get("dob")).to.equal("2026-06-15");
  });

  it("clicking the trigger sets open", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker aria-label="Date"></fluid-date-picker>`
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!.click();
    await elementUpdated(el);
    expect(el.open).to.be.true;
  });

  it("clicking the field opens the picker and selects its value by default", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker value="2026-06-15" aria-label="Field"></fluid-date-picker>`
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
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker
        value="2026-06-15"
        no-auto-open
        aria-label="Field"
      ></fluid-date-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    input.focus();
    await elementUpdated(el);
    expect(el.open).to.be.false;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(input.selectionEnd).to.equal(input.value.length);
  });

  it("no-select-on-focus opens on click without selecting the value", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker
        value="2026-06-15"
        no-select-on-focus
        aria-label="Field"
      ></fluid-date-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    input.focus();
    input.click();
    await elementUpdated(el);
    expect(el.open).to.be.true;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(input.selectionStart).to.equal(input.selectionEnd);
  });

  it("selecting a day in the inner calendar updates value, fires fluid-change, and closes", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker value="2026-06-15" aria-label="Date"></fluid-date-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const cal = el.shadowRoot!.querySelector<FluidCalendar>("fluid-calendar")!;
    const day = Array.from(cal.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.day")).find(
      (b) => b.textContent?.trim() === "20" && !b.classList.contains("outside")
    )!;
    setTimeout(() => day.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("2026-06-20");
    expect(event.detail.date).to.be.instanceOf(Date);
    expect(event.detail.timestamp).to.be.a("number");
    expect(el.value).to.equal("2026-06-20");
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("Escape closes the dialog", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker value="2026-06-15" aria-label="Date"></fluid-date-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const dialog = el.shadowRoot!.querySelector('[role="dialog"]')!;
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("fills its field wrapper and shrinks with it instead of overflowing", async () => {
    const holder = await fixture<HTMLDivElement>(html`
      <div style="width: 320px">
        <fluid-date-picker value="2026-06-15" aria-label="Sizing"></fluid-date-picker>
      </div>
    `);
    const el = holder.querySelector<FluidDatePicker>("fluid-date-picker")!;
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

  it("Escape closes for good: the returned focus does not reopen it", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker value="2026-06-15" aria-label="Field"></fluid-date-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);

    const dialog = el.shadowRoot!.querySelector('[role="dialog"]')!;
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await elementUpdated(el);
    /* Closing hands focus back to the input. That must not read as a fresh
       arrival at the field, or Escape can never actually dismiss the popover. */
    await aTimeout(20);
    expect(el.open).to.be.false;
  });

  it("format=iso shows the ISO string in the input", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker
        value="2026-06-15"
        format="iso"
        aria-label="Date"
      ></fluid-date-picker>`
    );
    await elementUpdated(el);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.value).to.equal("2026-06-15");
  });

  it("follows inherited locale live while preserving ISO values and explicit empty prompts", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form lang="en">
        <fluid-date-picker name="date" value="2026-06-15" format="long"></fluid-date-picker>
        <fluid-date-picker placeholder=""></fluid-date-picker>
      </form>
    `);
    const [el, emptyPrompt] = form.querySelectorAll<FluidDatePicker>("fluid-date-picker");
    const input = el!.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const expected = (locale: string) =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(new Date(2026, 5, 15));
    expect(input.value).to.equal(expected("en"));
    expect(emptyPrompt!.shadowRoot!.querySelector("input")!.getAttribute("placeholder")).to.equal(
      ""
    );
    form.lang = "ar";
    await elementUpdated(el!);
    await elementUpdated(emptyPrompt!);
    expect(input.value).to.equal(expected("ar"));
    expect(new FormData(form).get("date")).to.equal("2026-06-15");
    expect(emptyPrompt!.shadowRoot!.querySelector("input")!.getAttribute("placeholder")).to.equal(
      ""
    );
  });

  it("passes a11y audit (closed)", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker aria-label="Date"></fluid-date-picker>`
    );
    await elementUpdated(el);
    await expect(el).to.be.accessible();
  });

  it("passes a11y audit (open)", async () => {
    // The bare test page loads no theme tokens, so the calendar's muted text
    // would otherwise fall back to a UA default that fails contrast. Apply the
    // shipped light-scheme semantic tokens so axe measures the real rendered
    // colors (surface + text the component actually ships with).
    const host = await fixture<HTMLElement>(html`
      <div
        style="
          --fluid-surface-base: #ffffff;
          --fluid-surface-muted: #f4f4f5;
          --fluid-text-primary: #18181b;
          --fluid-text-secondary: #3f3f46;
          --fluid-border-default: #e4e4e7;
          --fluid-motion: 0;
        "
      >
        <fluid-date-picker value="2026-06-15" aria-label="Date"></fluid-date-picker>
      </div>
    `);
    const el = host.querySelector<FluidDatePicker>("fluid-date-picker")!;
    el.open = true;
    await elementUpdated(el);
    const cal = el.shadowRoot?.querySelector("fluid-calendar");
    if (cal) await (cal as Element & { updateComplete: Promise<unknown> }).updateComplete;
    // `--fluid-motion: 0` (set on the fixture, pierces shadow DOM) zeroes the
    // open transition so the panel is fully opaque immediately. Without it, axe
    // can audit mid-fade and blend the foreground over the background by the
    // transient opacity, reporting a false contrast failure.
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
