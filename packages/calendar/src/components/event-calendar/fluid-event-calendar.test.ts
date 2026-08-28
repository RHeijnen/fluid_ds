import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
import type { FluidEventCalendar, CalendarEvent } from "./fluid-event-calendar.js";

const events: CalendarEvent[] = [
  { id: "a", date: "2026-06-03", title: "Standup", tone: "accent" },
  { id: "b", date: "2026-06-10", title: "Release", tone: "warning" },
  { id: "c", date: "2026-06-10", title: "Retro" },
  { id: "d", date: "2026-06-10", title: "1:1" },
  { id: "e", date: "2026-06-10", title: "Incident", tone: "danger" }
];

async function cal(
  extra: Partial<{ weekStart: number; maxPerDay: number }> = {}
): Promise<FluidEventCalendar> {
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

  it("falls back safely for invalid month, week-start and event entries", async () => {
    const el = await fixture<FluidEventCalendar>(html`
      <fluid-event-calendar month="2026-13" week-start="99"></fluid-event-calendar>
    `);
    el.events = [
      null,
      { id: "missing-date", title: "Missing date" },
      { id: "valid", date: "2026-06-03", title: "Valid" }
    ] as unknown as CalendarEvent[];
    await elementUpdated(el);

    const now = new Date();
    const expectedMonth = new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric"
    }).format(new Date(now.getFullYear(), now.getMonth(), 1));
    expect(el.shadowRoot!.querySelector("#ec-title")!.textContent!.trim()).to.equal(expectedMonth);
    expect(el.shadowRoot!.querySelectorAll('[role="gridcell"]').length).to.equal(42);
    expect(el.shadowRoot!.querySelectorAll('[part="event"]').length).to.equal(0);
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

  it("keeps event chips and overflow buttons out of the tab order", async () => {
    // Use a low max so the 4-event day shows chips AND a "+N more" button.
    const el = await cal({ maxPerDay: 2 });
    // The only natural tab stop in the grid is the single roving gridcell:
    // chips and the overflow button must carry tabindex=-1.
    const focusable = el.shadowRoot!.querySelectorAll(
      '[role="grid"] [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).to.equal(1);
    expect((focusable[0] as HTMLElement).getAttribute("role")).to.equal("gridcell");
    // Spot-check the inner buttons explicitly.
    const cell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-10"]')!;
    for (const chip of cell.querySelectorAll('[part="event"]')) {
      expect(chip.getAttribute("tabindex")).to.equal("-1");
    }
    expect(cell.querySelector('[part="more"]')!.getAttribute("tabindex")).to.equal("-1");
  });

  it("moves the roving tab stop with arrow keys, Home and End", async () => {
    const el = await cal();
    const start = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-15"]')!;
    start.focus();
    const press = (key: string) =>
      start.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

    // 2026-06-15 is a Monday; ArrowRight -> Tuesday the 16th.
    press("ArrowRight");
    await elementUpdated(el);
    let active = el.shadowRoot!.querySelector('[role="gridcell"][tabindex="0"]')!;
    expect(active.getAttribute("data-iso")).to.equal("2026-06-16");

    // ArrowDown from the 16th -> a week later, the 23rd.
    const cur = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-16"]')!;
    cur.focus();
    cur.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    active = el.shadowRoot!.querySelector('[role="gridcell"][tabindex="0"]')!;
    expect(active.getAttribute("data-iso")).to.equal("2026-06-23");

    // Home jumps to the start of that week (Monday the 22nd, week-start=1).
    const wk = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-23"]')!;
    wk.focus();
    wk.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await elementUpdated(el);
    active = el.shadowRoot!.querySelector('[role="gridcell"][tabindex="0"]')!;
    expect(active.getAttribute("data-iso")).to.equal("2026-06-22");

    // End jumps to the end of the week (Sunday the 28th).
    const home = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-22"]')!;
    home.focus();
    home.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await elementUpdated(el);
    active = el.shadowRoot!.querySelector('[role="gridcell"][tabindex="0"]')!;
    expect(active.getAttribute("data-iso")).to.equal("2026-06-28");

    // Exactly one cell is ever the roving tab stop.
    expect(el.shadowRoot!.querySelectorAll('[role="gridcell"][tabindex="0"]').length).to.equal(1);
  });

  it("steps the month with PageDown", async () => {
    const el = await cal();
    const cell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-15"]')!;
    cell.focus();
    setTimeout(() =>
      cell.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown", bubbles: true }))
    );
    const ev = await oneEvent(el, "fluid-month-change");
    expect(ev.detail.month).to.equal("2026-07");
  });

  it("activates a day with Enter via the keyboard", async () => {
    const el = await cal();
    const cell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-15"]')!;
    cell.focus();
    setTimeout(() =>
      cell.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    const ev = await oneEvent(el, "fluid-day-click");
    expect(ev.detail.date).to.equal("2026-06-15");
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
    const chip = el.shadowRoot!.querySelector<HTMLElement>(
      '[data-iso="2026-06-03"] [part="event"]'
    )!;
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

  it("offers keyboard access to event and overflow buttons without activating the day", async () => {
    const el = await cal({ maxPerDay: 2 });
    const cell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-10"]')!;
    const seen: string[] = [];
    el.addEventListener("fluid-day-click", () => seen.push("day"));
    el.addEventListener("fluid-event-click", (event) =>
      seen.push((event as CustomEvent).detail.id)
    );
    cell.focus();
    cell.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true }));
    const first = cell.querySelector<HTMLButtonElement>("button")!;
    expect(el.shadowRoot!.activeElement).to.equal(first);
    const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    first.dispatchEvent(enter);
    expect(enter.defaultPrevented).to.be.false;
    first.click();
    expect(seen).to.deep.equal(["b"]);
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const second = cell.querySelectorAll<HTMLButtonElement>("button")[1]!;
    expect(el.shadowRoot!.activeElement).to.equal(second);
    second.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement).to.equal(cell);
  });

  it("preserves a valid focused day after PageDown and external month replacement", async () => {
    const el = await cal();
    const cell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-30"]')!;
    cell.focus();
    cell.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown", bubbles: true }));
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement?.getAttribute("data-iso")).to.equal("2026-07-30");
    expect(el.shadowRoot!.activeElement?.getAttribute("tabindex")).to.equal("0");
    el.month = "2026-02";
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement?.getAttribute("tabindex")).to.equal("0");
    expect(el.shadowRoot!.activeElement?.getAttribute("data-iso")).to.equal("2026-02-01");
  });

  it("localizes inherited dates, counts and navigation live without touching event content", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="en">
        <fluid-event-calendar
          month="2026-06"
          max-per-day="2"
          .events=${[...events, { id: "odd", date: "2026-06-03", title: "<Caller & title>" }]}
        ></fluid-event-calendar>
      </div>
    `);
    const el = wrapper.querySelector<FluidEventCalendar>("fluid-event-calendar")!;
    wrapper.lang = "ar";
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!;
    expect(base.dir).to.equal("rtl");
    expect(el.shadowRoot!.querySelector('[part="prev"]')!.getAttribute("aria-label")).to.equal(
      "الشهر السابق"
    );
    const cell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-10"]')!;
    const dateLabel = new Intl.DateTimeFormat("ar", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(2026, 5, 10));
    expect(cell.getAttribute("aria-label")).to.contain(dateLabel);
    expect(cell.querySelector('[part="more"]')!.textContent).to.contain(
      new Intl.NumberFormat("ar", { useGrouping: false }).format(2)
    );
    expect(
      el
        .shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-03"] [part="event"]')!
        .textContent.trim()
    ).to.equal("Standup");
    expect(el.events.at(-1)!.title).to.equal("<Caller & title>");

    wrapper.lang = "fr-CA";
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[part="next"]')!.getAttribute("aria-label")).to.equal(
      "Mois suivant"
    );
    expect(base.dir).to.equal("ltr");
  });

  it("keeps explicit Intl locale separate from inherited dictionary language", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-event-calendar month="2026-06" locale="de"></fluid-event-calendar>
      </div>
    `);
    const el = wrapper.querySelector<FluidEventCalendar>("fluid-event-calendar")!;
    expect(el.shadowRoot!.querySelector("#ec-title")!.textContent).to.equal("Juni 2026");
    expect(el.shadowRoot!.querySelector('[part="next"]')!.getAttribute("aria-label")).to.equal(
      "الشهر التالي"
    );
  });

  it("follows the rendered Arabic grid and event-chip direction while preserving ISO payloads", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar" dir="rtl">
        <fluid-event-calendar
          month="2026-06"
          max-per-day="2"
          .events=${events}
        ></fluid-event-calendar>
      </div>
    `);
    const el = wrapper.querySelector<FluidEventCalendar>("fluid-event-calendar")!;
    const start = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-15"]')!;
    start.focus();
    start.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[tabindex="0"]')!.getAttribute("data-iso")).to.equal(
      "2026-06-16"
    );

    const eventCell = el.shadowRoot!.querySelector<HTMLElement>('[data-iso="2026-06-10"]')!;
    eventCell.focus();
    eventCell.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true }));
    const buttons = eventCell.querySelectorAll<HTMLButtonElement>("button");
    buttons[1]!.focus();
    buttons[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(el.shadowRoot!.activeElement).to.equal(buttons[0]);

    setTimeout(() => start.click());
    const event = await oneEvent(el, "fluid-day-click");
    expect(event.detail.date).to.equal("2026-06-15");
    const transform = getComputedStyle(
      el.shadowRoot!.querySelector<SVGElement>('[part="prev"] svg')!
    ).transform;
    expect(new DOMMatrixReadOnly(transform).a).to.equal(-1);
  });
});
