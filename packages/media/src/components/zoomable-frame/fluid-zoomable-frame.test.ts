import { expect, fixture, html, elementUpdated, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidZoomableFrame } from "./fluid-zoomable-frame.js";

async function frame(): Promise<FluidZoomableFrame> {
  const el = await fixture<FluidZoomableFrame>(html`
    <fluid-zoomable-frame style="width: 200px; height: 200px;">
      <img src="a.png" alt="Alpha" />
    </fluid-zoomable-frame>
  `);
  await elementUpdated(el);
  return el;
}

describe("<fluid-zoomable-frame>", () => {
  it("clamps scale to the configured min/max bounds", async () => {
    const el = await frame();
    el.minScale = 0.5;
    el.maxScale = 2;

    el.scale = 10;
    el.zoomIn(); // forces a clampScale pass
    expect(el.scale).to.be.at.most(2);

    el.scale = 0.01;
    el.zoomOut();
    expect(el.scale).to.be.at.least(0.5);
  });

  it("emits fluid-zoom when the scale changes", async () => {
    const el = await frame();
    setTimeout(() => el.zoomIn());
    const ev = await oneEvent(el, "fluid-zoom");
    expect(ev.detail.scale).to.equal(el.scale);
    expect(ev.detail.scale).to.be.greaterThan(1);
  });

  it("removes wheel/pointer handlers on disconnect", async () => {
    const el = await frame();

    // Sanity: a wheel event mutates scale while connected.
    const before = el.scale;
    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, cancelable: true }));
    await elementUpdated(el);
    expect(el.scale).to.not.equal(before);

    const afterRemove = el.scale;
    el.remove();

    // After removal the listeners must be gone: dispatching does nothing.
    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, cancelable: true }));
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1 }));
    el.dispatchEvent(
      new PointerEvent("pointermove", { pointerId: 1, clientX: 50, clientY: 50 })
    );
    await elementUpdated(el);

    expect(el.scale).to.equal(afterRemove);
    expect(el.hasAttribute("data-dragging")).to.equal(false);
  });
});
