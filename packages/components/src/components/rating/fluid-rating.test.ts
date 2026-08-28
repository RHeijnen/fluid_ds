import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidRating, FluidRatingChangeDetail, FluidRatingChangeEvent } from "../../index.js";

const ratingDetail: FluidRatingChangeDetail = { value: 0 };
// @ts-expect-error Rating values are numeric.
const invalidRatingDetail: FluidRatingChangeDetail = { value: "five" };
void invalidRatingDetail;

describe("<fluid-rating> host label ownership", () => {
  type NamedControl = HTMLElement & { updateComplete: Promise<boolean> };
  const mount = () => fixture<HTMLDivElement>('<div lang="en"><fluid-rating></fluid-rating></div>');
  async function settle(control: NamedControl): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }

  for (const [locale, expected] of [
    ["nl", "Beoordeling"],
    ["de", "Bewertung"],
    ["fr", "Évaluation"],
    ["es", "Valoración"],
    ["ar", "التقييم"],
    ["fr-CA", "Évaluation"]
  ] as const) {
    it(`updates the owned host name for ${locale} and after reconnect`, async () => {
      const wrapper = await mount();
      const control = wrapper.firstElementChild as NamedControl;
      expect(control.getAttribute("aria-label")).to.equal("Rating");
      wrapper.lang = locale;
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(expected);
      control.remove();
      wrapper.lang = "nl";
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal("Beoordeling");
    });
  }

  for (const explicit of ["", "Rating", "Application name"]) {
    it(`preserves initially authored ${JSON.stringify(explicit)} through locale changes and reconnect`, async () => {
      const control = document.createElement("fluid-rating") as NamedControl;
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
      expect(control.getAttribute("aria-label")).to.equal("Évaluation");
    });
  }

  it("recognizes late same-value writes as application ownership and restores removed overrides immediately", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Rating", "", "Application name"]) {
      control.setAttribute("aria-label", explicit);
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.removeAttribute("aria-label");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Évaluation" : "Beoordeling"
    );
  });

  it("preserves native ariaLabel property writes, including equal defaults, empty strings and null reset", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Rating", "", "Property name"]) {
      control.ariaLabel = explicit;
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.ariaLabel).to.equal(explicit);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.ariaLabel = null;
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Évaluation" : "Beoordeling"
    );
  });

  it("withdraws only its owned fallback while aria-labelledby exists and restores it on removal", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    const label = document.createElement("span");
    label.id = "application-rating-label";
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
    expect(control.getAttribute("aria-label")).to.equal("Évaluation");
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
    const control = document.createElement("fluid-rating") as NamedControl;
    root.append(control);
    wrapper.append(context);
    await settle(control);
    context.lang = "fr-CA";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Évaluation");
    control.remove();
    control.setAttribute("aria-label", "Rating");
    context.lang = "nl";
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Rating");
    control.remove();
    control.removeAttribute("aria-label");
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Beoordeling");
  });
});

