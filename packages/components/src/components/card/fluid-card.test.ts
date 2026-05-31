import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidCard } from "./fluid-card.js";

describe("<fluid-card>", () => {
  it("renders with default variant", async () => {
    const el = await fixture<FluidCard>(html`<fluid-card>Body</fluid-card>`);
    expect(el.variant).to.equal("elevated");
  });

  it("renders slot content", async () => {
    const el = await fixture<FluidCard>(html`
      <fluid-card>
        <span slot="header">Title</span>
        <p>Body content</p>
        <span slot="footer">Footer</span>
      </fluid-card>
    `);
    expect(el.textContent).to.include("Title");
    expect(el.textContent).to.include("Body content");
    expect(el.textContent).to.include("Footer");
  });

  it("hides header/footer when empty", async () => {
    const el = await fixture<FluidCard>(html`<fluid-card>Body only</fluid-card>`);
    await el.updateComplete;
    const header = el.shadowRoot!.querySelector(".header")!;
    const footer = el.shadowRoot!.querySelector(".footer")!;
    expect(header.classList.contains("empty")).to.be.true;
    expect(footer.classList.contains("empty")).to.be.true;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCard>(html`
      <fluid-card>
        <h3 slot="header">Card title</h3>
        <p>Content</p>
      </fluid-card>
    `);
    await expect(el).to.be.accessible();
  });
});
