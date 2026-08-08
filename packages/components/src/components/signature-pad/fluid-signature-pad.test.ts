import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidSignaturePad } from "./fluid-signature-pad.js";

function draw(
  pad: FluidSignaturePad,
  points: Array<[number, number]>
): void {
  const canvas = pad.shadowRoot!.querySelector("canvas")!;
  const rect = canvas.getBoundingClientRect();
  const at = ([x, y]: [number, number], type: string) =>
    new PointerEvent(type, {
      clientX: rect.left + x,
      clientY: rect.top + y,
      pointerId: 1,
      pressure: 0.5,
      bubbles: true
    });
  canvas.dispatchEvent(at(points[0], "pointerdown"));
  for (const point of points.slice(1)) canvas.dispatchEvent(at(point, "pointermove"));
  canvas.dispatchEvent(at(points[points.length - 1], "pointerup"));
}

describe("<fluid-signature-pad>", () => {
  it("reports ink after a stroke and exports it", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad aria-label="Signature"></fluid-signature-pad>
    `);
    expect(pad.signed).to.equal(false);
    expect(pad.toDataURL()).to.equal(undefined);

    const change = oneEvent(pad, "fluid-change");
    draw(pad, [[20, 40], [60, 60], [110, 35]]);
    const event = await change;
    expect(event.detail).to.deep.equal({ signed: true, strokes: 1 });
    expect(pad.signed).to.equal(true);
    expect(pad.toDataURL()).to.match(/^data:image\/png/);
  });

  it("undoes one stroke and clears the rest", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad></fluid-signature-pad>
    `);
    draw(pad, [[20, 40], [60, 60]]);
    draw(pad, [[30, 70], [80, 20]]);
    expect(pad.signed).to.equal(true);

    pad.undo();
    expect(pad.signed).to.equal(true);
    pad.undo();
    expect(pad.signed).to.equal(false);

    draw(pad, [[20, 40], [60, 60]]);
    pad.clear();
    expect(pad.signed).to.equal(false);
    expect(pad.toDataURL()).to.equal(undefined);
  });

  it("keeps the ink through a resize", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div style="width: 400px"><fluid-signature-pad></fluid-signature-pad></div>
    `);
    const pad = wrapper.querySelector("fluid-signature-pad")!;
    draw(pad, [[20, 40], [120, 60], [200, 30]]);
    const before = pad.toDataURL();
    expect(before).to.match(/^data:image\/png/);

    wrapper.style.width = "600px";
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    // Still signed, still exportable: the strokes survived the resize because
    // the canvas is a rendering of them, not the source of truth.
    expect(pad.signed).to.equal(true);
    expect(pad.toDataURL()).to.match(/^data:image\/png/);
  });

  it("ignores the pointer while disabled", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad disabled></fluid-signature-pad>
    `);
    draw(pad, [[20, 40], [60, 60]]);
    expect(pad.signed).to.equal(false);
  });
});
