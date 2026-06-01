import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidAppBar } from "./fluid-app-bar.js";

describe("<fluid-app-bar>", () => {
  it("renders a banner landmark", async () => {
    const el = await fixture<FluidAppBar>(html`<fluid-app-bar></fluid-app-bar>`);
    const header = el.shadowRoot!.querySelector("header");
    expect(header).to.exist;
    expect(header!.getAttribute("role")).to.equal("banner");
  });

  it("exposes start, nav, and end parts", async () => {
    const el = await fixture<FluidAppBar>(html`<fluid-app-bar></fluid-app-bar>`);
    expect(el.shadowRoot!.querySelector('[part="start"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="nav"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="end"]')).to.exist;
  });

  it("does not show the menu button by default", async () => {
    const el = await fixture<FluidAppBar>(html`<fluid-app-bar></fluid-app-bar>`);
    expect(el.shadowRoot!.querySelector(".menu-button")).to.be.null;
  });

  it("renders the menu button when menu-button is set", async () => {
    const el = await fixture<FluidAppBar>(
      html`<fluid-app-bar menu-button></fluid-app-bar>`
    );
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".menu-button");
    expect(button).to.exist;
    expect(button!.getAttribute("aria-label")).to.equal("Open menu");
    expect(button!.getAttribute("aria-expanded")).to.equal("false");
  });

  it("forwards menu-label to the button accessible name", async () => {
    const el = await fixture<FluidAppBar>(
      html`<fluid-app-bar menu-button menu-label="Toggle navigation"></fluid-app-bar>`
    );
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".menu-button")!;
    expect(button.getAttribute("aria-label")).to.equal("Toggle navigation");
  });

  it("reflects expanded into aria-expanded", async () => {
    const el = await fixture<FluidAppBar>(
      html`<fluid-app-bar menu-button expanded></fluid-app-bar>`
    );
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".menu-button")!;
    expect(button.getAttribute("aria-expanded")).to.equal("true");
  });

  it("fires fluid-menu-toggle with the next expanded state", async () => {
    const el = await fixture<FluidAppBar>(
      html`<fluid-app-bar menu-button></fluid-app-bar>`
    );
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".menu-button")!;
    setTimeout(() => button.click());
    const event = await oneEvent(el, "fluid-menu-toggle");
    expect(event).to.exist;
    expect((event as CustomEvent).detail.expanded).to.be.true;
  });

  it("toggles expanded state in the event detail when already expanded", async () => {
    const el = await fixture<FluidAppBar>(
      html`<fluid-app-bar menu-button expanded></fluid-app-bar>`
    );
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".menu-button")!;
    setTimeout(() => button.click());
    const event = await oneEvent(el, "fluid-menu-toggle");
    expect((event as CustomEvent).detail.expanded).to.be.false;
  });

  it("reflects sticky and elevated attributes", async () => {
    const el = await fixture<FluidAppBar>(html`<fluid-app-bar></fluid-app-bar>`);
    el.sticky = true;
    el.elevated = true;
    await elementUpdated(el);
    expect(el.hasAttribute("sticky")).to.be.true;
    expect(el.hasAttribute("elevated")).to.be.true;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidAppBar>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
        "
      >
        <fluid-app-bar menu-button>
          <strong slot="start">Acme</strong>
          <a href="#">Dashboard</a>
          <span slot="end">Sign in</span>
        </fluid-app-bar>
      </div>
    `);
    const bar = el.querySelector<FluidAppBar>("fluid-app-bar")!;
    await elementUpdated(bar);
    await aTimeout(20);
    await expect(bar).to.be.accessible();
  });
});
