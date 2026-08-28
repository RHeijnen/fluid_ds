import { expect, fixture, html, elementUpdated, aTimeout, oneEvent } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type {
  FluidAnchorNav,
  FluidAnchorNavActiveChangeDetail,
  FluidAnchorNavActiveChangeEvent,
  FluidAnchorNavItem
} from "../../index.js";

const compatibleActiveChangeDetail: FluidAnchorNavActiveChangeDetail = { id: null };
// @ts-expect-error The public payload contract excludes numeric target ids.
const incompatibleActiveChangeDetail: FluidAnchorNavActiveChangeDetail = { id: 1 };
void incompatibleActiveChangeDetail;

const items: FluidAnchorNavItem[] = [
  { id: "intro", label: "Introduction", level: 2 },
  { id: "details", label: "Details", level: 3 },
  { id: "summary", label: "Summary", level: 2 }
];

describe("<fluid-anchor-nav>", () => {
  it("exports an exact nullable-string active-change payload contract", () => {
    expect(compatibleActiveChangeDetail).to.deep.equal({ id: null });
  });
  describe("<fluid-anchor-nav> localized defaults", () => {
    const readLabels = (control: FluidAnchorNav) => [
      control.shadowRoot!.querySelector("nav")!.getAttribute("aria-label")
    ];
    for (const [locale, expected] of [
      ["nl", ["Op deze pagina"]],
      ["de", ["Auf dieser Seite"]],
      ["fr", ["Sur cette page"]],
      ["es", ["En esta página"]],
      ["ar", ["في هذه الصفحة"]],
      ["fr-CA", ["Sur cette page"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-anchor-nav></fluid-anchor-nav></div>
        `);
        const control = wrapper.querySelector<FluidAnchorNav>("fluid-anchor-nav")!;
        await control.updateComplete;
        expect(control.hasAttribute("nav-label")).to.equal(false);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);
        expect(control.navLabel).to.equal(expected[0]);
        expect(control.hasAttribute("nav-label")).to.equal(false);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidAnchorNav>(html`<fluid-anchor-nav></fluid-anchor-nav>`);
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Op deze pagina"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Auf dieser Seite"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["في هذه الصفحة"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-anchor-nav></fluid-anchor-nav></div>
      `);
      const control = wrapper.querySelector<FluidAnchorNav>("fluid-anchor-nav")!;
      control.navLabel = "On this page";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["On this page"]);
      control.setAttribute("nav-label", "On this page");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["On this page"]);
      control.removeAttribute("nav-label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Sur cette page"]);
      control.navLabel = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "navLabel", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["في هذه الصفحة"]);
    });
  });

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
    expect(el.shadowRoot!.querySelector("nav")!.getAttribute("aria-label")).to.equal("Contents");
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
    const event: FluidAnchorNavActiveChangeEvent = await listener;
    const detail: FluidAnchorNavActiveChangeDetail = event.detail;
    expect(detail).to.deep.equal({ id: "details" });
    expect(Object.keys(detail)).to.deep.equal(["id"]);
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
