import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidAvatar } from "./fluid-avatar.js";

describe("<fluid-avatar>", () => {
  it("renders with defaults", async () => {
    const el = await fixture<FluidAvatar>(html`<fluid-avatar></fluid-avatar>`);
    expect(el.size).to.equal("md");
    expect(el.shape).to.equal("circle");
  });

  it("derives initials from a full-name label", async () => {
    const el = await fixture<FluidAvatar>(
      html`<fluid-avatar label="Ada Lovelace"></fluid-avatar>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("[part='initials']")!.textContent).to.equal("AL");
  });

  it("prefers explicit initials over derived ones", async () => {
    const el = await fixture<FluidAvatar>(
      html`<fluid-avatar label="Ada Lovelace" initials="AL!"></fluid-avatar>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("[part='initials']")!.textContent).to.equal("AL!");
  });

  it("renders the image when one is provided", async () => {
    const el = await fixture<FluidAvatar>(
      html`<fluid-avatar image="https://example.com/a.jpg" label="x"></fluid-avatar>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("img")).to.exist;
  });

  it("falls back to initials when the image fails to load", async () => {
    const el = await fixture<FluidAvatar>(
      html`<fluid-avatar image="bad" label="Ada Lovelace"></fluid-avatar>`
    );
    await el.updateComplete;
    const img = el.shadowRoot!.querySelector("img")!;
    img.dispatchEvent(new Event("error"));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("[part='initials']")!.textContent).to.equal("AL");
  });

  it("falls back to the icon slot when no image or initials are available", async () => {
    const el = await fixture<FluidAvatar>(html`
      <fluid-avatar><span slot="icon">👤</span></fluid-avatar>
    `);
    expect(el.shadowRoot!.querySelector("slot[name='icon']")).to.exist;
  });

  it("uses the label as the accessible name", async () => {
    const el = await fixture<FluidAvatar>(
      html`<fluid-avatar label="Ada Lovelace"></fluid-avatar>`
    );
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector("[part='base']")!;
    expect(base.getAttribute("aria-label")).to.equal("Ada Lovelace");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidAvatar>(
      html`<fluid-avatar label="Ada Lovelace"></fluid-avatar>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
