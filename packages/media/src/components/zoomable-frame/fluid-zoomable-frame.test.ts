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

function transform(el: FluidZoomableFrame) {
  const content = el.shadowRoot!.querySelector<HTMLElement>(".content")!;
  const matrix = new DOMMatrixReadOnly(getComputedStyle(content).transform);
  return { x: matrix.m41, y: matrix.m42, scale: matrix.m11 };
}

describe("<fluid-zoomable-frame>", () => {
  it("passes an a11y audit with named content and zoom controls", async () => {
    const el = await frame();
    await expect(el).to.be.accessible();
  });

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

  it("uses the configured step for imperative zoom controls", async () => {
    const el = await frame();
    el.step = 0.5;
    el.zoomIn();
    await elementUpdated(el);
    expect(el.scale).to.equal(1.5);
    el.zoomOut();
    await elementUpdated(el);
    expect(el.scale).to.equal(1);
  });

  it("reset restores scale and pan transform", async () => {
    const el = await frame();
    el.zoomIn();
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, clientX: 10, clientY: 10 }));
    el.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 40, clientY: 35 }));
    el.reset();
    await elementUpdated(el);
    expect(el.scale).to.equal(1);
    expect(transform(el)).to.deep.equal({ x: 0, y: 0, scale: 1 });
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
    el.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 50, clientY: 50 }));
    await elementUpdated(el);

    expect(el.scale).to.equal(afterRemove);
    expect(el.hasAttribute("data-dragging")).to.equal(false);
  });

  it("does not cancel or capture pointer presses on shadow control icons", async () => {
    const el = await frame();
    const icon = el.shadowRoot!.querySelector("button svg path")!;
    const event = new PointerEvent("pointerdown", {
      pointerId: 1,
      bubbles: true,
      composed: true,
      cancelable: true
    });
    icon.dispatchEvent(event);
    expect(event.defaultPrevented).to.be.false;
    expect(el.hasAttribute("data-dragging")).to.be.false;
  });

  it("keeps decorative SVG and arrow hit targets on their native buttons", async () => {
    const el = await frame();
    const buttons = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".button")];
    expect(buttons).to.have.length(7);
    for (const button of buttons) {
      const decoration = button.firstElementChild!;
      expect(getComputedStyle(decoration).pointerEvents).to.equal("none");
      const bounds = decoration.getBoundingClientRect();
      expect(bounds.width).to.be.greaterThan(0);
      expect(bounds.height).to.be.greaterThan(0);
      expect(
        el.shadowRoot!.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      ).to.equal(button);
    }
  });

  it("clears an active drag on disconnect and accepts a fresh drag after reconnect", async () => {
    const el = await frame();
    const parent = el.parentElement!;
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1 }));
    expect(el.hasAttribute("data-dragging")).to.be.true;
    el.remove();
    expect(el.hasAttribute("data-dragging")).to.be.false;
    parent.append(el);
    el.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 50 }));
    expect(transform(el)).to.deep.equal({ x: 0, y: 0, scale: 1 });
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 2 }));
    el.dispatchEvent(new PointerEvent("pointermove", { pointerId: 2, clientX: 20 }));
    el.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 2 }));
    expect(el.hasAttribute("data-dragging")).to.be.false;
    expect(transform(el)).to.deep.equal({ x: 20, y: 0, scale: 1 });
  });

  it("ignores secondary-button presses and additional pointers during a drag", async () => {
    const el = await frame();
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, button: 2 }));
    expect(el.hasAttribute("data-dragging")).to.be.false;
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1 }));
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 2, clientX: 100 }));
    el.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 20 }));
    expect(transform(el)).to.deep.equal({ x: 20, y: 0, scale: 1 });
    el.dispatchEvent(new PointerEvent("lostpointercapture", { pointerId: 1 }));
    expect(el.hasAttribute("data-dragging")).to.be.false;
  });

  it("offers named single-pointer pan controls and configurable translated labels", async () => {
    const el = await frame();
    el.panRightLabel = "Naar rechts";
    el.panStep = 25;
    await elementUpdated(el);
    const right = el.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Naar rechts"]')!;
    expect(right).to.exist;
    right.click();
    expect(transform(el)).to.deep.equal({ x: 25, y: 0, scale: 1 });
    el.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Pan up"]')!.click();
    expect(transform(el)).to.deep.equal({ x: 25, y: -25, scale: 1 });
    el.reset();
    expect(transform(el)).to.deep.equal({ x: 0, y: 0, scale: 1 });
  });

  it("takes a caller-supplied name for every control and falls back to the translated one", async () => {
    const el = await frame();
    el.zoomOutLabel = "Uitzoomen";
    el.resetLabel = "Herstellen";
    el.zoomInLabel = "Inzoomen";
    el.panLeftLabel = "Naar links";
    el.panRightLabel = "Naar rechts";
    el.panUpLabel = "Omhoog";
    el.panDownLabel = "Omlaag";
    await elementUpdated(el);
    const labels = () =>
      [...el.shadowRoot!.querySelectorAll("button")].map((button) =>
        button.getAttribute("aria-label")
      );
    expect(labels()).to.deep.equal([
      "Uitzoomen",
      "Herstellen",
      "Inzoomen",
      "Naar links",
      "Naar rechts",
      "Omhoog",
      "Omlaag"
    ]);

    // Clearing an override hands the name back to the built-in dictionary.
    el.zoomOutLabel = null;
    el.resetLabel = null;
    el.zoomInLabel = null;
    el.panLeftLabel = null;
    el.panRightLabel = null;
    el.panUpLabel = null;
    el.panDownLabel = null;
    await elementUpdated(el);
    expect(labels()).to.deep.equal([
      "Zoom out",
      "Reset zoom",
      "Zoom in",
      "Pan left",
      "Pan right",
      "Pan up",
      "Pan down"
    ]);
  });

  it("falls back to safe defaults when zoom and pan settings are unusable", async () => {
    const el = await frame();
    el.minScale = Number.NaN;
    el.maxScale = Number.NaN;
    el.step = 0;
    el.panStep = -10;
    await elementUpdated(el);

    el.zoomIn();
    await elementUpdated(el);
    expect(el.scale).to.equal(1.25); // default step

    el.reset();
    await elementUpdated(el);
    el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".button")[4]!.click();
    expect(transform(el).x).to.equal(40); // default pan distance

    el.scale = -5;
    await elementUpdated(el);
    expect(el.scale).to.equal(0.5); // default minimum

    el.scale = 99;
    await elementUpdated(el);
    expect(el.scale).to.equal(5); // default maximum
  });

  it("ignores a pan request that is not a finite distance", async () => {
    const el = await frame();
    el.panBy(30, 0);
    el.panBy(Number.NaN, 10);
    el.panBy(10, Number.POSITIVE_INFINITY);
    expect(transform(el)).to.deep.equal({ x: 30, y: 0, scale: 1 });
  });

  it("hides the control strip when no-controls is set and still zooms", async () => {
    const el = await fixture<FluidZoomableFrame>(html`
      <fluid-zoomable-frame no-controls style="width: 200px; height: 200px;">
        <img src="a.png" alt="Alpha" />
      </fluid-zoomable-frame>
    `);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[part="controls"]')).to.not.exist;
    expect(el.shadowRoot!.querySelectorAll("button")).to.have.length(0);
    expect(el.shadowRoot!.querySelector('[part="content"]')).to.exist;

    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, cancelable: true }));
    await elementUpdated(el);
    expect(el.scale).to.be.greaterThan(1);
  });

  it("releases the captured pointer when a drag ends", async () => {
    const el = await frame();
    // Synthetic pointer events never acquire a real capture, so the platform
    // side of the contract is stubbed to observe what the component asks for.
    const released: number[] = [];
    el.hasPointerCapture = () => true;
    el.releasePointerCapture = (pointerId: number) => released.push(pointerId);

    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 7 }));
    el.dispatchEvent(new PointerEvent("pointerup", { pointerId: 7 }));
    expect(released).to.deep.equal([7]);
    expect(el.hasAttribute("data-dragging")).to.be.false;
  });

  it("clears drag state on disconnect even when the capture id is already stale", async () => {
    const el = await frame();
    el.hasPointerCapture = () => true;
    el.releasePointerCapture = () => {
      throw new DOMException("No active pointer", "NotFoundError");
    };

    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 3 }));
    expect(el.hasAttribute("data-dragging")).to.be.true;
    el.remove();
    expect(el.hasAttribute("data-dragging")).to.be.false;
  });

  it("normalizes direct scale changes and keeps reset inside valid configured bounds", async () => {
    const el = await frame();
    el.minScale = 2;
    el.maxScale = 4;
    el.scale = 100;
    await elementUpdated(el);
    expect(el.scale).to.equal(4);
    el.reset();
    await elementUpdated(el);
    expect(el.scale).to.equal(2);
    el.scale = NaN;
    await elementUpdated(el);
    expect(el.scale).to.equal(2);
    expect(el.shadowRoot!.querySelector<HTMLElement>(".content")!.style.transform).not.to.contain(
      "NaN"
    );
  });
});
