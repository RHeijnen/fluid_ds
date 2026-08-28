import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../button/define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidLoadingOverlay } from "./fluid-loading-overlay.js";

describe("<fluid-loading-overlay>", () => {
  describe("<fluid-loading-overlay> localized defaults", () => {
    const readLabels = (control: FluidLoadingOverlay) => [
      control.shadowRoot!.querySelector(".overlay")!.getAttribute("aria-label")
    ];
    for (const [locale, expected] of [
      ["nl", ["Laden"]],
      ["de", ["Wird geladen"]],
      ["fr", ["Chargement"]],
      ["es", ["Cargando"]],
      ["ar", ["جارٍ التحميل"]],
      ["fr-CA", ["Chargement"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-loading-overlay active></fluid-loading-overlay></div>
        `);
        const control = wrapper.querySelector<FluidLoadingOverlay>("fluid-loading-overlay")!;
        await control.updateComplete;
        expect(control.hasAttribute("label")).to.equal(false);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);

        expect(control.hasAttribute("label")).to.equal(false);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidLoadingOverlay>(
        html`<fluid-loading-overlay active></fluid-loading-overlay>`
      );
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Laden"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Wird geladen"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["جارٍ التحميل"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-loading-overlay active></fluid-loading-overlay></div>
      `);
      const control = wrapper.querySelector<FluidLoadingOverlay>("fluid-loading-overlay")!;
      control.label = "Loading";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Loading"]);
      control.setAttribute("label", "Loading");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Loading"]);
      control.removeAttribute("label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Chargement"]);
      control.label = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "label", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["جارٍ التحميل"]);
    });
  });

  it("renders the slotted content", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay><p>Content</p></fluid-loading-overlay>`
    );
    expect(el.querySelector("p")?.textContent).to.equal("Content");
  });

  it("does not render the overlay layer when inactive", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay><p>Content</p></fluid-loading-overlay>`
    );
    expect(el.shadowRoot!.querySelector(".overlay")).to.be.null;
    expect(el.hasAttribute("aria-busy")).to.be.false;
  });

  it("renders the overlay with a spinner when active", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active><p>Content</p></fluid-loading-overlay>`
    );
    const overlay = el.shadowRoot!.querySelector(".overlay");
    expect(overlay).to.exist;
    expect(el.shadowRoot!.querySelector("fluid-spinner")).to.exist;
  });

  it("sets aria-busy on the host while active", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active><p>Content</p></fluid-loading-overlay>`
    );
    expect(el.getAttribute("aria-busy")).to.equal("true");
  });

  it("clears aria-busy when toggled inactive", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active><p>Content</p></fluid-loading-overlay>`
    );
    el.active = false;
    await elementUpdated(el);
    expect(el.hasAttribute("aria-busy")).to.be.false;
    expect(el.shadowRoot!.querySelector(".overlay")).to.be.null;
  });

  it("gates focused content while busy and restores focus when idle", async () => {
    const el = await fixture<FluidLoadingOverlay>(html`
      <fluid-loading-overlay><button>Continue</button></fluid-loading-overlay>
    `);
    const button = el.querySelector("button")!;
    button.focus();
    expect(document.activeElement).to.equal(button);

    el.active = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".content")!.hasAttribute("inert")).to.be.true;
    expect(document.activeElement).not.to.equal(button);
    button.focus();
    expect(document.activeElement).not.to.equal(button);

    el.active = false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".content")!.hasAttribute("inert")).to.be.false;
    expect(document.activeElement).to.equal(button);
  });

  it("restores focus through a shadow-owning Fluid control", async () => {
    const el = await fixture<FluidLoadingOverlay>(html`
      <fluid-loading-overlay><fluid-button>Continue</fluid-button></fluid-loading-overlay>
    `);
    const button = el.querySelector<HTMLElement>("fluid-button")!;
    const inner = button.shadowRoot!.querySelector<HTMLButtonElement>("button")!;
    button.focus();
    expect(document.activeElement).to.equal(button);
    expect(button.shadowRoot!.activeElement).to.equal(inner);

    el.active = true;
    await el.updateComplete;
    expect(document.activeElement).not.to.equal(button);
    expect(button.shadowRoot!.activeElement).not.to.equal(inner);

    el.active = false;
    await el.updateComplete;
    expect(document.activeElement).to.equal(button);
    expect(button.shadowRoot!.activeElement).to.equal(inner);
  });

  it("reacquires busy and localized status state after reconnect", async () => {
    const root = await fixture<HTMLDivElement>(html`<div lang="nl"></div>`);
    const el = document.createElement("fluid-loading-overlay") as FluidLoadingOverlay;
    el.active = true;
    root.append(el);
    await el.updateComplete;
    el.remove();
    root.append(el);
    await el.updateComplete;

    expect(el.getAttribute("aria-busy")).to.equal("true");
    expect(el.shadowRoot!.querySelector(".content")!.hasAttribute("inert")).to.be.true;
    expect(el.shadowRoot!.querySelector("[role=status]")!.getAttribute("aria-label")).to.equal(
      "Laden"
    );
  });

  it("reflects the active property to an attribute", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay><p>Content</p></fluid-loading-overlay>`
    );
    el.active = true;
    await elementUpdated(el);
    expect(el.hasAttribute("active")).to.be.true;
  });

  it("exposes the overlay as a status live region", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active label="Saving"><p>Content</p></fluid-loading-overlay>`
    );
    const overlay = el.shadowRoot!.querySelector(".overlay")!;
    expect(overlay.getAttribute("role")).to.equal("status");
    expect(overlay.getAttribute("aria-live")).to.equal("polite");
    expect(overlay.getAttribute("aria-label")).to.equal("Saving");
  });

  it("falls back to a default accessible name when no label is set", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active><p>Content</p></fluid-loading-overlay>`
    );
    const overlay = el.shadowRoot!.querySelector(".overlay")!;
    expect(overlay.getAttribute("aria-label")).to.equal("Loading");
    expect(el.shadowRoot!.querySelector(".label")).to.be.null;
  });

  it("renders the visible label text when provided", async () => {
    const el = await fixture<FluidLoadingOverlay>(
      html`<fluid-loading-overlay active label="Uploading"><p>Content</p></fluid-loading-overlay>`
    );
    expect(el.shadowRoot!.querySelector(".label")?.textContent).to.equal("Uploading");
  });

  it("collapses the fade-in duration when --fluid-motion is 0", async () => {
    const wrapper = await fixture(html`
      <div style="--fluid-motion:0;">
        <fluid-loading-overlay active label="Loading"><p>Content</p></fluid-loading-overlay>
      </div>
    `);
    const el = wrapper.querySelector<FluidLoadingOverlay>("fluid-loading-overlay")!;
    await elementUpdated(el);
    const overlay = el.shadowRoot!.querySelector(".overlay")!;
    const duration = getComputedStyle(overlay).animationDuration;
    // calc(var(--fluid-duration-fast) * 0) must resolve to a zero-length time.
    expect(parseFloat(duration)).to.equal(0);
  });

  it("passes a11y audit", async () => {
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
          --fluid-motion:0;
        "
      >
        <fluid-loading-overlay active label="Loading data">
          <p>Gated content</p>
        </fluid-loading-overlay>
      </div>
    `);
    const overlay = el.querySelector<FluidLoadingOverlay>("fluid-loading-overlay")!;
    await elementUpdated(overlay);
    await aTimeout(20);
    await expect(overlay).to.be.accessible();
  });
});
