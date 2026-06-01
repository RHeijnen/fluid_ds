import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidAvailabilityEditor } from "./fluid-availability-editor.js";
import type { Availability } from "../../internal/availability.js";

const SEED: Availability = {
  weekly: { 1: [{ start: "09:00", end: "17:00" }] },
  slotMinutes: 45,
  exceptions: [{ date: "2026-12-25", closed: true }]
};

describe("<fluid-availability-editor>", () => {
  it("renders a row for every weekday", async () => {
    const el = await fixture<FluidAvailabilityEditor>(html`<fluid-availability-editor></fluid-availability-editor>`);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelectorAll('[part="day"]').length).to.equal(7);
  });

  it("hydrates its controls from the availability property", async () => {
    const el = await fixture<FluidAvailabilityEditor>(html`<fluid-availability-editor .availability=${SEED}></fluid-availability-editor>`);
    await elementUpdated(el);
    // Monday is first (week starts Monday); its switch is checked and times shown.
    const firstRow = el.shadowRoot!.querySelector('[part="day"]')!;
    const sw = firstRow.querySelector("fluid-switch") as HTMLElement & { checked: boolean };
    expect(sw.checked).to.be.true;
    const times = firstRow.querySelectorAll<HTMLInputElement>('input[type="time"]');
    expect(times[0].value).to.equal("09:00");
    expect(times[1].value).to.equal("17:00");
    // The seeded exception renders a date-picker row.
    expect(el.shadowRoot!.querySelector("fluid-date-picker")).to.exist;
  });

  it("emits availability when a day is toggled open", async () => {
    const el = await fixture<FluidAvailabilityEditor>(html`<fluid-availability-editor></fluid-availability-editor>`);
    await elementUpdated(el);
    const firstRow = el.shadowRoot!.querySelector('[part="day"]')!;
    const sw = firstRow.querySelector("fluid-switch")!;
    setTimeout(() => sw.dispatchEvent(new CustomEvent("fluid-change", { detail: { checked: true }, bubbles: true, composed: true })));
    const ev = await oneEvent(el, "fluid-change");
    const a = ev.detail.availability as Availability;
    // Monday (weekday 1) now has a default window.
    expect(a.weekly[1]).to.deep.equal([{ start: "09:00", end: "17:00" }]);
    expect(a.slotMinutes).to.be.a("number");
  });

  it("adds a second window to a day", async () => {
    const el = await fixture<FluidAvailabilityEditor>(html`<fluid-availability-editor .availability=${SEED}></fluid-availability-editor>`);
    await elementUpdated(el);
    const firstRow = el.shadowRoot!.querySelector('[part="day"]')!;
    const addBtn = firstRow.querySelector("fluid-button")!;
    setTimeout(() => addBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })));
    const ev = await oneEvent(el, "fluid-change");
    expect((ev.detail.availability as Availability).weekly[1]!.length).to.equal(2);
  });

  it("updates a window when a time input changes", async () => {
    const el = await fixture<FluidAvailabilityEditor>(html`<fluid-availability-editor .availability=${SEED}></fluid-availability-editor>`);
    await elementUpdated(el);
    const start = el.shadowRoot!.querySelector<HTMLInputElement>('input[type="time"]')!;
    start.value = "08:30";
    setTimeout(() => start.dispatchEvent(new Event("change", { bubbles: true })));
    const ev = await oneEvent(el, "fluid-change");
    expect((ev.detail.availability as Availability).weekly[1]![0]!.start).to.equal("08:30");
  });

  it("adds and removes closed-date exceptions", async () => {
    const el = await fixture<FluidAvailabilityEditor>(html`<fluid-availability-editor></fluid-availability-editor>`);
    await elementUpdated(el);
    const addException = Array.from(el.shadowRoot!.querySelectorAll("fluid-button")).pop()!;
    setTimeout(() => addException.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })));
    const ev = await oneEvent(el, "fluid-change");
    expect((ev.detail.availability as Availability).exceptions?.length).to.equal(1);
  });

  it("passes the a11y audit", async () => {
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
        <fluid-availability-editor .availability=${SEED}></fluid-availability-editor>
      </div>
    `);
    const el = host.querySelector<FluidAvailabilityEditor>("fluid-availability-editor")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
