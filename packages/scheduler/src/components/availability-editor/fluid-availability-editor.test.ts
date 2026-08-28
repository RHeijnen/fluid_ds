import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
import type { FluidAvailabilityEditor } from "./fluid-availability-editor.js";
import type { Availability } from "../../internal/availability.js";

const SEED: Availability = {
  weekly: { 1: [{ start: "09:00", end: "17:00" }] },
  slotMinutes: 45,
  exceptions: [{ date: "2026-12-25", closed: true }]
};

describe("<fluid-availability-editor>", () => {
  it("renders a row for every weekday", async () => {
    const el = await fixture<FluidAvailabilityEditor>(
      html`<fluid-availability-editor></fluid-availability-editor>`
    );
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelectorAll('[part="day"]').length).to.equal(7);
  });

  it("hydrates its controls from the availability property", async () => {
    const el = await fixture<FluidAvailabilityEditor>(
      html`<fluid-availability-editor .availability=${SEED}></fluid-availability-editor>`
    );
    await elementUpdated(el);
    // Monday is first (week starts Monday); its switch is checked and times shown.
    const firstRow = el.shadowRoot!.querySelector('[part="day"]')!;
    const sw = firstRow.querySelector("fluid-switch") as HTMLElement & { checked: boolean };
    expect(sw.checked).to.be.true;
    const times = firstRow.querySelectorAll<HTMLInputElement>('input[type="time"]');
    if (!times[0] || !times[1]) throw new Error("Expected both opening and closing time controls");
    expect(times[0].value).to.equal("09:00");
    expect(times[1].value).to.equal("17:00");
    // The seeded exception renders a date-picker row.
    expect(el.shadowRoot!.querySelector("fluid-date-picker")).to.exist;
  });

  it("emits availability when a day is toggled open", async () => {
    const el = await fixture<FluidAvailabilityEditor>(
      html`<fluid-availability-editor></fluid-availability-editor>`
    );
    await elementUpdated(el);
    const firstRow = el.shadowRoot!.querySelector('[part="day"]')!;
    const sw = firstRow.querySelector("fluid-switch")!;
    setTimeout(() =>
      sw.dispatchEvent(
        new CustomEvent("fluid-change", {
          detail: { checked: true },
          bubbles: true,
          composed: true
        })
      )
    );
    const ev = await oneEvent(el, "fluid-change");
    const a = ev.detail.availability as Availability;
    // Monday (weekday 1) now has a default window.
    expect(a.weekly[1]).to.deep.equal([{ start: "09:00", end: "17:00" }]);
    expect(a.slotMinutes).to.be.a("number");
  });

  it("adds a second window to a day", async () => {
    const el = await fixture<FluidAvailabilityEditor>(
      html`<fluid-availability-editor .availability=${SEED}></fluid-availability-editor>`
    );
    await elementUpdated(el);
    const firstRow = el.shadowRoot!.querySelector('[part="day"]')!;
    const addBtn = firstRow.querySelector("fluid-button")!;
    setTimeout(() =>
      addBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }))
    );
    const ev = await oneEvent(el, "fluid-change");
    expect((ev.detail.availability as Availability).weekly[1]!.length).to.equal(2);
  });

  it("updates a window when a time input changes", async () => {
    const el = await fixture<FluidAvailabilityEditor>(
      html`<fluid-availability-editor .availability=${SEED}></fluid-availability-editor>`
    );
    await elementUpdated(el);
    const start = el.shadowRoot!.querySelector<HTMLInputElement>('input[type="time"]')!;
    start.value = "08:30";
    setTimeout(() => start.dispatchEvent(new Event("change", { bubbles: true })));
    const ev = await oneEvent(el, "fluid-change");
    expect((ev.detail.availability as Availability).weekly[1]![0]!.start).to.equal("08:30");
  });

  it("adds and removes closed-date exceptions", async () => {
    const el = await fixture<FluidAvailabilityEditor>(
      html`<fluid-availability-editor></fluid-availability-editor>`
    );
    await elementUpdated(el);
    const addException = Array.from(el.shadowRoot!.querySelectorAll("fluid-button")).pop()!;
    setTimeout(() =>
      addException.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }))
    );
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

  it("emits exactly one complete change for a child switch and preserves edits after reconnect", async () => {
    const el = await fixture<FluidAvailabilityEditor>(
      html`<fluid-availability-editor .availability=${SEED}></fluid-availability-editor>`
    );
    const parent = el.parentElement!;
    const changes: CustomEvent[] = [];
    el.addEventListener("fluid-change", (event) => changes.push(event as CustomEvent));
    const switchEl = el.shadowRoot!.querySelector("fluid-switch")!;
    switchEl.dispatchEvent(
      new CustomEvent("fluid-change", { detail: { checked: false }, bubbles: true, composed: true })
    );
    await elementUpdated(el);
    expect(changes).to.have.length(1);
    expect(changes[0]!.detail.availability.weekly[1]).to.equal(undefined);
    el.remove();
    parent.append(el);
    await elementUpdated(el);
    expect((switchEl as HTMLElement & { checked: boolean }).checked).to.be.false;
  });

  it("preserves unedited slot settings, fractional notice hours, and special-date windows", async () => {
    const seed: Availability = {
      ...SEED,
      stepMinutes: 15,
      bufferMinutes: 5,
      minNoticeMinutes: 90,
      timeZone: "Europe/Amsterdam",
      exceptions: [{ date: "2035-01-03", windows: [{ start: "10:00", end: "12:00" }] }]
    };
    const el = await fixture<FluidAvailabilityEditor>(
      html`<fluid-availability-editor .availability=${seed}></fluid-availability-editor>`
    );
    let changed: Availability | undefined;
    el.addEventListener("fluid-change", (event) => {
      changed = (event as CustomEvent).detail.availability;
    });
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input[type="time"]')!;
    input.value = "08:30";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(changed).to.include({
      stepMinutes: 15,
      bufferMinutes: 5,
      minNoticeMinutes: 90,
      timeZone: "Europe/Amsterdam"
    });
    expect(changed!.exceptions).to.deep.equal(seed.exceptions);
    expect(changed!.maxAdvanceDays).to.equal(undefined);
    expect(seed.weekly[1]![0]!.start).to.equal("09:00");
  });

  it("keeps invalid time ranges as a marked draft without publishing invalid availability", async () => {
    const el = await fixture<FluidAvailabilityEditor>(
      html`<fluid-availability-editor .availability=${SEED}></fluid-availability-editor>`
    );
    const events: Event[] = [];
    el.addEventListener("fluid-change", (event) => events.push(event));
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input[type="time"]')!;
    input.value = "18:00";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await elementUpdated(el);
    expect(input.getAttribute("aria-invalid")).to.equal("true");
    expect(events).to.have.length(0);
    input.value = "08:00";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await elementUpdated(el);
    expect(input.getAttribute("aria-invalid")).to.equal("false");
    expect(events).to.have.length(1);
  });

  it("localizes owned editor copy and weekdays live without rewriting availability", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="nl">
        <fluid-availability-editor .availability=${SEED}></fluid-availability-editor>
      </div>
    `);
    const el = wrapper.querySelector<FluidAvailabilityEditor>("fluid-availability-editor")!;
    const changes: Event[] = [];
    el.addEventListener("fluid-change", (event) => changes.push(event));
    expect(el.shadowRoot!.querySelector("h3")!.textContent).to.equal("Tijdslotregels");
    expect(el.shadowRoot!.querySelector(".day-name")!.textContent).to.equal("maandag");

    wrapper.lang = "fr-CA";
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("h3")!.textContent).to.equal("Règles des créneaux");
    expect(el.shadowRoot!.querySelector(".day-name")!.textContent).to.equal("lundi");
    expect(changes).to.have.length(0);
    expect(el.availability).to.equal(SEED);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input[type="time"]')!.value).to.equal(
      "09:00"
    );
  });

  it("keeps explicit weekday locale independent from inherited Arabic messages", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-availability-editor locale="de" .availability=${SEED}></fluid-availability-editor>
      </div>
    `);
    const el = wrapper.querySelector<FluidAvailabilityEditor>("fluid-availability-editor")!;
    expect(el.shadowRoot!.querySelector(".day-name")!.textContent).to.equal("Montag");
    expect(el.shadowRoot!.querySelector("h3")!.textContent).to.equal("قواعد الفترات");
    expect(el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!.dir).to.equal("rtl");
  });

  it("uses localized complete window messages and display positions", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-availability-editor .availability=${SEED}></fluid-availability-editor>
      </div>
    `);
    const el = wrapper.querySelector<FluidAvailabilityEditor>("fluid-availability-editor")!;
    const row = el.shadowRoot!.querySelector<HTMLElement>('[part="day"]')!;
    const position = new Intl.NumberFormat("ar", { useGrouping: false }).format(1);
    const inputs = row.querySelectorAll<HTMLInputElement>('input[type="time"]');
    expect(inputs[0]!.getAttribute("aria-label")).to.equal(`وقت الفتح ${position} ليوم الاثنين`);
    expect(inputs[1]!.getAttribute("aria-label")).to.equal(`وقت الإغلاق ${position} ليوم الاثنين`);
    inputs[0]!.value = "18:00";
    inputs[0]!.dispatchEvent(new Event("change", { bubbles: true }));
    await elementUpdated(el);
    expect(row.querySelector('[role="alert"]')!.textContent?.trim()).to.equal(
      "يجب أن يسبق وقت الفتح وقت الإغلاق."
    );
  });

  it("supports Arabic RTL layout, keyboard focus, and canonical activation output", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar" dir="rtl">
        <fluid-availability-editor></fluid-availability-editor>
      </div>
    `);
    const el = wrapper.querySelector<FluidAvailabilityEditor>("fluid-availability-editor")!;
    const row = el.shadowRoot!.querySelector<HTMLElement>('[part="day"]')!;
    const name = row.querySelector<HTMLElement>(".day-name")!;
    const toggle = row.querySelector<HTMLElement>("fluid-switch")!;
    expect(
      getComputedStyle(el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!).direction
    ).to.equal("rtl");
    expect(name.getBoundingClientRect().x).to.be.greaterThan(toggle.getBoundingClientRect().x);
    const input = toggle.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    toggle.focus();
    expect(toggle.shadowRoot!.activeElement).to.equal(input);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    setTimeout(() => input.click());
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.availability.weekly[1]).to.deep.equal([{ start: "09:00", end: "17:00" }]);
  });

  it("passes inherited context into the composed closed-date picker and survives reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-availability-editor .availability=${SEED}></fluid-availability-editor>
      </div>
    `);
    const el = wrapper.querySelector<FluidAvailabilityEditor>("fluid-availability-editor")!;
    const picker = el.shadowRoot!.querySelector<HTMLElement & { updateComplete: Promise<unknown> }>(
      "fluid-date-picker"
    )!;
    await picker.updateComplete;
    const expected = new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
      new Date(2026, 11, 25)
    );
    expect(picker.shadowRoot!.querySelector<HTMLInputElement>("input")!.value).to.equal(expected);
    el.remove();
    wrapper.lang = "de";
    wrapper.append(el);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("h3")!.textContent).to.equal("Zeitfensterregeln");
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('input[type="time"]')!.value).to.equal(
      "09:00"
    );
  });
});
