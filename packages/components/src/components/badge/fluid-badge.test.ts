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

  it("dot mode exposes an author-provided accessible name on the base", async () => {
    const el = await fixture<FluidBadge>(
      html`<fluid-badge dot variant="danger" aria-label="Offline"></fluid-badge>`
    );
    const base = el.shadowRoot!.querySelector(".base")!;
    expect(base.getAttribute("aria-label")).to.equal("Offline");
    expect(base.getAttribute("role")).to.equal("status");
  });

  it("success variant background falls back to a theming token, not a hardcoded hex", async () => {
    const el = await fixture<FluidBadge>(
      html`<fluid-badge variant="success">Done</fluid-badge>`
    );
    const styles = (el.constructor as typeof FluidBadge).styles.toString();
    expect(styles).to.contain("var(--fluid-badge-success-bg, var(--fluid-color-emerald-100))");
    expect(styles).to.contain("var(--fluid-badge-warning-bg, var(--fluid-color-amber-100))");
    expect(styles).to.contain("var(--fluid-badge-danger-bg, var(--fluid-color-red-100))");
    expect(styles).to.not.match(/#dcfce7|#fef3c7|#fee2e2/i);
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
