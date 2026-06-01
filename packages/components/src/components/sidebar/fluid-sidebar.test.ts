import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidSidebar } from "./fluid-sidebar.js";

const tokens =
  "--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-motion:0;";

describe("<fluid-sidebar>", () => {
  it("renders an aside landmark with an accessible name", async () => {
    const el = await fixture<FluidSidebar>(html`
      <fluid-sidebar aria-label="Primary navigation">
        <a href="#">Home</a>
      </fluid-sidebar>
    `);
    const aside = el.shadowRoot!.querySelector("aside")!;
    expect(aside).to.exist;
    expect(aside.getAttribute("aria-label")).to.equal("Primary navigation");
  });

  it("falls back to a default landmark label", async () => {
    const el = await fixture<FluidSidebar>(html`<fluid-sidebar><a href="#">Home</a></fluid-sidebar>`);
    expect(el.shadowRoot!.querySelector("aside")!.getAttribute("aria-label")).to.equal("Sidebar");
  });

  it("is open by default", async () => {
    const el = await fixture<FluidSidebar>(html`<fluid-sidebar><a href="#">Home</a></fluid-sidebar>`);
    expect(el.open).to.be.true;
  });

  it("toggle() flips open and fires fluid-toggle with the new state", async () => {
    const el = await fixture<FluidSidebar>(html`<fluid-sidebar><a href="#">Home</a></fluid-sidebar>`);
    setTimeout(() => el.toggle());
    const event = await oneEvent(el, "fluid-toggle");
    expect(event.detail.open).to.be.false;
    expect(el.open).to.be.false;
  });

  it("reflects open to an attribute", async () => {
    const el = await fixture<FluidSidebar>(html`<fluid-sidebar open><a href="#">Home</a></fluid-sidebar>`);
    el.hide();
    await elementUpdated(el);
    expect(el.hasAttribute("open")).to.be.false;
  });

  it("maps width / mini props onto the override-ladder tokens", async () => {
    const el = await fixture<FluidSidebar>(html`
      <fluid-sidebar width="20rem" mini="5rem"><a href="#">Home</a></fluid-sidebar>
    `);
    await elementUpdated(el);
    expect(el.style.getPropertyValue("--fluid-sidebar-width")).to.equal("20rem");
    expect(el.style.getPropertyValue("--fluid-sidebar-mini-width")).to.equal("5rem");
  });

  it("base background reads the --fluid-sidebar-* override ladder", async () => {
    const el = await fixture<FluidSidebar>(html`<fluid-sidebar><a href="#">Home</a></fluid-sidebar>`);
    el.style.setProperty("--fluid-sidebar-bg", "rgb(1, 2, 3)");
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("overlay mode closes on Escape", async () => {
    const el = await fixture<FluidSidebar>(html`
      <fluid-sidebar overlay open aria-label="Nav"><a href="#">Home</a></fluid-sidebar>
    `);
    await elementUpdated(el);
    setTimeout(() =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    );
    await oneEvent(el, "fluid-toggle");
    expect(el.open).to.be.false;
  });

  it("overlay backdrop click closes the sidebar", async () => {
    const el = await fixture<FluidSidebar>(html`
      <fluid-sidebar overlay open aria-label="Nav"><a href="#">Home</a></fluid-sidebar>
    `);
    await elementUpdated(el);
    el.shadowRoot!.querySelector<HTMLElement>(".backdrop")!.click();
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("inline mode does not render a backdrop", async () => {
    const el = await fixture<FluidSidebar>(html`<fluid-sidebar><a href="#">Home</a></fluid-sidebar>`);
    expect(el.shadowRoot!.querySelector(".backdrop")).to.be.null;
  });

  it("passes an a11y audit", async () => {
    const el = await fixture<FluidSidebar>(html`
      <div style=${tokens}>
        <fluid-sidebar aria-label="Primary navigation">
          <strong slot="header">Fluid</strong>
          <nav aria-label="Primary">
            <a href="#">Dashboard</a>
            <a href="#">Settings</a>
          </nav>
          <small slot="footer">v1.0.0</small>
        </fluid-sidebar>
      </div>
    `);
    const sidebar = el.querySelector<FluidSidebar>("fluid-sidebar")!;
    await elementUpdated(sidebar);
    await aTimeout(20);
    await expect(sidebar).to.be.accessible();
  });
});
