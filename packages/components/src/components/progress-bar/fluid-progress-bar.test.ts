import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidProgressBar } from "./fluid-progress-bar.js";

describe("<fluid-progress-bar> host label ownership", () => {
  type NamedControl = HTMLElement & { updateComplete: Promise<boolean> };
  const mount = () =>
    fixture<HTMLDivElement>('<div lang="en"><fluid-progress-bar></fluid-progress-bar></div>');
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
      const control = document.createElement("fluid-progress-bar") as NamedControl;
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
    label.id = "application-progress-bar-label";
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
    const control = document.createElement("fluid-progress-bar") as NamedControl;
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

describe("<fluid-progress-bar>", () => {
  it("renders with role=progressbar and aria-valuenow", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="42"></fluid-progress-bar>`
    );
    await el.updateComplete;
    expect(el.getAttribute("role")).to.equal("progressbar");
    expect(el.getAttribute("aria-valuenow")).to.equal("42");
  });

  it("clamps value to 0-100", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="150"></fluid-progress-bar>`
    );
    await el.updateComplete;
    expect(el.getAttribute("aria-valuenow")).to.equal("100");
  });

  it("normalizes malformed and nonfinite values and recovers without invalid output", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="not-a-number" show-value></fluid-progress-bar>`
    );
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<HTMLElement>(".indicator")!;
    const text = el.shadowRoot!.querySelector(".value-text")!;
    expect(el.getAttribute("aria-valuenow")).to.equal("0");
    expect(indicator.getAttribute("style")).to.contain("scaleX(0)");
    expect(text.textContent).to.equal("0%");

    el.value = Infinity;
    await el.updateComplete;
    expect(el.getAttribute("aria-valuenow")).to.equal("100");
    expect(text.textContent).to.equal("100%");

    el.value = 35;
    await el.updateComplete;
    expect(el.getAttribute("aria-valuenow")).to.equal("35");
    expect(text.textContent).to.equal("35%");
  });

  it("becomes indeterminate when value is null", async () => {
    const el = await fixture<FluidProgressBar>(html`<fluid-progress-bar></fluid-progress-bar>`);
    el.value = null;
    await el.updateComplete;
    expect(el.indeterminate).to.be.true;
    expect(el.hasAttribute("aria-valuenow")).to.be.false;
  });

  it("keeps live ARIA and value text coherent across determinate transitions", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="25" show-value></fluid-progress-bar>`
    );
    el.value = null;
    await el.updateComplete;
    expect(el.hasAttribute("indeterminate")).to.be.true;
    expect(el.hasAttribute("aria-valuenow")).to.be.false;
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent).to.equal("");

    el.value = 64;
    await el.updateComplete;
    expect(el.hasAttribute("indeterminate")).to.be.false;
    expect(el.getAttribute("aria-valuenow")).to.equal("64");
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent).to.equal("64%");
  });

  it("shows the value text when show-value is set", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="33" show-value></fluid-progress-bar>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent?.trim()).to.equal("33%");
  });

  it("applies a custom formatter", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="33" show-value></fluid-progress-bar>`
    );
    el.valueFormatter = (v) => `${v} of 100`;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent?.trim()).to.equal("33 of 100");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="42" aria-label="Upload"></fluid-progress-bar>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder. */

  it("indicator fill reads the --fluid-progress-bar-* override ladder", async () => {
    const el = await fixture<FluidProgressBar>(
      html`<fluid-progress-bar value="50" aria-label="x"></fluid-progress-bar>`
    );
    el.style.setProperty("--fluid-progress-bar-fill", "rgb(1, 2, 3)");
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<HTMLElement>(".indicator")!;
    expect(getComputedStyle(indicator).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  /* Indeterminate animation / reduced-motion. */

  it("runs the indeterminate loop animation when value is null", async () => {
    const el = await fixture<FluidProgressBar>(html`<fluid-progress-bar></fluid-progress-bar>`);
    el.value = null;
    await el.updateComplete;
    expect(el.hasAttribute("indeterminate")).to.be.true;
    const indicator = el.shadowRoot!.querySelector<HTMLElement>(".indicator")!;
    const style = getComputedStyle(indicator);
    expect(style.animationName).to.equal("progress-loop");
    expect(style.animationIterationCount).to.equal("infinite");
  });

  it("keeps the indeterminate loop running (slowed, not stopped) under reduced motion", async () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = await fixture<FluidProgressBar>(html`<fluid-progress-bar></fluid-progress-bar>`);
    el.value = null;
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<HTMLElement>(".indicator")!;
    const style = getComputedStyle(indicator);
    // The reduced-motion branch slows the loop to 6s rather than removing it,
    // so the animation must still be present and infinite either way.
    expect(style.animationName).to.equal("progress-loop");
    expect(style.animationIterationCount).to.equal("infinite");
    expect(style.animationDuration).to.equal(reduced ? "6s" : "1.5s");
  });

  /* Regression: the label slot used to sit directly in the space-between flex
     row, so mixed content ("Uploading <b>file</b>") split into separate flex
     items spread across the full row width. */
  it("mixed inline label content stays together instead of spreading", async () => {
    const el = await fixture<FluidProgressBar>(html`
      <fluid-progress-bar value="40" show-value style="width: 24rem"
        >Uploading <b>file.zip</b></fluid-progress-bar
      >
    `);
    await el.updateComplete;
    const bold = el.querySelector("b")!;
    expect(getComputedStyle(bold).display).to.equal("inline");
    // The bold fragment hugs its preceding text on the left side of the row;
    // only the value text sits at the far end.
    const label = el.shadowRoot!.querySelector<HTMLElement>("[part='label']")!;
    const mid = label.getBoundingClientRect().left + label.getBoundingClientRect().width / 2;
    expect(bold.getBoundingClientRect().right).to.be.lessThan(mid);
  });
});
