import { expect, fixture, html } from "@open-wc/testing";
import {
  computePosition,
  offset,
  flip,
  shift,
  arrow,
  size,
  getOppositePlacement,
  type Rect
} from "./position.js";

/** Stub an element's measured rect (and, for the floating element, its
 *  offset dimensions) so the geometry is deterministic regardless of layout. */
function stubRect(el: HTMLElement, rect: Rect): void {
  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.y,
      left: rect.x,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height,
      toJSON() {
        return rect;
      }
    })
  });
  Object.defineProperty(el, "offsetWidth", { configurable: true, value: rect.width });
  Object.defineProperty(el, "offsetHeight", { configurable: true, value: rect.height });
}

async function elements(): Promise<{ ref: HTMLElement; float: HTMLElement }> {
  const ref = await fixture<HTMLElement>(html`<div></div>`);
  const float = await fixture<HTMLElement>(html`<div></div>`);
  return { ref, float };
}

describe("position: computeCoordsFromPlacement", () => {
  it("places on each side (fixed strategy, no middleware)", async () => {
    const { ref, float } = await elements();
    stubRect(ref, { x: 100, y: 100, width: 50, height: 20 });
    stubRect(float, { x: 0, y: 0, width: 80, height: 40 });

    const bottom = await computePosition(ref, float, { placement: "bottom", strategy: "fixed" });
    expect(bottom).to.include({ x: 85, y: 120, placement: "bottom" });

    const top = await computePosition(ref, float, { placement: "top", strategy: "fixed" });
    expect(top).to.include({ x: 85, y: 60 });

    const right = await computePosition(ref, float, { placement: "right", strategy: "fixed" });
    expect(right).to.include({ x: 150, y: 90 });

    const left = await computePosition(ref, float, { placement: "left", strategy: "fixed" });
    expect(left).to.include({ x: 20, y: 90 });
  });

  it("honors -start / -end alignment", async () => {
    const { ref, float } = await elements();
    stubRect(ref, { x: 100, y: 100, width: 50, height: 20 });
    stubRect(float, { x: 0, y: 0, width: 80, height: 40 });

    const start = await computePosition(ref, float, {
      placement: "bottom-start",
      strategy: "fixed"
    });
    expect(start).to.include({ x: 100, y: 120 });

    const end = await computePosition(ref, float, { placement: "bottom-end", strategy: "fixed" });
    expect(end).to.include({ x: 70, y: 120 });
  });

  it("resolves horizontal start and end logically for RTL references", async () => {
    const { ref, float } = await elements();
    ref.dir = "rtl";
    stubRect(ref, { x: 100, y: 100, width: 50, height: 20 });
    stubRect(float, { x: 0, y: 0, width: 80, height: 40 });

    const start = await computePosition(ref, float, {
      placement: "bottom-start",
      strategy: "fixed"
    });
    expect(start).to.include({ x: 70, y: 120 });

    const end = await computePosition(ref, float, { placement: "bottom-end", strategy: "fixed" });
    expect(end).to.include({ x: 100, y: 120 });

    const leftStart = await computePosition(ref, float, {
      placement: "left-start",
      strategy: "fixed"
    });
    expect(leftStart).to.include({ x: 20, y: 100 });
  });
});

