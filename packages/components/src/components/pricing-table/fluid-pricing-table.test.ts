import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidPricingTable } from "./fluid-pricing-table.js";
import type { FluidPricingTier } from "./fluid-pricing-tier.js";

describe("<fluid-pricing-table>", () => {
  describe("<fluid-pricing-table> localized defaults", () => {
    const readLabels = (control: FluidPricingTable) => [
      control.shadowRoot!.querySelector(".base")!.getAttribute("aria-label")
    ];
    for (const [locale, expected] of [
      ["nl", ["Abonnementen"]],
      ["de", ["Tarife"]],
      ["fr", ["Offres tarifaires"]],
      ["es", ["Planes de precios"]],
      ["ar", ["خطط الأسعار"]],
      ["fr-CA", ["Offres tarifaires"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-pricing-table></fluid-pricing-table></div>
        `);
        const control = wrapper.querySelector<FluidPricingTable>("fluid-pricing-table")!;
        await control.updateComplete;
        expect(control.hasAttribute("label")).to.equal(false);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);
        expect(control.label).to.equal(expected[0]);
        expect(control.hasAttribute("label")).to.equal(false);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidPricingTable>(
        html`<fluid-pricing-table></fluid-pricing-table>`
      );
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Abonnementen"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Tarife"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["خطط الأسعار"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-pricing-table></fluid-pricing-table></div>
      `);
      const control = wrapper.querySelector<FluidPricingTable>("fluid-pricing-table")!;
      control.label = "Pricing plans";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Pricing plans"]);
      control.setAttribute("label", "Pricing plans");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Pricing plans"]);
      control.removeAttribute("label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Offres tarifaires"]);
      control.label = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "label", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["خطط الأسعار"]);
    });
  });

  it("renders a group with an accessible label", async () => {
    const el = await fixture<FluidPricingTable>(
      html`<fluid-pricing-table label="Plans"></fluid-pricing-table>`
    );
    const base = el.shadowRoot!.querySelector(".base")!;
    expect(base.getAttribute("role")).to.equal("group");
    expect(base.getAttribute("aria-label")).to.equal("Plans");
  });

  it("defaults the group label", async () => {
    const el = await fixture<FluidPricingTable>(html`<fluid-pricing-table></fluid-pricing-table>`);
    expect(el.shadowRoot!.querySelector(".base")!.getAttribute("aria-label")).to.equal(
      "Pricing plans"
    );
  });

  it("renders slotted tiers", async () => {
    const el = await fixture<FluidPricingTable>(html`
      <fluid-pricing-table>
        <fluid-pricing-tier name="Pro" price="$29"></fluid-pricing-tier>
      </fluid-pricing-table>
    `);
    const slot = el.shadowRoot!.querySelector("slot")!;
    const assigned = slot.assignedElements();
    expect(assigned.length).to.equal(1);
    expect(assigned[0]?.tagName.toLowerCase()).to.equal("fluid-pricing-tier");
  });
});

