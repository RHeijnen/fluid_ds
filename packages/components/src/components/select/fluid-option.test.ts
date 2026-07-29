import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidOption } from "./fluid-option.js";

describe("<fluid-option>", () => {
  it("selected background reads the --fluid-option-selected-bg override", async () => {
    const el = await fixture<FluidOption>(html`
      <fluid-option value="apple" selected>Apple</fluid-option>
    `);
    el.style.setProperty("--fluid-option-selected-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    expect(getComputedStyle(el).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("selected foreground reads the --fluid-option-selected-fg override", async () => {
    const el = await fixture<FluidOption>(html`
      <fluid-option value="apple" selected>Apple</fluid-option>
    `);
    el.style.setProperty("--fluid-option-selected-fg", "rgb(4, 5, 6)");
    await el.updateComplete;
    expect(getComputedStyle(el).color).to.equal("rgb(4, 5, 6)");
  });

  it("selected default background is a theme-aware accent tint, not raw brand-50", async () => {
    const el = await fixture<FluidOption>(html`
      <fluid-option value="apple" selected>Apple</fluid-option>
    `);
    await el.updateComplete;
    // The fallback resolves through --fluid-accent-base via color-mix, so it
    // must NOT paint the raw light brand-50 primitive (#eff6ff). Regression
    // guard for the dark-theme contrast break.
    expect(getComputedStyle(el).backgroundColor).to.not.equal("rgb(239, 246, 255)");
  });
});
