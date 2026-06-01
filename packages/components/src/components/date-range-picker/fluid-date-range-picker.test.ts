import { expect, fixture, html, oneEvent, aTimeout, elementUpdated } from "@open-wc/testing";
import "./define.js";
import type { FluidDateRangePicker } from "./fluid-date-range-picker.js";
import { toISODate, startOfDay, addDays } from "../../internal/date-utils.js";

describe("<fluid-date-range-picker>", () => {
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

    const presetButtons = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".preset")
    );
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

  it("no-presets hides the preset column", async () => {
    const el = await fixture<FluidDateRangePicker>(
      html`<fluid-date-range-picker no-presets aria-label="Range"></fluid-date-range-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    expect(el.shadowRoot!.querySelector(".presets")).to.be.null;
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
    await Promise.all(calendars.map((c) => (c as Element & { updateComplete: Promise<unknown> }).updateComplete));
    // `--fluid-motion: 0` (set on the fixture, pierces shadow DOM) zeroes the
    // open transition so the panel is fully opaque immediately. Without it, axe
    // can audit mid-fade and blend the foreground over the background by the
    // transient opacity, reporting a false contrast failure (e.g. #3f3f46 text
    // reads as ~#d5d5d5 at partial opacity).
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
