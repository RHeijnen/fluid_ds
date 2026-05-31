import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidAnimation } from "./fluid-animation.js";

describe("<fluid-animation>", () => {
  it("renders its slotted target", async () => {
    const el = await fixture<FluidAnimation>(html`
      <fluid-animation><div id="t">hi</div></fluid-animation>
    `);
    await el.updateComplete;
    expect(el.querySelector("#t")).to.not.be.null;
  });

  it("animates the first child via a named preset on start()", async () => {
    const el = await fixture<FluidAnimation>(html`
      <fluid-animation name="fadeIn" duration="50"><div>hi</div></fluid-animation>
    `);
    await el.updateComplete;
    setTimeout(() => el.start());
    await oneEvent(el, "fluid-start");
    const target = el.firstElementChild as HTMLElement;
    expect(target.getAnimations().length).to.be.greaterThan(0);
  });

  it("fires fluid-finish when the animation completes", async () => {
    const el = await fixture<FluidAnimation>(html`
      <fluid-animation name="fadeIn" duration="30"><div>hi</div></fluid-animation>
    `);
    await el.updateComplete;
    setTimeout(() => el.start());
    const ev = await oneEvent(el, "fluid-finish");
    expect(ev).to.exist;
  });
});
