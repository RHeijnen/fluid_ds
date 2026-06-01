import { expect, fixture, html, oneEvent, elementUpdated } from "@open-wc/testing";
import "./define.js";
import type { FluidCalendar } from "./fluid-calendar.js";

describe("<fluid-calendar>", () => {
  it("renders a role=grid with 42 day buttons", async () => {
    const el = await fixture<FluidCalendar>(
      html`<fluid-calendar value="2026-06-15"></fluid-calendar>`
    );
    const grid = el.shadowRoot!.querySelector('[role="grid"]')!;
    expect(grid).to.exist;
    const days = el.shadowRoot!.querySelectorAll("button.day");
    expect(days.length).to.equal(42);
  });

  it("marks the selected value day as selected (class + aria-selected)", async () => {
    const el = await fixture<FluidCalendar>(
      html`<fluid-calendar value="2026-06-15"></fluid-calendar>`
    );
    const selected = el.shadowRoot!.querySelector("button.day.selected")!;
    expect(selected).to.exist;
    expect(selected.textContent?.trim()).to.equal("15");
    const cell = selected.closest('[role="gridcell"]')!;
    expect(cell.getAttribute("aria-selected")).to.equal("true");
  });

  it("fires fluid-date-activate with the right detail.iso when a day is clicked", async () => {
    const el = await fixture<FluidCalendar>(
      html`<fluid-calendar value="2026-06-15"></fluid-calendar>`
    );
    // Find the in-month day labelled "20".
    const buttons = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.day"));
    const target = buttons.find(
      (b) => b.textContent?.trim() === "20" && !b.classList.contains("outside")
    )!;
    setTimeout(() => target.click());
    const event = (await oneEvent(el, "fluid-date-activate")) as CustomEvent;
    expect(event.detail.iso).to.equal("2026-06-20");
  });

  it("ArrowRight moves the roving tabindex=0 to the next day", async () => {
    const el = await fixture<FluidCalendar>(
      html`<fluid-calendar value="2026-06-15"></fluid-calendar>`
    );
    const before = el.shadowRoot!.querySelector<HTMLButtonElement>(".day[tabindex='0']")!;
    expect(before.textContent?.trim()).to.equal("15");
    const grid = el.shadowRoot!.querySelector('[role="grid"]')!;
    grid.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await elementUpdated(el);
    const after = el.shadowRoot!.querySelector<HTMLButtonElement>(".day[tabindex='0']")!;
    expect(after.textContent?.trim()).to.equal("16");
  });

  it("disables out-of-range days via min/max", async () => {
    const el = await fixture<FluidCalendar>(
      html`<fluid-calendar value="2026-06-15" min="2026-06-10" max="2026-06-20"></fluid-calendar>`
    );
    const buttons = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.day"));
    const inMonth = buttons.filter((b) => !b.classList.contains("outside"));
    const day5 = inMonth.find((b) => b.textContent?.trim() === "5")!;
    const day15 = inMonth.find((b) => b.textContent?.trim() === "15")!;
    const day25 = inMonth.find((b) => b.textContent?.trim() === "25")!;
    expect(day5.disabled).to.be.true;
    expect(day15.disabled).to.be.false;
    expect(day25.disabled).to.be.true;
  });

  it("week-start=0 puts Sunday first", async () => {
    const el = await fixture<FluidCalendar>(
      html`<fluid-calendar value="2026-06-15" week-start="0" locale="en-US"></fluid-calendar>`
    );
    const headers = Array.from(
      el.shadowRoot!.querySelectorAll('th[role="columnheader"]')
    ).map((th) => th.textContent?.trim());
    expect(headers[0]).to.equal("Sun");
  });

  it("defaults to week-start Monday", async () => {
    const el = await fixture<FluidCalendar>(
      html`<fluid-calendar value="2026-06-15" locale="en-US"></fluid-calendar>`
    );
    const headers = Array.from(
      el.shadowRoot!.querySelectorAll('th[role="columnheader"]')
    ).map((th) => th.textContent?.trim());
    expect(headers[0]).to.equal("Mon");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCalendar>(
      html`<fluid-calendar value="2026-06-15"></fluid-calendar>`
    );
    await elementUpdated(el);
    await expect(el).to.be.accessible();
  });

  describe("dayState", () => {
    it("renders an availability dot for open/some/full days", async () => {
      const el = await fixture<FluidCalendar>(html`
        <fluid-calendar
          view="2026-06-15"
          .dayState=${{ "2026-06-10": "open", "2026-06-11": "some", "2026-06-12": "full" }}
        ></fluid-calendar>
      `);
      await elementUpdated(el);
      const dots = el.shadowRoot!.querySelectorAll(".dot");
      expect(dots.length).to.equal(3);
      expect(el.shadowRoot!.querySelector('.dot[data-state="open"]')).to.exist;
      expect(el.shadowRoot!.querySelector('.dot[data-state="full"]')).to.exist;
    });

    it("disables closed and unavailable days", async () => {
      const el = await fixture<FluidCalendar>(html`
        <fluid-calendar
          view="2026-06-15"
          .dayState=${{ "2026-06-10": "closed", "2026-06-11": "unavailable", "2026-06-12": "open" }}
        ></fluid-calendar>
      `);
      await elementUpdated(el);
      const buttons = Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".day:not(.outside)"));
      const byLabel = (day: number) => buttons.find((b) => b.textContent?.trim() === String(day));
      expect(byLabel(10)!.disabled).to.be.true;
      expect(byLabel(11)!.disabled).to.be.true;
      expect(byLabel(12)!.disabled).to.be.false;
    });

    it("renders no dots when dayState is unset (backward compatible)", async () => {
      const el = await fixture<FluidCalendar>(html`<fluid-calendar view="2026-06-15"></fluid-calendar>`);
      await elementUpdated(el);
      expect(el.shadowRoot!.querySelectorAll(".dot").length).to.equal(0);
    });
  });
});
