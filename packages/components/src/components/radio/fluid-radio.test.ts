import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidRadioGroup } from "./fluid-radio-group.js";
import type { FluidRadio } from "./fluid-radio.js";

describe("<fluid-radio-group>", () => {
  it("selects the radio matching value", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size" value="md">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md">Medium</fluid-radio>
        <fluid-radio value="lg">Large</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    const checked = el.querySelectorAll<HTMLElement>("fluid-radio[checked]");
    expect(checked.length).to.equal(1);
    expect(checked[0]!.getAttribute("value")).to.equal("md");
  });

  it("clicking a radio updates value and fires fluid-change", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md">Medium</fluid-radio>
      </fluid-radio-group>
    `);
    const md = el.querySelector<HTMLElement>('fluid-radio[value="md"]')!;
    setTimeout(() => md.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("md");
    expect(el.value).to.equal("md");
  });

  it("ArrowDown moves selection to the next radio", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size" value="sm">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md">Medium</fluid-radio>
        <fluid-radio value="lg">Large</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    el.querySelector<HTMLElement>('fluid-radio[value="sm"]')!.focus();
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("md");
  });

  it("skips disabled radios", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size" value="sm">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md" disabled>Medium</fluid-radio>
        <fluid-radio value="lg">Large</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    el.querySelector<HTMLElement>('fluid-radio[value="sm"]')!.focus();
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("lg");
  });

  it("submits its value with a form", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-radio-group name="size" value="md" aria-label="Size">
          <fluid-radio value="sm">S</fluid-radio>
          <fluid-radio value="md">M</fluid-radio>
        </fluid-radio-group>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("size")).to.equal("md");
  });

  it("reports invalid when required and no selection", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group required aria-label="Size">
        <fluid-radio value="a">A</fluid-radio>
        <fluid-radio value="b">B</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidRadioGroup>(html`
      <fluid-radio-group aria-label="Size" value="md">
        <fluid-radio value="sm">Small</fluid-radio>
        <fluid-radio value="md">Medium</fluid-radio>
      </fluid-radio-group>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("checked accent reads the --fluid-radio-* override ladder", async () => {
    const el = await fixture<FluidRadio>(html`<fluid-radio checked value="x">x</fluid-radio>`);
    el.style.setProperty("--fluid-radio-accent", "rgb(1, 2, 3)");
    await el.updateComplete;
    const control = el.shadowRoot!.querySelector<HTMLElement>(".control")!;
    expect(getComputedStyle(control).borderColor).to.equal("rgb(1, 2, 3)");
  });

  it("the clickable target respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidRadio>(html`<fluid-radio value="x">x</fluid-radio>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
