import { expect, fixture, html, elementUpdated, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidAnimatedImage } from "./fluid-animated-image.js";

// A 1x1 transparent GIF data URL loads synchronously and reliably in the test runner.
const SRC =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

describe("<fluid-animated-image>", () => {
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

  it("omits the control overlay when no-control is set", async () => {
    const el = await fixture<FluidAnimatedImage>(
      html`<fluid-animated-image alt="anim" no-control></fluid-animated-image>`
    );
    expect(el.shadowRoot!.querySelector('[part="control"]')).to.not.exist;
  });
});
