import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidTag } from "./fluid-tag.js";

describe("<fluid-tag>", () => {
  it("renders the slotted text", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag>Beta</fluid-tag>`);
    expect(el.textContent?.trim()).to.equal("Beta");
  });

  it("does not show the remove button by default", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag>Beta</fluid-tag>`);
    expect(el.shadowRoot!.querySelector(".remove")).to.be.null;
  });

  it("renders the remove button when removable", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Beta</fluid-tag>`);
    expect(el.shadowRoot!.querySelector(".remove")).to.exist;
  });

  it("fires fluid-remove on remove click", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Beta</fluid-tag>`);
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!;
    setTimeout(() => button.click());
    const event = await oneEvent(el, "fluid-remove");
    expect(event).to.exist;
  });

  it("does not fire fluid-remove when disabled", async () => {
    const el = await fixture<FluidTag>(
      html`<fluid-tag removable disabled>Beta</fluid-tag>`
    );
    let fired = false;
    el.addEventListener("fluid-remove", () => (fired = true));
    el.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!.click();
    expect(fired).to.be.false;
  });

  it("the remove button respects --fluid-target-min (hit area)", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Beta</fluid-tag>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!;
    const rect = button.getBoundingClientRect();
    expect(rect.width).to.be.greaterThanOrEqual(44);
    expect(rect.height).to.be.greaterThanOrEqual(44);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Removable</fluid-tag>`);
    await expect(el).to.be.accessible();
  });
});
