import { expect, fixture, html } from "@open-wc/testing";
import { emulateMedia } from "@web/test-runner-commands";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidSkeleton } from "./fluid-skeleton.js";

describe("<fluid-skeleton> host label ownership", () => {
  type NamedControl = HTMLElement & { updateComplete: Promise<boolean> };
  const mount = () =>
    fixture<HTMLDivElement>('<div lang="en"><fluid-skeleton></fluid-skeleton></div>');
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
      const control = document.createElement("fluid-skeleton") as NamedControl;
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
    label.id = "application-skeleton-label";
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
    const control = document.createElement("fluid-skeleton") as NamedControl;
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

describe("<fluid-skeleton>", () => {
  it("renders with pulse effect by default", async () => {
    const el = await fixture<FluidSkeleton>(html`<fluid-skeleton></fluid-skeleton>`);
    expect(el.effect).to.equal("pulse");
  });

  it("sets aria-busy=true automatically", async () => {
    const el = await fixture<FluidSkeleton>(html`<fluid-skeleton></fluid-skeleton>`);
    expect(el.getAttribute("aria-busy")).to.equal("true");
  });

  it("respects an existing aria-busy attribute", async () => {
    const el = await fixture<FluidSkeleton>(
      html`<fluid-skeleton aria-busy="false"></fluid-skeleton>`
    );
    expect(el.getAttribute("aria-busy")).to.equal("false");
  });

  it("stops pulse and sheen animation under reduced motion", async () => {
    const initiallyReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      await emulateMedia({ reducedMotion: "no-preference" });
      for (const effect of ["pulse", "sheen"] as const) {
        const el = await fixture<FluidSkeleton>(
          html`<fluid-skeleton effect=${effect}></fluid-skeleton>`
        );
        const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
        const pseudo = effect === "sheen" ? "::after" : null;
        expect(getComputedStyle(base, pseudo).animationName).to.equal(effect);

        await emulateMedia({ reducedMotion: "reduce" });
        expect(matchMedia("(prefers-reduced-motion: reduce)").matches).to.equal(true);
        expect(getComputedStyle(base, pseudo).animationName).to.equal("none");
        expect(base.getAnimations()).to.have.lengthOf(0);
        await emulateMedia({ reducedMotion: "no-preference" });
      }
    } finally {
      await emulateMedia({ reducedMotion: initiallyReduced ? "reduce" : "no-preference" });
    }
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSkeleton>(
      html`<fluid-skeleton aria-label="Loading"></fluid-skeleton>`
    );
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder. */

  it("base color reads the --fluid-skeleton-* override ladder", async () => {
    const el = await fixture<FluidSkeleton>(html`<fluid-skeleton></fluid-skeleton>`);
    el.style.setProperty("--fluid-skeleton-color", "rgb(1, 2, 3)");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("uses a contained system-color silhouette in forced-colors mode", async () => {
    const initiallyForced = matchMedia("(forced-colors: active)").matches;
    const el = await fixture<FluidSkeleton>(
      html`<fluid-skeleton style="width: 120px; height: 24px"></fluid-skeleton>`
    );
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const before = base.getBoundingClientRect();
    try {
      await emulateMedia({ forcedColors: "active" });
      const probe = document.createElement("span");
      probe.style.color = "CanvasText";
      document.body.append(probe);
      const canvasText = getComputedStyle(probe).color;
      probe.remove();
      const after = base.getBoundingClientRect();
      expect(getComputedStyle(base).backgroundColor).to.equal(canvasText);
      expect(after.width).to.be.closeTo(before.width, 0.01);
      expect(after.height).to.be.closeTo(before.height, 0.01);
    } finally {
      await emulateMedia({ forcedColors: initiallyForced ? "active" : "none" });
    }
  });
});
