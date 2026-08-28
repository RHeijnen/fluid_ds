import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import type { FluidTimeSlots } from "./fluid-time-slots.js";
import type { Slot } from "../../internal/availability.js";

const SLOTS: Slot[] = [
  { start: "2026-06-15T09:00", end: "2026-06-15T09:30", remaining: 1, state: "available" },
  { start: "2026-06-15T09:30", end: "2026-06-15T10:00", remaining: 1, state: "available" },
  { start: "2026-06-15T10:00", end: "2026-06-15T10:30", remaining: 0, state: "full" },
  { start: "2026-06-15T10:30", end: "2026-06-15T11:00", remaining: 1, state: "available" }
];

async function slotsFixture(value: string | null = null): Promise<FluidTimeSlots> {
  const el = await fixture<FluidTimeSlots>(html`<fluid-time-slots .slots=${SLOTS} .value=${value}></fluid-time-slots>`);
  await elementUpdated(el);
  return el;
}

describe("<fluid-time-slots>", () => {
  it("localizes unavailable and live availability text", async () => {
    const el = await fixture<FluidTimeSlots>(html`
      <fluid-time-slots lang="nl" .slots=${SLOTS}></fluid-time-slots>
    `);
    await elementUpdated(el);
    const unavailable = el.shadowRoot!.querySelector<HTMLButtonElement>("button:disabled")!;
    expect(unavailable.getAttribute("aria-label")).to.contain("niet beschikbaar");
    expect(el.shadowRoot!.querySelector('[aria-live="polite"]')?.textContent).to.contain(
      "beschikbare"
    );
  });

  it("renders a radiogroup of slot radios", async () => {
    const el = await slotsFixture();
    const group = el.shadowRoot!.querySelector('[role="radiogroup"]');
    expect(group).to.exist;
    const radios = el.shadowRoot!.querySelectorAll('[role="radio"]');
    expect(radios.length).to.equal(4);
  });

  it("formats the slot label as a time", async () => {
    const el = await slotsFixture();
    const first = el.shadowRoot!.querySelector('[role="radio"]')!;
    expect(first.textContent?.trim()).to.match(/09[:.]00|9[:.]00/);
  });

  it("disables full and past slots", async () => {
    const el = await slotsFixture();
    const radios = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    // index 2 is full
    if (!radios[2]) throw new Error("Expected the full slot");
    expect(radios[2].disabled).to.be.true;
  });

  it("fires fluid-change with the slot start when an available slot is clicked", async () => {
    const el = await slotsFixture();
    const radios = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    if (!radios[1]) throw new Error("Expected the second available slot");
    const changed = oneEvent(el, "fluid-change");
    radios[1].click();
    const ev = await changed;
    expect(ev.detail.value).to.equal("2026-06-15T09:30");
    expect(el.value).to.equal("2026-06-15T09:30");
  });

  it("does not select a full slot on click", async () => {
    const el = await slotsFixture();
    const radios = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    if (!radios[2]) throw new Error("Expected the full slot");
    radios[2].click();
    await elementUpdated(el);
    expect(el.value).to.be.null;
  });

  it("marks the selected slot aria-checked", async () => {
    const el = await slotsFixture("2026-06-15T09:30");
    const radios = Array.from(el.shadowRoot!.querySelectorAll('[role="radio"]'));
    if (!radios[0] || !radios[1]) throw new Error("Expected both selectable slots");
    expect(radios[1].getAttribute("aria-checked")).to.equal("true");
    expect(radios[0].getAttribute("aria-checked")).to.equal("false");
  });

  it("makes only one slot tabbable (roving tabindex)", async () => {
    const el = await slotsFixture();
    const radios = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    const tabbable = radios.filter((r) => r.tabIndex === 0);
    expect(tabbable.length).to.equal(1);
  });

  it("moves focus to the next selectable slot on ArrowDown and selects with Enter", async () => {
    const el = await slotsFixture();
    const group = el.shadowRoot!.querySelector<HTMLElement>('[role="radiogroup"]')!;
    group.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    group.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await elementUpdated(el);
    // started at first selectable (09:00), ArrowDown → 09:30
    expect(el.value).to.equal("2026-06-15T09:30");
  });

  it("shows an empty message when there are no slots", async () => {
    const el = await fixture<FluidTimeSlots>(html`<fluid-time-slots .slots=${[]}></fluid-time-slots>`);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[part="empty"]')).to.exist;
  });

  it("generates slots from date + availability when no slots are given", async () => {
    const el = await fixture<FluidTimeSlots>(html`
      <fluid-time-slots
        date="2030-01-07"
        .availability=${{ weekly: { 1: [{ start: "09:00", end: "10:00" }] }, slotMinutes: 30 }}
      ></fluid-time-slots>
    `);
    await elementUpdated(el);
    // 2030-01-07 is a Monday (weekday 1); 09:00-10:00 / 30min = 2 slots
    const radios = el.shadowRoot!.querySelectorAll('[role="radio"]');
    expect(radios.length).to.equal(2);
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
        "
      >
        <fluid-time-slots .slots=${SLOTS} value="2026-06-15T09:30"></fluid-time-slots>
      </div>
    `);
    const el = host.querySelector<FluidTimeSlots>("fluid-time-slots")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
