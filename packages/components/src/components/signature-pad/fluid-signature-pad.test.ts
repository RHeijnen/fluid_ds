import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import { sendMouse, resetMouse } from "@web/test-runner-commands";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidSignaturePad } from "./fluid-signature-pad.js";

async function drawWithNativeMouse(
  pad: FluidSignaturePad,
  points: Array<[number, number]>
): Promise<void> {
  const canvas = pad.shadowRoot!.querySelector("canvas")!;
  canvas.scrollIntoView({ block: "center" });
  const rect = canvas.getBoundingClientRect();
  const at = ([x, y]: [number, number]): [number, number] => [
    Math.round(rect.left + x),
    Math.round(rect.top + y)
  ];
  const events: PointerEvent[] = [];
  let captured = false;
  const record = (event: PointerEvent) => {
    if (event.type !== "pointermove" || event.buttons === 1) events.push(event);
    if (event.type === "pointerdown") captured = canvas.hasPointerCapture(event.pointerId);
  };
  const types = ["pointerdown", "pointermove", "pointerup"] as const;
  for (const type of types) canvas.addEventListener(type, record);
  try {
    await sendMouse({ type: "move", position: at(points[0]!) });
    await sendMouse({ type: "down" });
    for (const point of points.slice(1)) await sendMouse({ type: "move", position: at(point) });
    await sendMouse({ type: "up" });
    await pad.updateComplete;
    if (pad.disabled) {
      // Disabled styling removes the canvas from native pointer hit testing.
      expect(events).to.have.length(0);
      expect(captured).to.equal(false);
    } else {
      for (const type of types)
        expect(
          events.some((event) => event.type === type),
          type
        ).to.equal(true);
      expect(events.every((event) => event.isTrusted)).to.equal(true);
      expect(captured).to.equal(true);
      expect(canvas.hasPointerCapture(events[0]!.pointerId)).to.equal(false);
      expect(pad.shadowRoot!.activeElement === canvas, "draw surface has focus").to.equal(true);
    }
  } finally {
    for (const type of types) canvas.removeEventListener(type, record);
    await resetMouse();
  }
}

async function draw(pad: FluidSignaturePad, points: Array<[number, number]>): Promise<void> {
  const canvas = pad.shadowRoot!.querySelector("canvas")!;
  const rect = canvas.getBoundingClientRect();
  const pointer = (type: string, [x, y]: [number, number], buttons: number) =>
    canvas.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        composed: true,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        buttons,
        clientX: rect.left + x,
        clientY: rect.top + y
      })
    );
  pointer("pointerdown", points[0]!, 1);
  for (const point of points.slice(1)) pointer("pointermove", point, 1);
  pointer("pointerup", points.at(-1)!, 0);
  await pad.updateComplete;
}

