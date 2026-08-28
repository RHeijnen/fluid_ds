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

  it("keeps dynamically replaced slotted content constrained", async () => {
    const el = await fixture<FluidAspectRatio>(html`
      <fluid-aspect-ratio ratio="4/3" style="width: 240px">
        <div data-child="initial">initial</div>
      </fluid-aspect-ratio>
    `);
    const replacement = document.createElement("section");
    replacement.dataset.child = "replacement";
    replacement.textContent = "replacement";

    el.replaceChildren(replacement);
    await aTimeout(0);

    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>("slot")!;
    const base = el.shadowRoot!.querySelector<HTMLElement>("[part='base']")!;
    expect(slot.assignedElements()).to.deep.equal([replacement]);
    expect(replacement.getBoundingClientRect().width).to.be.closeTo(
      base.getBoundingClientRect().width,
      0.5
    );
    expect(replacement.getBoundingClientRect().height).to.be.closeTo(
      base.getBoundingClientRect().height,
      0.5
    );
  });

  it("falls back deterministically for an invalid ratio and recovers", async () => {
    const el = await fixture<FluidAspectRatio>(html`
      <fluid-aspect-ratio ratio="not-a-ratio" style="width: 180px">
        <div>content</div>
      </fluid-aspect-ratio>
    `);
    const base = el.shadowRoot!.querySelector<HTMLElement>("[part='base']")!;
    expect(getComputedStyle(base).aspectRatio.replace(/\s/g, "")).to.equal("1/1");
    expect(base.getBoundingClientRect().height).to.be.closeTo(180, 0.5);

    el.ratio = "3/2";
    await elementUpdated(el);

    expect(getComputedStyle(base).aspectRatio.replace(/\s/g, "")).to.equal("3/2");
    expect(base.getBoundingClientRect().height).to.be.closeTo(120, 0.5);
  });

  it("reflows to the measured ratio at a narrow width", async () => {
    const el = await fixture<FluidAspectRatio>(html`
      <fluid-aspect-ratio ratio="16/9" style="width: 96px">
        <div>content</div>
      </fluid-aspect-ratio>
    `);
    const base = el.shadowRoot!.querySelector<HTMLElement>("[part='base']")!;
    expect(base.getBoundingClientRect().height).to.be.closeTo(54, 0.5);

    el.style.width = "64px";
    await aTimeout(0);

    expect(base.getBoundingClientRect().width).to.be.closeTo(64, 0.5);
    expect(base.getBoundingClientRect().height).to.be.closeTo(36, 0.5);
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
