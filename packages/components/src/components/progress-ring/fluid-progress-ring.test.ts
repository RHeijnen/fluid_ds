import { expect, fixture, html } from "@open-wc/testing";
import { emulateMedia } from "@web/test-runner-commands";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidProgressRing } from "./fluid-progress-ring.js";

describe("<fluid-progress-ring> host label ownership", () => {
  type NamedControl = HTMLElement & { updateComplete: Promise<boolean> };
  const mount = () =>
    fixture<HTMLDivElement>('<div lang="en"><fluid-progress-ring></fluid-progress-ring></div>');
  async function settle(control: NamedControl): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }

  for (const [locale, expected] of [
    ["nl", "Voortgang"],
    ["de", "Fortschritt"],
    ["fr", "Progression"],
    ["es", "Progreso"],
    ["ar", "التقدم"],
    ["fr-CA", "Progression"]
  ] as const) {
    it(`updates the owned host name for ${locale} and after reconnect`, async () => {
      const wrapper = await mount();
      const control = wrapper.firstElementChild as NamedControl;
      expect(control.getAttribute("aria-label")).to.equal("Progress");
      wrapper.lang = locale;
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(expected);
      control.remove();
      wrapper.lang = "nl";
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal("Voortgang");
    });
  }

  for (const explicit of ["", "Progress", "Application name"]) {
    it(`preserves initially authored ${JSON.stringify(explicit)} through locale changes and reconnect`, async () => {
      const control = document.createElement("fluid-progress-ring") as NamedControl;
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
      expect(control.getAttribute("aria-label")).to.equal("Progression");
    });
  }

  it("recognizes late same-value writes as application ownership and restores removed overrides immediately", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Progress", "", "Application name"]) {
      control.setAttribute("aria-label", explicit);
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.removeAttribute("aria-label");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Progression" : "Voortgang"
    );
  });

  it("preserves native ariaLabel property writes, including equal defaults, empty strings and null reset", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Progress", "", "Property name"]) {
      control.ariaLabel = explicit;
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.ariaLabel).to.equal(explicit);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.ariaLabel = null;
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Progression" : "Voortgang"
    );
  });

  it("withdraws only its owned fallback while aria-labelledby exists and restores it on removal", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    const label = document.createElement("span");
    label.id = "application-progress-ring-label";
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
    expect(control.getAttribute("aria-label")).to.equal("Progression");
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
    const control = document.createElement("fluid-progress-ring") as NamedControl;
    root.append(control);
    wrapper.append(context);
    await settle(control);
    context.lang = "fr-CA";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Progression");
    control.remove();
    control.setAttribute("aria-label", "Progress");
    context.lang = "nl";
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Progress");
    control.remove();
    control.removeAttribute("aria-label");
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Voortgang");
  });
});

describe("<fluid-progress-ring>", () => {
  it("renders as a progressbar with aria-valuenow", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="33"></fluid-progress-ring>`
    );
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("progressbar");
    expect(el.getAttribute("aria-valuenow")).to.equal("33");
  });

  it("clamps value into 0-100", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="999"></fluid-progress-ring>`
    );
    await el.updateComplete;
    expect(el.getAttribute("aria-valuenow")).to.equal("100");
  });

  it("normalizes negative and nonfinite values and recovers cleanly", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="-20" show-value></fluid-progress-ring>`
    );
    await el.updateComplete;
    expect(el.getAttribute("aria-valuenow")).to.equal("0");
    expect(el.shadowRoot!.querySelector(".label")!.textContent?.trim()).to.equal("0%");

    el.value = Number.NaN;
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector(".indicator")!;
    expect(el.getAttribute("aria-valuenow")).to.equal("0");
    expect(indicator.getAttribute("stroke-dashoffset")).not.to.equal("NaN");

    el.value = 45;
    await el.updateComplete;
    expect(el.getAttribute("aria-valuenow")).to.equal("45");
    expect(el.shadowRoot!.querySelector(".label")!.textContent?.trim()).to.equal("45%");
  });

  it("remains determinate because no indeterminate API is published", async () => {
    const el = await fixture<FluidProgressRing>(html`<fluid-progress-ring></fluid-progress-ring>`);
    expect("indeterminate" in el).to.be.false;
    expect(el.getAttribute("aria-valuenow")).to.equal("0");
  });

  it("renders the center label when show-value is set", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="42" show-value></fluid-progress-ring>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".label")!.textContent?.trim()).to.equal("42%");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="50" aria-label="Saved"></fluid-progress-ring>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + thickness drives geometry. */

  it("indicator stroke reads the --fluid-progress-ring-* override ladder", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="50" aria-label="x"></fluid-progress-ring>`
    );
    el.style.setProperty("--fluid-progress-ring-fill", "rgb(1, 2, 3)");
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<SVGElement>(".indicator")!;
    expect(getComputedStyle(indicator).stroke).to.equal("rgb(1, 2, 3)");
  });

  it("thickness drives the stroke-width and arc radius", async () => {
    const el = await fixture<FluidProgressRing>(
      html`<fluid-progress-ring value="50" thickness="20" aria-label="x"></fluid-progress-ring>`
    );
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<SVGCircleElement>(".indicator")!;
    expect(indicator.getAttribute("stroke-width")).to.equal("20");
    // radius = 50 - thickness/2 = 40
    expect(indicator.getAttribute("r")).to.equal("40");
  });

  it("uses distinct system strokes in forced-colors mode", async () => {
    const initiallyForced = matchMedia("(forced-colors: active)").matches;
    try {
      await emulateMedia({ forcedColors: "active" });
      const el = await fixture<FluidProgressRing>(
        html`<fluid-progress-ring value="50"></fluid-progress-ring>`
      );
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
});
