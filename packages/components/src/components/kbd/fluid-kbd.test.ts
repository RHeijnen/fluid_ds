import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidKbd } from "./fluid-kbd.js";

describe("<fluid-kbd>", () => {
  it("renders slotted text inside a <kbd>", async () => {
    const el = await fixture<FluidKbd>(html`<fluid-kbd>Ctrl</fluid-kbd>`);
    expect(el.shadowRoot!.querySelector("kbd")).to.exist;
    expect(el.textContent?.trim()).to.equal("Ctrl");
  });

  it("reflects size", async () => {
    const el = await fixture<FluidKbd>(html`<fluid-kbd size="lg">K</fluid-kbd>`);
    expect(el.getAttribute("size")).to.equal("lg");
  });

  it("passes the a11y audit", async () => {
    const el = await fixture<FluidKbd>(html`<fluid-kbd>Enter</fluid-kbd>`);
    await expect(el).to.be.accessible();
  });
});
