import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidSelect } from "./fluid-select.js";

const sampleOptions = html`
  <fluid-option value="apple">Apple</fluid-option>
  <fluid-option value="banana">Banana</fluid-option>
  <fluid-option value="cherry" disabled>Cherry</fluid-option>
  <fluid-option value="date">Date</fluid-option>
`;

describe("<fluid-select>", () => {
  it("renders closed by default", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    expect(el.open).to.be.false;
    expect(el.shadowRoot!.querySelector(".trigger")!.getAttribute("aria-expanded")).to.equal(
      "false"
    );
  });

  it("shows the placeholder when nothing is selected", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select placeholder="Pick one" aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    expect(el.shadowRoot!.querySelector(".label")?.textContent?.trim()).to.equal("Pick one");
  });

  it("shows the selected option label when value is set", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select value="banana" aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".label")?.textContent?.trim()).to.equal("Banana");
  });

  it("opens on click", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!.click();
    await el.updateComplete;
    expect(el.open).to.be.true;
  });

  it("selects an option by clicking it", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.open = true;
    await el.updateComplete;
    const banana = el.querySelector<HTMLElement>('fluid-option[value="banana"]')!;
    setTimeout(() => banana.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("banana");
    expect(el.value).to.equal("banana");
    expect(el.open).to.be.false;
  });

  it("keyboard: ArrowDown opens, Enter selects", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.focus();
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.true;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("banana");
  });

  it("keyboard: Escape closes", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.open = true;
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.false;
  });

  it("skips disabled options when navigating", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit" value="banana">${sampleOptions}</fluid-select>
    `);
    el.open = true;
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    // banana → date (skipping cherry which is disabled)
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    const active = el.querySelector<HTMLElement>("fluid-option[active]");
    expect(active?.getAttribute("value")).to.equal("date");
  });

  it("type-ahead jumps to matching option", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    el.focus();
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.true;
    await aTimeout(10);
    const active = el.querySelector<HTMLElement>("fluid-option[active]");
    expect(active?.getAttribute("value")).to.equal("date");
  });

  it("closes when clicking outside", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div>
        <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
        <span class="outside">outside</span>
      </div>
    `);
    const el = wrapper.querySelector<FluidSelect>("fluid-select")!;
    el.open = true;
    await el.updateComplete;
    wrapper.querySelector<HTMLElement>(".outside")!.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true })
    );
    await el.updateComplete;
    expect(el.open).to.be.false;
  });

  it("participates in form submission", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-select name="fruit" value="apple" aria-label="Fruit">${sampleOptions}</fluid-select>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("fruit")).to.equal("apple");
  });

  it("reports invalid when required and empty", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select required aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
  });

  it("passes a11y audit (closed)", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">${sampleOptions}</fluid-select>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("trigger background reads the --fluid-select-* override ladder", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select aria-label="x">${sampleOptions}</fluid-select>
    `);
    el.style.setProperty("--fluid-select-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLElement>(".trigger")!;
    expect(getComputedStyle(trigger).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("trigger min-height respects --fluid-target-min (AAA scaling)", async () => {
    const el = await fixture<FluidSelect>(html`
      <fluid-select size="sm" aria-label="x">${sampleOptions}</fluid-select>
    `);
    el.style.setProperty("--fluid-target-min", "60px");
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector<HTMLElement>(".trigger")!;
    expect(trigger.getBoundingClientRect().height).to.be.greaterThanOrEqual(60);
  });
});
