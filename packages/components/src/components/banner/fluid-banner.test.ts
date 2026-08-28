import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidBanner, FluidBannerDismissEvent } from "../../index.js";

// @ts-expect-error Banner dismissal detail is exactly null.
const invalidBannerEvent: FluidBannerDismissEvent = new CustomEvent("fluid-dismiss", {
  detail: {}
});
void invalidBannerEvent;

describe("<fluid-banner>", () => {
  describe("<fluid-banner> localized defaults", () => {
    it("updates variant-specific default names while retaining an explicit application label", async () => {
      const control = await fixture<FluidBanner>(
        html`<fluid-banner lang="nl" variant="danger"></fluid-banner>`
      );
      const label = () => control.shadowRoot!.querySelector(".base")!.getAttribute("aria-label");
      expect(label()).to.equal("Waarschuwing");
      control.variant = "info";
      await control.updateComplete;
      expect(label()).to.equal("Melding");
      control.label = "Alert";
      control.variant = "warning";
      control.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(label()).to.equal("Alert");
    });

    const readLabels = (control: FluidBanner) => [
      control.shadowRoot!.querySelector(".base")!.getAttribute("aria-label")
    ];
    for (const [locale, expected] of [
      ["nl", ["Waarschuwing"]],
      ["de", ["Warnung"]],
      ["fr", ["Alerte"]],
      ["es", ["Alerta"]],
      ["ar", ["تنبيه"]],
      ["fr-CA", ["Alerte"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-banner variant="danger"></fluid-banner></div>
        `);
        const control = wrapper.querySelector<FluidBanner>("fluid-banner")!;
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
      const control = await fixture<FluidBanner>(
        html`<fluid-banner variant="danger"></fluid-banner>`
      );
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Waarschuwing"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Warnung"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["تنبيه"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-banner variant="danger"></fluid-banner></div>
      `);
      const control = wrapper.querySelector<FluidBanner>("fluid-banner")!;
      control.label = "Alert";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Alert"]);
      control.setAttribute("label", "Alert");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Alert"]);
      control.removeAttribute("label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Alerte"]);
      control.label = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "label", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["تنبيه"]);
    });
  });

  it("renders the slotted content", async () => {
    const el = await fixture<FluidBanner>(html`<fluid-banner>Site-wide notice.</fluid-banner>`);
    expect(el.textContent?.trim()).to.include("Site-wide notice.");
  });

  it("defaults to the neutral variant", async () => {
    const el = await fixture<FluidBanner>(html`<fluid-banner>Body</fluid-banner>`);
    expect(el.variant).to.equal("neutral");
    expect(el.getAttribute("variant")).to.equal("neutral");
  });

  it("uses role=status for info and success (polite)", async () => {
    const info = await fixture<FluidBanner>(html`<fluid-banner variant="info">Body</fluid-banner>`);
    const success = await fixture<FluidBanner>(
      html`<fluid-banner variant="success">Body</fluid-banner>`
    );
    expect(info.shadowRoot!.querySelector("[part='base']")!.getAttribute("role")).to.equal(
      "status"
    );
    expect(success.shadowRoot!.querySelector("[part='base']")!.getAttribute("role")).to.equal(
      "status"
    );
  });

  it("uses role=region for warning, danger, and neutral", async () => {
    for (const variant of ["warning", "danger", "neutral"] as const) {
      const el = await fixture<FluidBanner>(
        html`<fluid-banner variant=${variant}>Body</fluid-banner>`
      );
      expect(el.shadowRoot!.querySelector("[part='base']")!.getAttribute("role")).to.equal(
        "region"
      );
    }
  });

  it("gives the region a default accessible name from the variant", async () => {
    const danger = await fixture<FluidBanner>(
      html`<fluid-banner variant="danger">Body</fluid-banner>`
    );
    const neutral = await fixture<FluidBanner>(
      html`<fluid-banner variant="neutral">Body</fluid-banner>`
    );
    expect(danger.shadowRoot!.querySelector("[part='base']")!.getAttribute("aria-label")).to.equal(
      "Alert"
    );
    expect(neutral.shadowRoot!.querySelector("[part='base']")!.getAttribute("aria-label")).to.equal(
      "Notification"
    );
  });

  it("honors a custom label", async () => {
    const el = await fixture<FluidBanner>(
      html`<fluid-banner label="Cookie notice">Body</fluid-banner>`
    );
    expect(el.shadowRoot!.querySelector("[part='base']")!.getAttribute("aria-label")).to.equal(
      "Cookie notice"
    );
  });

  it("hides the dismiss button by default", async () => {
    const el = await fixture<FluidBanner>(html`<fluid-banner>Body</fluid-banner>`);
    expect(el.shadowRoot!.querySelector(".dismiss")).to.be.null;
  });

  it("renders a dismiss button labeled Dismiss when dismissible", async () => {
    const el = await fixture<FluidBanner>(html`<fluid-banner dismissible>Body</fluid-banner>`);
    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>(".dismiss");
    expect(btn).to.exist;
    expect(btn!.getAttribute("aria-label")).to.equal("Dismiss");
  });

  it("fires fluid-dismiss and removes itself when the dismiss button is clicked", async () => {
    const host = await fixture(html`<div><fluid-banner dismissible>Body</fluid-banner></div>`);
    const el = host.querySelector<FluidBanner>("fluid-banner")!;
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".dismiss")!;
    setTimeout(() => button.click());
    const event = (await oneEvent(el, "fluid-dismiss")) as FluidBannerDismissEvent;
    expect(event.detail).to.equal(null);
    await aTimeout(0);
    expect(host.querySelector("fluid-banner")).to.be.null;
  });

  it("can be reinserted and dismissed again without duplicating events", async () => {
    const host = await fixture<HTMLDivElement>(
      html`<div><fluid-banner dismissible>Body</fluid-banner></div>`
    );
    const el = host.querySelector<FluidBanner>("fluid-banner")!;
    let dismisses = 0;
    el.addEventListener("fluid-dismiss", () => dismisses++);

    el.shadowRoot!.querySelector<HTMLButtonElement>(".dismiss")!.click();
    expect(el.isConnected).to.equal(false);
    expect(dismisses).to.equal(1);

    host.append(el);
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>(".dismiss")!.click();
    expect(el.isConnected).to.equal(false);
    expect(dismisses).to.equal(2);
  });

  it("keeps one live root while content and documented severity roles change", async () => {
    const el = await fixture<FluidBanner>(
      html`<fluid-banner variant="info">Initial notice</fluid-banner>`
    );
    const liveRoot = el.shadowRoot!.querySelector<HTMLElement>("[part='base']")!;
    expect(liveRoot.getAttribute("role")).to.equal("status");

    el.textContent = "Updated notice";
    await aTimeout(0);
    expect(el.shadowRoot!.querySelector("[part='base']")).to.equal(liveRoot);
    const contentSlot = liveRoot.querySelector<HTMLSlotElement>(".content slot")!;
    expect(
      contentSlot
        .assignedNodes({ flatten: true })
        .map((node) => node.textContent)
        .join("")
    ).to.equal("Updated notice");

    el.variant = "warning";
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("[part='base']")).to.equal(liveRoot);
    expect(liveRoot.getAttribute("role")).to.equal("region");
    expect(liveRoot.getAttribute("aria-label")).to.equal("Alert");

    el.variant = "success";
    await el.updateComplete;
    expect(liveRoot.getAttribute("role")).to.equal("status");
    expect(liveRoot.getAttribute("aria-label")).to.equal("Notification");
  });

  it("renders trailing actions slot content", async () => {
    const el = await fixture<FluidBanner>(html`
      <fluid-banner>
        Body
        <button slot="actions">Act</button>
      </fluid-banner>
    `);
    await elementUpdated(el);
    const assigned = el
      .shadowRoot!.querySelector<HTMLSlotElement>("slot[name='actions']")!
      .assignedElements();
    expect(assigned.length).to.equal(1);
  });

  it("background reads the --fluid-banner-* override ladder", async () => {
    const el = await fixture<FluidBanner>(html`<fluid-banner>Body</fluid-banner>`);
    el.style.setProperty("--fluid-banner-bg", "rgb(1, 2, 3)");
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the dismiss button respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidBanner>(html`<fluid-banner dismissible>Body</fluid-banner>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await elementUpdated(el);
    const dismiss = el.shadowRoot!.querySelector<HTMLElement>(".dismiss")!;
    expect(dismiss.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });

  it("passes a11y audit", async () => {
    const wrapper = await fixture(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-success-base:#059669;
          --fluid-success-text:#ffffff;
          --fluid-danger-base:#dc2626;
          --fluid-danger-text:#ffffff;
          --fluid-warning-base:#d97706;
          --fluid-focus-ring-color:#4f46e5;
          --fluid-motion:0;
        "
      >
        <fluid-banner variant="warning" dismissible label="Maintenance notice">
          Scheduled maintenance this weekend.
          <button slot="actions">Learn more</button>
        </fluid-banner>
      </div>
    `);
    const el = wrapper.querySelector<FluidBanner>("fluid-banner")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
