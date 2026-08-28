import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidAppBar } from "./fluid-app-bar.js";

describe("<fluid-app-bar>", () => {
  describe("<fluid-app-bar> localized defaults", () => {
    const readLabels = (control: FluidAppBar) => [
      control.shadowRoot!.querySelector(".menu-button")!.getAttribute("aria-label")
    ];
    for (const [locale, expected] of [
      ["nl", ["Menu openen"]],
      ["de", ["Menü öffnen"]],
      ["fr", ["Ouvrir le menu"]],
      ["es", ["Abrir menú"]],
      ["ar", ["فتح القائمة"]],
      ["fr-CA", ["Ouvrir le menu"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-app-bar menu-button></fluid-app-bar></div>
        `);
        const control = wrapper.querySelector<FluidAppBar>("fluid-app-bar")!;
        await control.updateComplete;
        expect(control.hasAttribute("menu-label")).to.equal(false);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);
        expect(control.menuLabel).to.equal(expected[0]);
        expect(control.hasAttribute("menu-label")).to.equal(false);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidAppBar>(html`<fluid-app-bar menu-button></fluid-app-bar>`);
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Menu openen"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Menü öffnen"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["فتح القائمة"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-app-bar menu-button></fluid-app-bar></div>
      `);
      const control = wrapper.querySelector<FluidAppBar>("fluid-app-bar")!;
      control.menuLabel = "Open menu";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Open menu"]);
      control.setAttribute("menu-label", "Open menu");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Open menu"]);
      control.removeAttribute("menu-label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Ouvrir le menu"]);
      control.menuLabel = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "menuLabel", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["فتح القائمة"]);
    });
  });

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
    const el = await fixture<FluidAppBar>(html`<fluid-app-bar menu-button></fluid-app-bar>`);
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
    const el = await fixture<FluidAppBar>(html`<fluid-app-bar menu-button></fluid-app-bar>`);
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
