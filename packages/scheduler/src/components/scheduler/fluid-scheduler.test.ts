import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
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

  it("re-emits fluid-range-change when the visible month changes (lazy-fetch hook)", async () => {
    const el = await schedulerFixture();
    const cal = el.shadowRoot!.querySelector("fluid-calendar")!;
    // Navigate to a different month; the inner calendar reports via fluid-view-change.
    const NEXT_MONTH = "2035-07-15";
    setTimeout(() =>
      cal.dispatchEvent(
        new CustomEvent("fluid-view-change", { detail: { view: NEXT_MONTH }, bubbles: true, composed: true })
      )
    );
    const ev = await oneEvent(el, "fluid-range-change");
    // July 2035 has 31 days: first and last day of the newly visible month.
    expect(ev.detail.start).to.equal("2035-07-01");
    expect(ev.detail.end).to.equal("2035-07-31");
  });

  it("passes a day-state map to the inner calendar", async () => {
    const el = await schedulerFixture();
    const cal = el.shadowRoot!.querySelector("fluid-calendar") as HTMLElement & { dayState: Record<string, string> | null };
    expect(cal.dayState).to.be.an("object");
    expect(Object.keys(cal.dayState!).length).to.be.greaterThan(0);
  });

  it("shows the slot panel and sets the form value when value is provided", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-scheduler name="appointment" .availability=${ALL_DAYS} value=${FUTURE_SLOT}></fluid-scheduler></form>
    `);
    const el = form.querySelector<FluidScheduler>("fluid-scheduler")!;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("fluid-time-slots")).to.exist;
    expect(el.value).to.equal(FUTURE_SLOT);
    expect(new FormData(form).get("appointment")).to.equal(FUTURE_SLOT);
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

  it("synchronizes FormData before fluid-change observers run", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-scheduler
          name="appointment"
          .availability=${ALL_DAYS}
          value=${FUTURE_SLOT}
        ></fluid-scheduler>
      </form>
    `);
    const el = form.querySelector<FluidScheduler>("fluid-scheduler")!;
    await elementUpdated(el);
    const slots = el.shadowRoot!.querySelector("fluid-time-slots")!;
    const slot = {
      start: `${FUTURE_DATE}T11:00`,
      end: `${FUTURE_DATE}T12:00`,
      remaining: 1,
      state: "available"
    };
    const data = oneEvent(el, "fluid-change").then(() => [...new FormData(form)]);
    slots.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: slot.start, slot },
        bubbles: true,
        composed: true
      })
    );
    expect(await data).to.deep.equal([["appointment", slot.start]]);
  });

  it("restores canonical form state and its selected day", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-scheduler name="appointment" .availability=${ALL_DAYS}></fluid-scheduler></form>
    `);
    const el = form.querySelector<FluidScheduler>("fluid-scheduler")!;
    el.formStateRestoreCallback(FUTURE_SLOT, "restore");
    await elementUpdated(el);
    expect(el.value).to.equal(FUTURE_SLOT);
    expect(new FormData(form).get("appointment")).to.equal(FUTURE_SLOT);
    expect(el.shadowRoot!.querySelector("fluid-time-slots")?.getAttribute("date")).to.equal(
      FUTURE_DATE
    );
  });

  it("localizes required validation, prompt and nested slot labels", async () => {
    const el = await schedulerFixture();
    el.lang = "nl";
    el.required = true;
    await elementUpdated(el);
    expect(el.validationMessage).to.equal("Kies een afspraak.");
    expect(el.shadowRoot!.querySelector('[part="prompt"]')?.textContent).to.contain(
      "Selecteer een dag"
    );
    el.shadowRoot!.querySelector("fluid-calendar")!.dispatchEvent(
      new CustomEvent("fluid-date-activate", {
        detail: { iso: FUTURE_DATE },
        bubbles: true,
        composed: true
      })
    );
    await elementUpdated(el);
    const slots = el.shadowRoot!.querySelector("fluid-time-slots") as
      | (HTMLElement & { updateComplete: Promise<unknown> })
      | null;
    await slots?.updateComplete;
    expect(slots?.shadowRoot?.querySelector('[role="radiogroup"]')?.getAttribute("aria-label")).to.contain(
      "Tijdsloten voor"
    );
  });

  it("focuses an enabled correction day when the roving day is unavailable", async () => {
    const today = new Date();
    const todayISO = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");
    const availability: Availability = {
      ...ALL_DAYS,
      exceptions: [{ date: todayISO, closed: true }]
    };
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-scheduler required .availability=${availability}></fluid-scheduler></form>
    `);
    const el = form.querySelector<FluidScheduler>("fluid-scheduler")!;
    const calendar = el.shadowRoot!.querySelector<HTMLElement>("fluid-calendar")!;
    await (calendar as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;

    expect(calendar.shadowRoot!.querySelector("button.day[tabindex='0']")?.hasAttribute("disabled"))
      .to.equal(true);
    expect(el.reportValidity()).to.equal(false);
    await aTimeout(0);
    expect(calendar.shadowRoot!.activeElement).to.match("button.day:not(:disabled)");
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

  it("blocks day and slot commits while disabled, readonly, or loading", async () => {
    const el = await schedulerFixture({ value: FUTURE_SLOT });
    const seen: Event[] = [];
    el.addEventListener("fluid-change", (event) => seen.push(event));
    el.addEventListener("fluid-day-select", (event) => seen.push(event));
    for (const state of ["disabled", "readonly", "loading"] as const) {
      el[state] = true;
      await elementUpdated(el);
      el.shadowRoot!.querySelector("fluid-calendar")!.dispatchEvent(new CustomEvent("fluid-date-activate", {
        detail: { iso: "2035-06-19" }, bubbles: true, composed: true
      }));
      el.shadowRoot!.querySelector("fluid-time-slots")!.dispatchEvent(new CustomEvent("fluid-change", {
        detail: { slot: { start: `${FUTURE_DATE}T11:00`, end: `${FUTURE_DATE}T12:00`, state: "available" } },
        bubbles: true, composed: true
      }));
      expect(el.value).to.equal(FUTURE_SLOT);
      el[state] = false;
    }
    expect(seen).to.deep.equal([]);
  });

  it("updates required validity and invalidates a selection booked by another visitor", async () => {
    const el = await schedulerFixture();
    el.required = true;
    await elementUpdated(el);
    expect(el.validity.valueMissing).to.be.true;
    el.value = FUTURE_SLOT;
    await elementUpdated(el);
    expect(el.checkValidity()).to.be.true;
    el.bookings = [{ start: FUTURE_SLOT }];
    await elementUpdated(el);
    expect(el.validity.customError).to.be.true;
    el.bookings = [];
    el.value = null;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("fluid-time-slots")).to.equal(null);
    expect(el.validity.valueMissing).to.be.true;
  });

  it("retains the original form-reset default after reconnect", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-scheduler name="appointment" .availability=${ALL_DAYS} value=${FUTURE_SLOT}></fluid-scheduler></form>
    `);
    const el = form.querySelector<FluidScheduler>("fluid-scheduler")!;
    el.value = `${FUTURE_DATE}T11:00`;
    await elementUpdated(el);
    el.remove();
    form.append(el);
    form.reset();
    await elementUpdated(el);
    expect(new FormData(form).get("appointment")).to.equal(FUTURE_SLOT);
  });
});