describe("<fluid-pricing-tier>", () => {
  describe("<fluid-pricing-tier> localized defaults", () => {
    const readLabels = (control: FluidPricingTier) => [
      control.shadowRoot!.querySelector(".badge")!.textContent!.trim()
    ];
    for (const [locale, expected] of [
      ["nl", ["Populairst"]],
      ["de", ["Am beliebtesten"]],
      ["fr", ["Le plus populaire"]],
      ["es", ["Más popular"]],
      ["ar", ["الأكثر شيوعًا"]],
      ["fr-CA", ["Le plus populaire"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-pricing-tier featured name="Application plan" price="$19"></fluid-pricing-tier>
          </div>
        `);
        const control = wrapper.querySelector<FluidPricingTier>("fluid-pricing-tier")!;
        await control.updateComplete;
        expect(control.hasAttribute("featured-label")).to.equal(false);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);
        expect(control.featuredLabel).to.equal(expected[0]);
        expect(control.hasAttribute("featured-label")).to.equal(false);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidPricingTier>(
        html`<fluid-pricing-tier featured name="Application plan" price="$19"></fluid-pricing-tier>`
      );
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Populairst"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Am beliebtesten"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["الأكثر شيوعًا"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en">
          <fluid-pricing-tier featured name="Application plan" price="$19"></fluid-pricing-tier>
        </div>
      `);
      const control = wrapper.querySelector<FluidPricingTier>("fluid-pricing-tier")!;
      control.featuredLabel = "Most popular";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Most popular"]);
      control.setAttribute("featured-label", "Most popular");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Most popular"]);
      control.removeAttribute("featured-label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Le plus populaire"]);
      control.featuredLabel = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "featuredLabel", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["الأكثر شيوعًا"]);
    });
  });

  it("renders the name as a heading with the default level", async () => {
    const el = await fixture<FluidPricingTier>(
      html`<fluid-pricing-tier name="Pro"></fluid-pricing-tier>`
    );
    const name = el.shadowRoot!.querySelector(".name")!;
    expect(name.textContent?.trim()).to.equal("Pro");
    expect(name.getAttribute("role")).to.equal("heading");
    expect(name.getAttribute("aria-level")).to.equal("3");
  });

  it("honors a custom heading level, clamped to 2-6", async () => {
    const el = await fixture<FluidPricingTier>(
      html`<fluid-pricing-tier name="Pro" heading-level="2"></fluid-pricing-tier>`
    );
    expect(el.shadowRoot!.querySelector(".name")!.getAttribute("aria-level")).to.equal("2");

    el.headingLevel = 9;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".name")!.getAttribute("aria-level")).to.equal("6");
  });

  it("renders price and period", async () => {
    const el = await fixture<FluidPricingTier>(
      html`<fluid-pricing-tier name="Pro" price="$29" period="/mo"></fluid-pricing-tier>`
    );
    expect(el.shadowRoot!.querySelector(".amount")!.textContent?.trim()).to.equal("$29");
    expect(el.shadowRoot!.querySelector(".period")!.textContent?.trim()).to.equal("/mo");
  });

  it("omits the period when not set", async () => {
    const el = await fixture<FluidPricingTier>(
      html`<fluid-pricing-tier name="Hobby" price="Free"></fluid-pricing-tier>`
    );
    expect(el.shadowRoot!.querySelector(".period")).to.be.null;
  });

  it("renders the features list as a ul", async () => {
    const el = await fixture<FluidPricingTier>(html`
      <fluid-pricing-tier name="Pro" price="$29">
        <li>One</li>
        <li>Two</li>
      </fluid-pricing-tier>
    `);
    const list = el.shadowRoot!.querySelector(".features")!;
    expect(list.tagName.toLowerCase()).to.equal("ul");
    const slot = list.querySelector("slot")!;
    expect(slot.assignedElements().length).to.equal(2);
  });

  it("does not show the featured badge by default", async () => {
    const el = await fixture<FluidPricingTier>(
      html`<fluid-pricing-tier name="Pro"></fluid-pricing-tier>`
    );
    expect(el.shadowRoot!.querySelector(".badge")).to.be.null;
    expect(el.hasAttribute("featured")).to.be.false;
  });

  it("reflects featured and shows the badge", async () => {
    const el = await fixture<FluidPricingTier>(
      html`<fluid-pricing-tier name="Pro" featured></fluid-pricing-tier>`
    );
    expect(el.hasAttribute("featured")).to.be.true;
    const badge = el.shadowRoot!.querySelector(".badge")!;
    expect(badge).to.exist;
    expect(badge.textContent?.trim()).to.equal("Most popular");
  });

  it("uses a custom featured label", async () => {
    const el = await fixture<FluidPricingTier>(
      html`<fluid-pricing-tier
        name="Pro"
        featured
        featured-label="Best value"
      ></fluid-pricing-tier>`
    );
    expect(el.shadowRoot!.querySelector(".badge")!.textContent?.trim()).to.equal("Best value");
  });

  it("exposes the action slot", async () => {
    const el = await fixture<FluidPricingTier>(html`
      <fluid-pricing-tier name="Pro" price="$29">
        <button slot="action">Buy</button>
      </fluid-pricing-tier>
    `);
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="action"]')!;
    expect(slot.assignedElements().length).to.equal(1);
  });

  it("passes an a11y audit (default + featured)", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
        "
      >
        <fluid-pricing-table>
          <fluid-pricing-tier name="Starter" price="$0" period="/mo">
            <li>One project</li>
            <li>Community support</li>
            <button slot="action">Choose Starter</button>
          </fluid-pricing-tier>
          <fluid-pricing-tier name="Pro" price="$29" period="/mo" featured>
            <li>Unlimited projects</li>
            <li>Priority support</li>
            <button slot="action">Choose Pro</button>
          </fluid-pricing-tier>
        </fluid-pricing-table>
      </div>
    `);
    const table = wrapper.querySelector<FluidPricingTable>("fluid-pricing-table")!;
    await elementUpdated(table);
    await aTimeout(20);
    await expect(wrapper).to.be.accessible();
  });
});
