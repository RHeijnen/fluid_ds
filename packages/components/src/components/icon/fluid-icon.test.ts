import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import { registerIcon } from "@fluid-ds/icons";
import "./define.js";
import type { FluidIcon } from "./fluid-icon.js";

const STAR_SVG = `<svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>`;

describe("<fluid-icon>", () => {
  before(() => {
    registerIcon("test-star", STAR_SVG);
  });

  it("renders nothing when name is unset", async () => {
    const el = await fixture<FluidIcon>(html`<fluid-icon></fluid-icon>`);
    expect(el.shadowRoot!.querySelector("svg")).to.be.null;
  });

  it("renders the SVG for a registered icon", async () => {
    const el = await fixture<FluidIcon>(html`<fluid-icon name="test-star"></fluid-icon>`);
    await el.updateComplete;
    const svg = el.shadowRoot!.querySelector("svg");
    expect(svg).to.exist;
    expect(svg!.querySelector("path")).to.exist;
  });

  it("is aria-hidden by default (decorative)", async () => {
    const el = await fixture<FluidIcon>(html`<fluid-icon name="test-star"></fluid-icon>`);
    await el.updateComplete;
    expect(el.getAttribute("aria-hidden")).to.equal("true");
    expect(el.getAttribute("role")).to.be.null;
  });

  it("becomes role=img with aria-label when label is set", async () => {
    const el = await fixture<FluidIcon>(
      html`<fluid-icon name="test-star" label="Favorite"></fluid-icon>`
    );
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("img");
    expect(el.getAttribute("aria-label")).to.equal("Favorite");
    expect(el.getAttribute("aria-hidden")).to.be.null;
  });

  it("renders late-registered icons", async () => {
    const el = await fixture<FluidIcon>(
      html`<fluid-icon name="test-late"></fluid-icon>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("svg")).to.be.null;

    registerIcon("test-late", STAR_SVG);
    await waitUntil(() => el.shadowRoot!.querySelector("svg"));
    expect(el.shadowRoot!.querySelector("svg")).to.exist;
  });

  it("passes basic accessibility audit (decorative)", async () => {
    const el = await fixture<FluidIcon>(html`<fluid-icon name="test-star"></fluid-icon>`);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it("passes basic accessibility audit (labeled)", async () => {
    const el = await fixture<FluidIcon>(
      html`<fluid-icon name="test-star" label="Star"></fluid-icon>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
