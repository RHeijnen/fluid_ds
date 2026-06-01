import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidLoadingOverlay } from "./fluid-loading-overlay.js";

describe("<fluid-loading-overlay>", () => {
  it("renders the slotted content", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay><p>Content</p></fluid-loading-overlay>`
    );
    expect(el.querySelector("p")?.textContent).to.equal("Content");
  });

  it("does not render the overlay layer when inactive", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay><p>Content</p></fluid-loading-overlay>`
    );
    expect(el.shadowRoot!.querySelector(".overlay")).to.be.null;
    expect(el.hasAttribute("aria-busy")).to.be.false;
  });

  it("renders the overlay with a spinner when active", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active><p>Content</p></fluid-loading-overlay>`
    );
    const overlay = el.shadowRoot!.querySelector(".overlay");
    expect(overlay).to.exist;
    expect(el.shadowRoot!.querySelector("fluid-spinner")).to.exist;
  });

  it("sets aria-busy on the host while active", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active><p>Content</p></fluid-loading-overlay>`
    );
    expect(el.getAttribute("aria-busy")).to.equal("true");
  });

  it("clears aria-busy when toggled inactive", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active><p>Content</p></fluid-loading-overlay>`
    );
    el.active = false;
    await elementUpdated(el);
    expect(el.hasAttribute("aria-busy")).to.be.false;
    expect(el.shadowRoot!.querySelector(".overlay")).to.be.null;
  });

  it("reflects the active property to an attribute", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay><p>Content</p></fluid-loading-overlay>`
    );
    el.active = true;
    await elementUpdated(el);
    expect(el.hasAttribute("active")).to.be.true;
  });

  it("exposes the overlay as a status live region", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active label="Saving"><p>Content</p></fluid-loading-overlay>`
    );
    const overlay = el.shadowRoot!.querySelector(".overlay")!;
    expect(overlay.getAttribute("role")).to.equal("status");
    expect(overlay.getAttribute("aria-live")).to.equal("polite");
    expect(overlay.getAttribute("aria-label")).to.equal("Saving");
  });

  it("falls back to a default accessible name when no label is set", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active><p>Content</p></fluid-loading-overlay>`
    );
    const overlay = el.shadowRoot!.querySelector(".overlay")!;
    expect(overlay.getAttribute("aria-label")).to.equal("Loading");
    expect(el.shadowRoot!.querySelector(".label")).to.be.null;
  });

  it("renders the visible label text when provided", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active label="Uploading"><p>Content</p></fluid-loading-overlay>`
    );
    expect(el.shadowRoot!.querySelector(".label")?.textContent).to.equal(
      "Uploading"
    );
  });

  it("passes a11y audit", async () => {
    const el = await fixture(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-motion:0;
        "
      >
        <fluid-loading-overlay active label="Loading data">
          <p>Gated content</p>
        </fluid-loading-overlay>
      </div>
    `);
    const overlay = el.querySelector<FluidLoadingOverlay>("fluid-loading-overlay")!;
    await elementUpdated(overlay);
    await aTimeout(20);
    await expect(overlay).to.be.accessible();
  });
});
