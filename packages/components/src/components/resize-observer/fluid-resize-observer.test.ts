import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidResizeObserver } from "./fluid-resize-observer.js";

// Reach into the private observer fields for white-box lifecycle assertions.
type Internals = {
  observer: ResizeObserver | null;
  slotObserver: MutationObserver | null;
  box: ResizeObserverBoxOptions;
};

const peek = (el: FluidResizeObserver): Internals =>
  el as unknown as Internals;

describe("<fluid-resize-observer>", () => {
  it("renders its slotted children", async () => {
    const el = await fixture<FluidResizeObserver>(html`
      <fluid-resize-observer><div id="t">hi</div></fluid-resize-observer>
    `);
    await el.updateComplete;
    expect(el.querySelector("#t")).to.not.be.null;
  });

  it("creates a ResizeObserver and a MutationObserver on connect", async () => {
    const el = await fixture<FluidResizeObserver>(html`
      <fluid-resize-observer><div>hi</div></fluid-resize-observer>
    `);
    await el.updateComplete;
    expect(peek(el).observer).to.be.instanceOf(ResizeObserver);
    expect(peek(el).slotObserver).to.be.instanceOf(MutationObserver);
  });

  it("disconnects both observers on disconnectedCallback() (cleanup contract)", async () => {
    const el = await fixture<FluidResizeObserver>(html`
      <fluid-resize-observer><div>hi</div></fluid-resize-observer>
    `);
    await el.updateComplete;

    const ro = peek(el).observer;
    const mo = peek(el).slotObserver;
    expect(ro).to.not.be.null;
    expect(mo).to.not.be.null;

    let roDisconnected = false;
    let moDisconnected = false;
    ro!.disconnect = () => {
      roDisconnected = true;
    };
    mo!.disconnect = () => {
      moDisconnected = true;
    };

    el.remove();

    // disconnectedCallback() must tear both observers down so they stop
    // observing after the element leaves the DOM (no leaked ResizeObserver).
    expect(roDisconnected).to.equal(true);
    expect(moDisconnected).to.equal(true);
    expect(peek(el).observer).to.be.null;
    expect(peek(el).slotObserver).to.be.null;
  });

  it("spies ResizeObserver.prototype.disconnect to prove stop() runs on removal", async () => {
    // Belt-and-braces regression guard: assert the real prototype method is
    // invoked when the element leaves the DOM, so the teardown in stop() can
    // never silently regress.
    const proto = ResizeObserver.prototype;
    const original = proto.disconnect;
    let disconnectCalls = 0;
    proto.disconnect = function (this: ResizeObserver, ...args: []) {
      disconnectCalls += 1;
      return original.apply(this, args);
    };

    try {
      const el = await fixture<FluidResizeObserver>(html`
        <fluid-resize-observer><div>hi</div></fluid-resize-observer>
      `);
      await el.updateComplete;

      const before = disconnectCalls;
      el.remove();
      expect(disconnectCalls).to.be.greaterThan(before);
    } finally {
      proto.disconnect = original;
    }
  });

  it("fires fluid-resize with detail.entries when a child resizes", async () => {
    // Capture the callback the component passes to ResizeObserver so we can
    // invoke it deterministically (the real observer is async and depends on
    // layout, which is not reliable in a test runner).
    const RealRO = window.ResizeObserver;
    let captured: ResizeObserverCallback | null = null;
    window.ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        captured = cb;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;

    try {
      const el = await fixture<FluidResizeObserver>(html`
        <fluid-resize-observer><div>hi</div></fluid-resize-observer>
      `);
      await el.updateComplete;
      expect(captured).to.be.a("function");

      const entries = [
        { contentRect: { width: 100, height: 50 } } as ResizeObserverEntry
      ];
      setTimeout(() =>
        captured!(entries, {} as ResizeObserver)
      );

      const ev = await oneEvent(el, "fluid-resize");
      expect(ev).to.exist;
      expect(ev.detail.entries).to.be.an("array");
      expect(ev.detail.entries[0].contentRect.width).to.equal(100);
    } finally {
      window.ResizeObserver = RealRO;
    }
  });

  it("honors the box attribute when observing children", async () => {
    // Capture the box option passed to observe() to prove the attribute is
    // forwarded to ResizeObserver.observe().
    const RealRO = window.ResizeObserver;
    const observeCalls: ResizeObserverOptions[] = [];
    window.ResizeObserver = class {
      constructor(_cb: ResizeObserverCallback) {}
      observe(_target: Element, options?: ResizeObserverOptions): void {
        observeCalls.push(options ?? {});
      }
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;

    try {
      const el = await fixture<FluidResizeObserver>(html`
        <fluid-resize-observer box="border-box"><div>hi</div></fluid-resize-observer>
      `);
      await el.updateComplete;
      expect(el.box).to.equal("border-box");
      expect(observeCalls.length).to.be.greaterThan(0);
      expect(observeCalls[0].box).to.equal("border-box");
    } finally {
      window.ResizeObserver = RealRO;
    }
  });

  it("does not observe when disabled", async () => {
    const el = await fixture<FluidResizeObserver>(html`
      <fluid-resize-observer disabled><div>hi</div></fluid-resize-observer>
    `);
    await el.updateComplete;
    expect(peek(el).observer).to.be.null;
    expect(peek(el).slotObserver).to.be.null;
  });

  it("starts observing once disabled is cleared and stops again when re-set", async () => {
    const el = await fixture<FluidResizeObserver>(html`
      <fluid-resize-observer disabled><div>hi</div></fluid-resize-observer>
    `);
    await el.updateComplete;
    expect(peek(el).observer).to.be.null;

    el.disabled = false;
    await el.updateComplete;
    expect(peek(el).observer).to.be.instanceOf(ResizeObserver);

    el.disabled = true;
    await el.updateComplete;
    expect(peek(el).observer).to.be.null;
  });
});
