import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidTag } from "./fluid-tag.js";

describe("<fluid-tag>", () => {
  describe("<fluid-tag> localized defaults", () => {
    const readLabels = (control: FluidTag) => [
      control.shadowRoot!.querySelector("button")!.getAttribute("aria-label")
    ];
    for (const [locale, expected] of [
      ["nl", ["Verwijderen"]],
      ["de", ["Entfernen"]],
      ["fr", ["Supprimer"]],
      ["es", ["Eliminar"]],
      ["ar", ["إزالة"]],
      ["fr-CA", ["Supprimer"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-tag removable></fluid-tag></div>
        `);
        const control = wrapper.querySelector<FluidTag>("fluid-tag")!;
        await control.updateComplete;
        expect(control.hasAttribute("remove-label")).to.equal(false);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);
        expect(control.removeLabel).to.equal(expected[0]);
        expect(control.hasAttribute("remove-label")).to.equal(false);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidTag>(html`<fluid-tag removable></fluid-tag>`);
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Verwijderen"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Entfernen"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["إزالة"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-tag removable></fluid-tag></div>
      `);
      const control = wrapper.querySelector<FluidTag>("fluid-tag")!;
      control.removeLabel = "Remove";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Remove"]);
      control.setAttribute("remove-label", "Remove");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Remove"]);
      control.removeAttribute("remove-label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Supprimer"]);
      control.removeLabel = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "removeLabel", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["إزالة"]);
    });
  });

  it("renders the slotted text", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag>Beta</fluid-tag>`);
    expect(el.textContent?.trim()).to.equal("Beta");
  });

  it("does not show the remove button by default", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag>Beta</fluid-tag>`);
    expect(el.shadowRoot!.querySelector(".remove")).to.be.null;
  });

  it("renders the remove button when removable", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Beta</fluid-tag>`);
    expect(el.shadowRoot!.querySelector(".remove")).to.exist;
  });

  it("names the remove button 'Remove' by default", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Beta</fluid-tag>`);
    expect(el.shadowRoot!.querySelector(".remove")!.getAttribute("aria-label")).to.equal("Remove");
  });

  it("takes the remove button's name from remove-label", async () => {
    /* The × does not always mean "drop this tag": a consumer may hang an
       action off it whose outcome is something else, and this name is the
       only thing announcing which. */
    const el = await fixture<FluidTag>(
      html`<fluid-tag removable remove-label="Back to CURO">Domain: PAYTER</fluid-tag>`
    );
    expect(el.shadowRoot!.querySelector(".remove")!.getAttribute("aria-label")).to.equal(
      "Back to CURO"
    );
  });

  it("re-names the remove button when removeLabel changes", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Beta</fluid-tag>`);
    el.removeLabel = "Back to CURO";
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".remove")!.getAttribute("aria-label")).to.equal(
      "Back to CURO"
    );
  });

  it("fires fluid-remove on remove click", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Beta</fluid-tag>`);
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!;
    setTimeout(() => button.click());
    const event = await oneEvent(el, "fluid-remove");
    expect(event).to.exist;
  });

  it("does not fire fluid-remove when disabled", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable disabled>Beta</fluid-tag>`);
    let fired = false;
    el.addEventListener("fluid-remove", () => (fired = true));
    el.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!.click();
    expect(fired).to.be.false;
  });

  it("the remove button respects --fluid-target-min (hit area)", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Beta</fluid-tag>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!;
    const rect = button.getBoundingClientRect();
    expect(rect.width).to.be.greaterThanOrEqual(44);
    expect(rect.height).to.be.greaterThanOrEqual(44);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTag>(html`<fluid-tag removable>Removable</fluid-tag>`);
    await expect(el).to.be.accessible();
  });
});
