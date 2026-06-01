import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidImage } from "./fluid-image.js";

// A 1x1 transparent PNG that always loads.
const okSrc =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const badSrc = "data:image/png;base64,not-a-real-image";

describe("<fluid-image>", () => {
  it("renders an inner img with the src and alt", async () => {
    const el = await fixture<FluidImage>(
      html`<fluid-image src=${okSrc} alt="Test"></fluid-image>`
    );
    const img = el.shadowRoot!.querySelector<HTMLImageElement>("img")!;
    expect(img).to.exist;
    expect(img.getAttribute("src")).to.equal(okSrc);
    expect(img.getAttribute("alt")).to.equal("Test");
  });

  it("exposes part base and part img", async () => {
    const el = await fixture<FluidImage>(
      html`<fluid-image src=${okSrc} alt="Test"></fluid-image>`
    );
    expect(el.shadowRoot!.querySelector('[part="base"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="img"]')).to.exist;
  });

  it("defaults loading to lazy", async () => {
    const el = await fixture<FluidImage>(
      html`<fluid-image src=${okSrc} alt="Test"></fluid-image>`
    );
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
      html`<fluid-image src=${okSrc} alt="Test"></fluid-image>`
    );
    await oneEvent(el, "fluid-load");
    await elementUpdated(el);
    const img = el.shadowRoot!.querySelector<HTMLImageElement>("img")!;
    expect(img.classList.contains("is-loaded")).to.be.true;
  });

  it("swaps to the fallback src before erroring", async () => {
    const el = await fixture<FluidImage>(
      html`<fluid-image src=${badSrc} fallback=${okSrc} alt="Test"></fluid-image>`
    );
    await oneEvent(el, "fluid-load");
    await elementUpdated(el);
    const img = el.shadowRoot!.querySelector<HTMLImageElement>("img")!;
    expect(img.getAttribute("src")).to.equal(okSrc);
  });

  it("fires fluid-error and shows the fallback slot when load fails", async () => {
    const el = await fixture<FluidImage>(
      html`<fluid-image src=${badSrc} alt="Test"
        ><span slot="fallback">nope</span></fluid-image
      >`
    );
    await oneEvent(el, "fluid-error");
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('slot[name="fallback"]')).to.exist;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidImage>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-motion:0;"
      >
        <fluid-image src=${okSrc} alt="A descriptive label" width="120" aspect-ratio="1/1"></fluid-image>
      </div>
    `);
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
