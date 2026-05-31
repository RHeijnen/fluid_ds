import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidBadge } from "./fluid-badge.js";

describe("<fluid-badge>", () => {
  it("renders with defaults", async () => {
    const el = await fixture<FluidBadge>(html`<fluid-badge>New</fluid-badge>`);
    expect(el.variant).to.equal("neutral");
    expect(el.size).to.equal("md");
    expect(el.dot).to.be.false;
  });

  it("renders the slotted content", async () => {
    const el = await fixture<FluidBadge>(html`<fluid-badge>42</fluid-badge>`);
    expect(el.textContent?.trim()).to.equal("42");
  });

  it("dot mode renders no content slot", async () => {
    const el = await fixture<FluidBadge>(html`<fluid-badge dot variant="danger"></fluid-badge>`);
    expect(el.shadowRoot!.querySelector(".dot")).to.exist;
    expect(el.shadowRoot!.querySelector("slot")).to.be.null;
  });

  it("reflects variant and size", async () => {
    const el = await fixture<FluidBadge>(
      html`<fluid-badge variant="warning" size="sm">Heads up</fluid-badge>`
    );
    expect(el.getAttribute("variant")).to.equal("warning");
    expect(el.getAttribute("size")).to.equal("sm");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidBadge>(html`<fluid-badge>Beta</fluid-badge>`);
    await expect(el).to.be.accessible();
  });
});
