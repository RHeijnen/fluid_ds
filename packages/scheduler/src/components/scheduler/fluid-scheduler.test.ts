import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidScheduler } from "./fluid-scheduler.js";
import type { Availability } from "../../internal/availability.js";

// Open every weekday 09:00-12:00 so any future date has slots.
const ALL_DAYS: Availability = {
  weekly: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, [{ start: "09:00", end: "12:00" }]])) as Availability["weekly"],
  slotMinutes: 60
};

// A date comfortably in the future so its slots are never "past".
const FUTURE_DATE = "2035-06-18";
const FUTURE_SLOT = `${FUTURE_DATE}T10:00`;

async function schedulerFixture(props: Partial<{ value: string | null }> = {}): Promise<FluidScheduler> {
  const el = await fixture<FluidScheduler>(
    html`<fluid-scheduler .availability=${ALL_DAYS} .value=${props.value ?? null}></fluid-scheduler>`
  );
  await elementUpdated(el);
  return el;
}

describe("<fluid-scheduler>", () => {
  it("renders a calendar and a prompt before a day is chosen", async () => {
    const el = await schedulerFixture();
    expect(el.shadowRoot!.querySelector("fluid-calendar")).to.exist;
    expect(el.shadowRoot!.querySelector('[part="prompt"]')).to.exist;
    expect(el.shadowRoot!.querySelector("fluid-time-slots")).to.not.exist;
  });

  it("emits fluid-range-change for the visible month on connect", async () => {
    // Subscribe before the element connects, since the event fires on the
    // first update (during connect), which would otherwise race the listener.
    const el = document.createElement("fluid-scheduler") as FluidScheduler;
    el.availability = ALL_DAYS;
    const done = oneEvent(el, "fluid-range-change");
    document.body.appendChild(el);
    const ev = await done;
    expect(ev.detail.start).to.match(/^\d{4}-\d{2}-01$/);
    expect(ev.detail.end).to.match(/^\d{4}-\d{2}-\d{2}$/);
    el.remove();
  });

  it("passes a day-state map to the inner calendar", async () => {
    const el = await schedulerFixture();
    const cal = el.shadowRoot!.querySelector("fluid-calendar") as HTMLElement & { dayState: Record<string, string> | null };
    expect(cal.dayState).to.be.an("object");
    expect(Object.keys(cal.dayState!).length).to.be.greaterThan(0);
  });

  it("shows the slot panel and sets the form value when value is provided", async () => {
    const el = await schedulerFixture({ value: FUTURE_SLOT });
    expect(el.shadowRoot!.querySelector("fluid-time-slots")).to.exist;
    const data = new FormData();
    // The control participates in forms via ElementInternals; value is reflected.
    expect(el.value).to.equal(FUTURE_SLOT);
    data.append("x", el.value ?? "");
    expect(data.get("x")).to.equal(FUTURE_SLOT);
  });

  it("fires fluid-day-select and reveals slots when a calendar day is activated", async () => {
    const el = await schedulerFixture();
    const cal = el.shadowRoot!.querySelector("fluid-calendar")!;
    setTimeout(() =>
      cal.dispatchEvent(
        new CustomEvent("fluid-date-activate", { detail: { iso: FUTURE_DATE }, bubbles: true, composed: true })
      )
    );
    const ev = await oneEvent(el, "fluid-day-select");
    expect(ev.detail.date).to.equal(FUTURE_DATE);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("fluid-time-slots")).to.exist;
  });

  it("commits the slot and fires fluid-change when a slot is chosen", async () => {
    const el = await schedulerFixture({ value: FUTURE_SLOT });
    const slots = el.shadowRoot!.querySelector("fluid-time-slots")!;
    const slot = { start: `${FUTURE_DATE}T11:00`, end: `${FUTURE_DATE}T12:00`, remaining: 1, state: "available" };
    setTimeout(() =>
      slots.dispatchEvent(new CustomEvent("fluid-change", { detail: { value: slot.start, slot }, bubbles: true, composed: true }))
    );
    const ev = await oneEvent(el, "fluid-change");
    expect(ev.detail.start).to.equal(`${FUTURE_DATE}T11:00`);
    expect(ev.detail.end).to.equal(`${FUTURE_DATE}T12:00`);
    expect(el.value).to.equal(`${FUTURE_DATE}T11:00`);
  });

  it("exposes a refresh() method", async () => {
    const el = await schedulerFixture();
    expect(el.refresh).to.be.a("function");
    el.refresh();
    await elementUpdated(el);
  });

  it("shows a loading overlay when loading", async () => {
    const el = await schedulerFixture({ value: FUTURE_SLOT });
    el.loading = true;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".overlay")).to.exist;
  });

  it("resets to the default value on form reset", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-scheduler name="appt" .availability=${ALL_DAYS}></fluid-scheduler></form>
    `);
    const el = form.querySelector<FluidScheduler>("fluid-scheduler")!;
    el.value = FUTURE_SLOT;
    await elementUpdated(el);
    form.reset();
    await elementUpdated(el);
    expect(el.value).to.be.null;
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
          --fluid-success-base: #15803d;
          --fluid-warning-base: #b45309;
          --fluid-danger-base: #b91c1c;
          --fluid-motion: 0;
        "
      >
        <fluid-scheduler .availability=${ALL_DAYS} value=${FUTURE_SLOT} aria-label="Book appointment"></fluid-scheduler>
      </div>
    `);
    const el = host.querySelector<FluidScheduler>("fluid-scheduler")!;
    await elementUpdated(el);
    const cal = el.shadowRoot!.querySelector("fluid-calendar") as (Element & { updateComplete: Promise<unknown> }) | null;
    const slots = el.shadowRoot!.querySelector("fluid-time-slots") as (Element & { updateComplete: Promise<unknown> }) | null;
    if (cal) await cal.updateComplete;
    if (slots) await slots.updateComplete;
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