describe("<fluid-rating>", () => {
  it("renders the max number of stars", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating max="5"></fluid-rating>`);
    expect(el.shadowRoot!.querySelectorAll(".star").length).to.equal(5);
  });

  it("clicking the nth star sets value to n+1", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating></fluid-rating>`);
    const stars = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".star");
    setTimeout(() => stars[2]!.click());
    const event = (await oneEvent(el, "fluid-change")) as FluidRatingChangeEvent;
    expect(event.detail).to.deep.equal({ value: 3 });
    expect(ratingDetail).to.deep.equal({ value: 0 });
    expect(el.value).to.equal(3);
  });

  it("ignores clicks in readonly mode", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating readonly value="2"></fluid-rating>`);
    el.shadowRoot!.querySelector<HTMLButtonElement>(".star")!.click();
    await el.updateComplete;
    expect(el.value).to.equal(2);
  });

  it("ArrowRight increments by precision", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating value="2"></fluid-rating>`);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(3);
  });

  it("Home/End jump to 0/max", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating value="3" max="5"></fluid-rating>`);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(5);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(0);
  });

  it("clamps value, accessibility state, and FormData when max shrinks", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-rating name="score" value="5" max="5"></fluid-rating></form>
    `);
    const el = form.querySelector<FluidRating>("fluid-rating")!;
    const changes: Event[] = [];
    el.addEventListener("fluid-change", (event) => changes.push(event));
    el.max = 3;
    await el.updateComplete;

    expect(el.value).to.equal(3);
    expect(el.getAttribute("aria-valuemax")).to.equal("3");
    expect(el.getAttribute("aria-valuenow")).to.equal("3");
    expect(new FormData(form).get("score")).to.equal("3");
    expect(changes).to.have.length(0);
  });

  it("preserves authored disabled state and releases focus across fieldset ownership", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset>
          <fluid-rating disabled aria-label="Authored disabled"></fluid-rating>
          <fluid-rating aria-label="Owner disabled only"></fluid-rating>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const [authored, enabled] = form.querySelectorAll<FluidRating>("fluid-rating");
    enabled!.focus();
    expect(document.activeElement).to.equal(enabled);
    fieldset.disabled = true;
    await aTimeout(0);
    expect(document.activeElement).not.to.equal(enabled);
    expect(authored!.disabled).to.be.true;
    expect(enabled!.disabled).to.be.true;
    expect(authored!.tabIndex).to.equal(-1);
    expect(enabled!.tabIndex).to.equal(-1);

    fieldset.disabled = false;
    await aTimeout(0);
    expect(authored!.disabled).to.be.true;
    expect(authored!.tabIndex).to.equal(-1);
    expect(enabled!.disabled).to.be.false;
    expect(enabled!.tabIndex).to.equal(0);
  });

  it("submits its value with a form", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-rating name="score" value="4"></fluid-rating>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("score")).to.equal("4");
  });

  it("supports half-step precision", async () => {
    const el = await fixture<FluidRating>(
      html`<fluid-rating precision="0.5" value="0"></fluid-rating>`
    );
    el.value = 2.5;
    await el.updateComplete;
    expect(el.value).to.equal(2.5);
  });

  it("keeps physical half-star hit mapping stable in RTL", async () => {
    const el = await fixture<FluidRating>(
      html`<fluid-rating dir="rtl" precision="0.5" value="0"></fluid-rating>`
    );
    const first = el.shadowRoot!.querySelector<HTMLElement>(".star")!;
    const rect = first.getBoundingClientRect();
    first.dispatchEvent(
      new MouseEvent("click", { clientX: rect.left + rect.width * 0.25, bubbles: true })
    );
    await el.updateComplete;
    expect(el.value).to.equal(0.5);

    first.dispatchEvent(
      new MouseEvent("click", { clientX: rect.left + rect.width * 0.75, bubbles: true })
    );
    await el.updateComplete;
    expect(el.value).to.equal(1);
  });

  it("clears transient hover preview before reconnecting", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div><fluid-rating value="2" max="5"></fluid-rating></div>
    `);
    const el = wrapper.querySelector<FluidRating>("fluid-rating")!;
    const fifth = el.shadowRoot!.querySelectorAll<HTMLElement>(".star")[4]!;
    const rect = fifth.getBoundingClientRect();
    fifth.dispatchEvent(new MouseEvent("pointermove", { clientX: rect.right - 1, bubbles: true }));
    await el.updateComplete;
    expect(
      [...el.shadowRoot!.querySelectorAll<HTMLElement>(".layer-active")].map(
        (layer) => layer.style.width
      )
    ).to.deep.equal(["100%", "100%", "100%", "100%", "100%"]);

    el.remove();
    wrapper.append(el);
    await el.updateComplete;

    expect(
      [...el.shadowRoot!.querySelectorAll<HTMLElement>(".layer-active")].map(
        (layer) => layer.style.width
      )
    ).to.deep.equal(["100%", "100%", "0%", "0%", "0%"]);
    expect(el.value).to.equal(2);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidRating>(
      html`<fluid-rating aria-label="Rate this product"></fluid-rating>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("active color reads the --fluid-rating-* override ladder", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating value="5"></fluid-rating>`);
    el.style.setProperty("--fluid-rating-active-color", "rgb(1, 2, 3)");
    await el.updateComplete;
    const activeLayer = el.shadowRoot!.querySelector<HTMLElement>(".layer-active")!;
    expect(getComputedStyle(activeLayer).color).to.equal("rgb(1, 2, 3)");
  });

  it("each star respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating></fluid-rating>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const star = el.shadowRoot!.querySelector<HTMLElement>(".star")!;
    expect(star.getBoundingClientRect().width).to.be.greaterThanOrEqual(44);
  });

  it("spreads the reduced-motion guard so the hover-scale transition collapses", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating></fluid-rating>`);
    await el.updateComplete;
    // The shared `reducedMotion` fragment must be adopted into the shadow root
    // so `prefers-reduced-motion: reduce` neutralizes the .star hover-scale
    // transition. Assert the guard rule is present in the component's styles.
    const cssText = el
      .shadowRoot!.adoptedStyleSheets.flatMap((sheet) =>
        Array.from(sheet.cssRules, (rule) => rule.cssText)
      )
      .join("\n");
    expect(cssText).to.match(/prefers-reduced-motion:\s*reduce/);
    expect(cssText).to.match(/transition-duration:\s*0\.01ms/);
  });
});
