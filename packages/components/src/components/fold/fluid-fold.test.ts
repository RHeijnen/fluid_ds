import { expect, fixture, html, elementUpdated, oneEvent } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidFold } from "./fluid-fold.js";

const toggleOf = (el: FluidFold) => el.shadowRoot!.querySelector<HTMLButtonElement>(".toggle")!;
const bodyOf = (el: FluidFold) => el.shadowRoot!.querySelector<HTMLElement>(".body")!;

describe("<fluid-fold>", () => {
  describe("<fluid-fold> localized defaults", () => {
    it("preserves the explicit expanded label when the language changes", async () => {
      const control = await fixture<FluidFold>(
        html`<fluid-fold lang="nl" open-label="Application expanded"></fluid-fold>`
      );
      const label = () =>
        control.shadowRoot!.querySelector(".label-group span")!.textContent!.trim();
      expect(label()).to.equal("Meer tonen");
      control.open = true;
      control.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(label()).to.equal("Application expanded");
      control.open = false;
      await control.updateComplete;
      expect(label()).to.equal("عرض المزيد");
    });

    const readLabels = (control: FluidFold) => [
      control.shadowRoot!.querySelector(".label-group span")!.textContent!.trim()
    ];
    for (const [locale, expected] of [
      ["nl", ["Meer tonen"]],
      ["de", ["Mehr anzeigen"]],
      ["fr", ["Afficher plus"]],
      ["es", ["Mostrar más"]],
      ["ar", ["عرض المزيد"]],
      ["fr-CA", ["Afficher plus"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-fold></fluid-fold></div>
        `);
        const control = wrapper.querySelector<FluidFold>("fluid-fold")!;
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
      const control = await fixture<FluidFold>(html`<fluid-fold></fluid-fold>`);
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Meer tonen"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Mehr anzeigen"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["عرض المزيد"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-fold></fluid-fold></div>
      `);
      const control = wrapper.querySelector<FluidFold>("fluid-fold")!;
      control.label = "Show more";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Show more"]);
      control.setAttribute("label", "Show more");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Show more"]);
      control.removeAttribute("label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Afficher plus"]);
      control.label = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "label", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["عرض المزيد"]);
    });
  });

  it("starts folded: content hidden, disclosure collapsed", async () => {
    const el = await fixture<FluidFold>(html`<fluid-fold><p>Underneath</p></fluid-fold>`);
    expect(el.open).to.equal(false);
    expect(toggleOf(el).getAttribute("aria-expanded")).to.equal("false");
    expect(bodyOf(el).hasAttribute("hidden")).to.equal(true);
  });

  it("wires the disclosure contract: button controls the labelled region", async () => {
    const el = await fixture<FluidFold>(html`<fluid-fold></fluid-fold>`);
    const toggle = toggleOf(el);
    const body = bodyOf(el);
    expect(toggle.getAttribute("aria-controls")).to.equal(body.id);
    expect(body.getAttribute("role")).to.equal("region");
    expect(body.getAttribute("aria-labelledby")).to.equal(toggle.id);
  });

  it("unfolds on click and reports the transition", async () => {
    const el = await fixture<FluidFold>(html`<fluid-fold><p>Underneath</p></fluid-fold>`);
    setTimeout(() => toggleOf(el).click());
    const event = await oneEvent(el, "fluid-toggle");
    expect(event.detail.open).to.equal(true);
    await elementUpdated(el);
    expect(toggleOf(el).getAttribute("aria-expanded")).to.equal("true");
    expect(bodyOf(el).hasAttribute("hidden")).to.equal(false);
  });

  it("does not fire a toggle just for being mounted open", async () => {
    const heard: Event[] = [];
    document.addEventListener("fluid-toggle", (event) => heard.push(event), {
      once: true
    });
    await fixture<FluidFold>(html`<fluid-fold open></fluid-fold>`);
    expect(heard).to.have.length(0);
  });

  it("says its other label while open, when given one", async () => {
    const el = await fixture<FluidFold>(
      html`<fluid-fold label="Show more" open-label="Show less"></fluid-fold>`
    );
    expect(toggleOf(el).textContent).to.contain("Show more");
    el.open = true;
    await elementUpdated(el);
    expect(toggleOf(el).textContent).to.contain("Show less");
  });

  it("ignores a click while disabled", async () => {
    const el = await fixture<FluidFold>(html`<fluid-fold disabled></fluid-fold>`);
    toggleOf(el).click();
    await elementUpdated(el);
    expect(el.open).to.equal(false);
  });

  it("toggles from the imperative API", async () => {
    const el = await fixture<FluidFold>(html`<fluid-fold></fluid-fold>`);
    el.show();
    await elementUpdated(el);
    expect(el.open).to.equal(true);
    el.hide();
    await elementUpdated(el);
    expect(el.open).to.equal(false);
  });

  it("passes a11y audit folded and unfolded", async () => {
    const el = await fixture<FluidFold>(html`<fluid-fold><p>Underneath</p></fluid-fold>`);
    await expect(el).to.be.accessible();
    el.open = true;
    await elementUpdated(el);
    await expect(el).to.be.accessible();
  });
});
