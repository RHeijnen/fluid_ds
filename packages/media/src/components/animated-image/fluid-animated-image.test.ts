import { expect, fixture, html, elementUpdated, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidAnimatedImage } from "./fluid-animated-image.js";

// A 1x1 transparent GIF data URL loads synchronously and reliably in the test runner.
const SRC = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/** An opaque 1x1 source, so a painted pause frame is distinguishable from a blank canvas. */
const RED_PIXEL = (() => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f00";
  ctx.fillRect(0, 0, 1, 1);
  return canvas.toDataURL("image/png");
})();

function pixelOf(canvas: HTMLCanvasElement): number[] {
  return [...canvas.getContext("2d")!.getImageData(0, 0, 1, 1).data];
}

/** Resolve only once the component has really decoded its source. */
async function loadedImage(src = RED_PIXEL): Promise<FluidAnimatedImage> {
  const el = await fixture<FluidAnimatedImage>(
    html`<fluid-animated-image alt="anim"></fluid-animated-image>`
  );
  const loaded = oneEvent(el, "fluid-load");
  el.src = src;
  await elementUpdated(el);
  await loaded;
  return el;
}

describe("<fluid-animated-image>", () => {
  it("passes an a11y audit with alternative text and playback control", async () => {
    const el = await fixture<FluidAnimatedImage>(html`
      <fluid-animated-image src=${SRC} alt="Decorative loading sequence"></fluid-animated-image>
    `);
    await expect(el).to.be.accessible();
  });

  it("fires fluid-load when the image finishes loading", async () => {
    const el = await fixture<FluidAnimatedImage>(
      html`<fluid-animated-image alt="anim"></fluid-animated-image>`
    );
    const img = el.shadowRoot!.querySelector("img")!;
    setTimeout(() => {
      img.src = SRC;
      // Ensure the load handler runs even if the data URL was already cached/complete.
      img.dispatchEvent(new Event("load"));
    });
    const ev = await oneEvent(el, "fluid-load");
    expect(ev).to.exist;
  });

  it("fires fluid-error when the image fails to load", async () => {
    const el = await fixture<FluidAnimatedImage>(
      html`<fluid-animated-image alt="anim"></fluid-animated-image>`
    );
    const img = el.shadowRoot!.querySelector("img")!;
    setTimeout(() => img.dispatchEvent(new Event("error")));
    const ev = await oneEvent(el, "fluid-error");
    expect(ev).to.exist;
  });

  it("reflects the paused property to the paused attribute", async () => {
    const el = await fixture<FluidAnimatedImage>(
      html`<fluid-animated-image alt="anim"></fluid-animated-image>`
    );
    expect(el.hasAttribute("paused")).to.be.false;
    el.paused = true;
    await elementUpdated(el);
    expect(el.hasAttribute("paused")).to.be.true;
  });

  it("flips the control aria-label between Pause and Play as paused toggles", async () => {
    const el = await fixture<FluidAnimatedImage>(
      html`<fluid-animated-image alt="anim"></fluid-animated-image>`
    );
    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="control"]')!;
    expect(btn.getAttribute("aria-label")).to.equal("Pause animation");
    btn.click();
    await elementUpdated(el);
    expect(el.paused).to.be.true;
    expect(btn.getAttribute("aria-label")).to.equal("Play animation");
  });

  it("sizes the pause canvas from the decoded image", async () => {
    const el = await loadedImage();
    const canvas = el.shadowRoot!.querySelector("canvas")!;
    expect(canvas.width).to.equal(1);
    expect(canvas.height).to.equal(1);
    // Nothing is painted while the animation runs.
    expect(pixelOf(canvas)).to.deep.equal([0, 0, 0, 0]);
  });

  it("paints the current frame onto the canvas when it is paused", async () => {
    const el = await loadedImage();
    const canvas = el.shadowRoot!.querySelector("canvas")!;
    el.paused = true;
    await elementUpdated(el);
    expect(pixelOf(canvas)).to.deep.equal([255, 0, 0, 255]);
    expect(getComputedStyle(canvas).display).to.equal("block");
  });

  it("paints the frame on load when it mounts already paused", async () => {
    const el = await fixture<FluidAnimatedImage>(
      html`<fluid-animated-image alt="anim" paused></fluid-animated-image>`
    );
    const loaded = oneEvent(el, "fluid-load");
    el.src = RED_PIXEL;
    await elementUpdated(el);
    await loaded;
    expect(pixelOf(el.shadowRoot!.querySelector("canvas")!)).to.deep.equal([255, 0, 0, 255]);
  });

  it("keeps the last good frame when the source breaks after loading", async () => {
    const el = await loadedImage();
    const canvas = el.shadowRoot!.querySelector("canvas")!;
    el.paused = true;
    await elementUpdated(el);
    expect(pixelOf(canvas)).to.deep.equal([255, 0, 0, 255]);

    // A broken image cannot be drawn: pausing again must not throw out of the
    // update cycle, it just keeps showing what was captured before.
    const failed = oneEvent(el, "fluid-error");
    el.src = "missing-animation.gif";
    await elementUpdated(el);
    await failed;
    el.paused = false;
    await elementUpdated(el);
    el.paused = true;
    await elementUpdated(el);

    expect(el.paused).to.be.true;
    expect(pixelOf(canvas)).to.deep.equal([255, 0, 0, 255]);
  });

  it("degrades quietly when the canvas has no 2D context", async () => {
    const el = await loadedImage();
    const canvas = el.shadowRoot!.querySelector("canvas")!;
    // A canvas already bound to another context type returns null here. Stub it
    // rather than claim a context type every test browser supports.
    canvas.getContext = () => null;

    el.paused = true;
    await elementUpdated(el);
    expect(el.paused).to.be.true;
    expect(el.hasAttribute("paused")).to.be.true;
  });

  it("leaves the canvas untouched while the image keeps playing", async () => {
    const el = await loadedImage();
    const canvas = el.shadowRoot!.querySelector("canvas")!;
    el.toggle();
    await elementUpdated(el);
    expect(el.paused).to.be.true;
    el.toggle();
    await elementUpdated(el);
    expect(el.paused).to.be.false;
    // Resuming does not clear the last frame, it just stops showing it.
    expect(getComputedStyle(canvas).display).to.equal("none");
  });

  it("omits the control overlay when no-control is set", async () => {
    const el = await fixture<FluidAnimatedImage>(
      html`<fluid-animated-image alt="anim" no-control></fluid-animated-image>`
    );
    expect(el.shadowRoot!.querySelector('[part="control"]')).to.not.exist;
  });
});
