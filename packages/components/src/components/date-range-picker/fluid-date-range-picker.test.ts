import { expect, fixture, html, oneEvent, aTimeout, elementUpdated } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidDateRangePicker } from "./fluid-date-range-picker.js";
import { toISODate, startOfDay, addDays, defaultRangePresets } from "../../internal/date-utils.js";

describe("<fluid-date-range-picker>", () => {
  describe("<fluid-date-range-picker> localized validation", () => {
    for (const [locale, message] of [
      ["nl", "Kies een datumbereik."],
      ["de", "Bitte wählen Sie einen Datumsbereich."],
      ["fr", "Veuillez choisir une plage de dates."],
      ["es", "Elige un intervalo de fechas."],
      ["ar", "يرجى اختيار نطاق تواريخ."],
      ["fr-CA", "Veuillez choisir une plage de dates."]
    ] as const) {
      it(`refreshes current required validation in ${locale}`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-date-range-picker
              required
              aria-label="Application label"
            ></fluid-date-range-picker>
          </div>
        `);
        const control = wrapper.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
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
      const control = document.createElement("fluid-date-range-picker") as FluidDateRangePicker;
      control.setAttribute("aria-label", "Application label");

      wrapper.append(control);
      root.append(wrapper);
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      control.required = true;
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Kies een datumbereik.");
      control.setCustomValidity("Application validation");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Application validation");
      expect(control.validity.customError).to.equal(true);
      control.setCustomValidity("");
      expect(control.validationMessage).to.equal("Bitte wählen Sie einen Datumsbereich.");
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
          <fluid-date-range-picker
            lang="fr"
            required
            aria-label="Application label"
          ></fluid-date-range-picker>
        </div>
      `);
      const control = wrapper.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez choisir une plage de dates.");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez choisir une plage de dates.");
      control.removeAttribute("lang");
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Bitte wählen Sie einen Datumsbereich.");
      control.remove();
      wrapper.lang = "ar";
      wrapper.append(control);
      await control.updateComplete;
      expect(control.validationMessage).to.equal("يرجى اختيار نطاق تواريخ.");
      expect(control.validity.valueMissing).to.equal(true);
    });

    it("keeps submitted data canonical and restores current-language validation after form reset", async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form lang="nl">
          <fluid-date-range-picker
            name="control"
            required
            aria-label="Application label"
          ></fluid-date-range-picker>
        </form>
      `);
      const control = form.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
      await control.updateComplete;
      control.start = "2026-08-26";
      control.end = "2026-08-28";
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      expect(new FormData(form).get("control")).to.equal("2026-08-26/2026-08-28");
      form.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      form.reset();
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Bitte wählen Sie einen Datumsbereich.");
    });
  });

  it("renders closed by default", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker aria-label="Range"></fluid-date-range-picker>`
    );
    expect(el.open).to.be.false;
  });

  it("is form-associated: the form value is the start/end interval", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-date-range-picker
          name="span"
          start="2026-06-10"
          end="2026-06-20"
          aria-label="Range"
        ></fluid-date-range-picker>
      </form>
    `);
    const el = form.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
    await elementUpdated(el);
    expect(new FormData(form).get("span")).to.equal("2026-06-10/2026-06-20");
  });

  it("renders two fluid-calendars", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker aria-label="Range"></fluid-date-range-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const cals = el.shadowRoot!.querySelectorAll("fluid-calendar");
    expect(cals.length).to.equal(2);
  });

  it("clicking a preset then Apply sets start+end and fires fluid-change", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker aria-label="Range"></fluid-date-range-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);

    // "Last 7 days" = [today-6, today], a deterministic non-empty range.
    const today = startOfDay(new Date());
    const expectStart = toISODate(addDays(today, -6));
    const expectEnd = toISODate(today);

    const presetButtons = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".preset"));
    const last7 = presetButtons.find((b) => b.textContent?.trim() === "Last 7 days")!;
    last7.click();
    await elementUpdated(el);

    const apply = el.shadowRoot!.querySelector<HTMLButtonElement>(".btn.apply")!;
    expect(apply.disabled).to.be.false;
    setTimeout(() => apply.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;

    expect(event.detail.start).to.equal(expectStart);
    expect(event.detail.end).to.equal(expectEnd);
    expect(event.detail.startDate).to.be.instanceOf(Date);
    expect(event.detail.endDate).to.be.instanceOf(Date);
    expect(el.start).to.equal(expectStart);
    expect(el.end).to.equal(expectEnd);
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("synchronizes FormData before fluid-change observers run", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-date-range-picker
          name="span"
          format="iso"
          aria-label="Range"
        ></fluid-date-range-picker>
      </form>
    `);
    const el = form.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    el.shadowRoot!.querySelector<HTMLButtonElement>(".preset")!.click();
    await elementUpdated(el);
    const eventData = oneEvent(el, "fluid-change").then(() => [...new FormData(form)]);
    el.shadowRoot!.querySelector<HTMLButtonElement>(".btn.apply")!.click();
    expect(await eventData).to.deep.equal([["span", `${el.start}/${el.end}`]]);
  });

  it("restores a canonical interval as committed form state", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-date-range-picker
          name="span"
          format="iso"
          aria-label="Range"
        ></fluid-date-range-picker>
      </form>
    `);
    const el = form.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
    el.formStateRestoreCallback("2026-08-10/2026-08-14", "restore");
    await elementUpdated(el);
    expect(el.start).to.equal("2026-08-10");
    expect(el.end).to.equal("2026-08-14");
    expect(new FormData(form).get("span")).to.equal("2026-08-10/2026-08-14");
    expect(el.shadowRoot!.querySelector<HTMLInputElement>("input")!.value).to.equal(
      "2026-08-10 – 2026-08-14"
    );
  });

  it("no-presets hides the preset column", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker no-presets aria-label="Range"></fluid-date-range-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    expect(el.shadowRoot!.querySelector(".presets")).to.be.null;
  });

  it("fills its field wrapper and shrinks with it instead of overflowing", async () => {
    const holder = await fixture<HTMLDivElement>(html`
      <div style="width: 320px">
        <fluid-date-range-picker
          start="2026-06-08"
          end="2026-06-19"
          aria-label="Sizing"
        ></fluid-date-range-picker>
      </div>
    `);
    const el = holder.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
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

  it("clicking the field opens the picker and selects its value by default", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        aria-label="Field"
      ></fluid-date-range-picker>`
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
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        no-auto-open
        aria-label="Field"
      ></fluid-date-range-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    input.focus();
    input.click();
    await elementUpdated(el);
    expect(el.open).to.be.false;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(input.selectionEnd).to.equal(input.value.length);
  });

  it("no-select-on-focus opens on click without selecting the value", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        no-select-on-focus
        aria-label="Field"
      ></fluid-date-range-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    input.focus();
    input.click();
    await elementUpdated(el);
    expect(el.open).to.be.true;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(input.selectionStart).to.equal(input.selectionEnd);
  });

  it("focus alone does not open the picker", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        aria-label="Field"
      ></fluid-date-range-picker>`
    );

    /* Focus also arrives from constraint validation, from an overlay above the
       field closing and from any programmatic .focus(); none of those are a
       request to see the popover. */
    el.shadowRoot!.querySelector<HTMLInputElement>("input")!.focus();
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("Escape closes for good: the returned focus does not reopen it", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        aria-label="Field"
      ></fluid-date-range-picker>`
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

  it("Escape closes the dialog", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker aria-label="Range"></fluid-date-range-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const dialog = el.shadowRoot!.querySelector('[role="dialog"]')!;
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("moves focus into the dialog when opened", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker aria-label="Range"></fluid-date-range-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    // Focus is moved in a requestAnimationFrame after the calendars render.
    await aTimeout(40);

    const dialog = el.shadowRoot!.querySelector('[role="dialog"]')!;
    // Active element resolves through shadow roots; walk to the deepest one.
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    expect(active, "focus should land inside the open dialog").to.not.be.null;
    // The focused element is either the active preset / first day inside the
    // dialog, or the dialog container itself as a fallback.
    const focusedInDialog =
      active === dialog ||
      dialog.contains(active) ||
      Boolean(el.shadowRoot!.querySelector("fluid-calendar")?.contains(active));
    expect(focusedInDialog, "focused element should be within the dialog").to.be.true;
  });

  it("localizes only built-in presets and the draft prompt across live language changes", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar" dir="rtl">
        <fluid-date-range-picker open></fluid-date-range-picker>
      </div>
    `);
    const el = wrapper.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
    const labels = () =>
      [...el.shadowRoot!.querySelectorAll<HTMLElement>(".preset")].map((item) =>
        item.textContent?.trim()
      );
    expect(labels()).to.deep.equal([
      "اليوم",
      "أمس",
      "آخر 7 أيام",
      "آخر 30 يومًا",
      "هذا الشهر",
      "الشهر الماضي"
    ]);
    expect(el.shadowRoot!.querySelector(".selected-range")!.textContent).to.equal("اختر نطاقًا");
    expect(el.presets).to.equal(defaultRangePresets);

    wrapper.lang = "nl";
    await elementUpdated(el);
    expect(labels()[0]).to.equal("Vandaag");
    expect(el.shadowRoot!.querySelector(".selected-range")!.textContent).to.equal(
      "Selecteer een bereik"
    );

    el.presets = [{ id: "caller", label: "", getRange: () => defaultRangePresets[0]!.getRange() }];
    await elementUpdated(el);
    expect(labels()).to.deep.equal([""]);
  });

  it("keeps inherited date formatting reactive and submitted intervals canonical", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form lang="en">
        <fluid-date-range-picker
          name="range"
          start="2026-06-15"
          end="2026-06-16"
          format="long"
          placeholder=""
        ></fluid-date-range-picker>
      </form>
    `);
    const el = form.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    form.lang = "ar";
    await elementUpdated(el);
    const formatter = new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    expect(input.value).to.equal(
      `${formatter.format(new Date(2026, 5, 15))} – ${formatter.format(new Date(2026, 5, 16))}`
    );
    expect(input.getAttribute("placeholder")).to.equal("");
    expect(new FormData(form).get("range")).to.equal("2026-06-15/2026-06-16");
  });

  it("passes a11y audit (closed)", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker aria-label="Range"></fluid-date-range-picker>`
    );
    await elementUpdated(el);
    await expect(el).to.be.accessible();
  });

  it("passes a11y audit (open)", async () => {
    // The bare test page loads no theme tokens, so the calendars' muted text
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
        <fluid-date-range-picker aria-label="Range"></fluid-date-range-picker>
      </div>
    `);
    const el = host.querySelector<FluidDateRangePicker>("fluid-date-range-picker")!;
    el.open = true;
    await elementUpdated(el);
    // The panel hosts two <fluid-calendar> grids that render in their own
    // update cycles after the picker opens; await them so axe sees the full
    // grid, not a half-rendered one.
    const calendars = Array.from(el.shadowRoot?.querySelectorAll("fluid-calendar") ?? []);
    await Promise.all(
      calendars.map((c) => (c as Element & { updateComplete: Promise<unknown> }).updateComplete)
    );
    // `--fluid-motion: 0` (set on the fixture, pierces shadow DOM) zeroes the
    // open transition so the panel is fully opaque immediately. Without it, axe
    // can audit mid-fade and blend the foreground over the background by the
    // transient opacity, reporting a false contrast failure (e.g. #3f3f46 text
    // reads as ~#d5d5d5 at partial opacity).
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
