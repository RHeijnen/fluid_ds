import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidNavList } from "./fluid-nav-list.js";
import type { FluidNavItem } from "./fluid-nav-item.js";

describe("<fluid-nav-list>", () => {
  it("renders a nav landmark wrapping a role=list", async () => {
    const el = await fixture<FluidNavList>(
      html`<fluid-nav-list label="Main">
        <fluid-nav-item href="/a">A</fluid-nav-item>
      </fluid-nav-list>`
    );
    const nav = el.shadowRoot!.querySelector("nav");
    expect(nav).to.exist;
    expect(nav!.getAttribute("aria-label")).to.equal("Main");
    expect(el.shadowRoot!.querySelector('[role="list"]')).to.exist;
  });

  it("falls back to a default landmark label", async () => {
    const el = await fixture<FluidNavList>(
      html`<fluid-nav-list><fluid-nav-item href="/a">A</fluid-nav-item></fluid-nav-list>`
    );
    expect(el.shadowRoot!.querySelector("nav")!.getAttribute("aria-label")).to.equal(
      "Navigation"
    );
  });
});

describe("<fluid-nav-item>", () => {
  it("renders an anchor with the given href", async () => {
    const el = await fixture<FluidNavItem>(
      html`<fluid-nav-item href="/projects">Projects</fluid-nav-item>`
    );
    const a = el.shadowRoot!.querySelector<HTMLAnchorElement>("a")!;
    expect(a).to.exist;
    expect(a.getAttribute("href")).to.equal("/projects");
  });

  it("carries role=listitem so list semantics hold", async () => {
    const el = await fixture<FluidNavItem>(
      html`<fluid-nav-item href="/a">A</fluid-nav-item>`
    );
    expect(el.getAttribute("role")).to.equal("listitem");
  });

  it("sets aria-current=page and reflects current when current is set", async () => {
    const el = await fixture<FluidNavItem>(
      html`<fluid-nav-item href="/a" current>A</fluid-nav-item>`
    );
    const a = el.shadowRoot!.querySelector("a")!;
    expect(a.getAttribute("aria-current")).to.equal("page");
    expect(el.hasAttribute("current")).to.be.true;
  });

  it("omits aria-current when not current", async () => {
    const el = await fixture<FluidNavItem>(
      html`<fluid-nav-item href="/a">A</fluid-nav-item>`
    );
    expect(el.shadowRoot!.querySelector("a")!.hasAttribute("aria-current")).to.be.false;
  });

  it("forwards target and rel to the anchor", async () => {
    const el = await fixture<FluidNavItem>(
      html`<fluid-nav-item href="/a" target="_blank" rel="noopener">A</fluid-nav-item>`
    );
    const a = el.shadowRoot!.querySelector("a")!;
    expect(a.getAttribute("target")).to.equal("_blank");
    expect(a.getAttribute("rel")).to.equal("noopener");
  });

  it("toggles aria-current when current changes", async () => {
    const el = await fixture<FluidNavItem>(
      html`<fluid-nav-item href="/a">A</fluid-nav-item>`
    );
    el.current = true;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("a")!.getAttribute("aria-current")).to.equal(
      "page"
    );
  });

  it("exposes icon and badge slots", async () => {
    const el = await fixture<FluidNavItem>(
      html`<fluid-nav-item href="/a">
        <span slot="icon">i</span>
        Label
        <span slot="badge">3</span>
      </fluid-nav-item>`
    );
    expect(el.shadowRoot!.querySelector('slot[name="icon"]')).to.exist;
    expect(el.shadowRoot!.querySelector('slot[name="badge"]')).to.exist;
  });
});

describe("<fluid-nav-list> accessibility", () => {
  it("passes an axe audit", async () => {
    const el = await fixture(html`
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
        <fluid-nav-list label="Main">
          <fluid-nav-item href="/dashboard" current>Dashboard</fluid-nav-item>
          <fluid-nav-item href="/projects">Projects</fluid-nav-item>
          <fluid-nav-item href="/settings">Settings</fluid-nav-item>
        </fluid-nav-list>
      </div>
    `);
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
