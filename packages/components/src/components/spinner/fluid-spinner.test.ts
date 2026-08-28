import { expect, fixture, html } from "@open-wc/testing";
import { emulateMedia } from "@web/test-runner-commands";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidSpinner } from "./fluid-spinner.js";

describe("<fluid-spinner> host label ownership", () => {
  it("keeps the published arialabel markup alias while exposing canonical host ARIA", async () => {
    const control = await fixture<HTMLElement & { updateComplete: Promise<boolean> }>(
      '<fluid-spinner lang="nl" arialabel="Legacy application label"></fluid-spinner>'
    );
    await control.updateComplete;
    expect(control.ariaLabel).to.equal("Legacy application label");
    expect(control.getAttribute("aria-label")).to.equal("Legacy application label");
    control.setAttribute("arialabel", "");
    await control.updateComplete;
    expect(control.getAttribute("aria-label")).to.equal("");
    control.removeAttribute("arialabel");
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
    expect(control.getAttribute("aria-label")).to.equal("Laden");
  });
  type NamedControl = HTMLElement & { updateComplete: Promise<boolean> };
  const mount = () =>
    fixture<HTMLDivElement>('<div lang="en"><fluid-spinner></fluid-spinner></div>');
  async function settle(control: NamedControl): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }

  for (const [locale, expected] of [
    ["nl", "Laden"],
    ["de", "Wird geladen"],
    ["fr", "Chargement"],
    ["es", "Cargando"],
    ["ar", "جارٍ التحميل"],
    ["fr-CA", "Chargement"]
  ] as const) {
    it(`updates the owned host name for ${locale} and after reconnect`, async () => {
      const wrapper = await mount();
      const control = wrapper.firstElementChild as NamedControl;
      expect(control.getAttribute("aria-label")).to.equal("Loading");
      wrapper.lang = locale;
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(expected);
      control.remove();
      wrapper.lang = "nl";
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal("Laden");
    });
  }

  for (const explicit of ["", "Loading", "Application name"]) {
    it(`preserves initially authored ${JSON.stringify(explicit)} through locale changes and reconnect`, async () => {
      const control = document.createElement("fluid-spinner") as NamedControl;
      control.setAttribute("aria-label", explicit);
      const wrapper = await fixture<HTMLDivElement>('<div lang="nl"></div>');
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
      wrapper.lang = "fr";
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
      control.remove();
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
      control.removeAttribute("aria-label");
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal("Chargement");
    });
  }

  it("recognizes late same-value writes as application ownership and restores removed overrides immediately", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Loading", "", "Application name"]) {
      control.setAttribute("aria-label", explicit);
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.removeAttribute("aria-label");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Chargement" : "Laden"
    );
  });

  it("preserves native ariaLabel property writes, including equal defaults, empty strings and null reset", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Loading", "", "Property name"]) {
      control.ariaLabel = explicit;
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.ariaLabel).to.equal(explicit);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.ariaLabel = null;
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Chargement" : "Laden"
    );
  });

  it("withdraws only its owned fallback while aria-labelledby exists and restores it on removal", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    const label = document.createElement("span");
    label.id = "application-spinner-label";
    label.textContent = "Application heading";
    wrapper.append(label);
    control.setAttribute("aria-labelledby", label.id);
    await settle(control);
    expect(control.hasAttribute("aria-label")).to.equal(false);
    wrapper.lang = "fr";
    await settle(control);
    expect(control.getAttribute("aria-labelledby")).to.equal(label.id);
    expect(control.hasAttribute("aria-label")).to.equal(false);
    control.removeAttribute("aria-labelledby");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Chargement");
  });

  it("never removes an authored aria-label when aria-labelledby is added or removed", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    control.setAttribute("aria-label", "Author fallback");
    control.setAttribute("aria-labelledby", "application-external-label");
    wrapper.lang = "fr";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Author fallback");
    control.removeAttribute("aria-labelledby");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Author fallback");
  });

  it("retains ownership after detached edits and follows a closed-shadow locale context", async () => {
    const wrapper = await fixture<HTMLDivElement>('<div lang="en"></div>');
    const context = document.createElement("div");
    const root = context.attachShadow({ mode: "closed" });
    const control = document.createElement("fluid-spinner") as NamedControl;
    root.append(control);
    wrapper.append(context);
    await settle(control);
    context.lang = "fr-CA";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Chargement");
    control.remove();
    control.setAttribute("aria-label", "Loading");
    context.lang = "nl";
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Loading");
    control.remove();
    control.removeAttribute("aria-label");
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Laden");
  });
});

describe("<fluid-spinner>", () => {
  it("renders an SVG", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    expect(el.shadowRoot!.querySelector("svg")).to.exist;
  });

  it("has role=progressbar with an accessible name", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    expect(el.getAttribute("role")).to.equal("progressbar");
    expect(el.getAttribute("aria-label")).to.equal("Loading");
  });

  it("respects a custom aria-label", async () => {
    const el = await fixture<FluidSpinner>(
      html`<fluid-spinner aria-label="Fetching"></fluid-spinner>`
    );
    expect(el.getAttribute("aria-label")).to.equal("Fetching");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder. */

  it("indicator stroke reads the --fluid-spinner-* override ladder", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    el.style.setProperty("--fluid-spinner-color", "rgb(1, 2, 3)");
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<SVGElement>(".indicator")!;
    expect(getComputedStyle(indicator).stroke).to.equal("rgb(1, 2, 3)");
  });

  it("uses distinct system strokes in forced-colors mode", async () => {
    const initiallyForced = matchMedia("(forced-colors: active)").matches;
    try {
      await emulateMedia({ forcedColors: "active" });
      const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color = "GrayText";
      const grayText = getComputedStyle(probe).color;
      probe.style.color = "CanvasText";
      const canvasText = getComputedStyle(probe).color;
      probe.remove();
      expect(getComputedStyle(el.shadowRoot!.querySelector(".track")!).stroke).to.equal(grayText);
      expect(getComputedStyle(el.shadowRoot!.querySelector(".indicator")!).stroke).to.equal(
        canvasText
      );
    } finally {
      await emulateMedia({ forcedColors: initiallyForced ? "active" : "none" });
    }
  });

  /* Reduced-motion: the rotation must stop entirely, not just slow down. */

  it("kills the spin animation under prefers-reduced-motion: reduce", async () => {
    const initiallyReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      await emulateMedia({ reducedMotion: "no-preference" });
      const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
      const base = el.shadowRoot!.querySelector<SVGElement>(".base")!;
      expect(getComputedStyle(base).animationName).to.equal("spin");
      expect(base.getAnimations()).to.have.lengthOf(1);

      // Emulate the browser media feature, not just the JavaScript query result.
      await emulateMedia({ reducedMotion: "reduce" });
      expect(matchMedia("(prefers-reduced-motion: reduce)").matches).to.equal(true);
      expect(getComputedStyle(base).animationName).to.equal("none");
      expect(base.getAnimations()).to.have.lengthOf(0);

      await emulateMedia({ reducedMotion: "no-preference" });
      expect(getComputedStyle(base).animationName).to.equal("spin");
      expect(base.getAnimations()).to.have.lengthOf(1);
    } finally {
      await emulateMedia({ reducedMotion: initiallyReduced ? "reduce" : "no-preference" });
    }
  });
});
