import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import "./define.js";
import type { FluidAvatar } from "./fluid-avatar.js";

describe("<fluid-avatar>", () => {
  it("renders with defaults", async () => {
    const el = await fixture<FluidAvatar>(html`<fluid-avatar></fluid-avatar>`);
    expect(el.size).to.equal("md");
    expect(el.shape).to.equal("circle");
  });

  it("derives initials from a full-name label", async () => {
    const el = await fixture<FluidAvatar>(html`<fluid-avatar label="Ada Lovelace"></fluid-avatar>`);
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

  it("falls back after a real image error and recovers without stale failure state", async () => {
    const missingImage = "data:image/png;base64,AAAA";
    const el = await fixture<FluidAvatar>(html`
      <fluid-avatar image=${missingImage} label="Ada Lovelace"></fluid-avatar>
    `);

    await waitUntil(() => el.shadowRoot!.querySelector("[part='initials']") !== null);
    expect(el.shadowRoot!.querySelector("img")).to.not.exist;
    expect(el.shadowRoot!.querySelector("[part='initials']")!.textContent).to.equal("AL");

    el.image = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    el.label = "Grace Hopper";
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector("img")).to.exist;
    await waitUntil(
      () => {
        const currentImage = el.shadowRoot!.querySelector<HTMLImageElement>("img");
        return currentImage?.complete && currentImage.naturalWidth === 1;
      },
      "replacement image loads after failure recovery",
      { timeout: 2000 }
    );
    expect(el.shadowRoot!.querySelector("[part='initials']")).to.not.exist;
    expect(el.shadowRoot!.querySelector("[part='base']")!.getAttribute("aria-label")).to.equal(
      "Grace Hopper"
    );
  });

  it("falls back to the icon after a real image error and can recover its label", async () => {
    const missingImage = "data:image/png;base64,AAAA";
    const el = await fixture<FluidAvatar>(html`
      <fluid-avatar image=${missingImage}>
        <span slot="icon">person</span>
      </fluid-avatar>
    `);

    await waitUntil(() => el.shadowRoot!.querySelector("slot[name='icon']") !== null);
    expect(el.shadowRoot!.querySelector("img")).to.not.exist;

    el.image = "";
    el.label = "Katherine Johnson";
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector("[part='initials']")!.textContent).to.equal("KJ");
    expect(el.shadowRoot!.querySelector("[part='base']")!.getAttribute("aria-label")).to.equal(
      "Katherine Johnson"
    );
  });

  it("falls back to the icon slot when no image or initials are available", async () => {
    const el = await fixture<FluidAvatar>(html`
      <fluid-avatar><span slot="icon">👤</span></fluid-avatar>
    `);
    expect(el.shadowRoot!.querySelector("slot[name='icon']")).to.exist;
  });

  it("uses the label as the accessible name", async () => {
    const el = await fixture<FluidAvatar>(html`<fluid-avatar label="Ada Lovelace"></fluid-avatar>`);
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector("[part='base']")!;
    expect(base.getAttribute("aria-label")).to.equal("Ada Lovelace");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidAvatar>(html`<fluid-avatar label="Ada Lovelace"></fluid-avatar>`);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
