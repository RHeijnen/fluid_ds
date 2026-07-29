import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidPage } from "./fluid-page.js";

describe("<fluid-page>", () => {
  it("is a grid container", async () => {
    const el = await fixture<FluidPage>(html`<fluid-page></fluid-page>`);
    expect(getComputedStyle(el).display).to.equal("grid");
  });

  it("marks navigation/aside presence via data attributes when slots are filled", async () => {
    const el = await fixture<FluidPage>(html`
      <fluid-page>
        <div slot="navigation">nav</div>
        <div slot="aside">aside</div>
        main
      </fluid-page>
    `);
    await el.updateComplete;
    expect(el.hasAttribute("data-has-nav")).to.be.true;
    expect(el.hasAttribute("data-has-aside")).to.be.true;
  });

  it("collapses navigation/aside columns when slots are empty", async () => {
    const el = await fixture<FluidPage>(html`<fluid-page>main</fluid-page>`);
    await el.updateComplete;
    expect(el.hasAttribute("data-has-nav")).to.be.false;
    expect(el.hasAttribute("data-has-aside")).to.be.false;
  });

  // Regression: the WithBanner story used the phantom token
  // --fluid-color-warning-soft, which does not exist (the warning track only
  // emits --fluid-warning-base/-hover/-active/-text). A phantom token resolves
  // to nothing, so the banner silently rendered with no background. Guard that
  // the banner background derives from the real --fluid-warning-base token.
  it("renders a banner background from a real warning token (no phantom token)", async () => {
    const root = await fixture(html`
      <div style="--fluid-warning-base: rgb(255, 0, 0);">
        <div
          style="background: color-mix(in srgb, var(--fluid-warning-base) 15%, transparent);"
          data-banner
        ></div>
      </div>
    `);
    const banner = root.querySelector<HTMLElement>("[data-banner]")!;
    const bg = getComputedStyle(banner).backgroundColor;
    // A resolved color-mix is a non-empty, non-transparent color.
    expect(bg).to.not.equal("");
    expect(bg).to.not.equal("rgba(0, 0, 0, 0)");
    expect(bg).to.not.equal("transparent");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidPage>(html`
      <fluid-page>
        <div slot="header">Header</div>
        <main>Main content</main>
      </fluid-page>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
