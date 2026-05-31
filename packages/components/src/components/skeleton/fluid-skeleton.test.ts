import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidSkeleton } from "./fluid-skeleton.js";

describe("<fluid-skeleton>", () => {
  it("renders with pulse effect by default", async () => {
    const el = await fixture<FluidSkeleton>(html`<fluid-skeleton></fluid-skeleton>`);
    expect(el.effect).to.equal("pulse");
  });

  it("sets aria-busy=true automatically", async () => {
    const el = await fixture<FluidSkeleton>(html`<fluid-skeleton></fluid-skeleton>`);
    expect(el.getAttribute("aria-busy")).to.equal("true");
  });

  it("respects an existing aria-busy attribute", async () => {
    const el = await fixture<FluidSkeleton>(
      html`<fluid-skeleton aria-busy="false"></fluid-skeleton>`
    );
    expect(el.getAttribute("aria-busy")).to.equal("false");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSkeleton>(
      html`<fluid-skeleton aria-label="Loading"></fluid-skeleton>`
    );
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder. */

  it("base color reads the --fluid-skeleton-* override ladder", async () => {
    const el = await fixture<FluidSkeleton>(html`<fluid-skeleton></fluid-skeleton>`);
    el.style.setProperty("--fluid-skeleton-color", "rgb(1, 2, 3)");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });
});
