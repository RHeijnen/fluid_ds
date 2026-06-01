import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidEventCalendar, CalendarEvent } from "./fluid-event-calendar.js";

const events: CalendarEvent[] = [
  { id: "a", date: "2026-06-03", title: "Standup", tone: "accent" },
  { id: "b", date: "2026-06-10", title: "Release", tone: "warning" },
  { id: "c", date: "2026-06-10", title: "Retro" },
  { id: "d", date: "2026-06-10", title: "1:1" },
  { id: "e", date: "2026-06-10", title: "Incident", tone: "danger" }
];

async function cal(extra: Partial<{ weekStart: number; maxPerDay: number }> = {}): Promise<FluidEventCalendar> {
  const el = await fixture<FluidEventCalendar>(html`
    <fluid-event-calendar
      .month=${"2026-06"}
      .events=${events}
      week-start=${extra.weekStart ?? 1}
      max-per-day=${extra.maxPerDay ?? 3}
    ></fluid-event-calendar>
  `);
  await elementUpdated(el);
  return el;
}

describe("<fluid-event-calendar>", () => {
  it("renders a labelled month grid of six weeks", async () => {
    const el = await cal();
    const grid = el.shadowRoot!.querySelector('[role="grid"]')!;
    expect(grid).to.exist;
    expect(grid.getAttribute("aria-labelledby")).to.equal("ec-title");
    // 1 header row + 6 week rows
    expect(el.shadowRoot!.querySelectorAll('[role="row"]').length).to.equal(7);
    expect(el.shadowRoot!.querySelectorAll('[role="columnheader"]').length).to.equal(7);
    expect(el.shadowRoot!.querySelectorAll('[role="gridcell"]').length).to.equal(42);
  });

  it("shows the localized month label", async () => {
    const el = await cal();
    expect(el.shadowRoot!.querySelector("#ec-title")!.textContent).to.contain("June");
    expect(el.shadowRoot!.querySelector("#ec-title")!.textContent).to.contain("2026");
  });

  it("places events on their day and shows their title text", async () => {
    const el = await cal();
    const cell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-03"]')!;
    const chips = cell.querySelectorAll('[part="event"]');
    expect(chips.length).to.equal(1);
    expect(chips[0]!.textContent!.trim()).to.equal("Standup");
  });

  it('collapses overflow into a "+N more" indicator', async () => {
    const el = await cal({ maxPerDay: 2 });
    const cell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-10"]')!;
    expect(cell.querySelectorAll('[part="event"]').length).to.equal(2);
    const more = cell.querySelector('[part="more"]')!;
    expect(more.textContent).to.contain("+2 more"); // 4 events, 2 shown
  });

  it("exposes exactly one roving tab stop in the grid", async () => {
    const el = await cal();
    const tabbable = el.shadowRoot!.querySelectorAll('[role="gridcell"][tabindex="0"]');
    expect(tabbable.length).to.equal(1);
  });

  it("emits fluid-day-click with the cell date", async () => {
    const el = await cal();
    const cell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-15"]')!;
    setTimeout(() => cell.click());
    const ev = await oneEvent(el, "fluid-day-click");
    expect(ev.detail.date).to.equal("2026-06-15");
  });

  it("emits fluid-event-click with the id and event, without firing day-click", async () => {
    const el = await cal();
    let dayFired = false;
    el.addEventListener("fluid-day-click", () => (dayFired = true));
    const chip = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-03"] [part="event"]')!;
    setTimeout(() => chip.click());
    const ev = await oneEvent(el, "fluid-event-click");
    expect(ev.detail.id).to.equal("a");
    expect(ev.detail.event.title).to.equal("Standup");
    expect(dayFired).to.be.false;
  });

  it("emits fluid-month-change when advancing the month", async () => {
    const el = await cal();
    const next = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="next"]')!;
    setTimeout(() => next.click());
    const ev = await oneEvent(el, "fluid-month-change");
    expect(ev.detail.month).to.equal("2026-07");
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("#ec-title")!.textContent).to.contain("July");
  });

  it("steps to the previous month", async () => {
    const el = await cal();
    const prev = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="prev"]')!;
    setTimeout(() => prev.click());
    const ev = await oneEvent(el, "fluid-month-change");
    expect(ev.detail.month).to.equal("2026-05");
  });

  it("respects week-start when ordering columns", async () => {
    const mon = await cal({ weekStart: 1 });
    const sun = await cal({ weekStart: 0 });
    const monFirst = mon.shadowRoot!.querySelectorAll('[role="columnheader"]')[0]!.textContent;
    const sunFirst = sun.shadowRoot!.querySelectorAll('[role="columnheader"]')[0]!.textContent;
    expect(monFirst).to.not.equal(sunFirst);
  });

  it("marks today with aria-current when visible", async () => {
    const now = new Date();
    const monthAttr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const el = await fixture<FluidEventCalendar>(html`
      <fluid-event-calendar .month=${monthAttr}></fluid-event-calendar>
    `);
    await elementUpdated(el);
    const current = el.shadowRoot!.querySelectorAll('[aria-current="date"]');
    expect(current.length).to.equal(1);
  });

  it("passes the a11y audit", async () => {
    const wrap = await fixture(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
        "
      >
        <fluid-event-calendar .month=${"2026-06"} .events=${events}></fluid-event-calendar>
      </div>
    `);
    const el = wrap.querySelector("fluid-event-calendar")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
