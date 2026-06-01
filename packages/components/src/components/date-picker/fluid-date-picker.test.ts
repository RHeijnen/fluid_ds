import { expect, fixture, html, oneEvent, aTimeout, elementUpdated } from "@open-wc/testing";
import "./define.js";
import type { FluidDatePicker } from "./fluid-date-picker.js";
import type { FluidCalendar } from "../calendar/fluid-calendar.js";

describe("<fluid-date-picker>", () => {
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

  it("selecting a day in the inner calendar updates value, fires fluid-change, and closes", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker value="2026-06-15" aria-label="Date"></fluid-date-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const cal = el.shadowRoot!.querySelector<FluidCalendar>("fluid-calendar")!;
    const day = Array.from(
      cal.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.day")
    ).find((b) => b.textContent?.trim() === "20" && !b.classList.contains("outside"))!;
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

  it("format=iso shows the ISO string in the input", async () => {
    const el = await fixture<FluidDatePicker>(
      html`<fluid-date-picker value="2026-06-15" format="iso" aria-label="Date"></fluid-date-picker>`
    );
    await elementUpdated(el);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.value).to.equal("2026-06-15");
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
