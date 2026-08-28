import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidAnimation } from "./fluid-animation.js";

describe("<fluid-animation>", () => {
  it("passes an a11y audit with slotted content", async () => {
    const el = await fixture<FluidAnimation>(html`
      <fluid-animation><p>Animated announcement</p></fluid-animation>
    `);
    await expect(el).to.be.accessible();
  });

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

  it("cancels the running animation when removed from the DOM", async () => {
    const el = await fixture<FluidAnimation>(html`
      <fluid-animation name="spin" duration="1000" iterations="Infinity"><div>hi</div></fluid-animation>
    `);
    await el.updateComplete;
    const target = el.firstElementChild as HTMLElement;
    setTimeout(() => el.start());
    await oneEvent(el, "fluid-start");
    expect(target.getAnimations().length).to.be.greaterThan(0);

    el.remove();

    // disconnectedCallback() must cancel the in-flight WAAPI animation so it
    // does not keep ticking after the element leaves the DOM.
    expect(target.getAnimations().length).to.equal(0);
  });

  describe("prefers-reduced-motion", () => {
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
      window.matchMedia = ((query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false
        }) as unknown as MediaQueryList) as typeof window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("does not start an indefinite animation under reduced motion", async () => {
      const el = await fixture<FluidAnimation>(html`
        <fluid-animation name="spin" duration="1000" iterations="Infinity"><div>hi</div></fluid-animation>
      `);
      await el.updateComplete;
      const target = el.firstElementChild as HTMLElement;
      setTimeout(() => el.start());
      // start + finish both fire synchronously: it jumps to the end state.
      await oneEvent(el, "fluid-finish");
      const running = target.getAnimations().filter((a) => a.playState === "running");
      expect(running.length).to.equal(0);
    });

    it("runs normally when reduced motion is not respected", async () => {
      const el = await fixture<FluidAnimation>(html`
        <fluid-animation name="fadeIn" duration="50"><div>hi</div></fluid-animation>
      `);
      el.ignoreReducedMotion = true;
      await el.updateComplete;
      const target = el.firstElementChild as HTMLElement;
      setTimeout(() => el.start());
      await oneEvent(el, "fluid-start");
      const running = target.getAnimations().filter((a) => a.playState === "running");
      expect(running.length).to.be.greaterThan(0);
    });
  });
});
