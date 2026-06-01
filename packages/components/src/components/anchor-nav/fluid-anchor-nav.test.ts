import { expect, fixture, html, elementUpdated, aTimeout, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidAnchorNav, FluidAnchorNavItem } from "./fluid-anchor-nav.js";

const items: FluidAnchorNavItem[] = [
  { id: "intro", label: "Introduction", level: 2 },
  { id: "details", label: "Details", level: 3 },
  { id: "summary", label: "Summary", level: 2 },
];

describe("<fluid-anchor-nav>", () => {
  it("renders a navigation landmark with the default label", async () => {
    const el = await fixture<FluidAnchorNav>(
      html`<fluid-anchor-nav .items=${items}></fluid-anchor-nav>`
    );
    await elementUpdated(el);
    await aTimeout(20);
    const nav = el.shadowRoot!.querySelector("nav")!;
    expect(nav).to.exist;
    expect(nav.getAttribute("aria-label")).to.equal("On this page");
  });

  it("honors a custom nav-label", async () => {
    const el = await fixture<FluidAnchorNav>(
      html`<fluid-anchor-nav nav-label="Contents" .items=${items}></fluid-anchor-nav>`
    );
    await elementUpdated(el);
    await aTimeout(20);
    expect(el.shadowRoot!.querySelector("nav")!.getAttribute("aria-label")).to.equal(
      "Contents"
    );
  });

  it("renders one link per item with hash hrefs", async () => {
    const el = await fixture<FluidAnchorNav>(
      html`<fluid-anchor-nav .items=${items}></fluid-anchor-nav>`
    );
    await elementUpdated(el);
    await aTimeout(20);
    const links = el.shadowRoot!.querySelectorAll<HTMLAnchorElement>("a");
    expect(links.length).to.equal(3);
    expect(links[0]!.getAttribute("href")).to.equal("#intro");
    expect(links[0]!.textContent?.trim()).to.equal("Introduction");
  });

  it("applies a per-level indent class", async () => {
    const el = await fixture<FluidAnchorNav>(
      html`<fluid-anchor-nav .items=${items}></fluid-anchor-nav>`
    );
    await elementUpdated(el);
    await aTimeout(20);
    const links = el.shadowRoot!.querySelectorAll<HTMLAnchorElement>("a");
    expect(links[0]!.classList.contains("level-2")).to.be.true;
    expect(links[1]!.classList.contains("level-3")).to.be.true;
  });

  it("auto-collects headings with ids from a scope when items is empty", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div>
        <div id="scope-region">
          <h2 id="auto-a">Alpha</h2>
          <h3 id="auto-b">Beta</h3>
          <h2>No id, skipped</h2>
        </div>
        <fluid-anchor-nav scope="#scope-region"></fluid-anchor-nav>
      </div>
    `);
    const el = wrapper.querySelector<FluidAnchorNav>("fluid-anchor-nav")!;
    await elementUpdated(el);
    await aTimeout(20);
    const links = el.shadowRoot!.querySelectorAll<HTMLAnchorElement>("a");
    expect(links.length).to.equal(2);
    expect(links[0]!.getAttribute("href")).to.equal("#auto-a");
    expect(links[1]!.textContent?.trim()).to.equal("Beta");
  });

  it("smooth-scrolls and updates active state on click", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div>
        <section id="intro" style="height: 50px;">Intro</section>
        <section id="details" style="height: 50px;">Details</section>
        <section id="summary" style="height: 50px;">Summary</section>
        <fluid-anchor-nav .items=${items}></fluid-anchor-nav>
      </div>
    `);
    const el = wrapper.querySelector<FluidAnchorNav>("fluid-anchor-nav")!;
    await elementUpdated(el);
    await aTimeout(20);
    const link = el.shadowRoot!.querySelector<HTMLAnchorElement>('a[href="#details"]')!;
    const listener = oneEvent(el, "fluid-active-change");
    link.click();
    const event = await listener;
    expect(event.detail.id).to.equal("details");
    await elementUpdated(el);
    expect(link.getAttribute("aria-current")).to.equal("true");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidAnchorNav>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-motion:0;"
      >
        <fluid-anchor-nav .items=${items}></fluid-anchor-nav>
      </div>
    `);
    const nav = el.querySelector<FluidAnchorNav>("fluid-anchor-nav")!;
    await elementUpdated(nav);
    await aTimeout(20);
    await expect(nav).to.be.accessible();
  });
});
