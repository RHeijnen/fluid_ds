import { expect, fixture, html, elementUpdated, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidImage } from "./fluid-image.js";

// A complete 1x1 RGBA PNG, with valid chunk lengths, CRCs and zlib data.
// Native decoding below guards the fixture itself, not just component behavior.
const okSrc =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=";
const badSrc = "data:image/png;base64,not-a-real-image";

describe("<fluid-image>", () => {
  it("uses a fixture that the native image decoder accepts", async () => {
    const image = new Image();
    image.src = okSrc;
    await image.decode();
    expect(image.naturalWidth).to.equal(1);
    expect(image.naturalHeight).to.equal(1);
  });

  it("renders an inner img with the src and alt", async () => {
    const el = await fixture<FluidImage>(html`<fluid-image src=${okSrc} alt="Test"></fluid-image>`);
    const img = el.shadowRoot!.querySelector<HTMLImageElement>("img")!;
    expect(img).to.exist;
    expect(img.getAttribute("src")).to.equal(okSrc);
    expect(img.getAttribute("alt")).to.equal("Test");
  });

  it("exposes part base and part img", async () => {
    const el = await fixture<FluidImage>(html`<fluid-image src=${okSrc} alt="Test"></fluid-image>`);
    expect(el.shadowRoot!.querySelector('[part="base"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="img"]')).to.exist;
  });

  it("defaults loading to lazy", async () => {
    const el = await fixture<FluidImage>(html`<fluid-image src=${okSrc} alt="Test"></fluid-image>`);
    const img = el.shadowRoot!.querySelector<HTMLImageElement>("img")!;
    expect(img.getAttribute("loading")).to.equal("lazy");
  });

  it("treats empty alt as decorative (renders alt='')", async () => {
    const el = await fixture<FluidImage>(html`<fluid-image src=${okSrc}></fluid-image>`);
    const img = el.shadowRoot!.querySelector<HTMLImageElement>("img")!;
    expect(img.getAttribute("alt")).to.equal("");
  });

  it("fires fluid-load and marks the image loaded", async () => {
    const el = await fixture<FluidImage>(
      html`<fluid-image loading="eager" alt="Test"></fluid-image>`
    );
    const loaded = oneEvent(el, "fluid-load");
    el.src = okSrc;
    await loaded;
    await elementUpdated(el);
    const img = el.shadowRoot!.querySelector<HTMLImageElement>("img")!;
    expect(img.classList.contains("is-loaded")).to.be.true;
    expect(img.naturalWidth).to.equal(1);
  });

  it("swaps to the fallback src before erroring", async () => {
    const el = await fixture<FluidImage>(
      html`<fluid-image loading="eager" fallback=${okSrc} alt="Test"></fluid-image>`
    );
    const loaded = oneEvent(el, "fluid-load");
    el.src = badSrc;
    await loaded;
    await elementUpdated(el);
    const img = el.shadowRoot!.querySelector<HTMLImageElement>("img")!;
    expect(img.getAttribute("src")).to.equal(okSrc);
    expect(img.naturalWidth).to.equal(1);
  });

  it("fires fluid-error and shows the fallback slot when load fails", async () => {
    const el = await fixture<FluidImage>(
      html`<fluid-image loading="eager" alt="Test"><span slot="fallback">nope</span></fluid-image>`
    );
    const errored = oneEvent(el, "fluid-error");
    el.src = badSrc;
    await errored;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('slot[name="fallback"]')).to.exist;
  });

  it("exposes a distinct part='fallback' (not part='img') on the error wrapper", async () => {
    const el = await fixture<FluidImage>(
      html`<fluid-image loading="eager" alt="Test"><span slot="fallback">nope</span></fluid-image>`
    );
    const errored = oneEvent(el, "fluid-error");
    el.src = badSrc;
    await errored;
    await elementUpdated(el);
    // The error wrapper carries its own part name...
    const fallback = el.shadowRoot!.querySelector('[part="fallback"]');
    expect(fallback).to.exist;
    expect(fallback!.querySelector('slot[name="fallback"]')).to.exist;
    // ...so a consumer's ::part(img) rule never hits the fallback box.
    expect(el.shadowRoot!.querySelector('[part="img"]')).to.not.exist;
  });

  it("collapses the load fade under reduced motion (--fluid-motion:0)", async () => {
    const el = await fixture<FluidImage>(html`
      <div style="--fluid-motion:0;">
        <fluid-image src=${okSrc} alt="Test"></fluid-image>
      </div>
    `);
    const image = el.querySelector<FluidImage>("fluid-image")!;
    await elementUpdated(image);
    const img = image.shadowRoot!.querySelector<HTMLImageElement>("img")!;
    const duration = getComputedStyle(img).transitionDuration;
    // calc(... * 0) collapses the fade to 0s.
    const ms = parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000);
    expect(ms).to.be.closeTo(0, 1);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidImage>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-motion:0;"
      >
        <fluid-image
          loading="eager"
          alt="A descriptive label"
          width="120"
          aspect-ratio="1/1"
        ></fluid-image>
      </div>
    `);
    const image = el.querySelector<FluidImage>("fluid-image")!;
    const loaded = oneEvent(image, "fluid-load");
    image.src = okSrc;
    await loaded;
    await elementUpdated(image);
    expect(image.shadowRoot!.querySelector("img")!.naturalWidth).to.equal(1);
    await expect(el).to.be.accessible();
  });
});
