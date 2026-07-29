import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidIntersectionObserver } from "./fluid-intersection-observer.js";

// Reach into the private observer fields for white-box lifecycle assertions.
type Internals = {
  observer: IntersectionObserver | null;
  slotObserver: MutationObserver | null;
  parsedThreshold(): number | number[];
};

const peek = (el: FluidIntersectionObserver): Internals =>
  el as unknown as Internals;

describe("<fluid-intersection-observer>", () => {
  it("renders its slotted children", async () => {
    const el = await fixture<FluidIntersectionObserver>(html`
      <fluid-intersection-observer><div id="t">hi</div></fluid-intersection-observer>
    `);
    await el.updateComplete;
    expect(el.querySelector("#t")).to.not.be.null;
  });

  it("creates an IntersectionObserver and a MutationObserver on connect", async () => {
    const el = await fixture<FluidIntersectionObserver>(html`
      <fluid-intersection-observer><div>hi</div></fluid-intersection-observer>
    `);
    await el.updateComplete;
    expect(peek(el).observer).to.be.instanceOf(IntersectionObserver);
    expect(peek(el).slotObserver).to.be.instanceOf(MutationObserver);
  });

  it("disconnects both observers on disconnectedCallback() (cleanup contract)", async () => {
    const el = await fixture<FluidIntersectionObserver>(html`
      <fluid-intersection-observer><div>hi</div></fluid-intersection-observer>
    `);
    await el.updateComplete;

    const io = peek(el).observer;
    const mo = peek(el).slotObserver;
    expect(io).to.not.be.null;
    expect(mo).to.not.be.null;

    let ioDisconnected = false;
    let moDisconnected = false;
    io!.disconnect = () => {
      ioDisconnected = true;
    };
    mo!.disconnect = () => {
      moDisconnected = true;
    };

    el.remove();

    // disconnectedCallback() must tear both observers down so they stop
    // observing after the element leaves the DOM.
    expect(ioDisconnected).to.equal(true);
    expect(moDisconnected).to.equal(true);
    expect(peek(el).observer).to.be.null;
    expect(peek(el).slotObserver).to.be.null;
  });

  it("fires fluid-intersect with detail.entries when its target intersects", async () => {
    // Capture the callback the component passes to IntersectionObserver so we
    // can invoke it deterministically (the real observer is async and depends
    // on layout/scroll, which is not reliable in a test runner).
    const RealIO = window.IntersectionObserver;
    let captured: IntersectionObserverCallback | null = null;
    window.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        captured = cb;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    } as unknown as typeof IntersectionObserver;

    try {
      const el = await fixture<FluidIntersectionObserver>(html`
        <fluid-intersection-observer><div>hi</div></fluid-intersection-observer>
      `);
      await el.updateComplete;
      expect(captured).to.be.a("function");

      const entries = [
        { isIntersecting: true } as IntersectionObserverEntry
      ];
      setTimeout(() =>
        captured!(entries, {} as IntersectionObserver)
      );

      const ev = await oneEvent(el, "fluid-intersect");
      expect(ev).to.exist;
      expect(ev.detail.entries).to.be.an("array");
      expect(ev.detail.entries[0].isIntersecting).to.equal(true);
    } finally {
      window.IntersectionObserver = RealIO;
    }
  });

  it("does not observe when disabled", async () => {
    const el = await fixture<FluidIntersectionObserver>(html`
      <fluid-intersection-observer disabled><div>hi</div></fluid-intersection-observer>
    `);
    await el.updateComplete;
    expect(peek(el).observer).to.be.null;
    expect(peek(el).slotObserver).to.be.null;
  });

  it("starts observing once disabled is cleared and stops again when re-set", async () => {
    const el = await fixture<FluidIntersectionObserver>(html`
      <fluid-intersection-observer disabled><div>hi</div></fluid-intersection-observer>
    `);
    await el.updateComplete;
    expect(peek(el).observer).to.be.null;

    el.disabled = false;
    await el.updateComplete;
    expect(peek(el).observer).to.be.instanceOf(IntersectionObserver);

    el.disabled = true;
    await el.updateComplete;
    expect(peek(el).observer).to.be.null;
  });

  it("parses a single threshold value", async () => {
    const el = await fixture<FluidIntersectionObserver>(html`
      <fluid-intersection-observer threshold="0.5"><div>hi</div></fluid-intersection-observer>
    `);
    await el.updateComplete;
    expect(peek(el).parsedThreshold()).to.equal(0.5);
  });

  it("parses a comma-separated threshold list", async () => {
    const el = await fixture<FluidIntersectionObserver>(html`
      <fluid-intersection-observer threshold="0, 0.25, 1"><div>hi</div></fluid-intersection-observer>
    `);
    await el.updateComplete;
    expect(peek(el).parsedThreshold()).to.deep.equal([0, 0.25, 1]);
  });
});
