import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidAspectRatio } from "./fluid-aspect-ratio.js";

describe("<fluid-aspect-ratio>", () => {
  it("defaults the ratio to 1/1", async () => {
    const el = await fixture<FluidAspectRatio>(
      html`<fluid-aspect-ratio><div>content</div></fluid-aspect-ratio>`
    );
    expect(el.ratio).to.equal("1/1");
  });

  it("renders a part='base' wrapper", async () => {
    const el = await fixture<FluidAspectRatio>(
      html`<fluid-aspect-ratio><div>content</div></fluid-aspect-ratio>`
    );
    const base = el.shadowRoot!.querySelector("[part='base']");
    expect(base).to.exist;
  });

  it("applies the ratio to the wrapper's aspect-ratio", async () => {
    const el = await fixture<FluidAspectRatio>(
      html`<fluid-aspect-ratio ratio="16/9"><div>content</div></fluid-aspect-ratio>`
    );
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>("[part='base']")!;
    const computed = getComputedStyle(base).aspectRatio.replace(/\s/g, "");
    expect(computed).to.equal("16/9");
  });

  it("reflects the ratio attribute", async () => {
    const el = await fixture<FluidAspectRatio>(
      html`<fluid-aspect-ratio ratio="4/3"><div>content</div></fluid-aspect-ratio>`
    );
    expect(el.getAttribute("ratio")).to.equal("4/3");
  });

  it("updates aspect-ratio when the ratio changes", async () => {
    const el = await fixture<FluidAspectRatio>(
      html`<fluid-aspect-ratio ratio="1/1"><div>content</div></fluid-aspect-ratio>`
    );
    el.ratio = "21/9";
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>("[part='base']")!;
    const computed = getComputedStyle(base).aspectRatio.replace(/\s/g, "");
    expect(computed).to.equal("21/9");
  });

  it("renders slotted content", async () => {
    const el = await fixture<FluidAspectRatio>(
      html`<fluid-aspect-ratio><img alt="sample" /></fluid-aspect-ratio>`
    );
    const slot = el.shadowRoot!.querySelector("slot")!;
    const assigned = slot.assignedElements();
    expect(assigned).to.have.lengthOf(1);
    expect(assigned[0]!.tagName).to.equal("IMG");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidAspectRatio>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
        "
      >
        <fluid-aspect-ratio ratio="16/9">
          <img src="" alt="Decorative sample" />
        </fluid-aspect-ratio>
      </div>
    `);
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
