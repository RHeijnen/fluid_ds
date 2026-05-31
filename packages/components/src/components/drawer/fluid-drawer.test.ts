import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidDrawer } from "./fluid-drawer.js";

describe("<fluid-drawer>", () => {
  it("renders closed by default", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x">Body</fluid-drawer>
    `);
    expect(el.open).to.be.false;
  });

  it("opens via show()", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x">Body</fluid-drawer>
    `);
    setTimeout(() => el.show());
    await oneEvent(el, "fluid-show");
    expect(el.open).to.be.true;
  });

  it("supports placement attribute", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x" placement="start">Body</fluid-drawer>
    `);
    expect(el.placement).to.equal("start");
  });

  it("fires fluid-hide on close", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x" open>Body</fluid-drawer>
    `);
    await el.updateComplete;
    setTimeout(() => el.hide());
    const event = await oneEvent(el, "fluid-hide");
    expect(event).to.exist;
  });

  /* Rework: override ladder + AAA target floor. */

  it("panel background reads the --fluid-drawer-* override ladder", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x" open>Body</fluid-drawer>
    `);
    el.style.setProperty("--fluid-drawer-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const panel = el.shadowRoot!.querySelector<HTMLElement>(".panel")!;
    expect(getComputedStyle(panel).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the close button respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x" open>Body</fluid-drawer>
    `);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const close = el.shadowRoot!.querySelector<HTMLElement>(".close")!;
    expect(close.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