describe("position: middleware", () => {
  it("offset() pushes along the main axis", async () => {
    const { ref, float } = await elements();
    stubRect(ref, { x: 100, y: 100, width: 50, height: 20 });
    stubRect(float, { x: 0, y: 0, width: 80, height: 40 });
    const res = await computePosition(ref, float, {
      placement: "bottom",
      strategy: "fixed",
      middleware: [offset(8)]
    });
    expect(res.y).to.equal(128);
  });

  it("flip() swaps to the opposite side when the preferred side overflows", async () => {
    const { ref, float } = await elements();
    // Reference hugging the top of the viewport: a `top` placement overflows.
    stubRect(ref, { x: 100, y: 4, width: 50, height: 20 });
    stubRect(float, { x: 0, y: 0, width: 80, height: 40 });
    const res = await computePosition(ref, float, {
      placement: "top",
      strategy: "fixed",
      middleware: [flip()]
    });
    expect(res.placement).to.equal("bottom");
    expect(res.y).to.equal(24); // ref.y + ref.height
  });

  it("shift() clamps the cross axis into the viewport", async () => {
    const { ref, float } = await elements();
    // Reference at the far left: the centered floating element would overflow.
    stubRect(ref, { x: 2, y: 100, width: 50, height: 20 });
    stubRect(float, { x: 0, y: 0, width: 80, height: 40 });
    const res = await computePosition(ref, float, {
      placement: "bottom",
      strategy: "fixed",
      middleware: [shift({ padding: 8 })]
    });
    expect(res.x).to.equal(8); // clamped to the left padding
  });

  it("arrow() centers on the reference, clamped to the floating box", async () => {
    const { ref, float } = await elements();
    const arrowEl = await fixture<HTMLElement>(html`<div></div>`);
    stubRect(ref, { x: 100, y: 100, width: 50, height: 20 });
    stubRect(float, { x: 0, y: 0, width: 80, height: 40 });
    stubRect(arrowEl, { x: 0, y: 0, width: 10, height: 10 });
    const res = await computePosition(ref, float, {
      placement: "bottom",
      strategy: "fixed",
      middleware: [arrow({ element: arrowEl })]
    });
    // ref center x = 125; floating x = 85; arrow half = 5 -> 125 - 85 - 5 = 35.
    expect(res.middlewareData.arrow?.x).to.equal(35);
  });

  it("size() reports the available space to its apply callback", async () => {
    const { ref, float } = await elements();
    stubRect(ref, { x: 100, y: 100, width: 50, height: 20 });
    stubRect(float, { x: 0, y: 0, width: 80, height: 40 });
    let captured = { availableWidth: -1, availableHeight: -1 };
    await computePosition(ref, float, {
      placement: "bottom",
      strategy: "fixed",
      middleware: [size({ apply: (a) => (captured = a) })]
    });
    expect(captured.availableWidth).to.be.greaterThan(0);
    expect(captured.availableHeight).to.be.greaterThan(0);
  });

  it("size() hands the live elements to apply, the way match-width consumers need", async () => {
    // Regression: select/popup/typeahead set the floating element's width from
    // apply({ elements }); omitting elements made every apply throw and the
    // whole computePosition reject.
    const { ref, float } = await elements();
    stubRect(ref, { x: 100, y: 100, width: 50, height: 20 });
    stubRect(float, { x: 0, y: 0, width: 80, height: 40 });
    let seen: { reference: Element; floating: HTMLElement } | undefined;
    await computePosition(ref, float, {
      placement: "bottom",
      strategy: "fixed",
      middleware: [size({ apply: ({ elements: els }) => (seen = els) })]
    });
    expect(seen?.reference).to.equal(ref);
    expect(seen?.floating).to.equal(float);
  });

  it("offset() accepts the object form with mainAxis and crossAxis skidding", async () => {
    // Regression: popover/popup pass { mainAxis, crossAxis }; the number-only
    // implementation multiplied an object and produced NaN coordinates.
    const { ref, float } = await elements();
    stubRect(ref, { x: 300, y: 200, width: 100, height: 30 });
    stubRect(float, { x: 0, y: 0, width: 120, height: 40 });
    const res = await computePosition(ref, float, {
      placement: "bottom",
      strategy: "fixed",
      middleware: [offset({ mainAxis: 10, crossAxis: 6 })]
    });
    expect(res.y).to.equal(240); // 200 + 30 + 10
    expect(res.x).to.equal(296); // 300 + (100 - 120) / 2 + 6
  });
});

describe("position: helpers", () => {
  it("getOppositePlacement flips the side, keeps the alignment", () => {
    expect(getOppositePlacement("top")).to.equal("bottom");
    expect(getOppositePlacement("left-start")).to.equal("right-start");
    expect(getOppositePlacement("bottom-end")).to.equal("top-end");
  });
});
