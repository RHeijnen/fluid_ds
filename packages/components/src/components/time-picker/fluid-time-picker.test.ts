import { expect, fixture, html, oneEvent, aTimeout, elementUpdated } from "@open-wc/testing";
import "./define.js";
import type { FluidTimePicker } from "./fluid-time-picker.js";

describe("<fluid-time-picker>", () => {
  it("renders closed by default", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker aria-label="Time"></fluid-time-picker>`
    );
    expect(el.open).to.be.false;
  });

  it("is form-associated: submits the canonical 24h value", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-time-picker name="start" value="09:30"></fluid-time-picker>
      </form>
    `);
    const el = form.querySelector<FluidTimePicker>("fluid-time-picker")!;
    await elementUpdated(el);
    expect(new FormData(form).get("start")).to.equal("09:30");
  });

  it("12h format shows a 12-hour label but keeps the 24h form value", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-time-picker name="t" value="13:30" format="12h"></fluid-time-picker>
      </form>
    `);
    const el = form.querySelector<FluidTimePicker>("fluid-time-picker")!;
    await elementUpdated(el);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.value).to.equal("1:30 PM");
    expect(new FormData(form).get("t")).to.equal("13:30");
  });

  it("clicking the trigger opens the listbox", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker aria-label="Time"></fluid-time-picker>`
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!.click();
    await elementUpdated(el);
    expect(el.open).to.be.true;
  });

  it("generates options from min/max/step", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker min="09:00" max="10:00" step="30"></fluid-time-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const options = el.shadowRoot!.querySelectorAll('[role="option"]');
    // 09:00, 09:30, 10:00
    expect(options.length).to.equal(3);
    expect(options[0]!.textContent!.trim()).to.equal("09:00");
    expect(options[2]!.textContent!.trim()).to.equal("10:00");
  });

  it("selecting an option commits the value, fires fluid-change, and closes", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker min="09:00" max="10:00" step="30"></fluid-time-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const option = Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (o) => o.textContent?.trim() === "09:30"
    )!;
    setTimeout(() => option.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("09:30");
    expect(el.value).to.equal("09:30");
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("ArrowDown opens, then moves the active option, Enter commits", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker min="09:00" max="10:00" step="30"></fluid-time-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    expect(el.open).to.be.true;
    // First ArrowDown opened + seeded active at index 0; move to index 1.
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    setTimeout(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("09:30");
  });

  it("type-to-filter narrows the option list", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker min="09:00" max="11:00" step="60"></fluid-time-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.value = "10";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await elementUpdated(el);
    await aTimeout(20);
    const options = el.shadowRoot!.querySelectorAll('[role="option"]');
    expect(options.length).to.equal(1);
    expect(options[0]!.textContent!.trim()).to.equal("10:00");
  });

  it("Escape closes the listbox", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker value="09:30"></fluid-time-picker>`
    );
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("sets aria-expanded and aria-controls on the combobox", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker aria-label="Time"></fluid-time-picker>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(input.getAttribute("role")).to.equal("combobox");
    expect(input.getAttribute("aria-expanded")).to.equal("false");
    const listbox = el.shadowRoot!.querySelector('[role="listbox"]')!;
    expect(input.getAttribute("aria-controls")).to.equal(listbox.id);
    el.open = true;
    await elementUpdated(el);
    expect(input.getAttribute("aria-expanded")).to.equal("true");
  });

  it("required + empty reports valueMissing", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker name="t" required></fluid-time-picker>`
    );
    await elementUpdated(el);
    expect(el.checkValidity()).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
  });

  it("passes a11y audit (closed)", async () => {
    const el = await fixture<FluidTimePicker>(
      html`<fluid-time-picker aria-label="Time"></fluid-time-picker>`
    );
    await elementUpdated(el);
    await expect(el).to.be.accessible();
  });

  it("passes a11y audit (open)", async () => {
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
        <fluid-time-picker value="09:30" aria-label="Time" min="09:00" max="11:00" step="30"></fluid-time-picker>
      </div>
    `);
    const el = host.querySelector<FluidTimePicker>("fluid-time-picker")!;
    el.open = true;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
