import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidComparison } from "./fluid-comparison.js";

const content = html`
  <div slot="before">Before</div>
  <div slot="after">After</div>
`;

const handleOf = (el: FluidComparison) =>
  el.shadowRoot!.querySelector<HTMLDivElement>(".handle")!;

const press = (el: FluidComparison, key: string, init: KeyboardEventInit = {}) =>
  handleOf(el).dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, composed: true, ...init })
  );

describe("<fluid-comparison>", () => {
  it("renders with the default position", async () => {
    const el = await fixture<FluidComparison>(html`<fluid-comparison>${content}</fluid-comparison>`);
    expect(el.position).to.equal(50);
  });

  it("fires fluid-position-change on ArrowRight and moves 1%", async () => {
    const el = await fixture<FluidComparison>(html`<fluid-comparison>${content}</fluid-comparison>`);
    setTimeout(() => press(el, "ArrowRight"));
    const event = (await oneEvent(el, "fluid-position-change")) as CustomEvent;
    expect(event.detail.position).to.equal(51);
    expect(el.position).to.equal(51);
  });

  it("ArrowLeft moves 1% and Shift moves 10%", async () => {
    const el = await fixture<FluidComparison>(html`<fluid-comparison>${content}</fluid-comparison>`);
    press(el, "ArrowLeft");
    await el.updateComplete;
    expect(el.position).to.equal(49);

    press(el, "ArrowLeft", { shiftKey: true });
    await el.updateComplete;
    expect(el.position).to.equal(39);

    press(el, "ArrowRight", { shiftKey: true });
    await el.updateComplete;
    expect(el.position).to.equal(49);
  });

  it("Home and End snap to 0 and 100", async () => {
    const el = await fixture<FluidComparison>(html`<fluid-comparison>${content}</fluid-comparison>`);
    press(el, "Home");
    await el.updateComplete;
    expect(el.position).to.equal(0);

    press(el, "End");
    await el.updateComplete;
    expect(el.position).to.equal(100);
  });

  it("clamps the position to the 0–100 range", async () => {
    const el = await fixture<FluidComparison>(html`
      <fluid-comparison position="2">${content}</fluid-comparison>
    `);
    // Shift+ArrowLeft from 2 would land at -8; it must clamp at 0.
    press(el, "ArrowLeft", { shiftKey: true });
    await el.updateComplete;
    expect(el.position).to.equal(0);

    el.position = 96;
    await el.updateComplete;
    press(el, "ArrowRight", { shiftKey: true });
    await el.updateComplete;
    expect(el.position).to.equal(100);
  });

  it("does not fire fluid-position-change when the position is unchanged", async () => {
    const el = await fixture<FluidComparison>(html`
      <fluid-comparison position="0">${content}</fluid-comparison>
    `);
    let fired = false;
    el.addEventListener("fluid-position-change", () => (fired = true));
    // ArrowLeft from 0 stays clamped at 0, so no event should fire.
    press(el, "ArrowLeft");
    await el.updateComplete;
    expect(fired).to.be.false;
  });

  it("reflects the position to the attribute", async () => {
    const el = await fixture<FluidComparison>(html`<fluid-comparison>${content}</fluid-comparison>`);
    press(el, "End");
    await el.updateComplete;
    expect(el.getAttribute("position")).to.equal("100");
  });

  it("keeps aria-valuenow in sync with the position", async () => {
    const el = await fixture<FluidComparison>(html`<fluid-comparison>${content}</fluid-comparison>`);
    const handle = handleOf(el);
    expect(handle.getAttribute("aria-valuenow")).to.equal("50");

    press(el, "ArrowRight");
    await el.updateComplete;
    expect(handle.getAttribute("aria-valuenow")).to.equal("51");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidComparison>(html`<fluid-comparison>${content}</fluid-comparison>`);
    await expect(el).to.be.accessible();
  });
});