describe("<fluid-signature-pad>", () => {
  describe("<fluid-signature-pad> localized defaults", () => {
    async function placeLocalImage(control: FluidSignaturePad): Promise<void> {
      const canvas = document.createElement("canvas");
      canvas.width = 40;
      canvas.height = 20;
      canvas.getContext("2d")!.fillRect(4, 8, 30, 4);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((value) => resolve(value!), "image/png")
      );
      await control.placeImage(blob);
      await control.updateComplete;
    }

    for (const [locale, upload, fit, undo, clear] of [
      ["nl", "Uploaden", "Passend maken", "Ongedaan maken", "Wissen"],
      ["de", "Hochladen", "Einpassen", "Rückgängig", "Löschen"],
      ["fr", "Importer", "Ajuster", "Annuler la dernière action", "Effacer"],
      ["es", "Subir", "Ajustar", "Deshacer", "Borrar"],
      ["ar", "رفع", "ملاءمة", "تراجع", "مسح"],
      ["fr-CA", "Importer", "Ajuster", "Annuler la dernière action", "Effacer"]
    ] as const) {
      it(`localizes empty and placed-image actions in ${locale} without changing the image`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-signature-pad aria-label="Application signature"></fluid-signature-pad>
          </div>
        `);
        const control = wrapper.querySelector<FluidSignaturePad>("fluid-signature-pad")!;
        const labels = () =>
          Array.from(control.shadowRoot!.querySelectorAll(".actions fluid-button")).map((button) =>
            button.textContent!.trim()
          );
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(labels()).to.deep.equal([upload]);
        await placeLocalImage(control);
        const image = control.toDataURL();
        expect(labels()).to.deep.equal([fit, undo, clear]);
        wrapper.lang = "nl";
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(labels()).to.deep.equal(["Passend maken", "Ongedaan maken", "Wissen"]);
        expect(control.toDataURL()).to.equal(image);
        expect(control.shadowRoot!.querySelector("canvas")!.getAttribute("aria-label")).to.equal(
          "Application signature"
        );
      });
    }

    it("preserves explicit signed-action labels and restores locale defaults after removing them", async () => {
      const control = await fixture<FluidSignaturePad>(
        html`<fluid-signature-pad lang="en"></fluid-signature-pad>`
      );
      control.clearLabel = "Clear";
      control.undoLabel = "Undo";
      control.fitLabel = "Fit";
      await placeLocalImage(control);
      control.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      const labels = () =>
        Array.from(control.shadowRoot!.querySelectorAll(".actions fluid-button")).map((button) =>
          button.textContent!.trim()
        );
      expect(labels()).to.deep.equal(["Fit", "Undo", "Clear"]);
      for (const [attribute, value] of [
        ["clear-label", "Clear"],
        ["undo-label", "Undo"],
        ["fit-label", "Fit"]
      ] as const) {
        control.setAttribute(attribute, value);
        control.removeAttribute(attribute);
      }
      await control.updateComplete;
      expect(labels()).to.deep.equal(["ملاءمة", "تراجع", "مسح"]);
    });

    const readLabels = (control: FluidSignaturePad) => [
      control.shadowRoot!.querySelector(".actions fluid-button")!.textContent!.trim()
    ];
    for (const [locale, expected] of [
      ["nl", ["Uploaden"]],
      ["de", ["Hochladen"]],
      ["fr", ["Importer"]],
      ["es", ["Subir"]],
      ["ar", ["رفع"]],
      ["fr-CA", ["Importer"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-signature-pad aria-label="Application signature"></fluid-signature-pad>
          </div>
        `);
        const control = wrapper.querySelector<FluidSignaturePad>("fluid-signature-pad")!;
        await control.updateComplete;
        expect(control.hasAttribute("upload-label")).to.equal(false);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);
        expect(control.uploadLabel).to.equal(expected[0]);
        expect(control.hasAttribute("upload-label")).to.equal(false);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidSignaturePad>(
        html`<fluid-signature-pad aria-label="Application signature"></fluid-signature-pad>`
      );
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Uploaden"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Hochladen"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["رفع"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en">
          <fluid-signature-pad aria-label="Application signature"></fluid-signature-pad>
        </div>
      `);
      const control = wrapper.querySelector<FluidSignaturePad>("fluid-signature-pad")!;
      control.uploadLabel = "Upload";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Upload"]);
      control.setAttribute("upload-label", "Upload");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Upload"]);
      control.removeAttribute("upload-label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Importer"]);
      control.uploadLabel = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "uploadLabel", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["رفع"]);
    });
  });

  it("passes an a11y audit with an accessible name", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad aria-label="Customer signature"></fluid-signature-pad>
    `);
    await expect(pad).to.be.accessible();
  });

  it("reports ink after a native stroke and exports it", async function () {
    // Browser-level mouse commands are intentionally retained for one focused
    // integration check. Firefox command transport can be slower under the
    // complete 1,900-test component matrix, so only this native boundary gets
    // a little more headroom; state-oriented cases below dispatch pointer
    // events directly and keep the normal timeout.
    this.timeout(10_000);
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad aria-label="Signature"></fluid-signature-pad>
    `);
    expect(pad.signed).to.equal(false);
    expect(pad.toDataURL()).to.equal(undefined);

    const change = oneEvent(pad, "fluid-change");
    await drawWithNativeMouse(pad, [
      [20, 40],
      [60, 60],
      [110, 35]
    ]);
    const event = await change;
    expect(event.detail).to.deep.equal({ signed: true, strokes: 1 });
    expect(pad.signed).to.equal(true);
    expect(pad.toDataURL()).to.match(/^data:image\/png/);
  });

  it("undoes one stroke and clears the rest", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad></fluid-signature-pad>
    `);
    await draw(pad, [
      [20, 40],
      [60, 60]
    ]);
    await draw(pad, [
      [30, 70],
      [80, 20]
    ]);
    expect(pad.signed).to.equal(true);

    pad.undo();
    expect(pad.signed).to.equal(true);
    pad.undo();
    expect(pad.signed).to.equal(false);

    await draw(pad, [
      [20, 40],
      [60, 60]
    ]);
    pad.clear();
    expect(pad.signed).to.equal(false);
    expect(pad.toDataURL()).to.equal(undefined);
  });

  it("keeps the ink through a resize", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div style="width: 400px"><fluid-signature-pad></fluid-signature-pad></div>
    `);
    const pad = wrapper.querySelector("fluid-signature-pad")!;
    await draw(pad, [
      [20, 40],
      [120, 60],
      [200, 30]
    ]);
    const before = pad.toDataURL();
    expect(before).to.match(/^data:image\/png/);

    wrapper.style.width = "600px";
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    // Still signed, still exportable: the strokes survived the resize because
    // the canvas is a rendering of them, not the source of truth.
    expect(pad.signed).to.equal(true);
    expect(pad.toDataURL()).to.match(/^data:image\/png/);
  });

  it("offers undo and clear as buttons once signed", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad></fluid-signature-pad>
    `);
    // The empty state offers exactly one action: Upload.
    expect(pad.shadowRoot!.querySelectorAll(".actions fluid-button").length).to.equal(1);
    await draw(pad, [
      [20, 40],
      [60, 60]
    ]);
    await draw(pad, [
      [30, 70],
      [80, 20]
    ]);
    // The controls arrive with the render that follows the signing, not in
    // the same tick as the pointer.
    await pad.updateComplete;
    const buttons = pad.shadowRoot!.querySelectorAll(".actions fluid-button");
    expect(buttons.length).to.equal(2);
    (buttons[0] as HTMLElement).click();
    expect(pad.signed).to.equal(true);
    (buttons[1] as HTMLElement).click();
    expect(pad.signed).to.equal(false);
    await pad.updateComplete;
    // With the ink gone the signed controls go too, and the invitation
    // (with its Upload action) returns.
    expect(pad.shadowRoot!.querySelectorAll(".actions fluid-button").length).to.equal(1);
    expect(pad.shadowRoot!.querySelector(".hint") !== null).to.equal(true);
  });

  it("places a prepared signature image and layers strokes over it", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad></fluid-signature-pad>
    `);
    // A tiny in-memory PNG stands in for someone's scanned signature.
    const source = document.createElement("canvas");
    source.width = 60;
    source.height = 24;
    const ctx = source.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(4, 10, 50, 4);
    const blob: Blob = await new Promise((resolve) =>
      source.toBlob((b) => resolve(b!), "image/png")
    );

    await pad.placeImage(blob);
    expect(pad.signed).to.equal(true);
    expect(pad.toDataURL()).to.match(/^data:image\/png/);

    // Strokes layer on top; undo peels the stroke first, then the image.
    await draw(pad, [
      [20, 40],
      [60, 60]
    ]);
    pad.undo();
    expect(pad.signed).to.equal(true);
    pad.undo();
    expect(pad.signed).to.equal(false);
  });

  it("lets the placed image be moved, resized and refitted", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad></fluid-signature-pad>
    `);
    const source = document.createElement("canvas");
    source.width = 80;
    source.height = 40;
    source.getContext("2d")!.fillRect(0, 0, 80, 40);
    const blob: Blob = await new Promise((resolve) =>
      source.toBlob((b) => resolve(b!), "image/png")
    );
    await pad.placeImage(blob);
    await pad.updateComplete;

    const frame = () => pad.shadowRoot!.querySelector<HTMLElement>(".frame")!;
    expect(frame() !== null).to.equal(true);
    const beforeLeft = frame().style.left;
    const canvas = pad.shadowRoot!.querySelector("canvas")!;
    const rect = canvas.getBoundingClientRect();
    // Drag from the centre of the image: it moves rather than draws.
    await draw(pad, [
      [rect.width / 2, rect.height / 2],
      [rect.width / 2 + 30, rect.height / 2 + 10]
    ]);
    await pad.updateComplete;
    expect(frame().style.left).to.not.equal(beforeLeft);
    // And no stroke was recorded by the drag.
    pad.undo();
    expect(pad.signed).to.equal(false);
  });

  it("offers upload while empty", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad upload-label="Place file"></fluid-signature-pad>
    `);
    const button = pad.shadowRoot!.querySelector(".actions fluid-button");
    expect(button !== null).to.equal(true);
    expect(button!.textContent!.trim()).to.equal("Place file");
    expect(pad.shadowRoot!.querySelector("input.file") !== null).to.equal(true);
  });

  it("ignores the pointer while disabled", async () => {
    const pad = await fixture<FluidSignaturePad>(html`
      <fluid-signature-pad disabled></fluid-signature-pad>
    `);
    await drawWithNativeMouse(pad, [
      [20, 40],
      [60, 60]
    ]);
    expect(pad.signed).to.equal(false);
  });
});
