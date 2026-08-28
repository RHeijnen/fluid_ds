import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidTour, FluidTourStep } from "./fluid-tour.js";
import type { FluidButton } from "../button/fluid-button.js";
import { registerTranslation, unregisterTranslation } from "../../internal/localization.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import { enXA } from "../../locales/en-xa.js";
import { arXB } from "../../locales/ar-xb.js";

const steps: FluidTourStep[] = [
  { target: "#a", title: "First", body: "First step body.", placement: "bottom" },
  { target: "#b", title: "Second", body: "Second step body.", placement: "bottom" },
  { target: "#c", title: "Third", body: "Third step body.", placement: "bottom" }
];

/** Mount a few real targets the tour can spotlight. */
function mountTargets(): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = `<button id="a">A</button><button id="b">B</button><button id="c">C</button>`;
  document.body.appendChild(host);
  return host;
}
const tourLocales = [
  {
    lang: "nl",
    skip: "Overslaan",
    back: "Terug",
    next: "Volgende",
    done: "Klaar",
    step: (current: string, total: string) => `Stap ${current} van ${total}`
  },
  {
    lang: "de",
    skip: "Überspringen",
    back: "Zurück",
    next: "Weiter",
    done: "Fertig",
    step: (current: string, total: string) => `Schritt ${current} von ${total}`
  },
  {
    lang: "fr",
    skip: "Passer",
    back: "Retour",
    next: "Suivant",
    done: "Terminé",
    step: (current: string, total: string) => `Étape ${current} sur ${total}`
  },
  {
    lang: "es",
    skip: "Omitir",
    back: "Atrás",
    next: "Siguiente",
    done: "Listo",
    step: (current: string, total: string) => `Paso ${current} de ${total}`
  },
  {
    lang: "ar",
    skip: "تخطي",
    back: "السابق",
    next: "التالي",
    done: "تم",
    step: (current: string, total: string) => `الخطوة ${current} من ${total}`
  },
  {
    lang: "fr-CA",
    skip: "Passer",
    back: "Retour",
    next: "Suivant",
    done: "Terminé",
    step: (current: string, total: string) => `Étape ${current} sur ${total}`
  }
];

async function settleTour(el: FluidTour): Promise<void> {
  await elementUpdated(el);
  for (const button of el.shadowRoot!.querySelectorAll<FluidButton>("fluid-button")) {
    await button.updateComplete;
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await elementUpdated(el);
}

function tourText(el: FluidTour, selector: string): string {
  return el.shadowRoot!.querySelector(selector)!.textContent!.trim();
}

function clickTourAction(el: FluidTour, selector: string): void {
  const control = el.shadowRoot!.querySelector(selector)!;
  control.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
}

describe("<fluid-tour> localized complete messages", () => {
  for (const language of ["fr", "ar-u-nu-arab"]) {
    it(`uses controller navigator fallback in ${language} (unit stub)`, async () => {
      const descriptor = Object.getOwnPropertyDescriptor(navigator, "language");
      const documentLang = document.documentElement.getAttribute("lang");
      const bodyLang = document.body.getAttribute("lang");
      try {
        Object.defineProperty(navigator, "language", { configurable: true, value: language });
        document.documentElement.removeAttribute("lang");
        document.body.removeAttribute("lang");
        const el = await fixture<FluidTour>(html`<fluid-tour .steps=${steps}></fluid-tour>`);
        el.show();
        await settleTour(el);
        const number = new Intl.NumberFormat(language);
        const prefix =
          language === "fr"
            ? `Étape ${number.format(1)} sur ${number.format(3)}`
            : `الخطوة ${number.format(1)} من ${number.format(3)}`;
        expect(tourText(el, ".counter")).to.equal(prefix);
        expect(tourText(el, '[role="status"]')).to.equal(`${prefix}. First. First step body.`);
      } finally {
        if (descriptor) Object.defineProperty(navigator, "language", descriptor);
        else Reflect.deleteProperty(navigator, "language");
        if (documentLang === null) document.documentElement.removeAttribute("lang");
        else document.documentElement.lang = documentLang;
        if (bodyLang === null) document.body.removeAttribute("lang");
        else document.body.lang = bodyLang;
      }
    });
  }

  for (const language of ["", "not_a_locale", "ar-EG-u-nu-arab"]) {
    it(`aligns step context for nearest language ${JSON.stringify(language)}`, async () => {
      const previous = document.documentElement.getAttribute("lang");
      try {
        document.documentElement.lang = "ar-u-nu-arab";
        const wrapper = await fixture<HTMLDivElement>(
          html`<div lang="de"><fluid-tour lang=${language} .steps=${steps}></fluid-tour></div>`
        );
        const el = wrapper.querySelector<FluidTour>("fluid-tour")!;
        el.show();
        await settleTour(el);
        const number = new Intl.NumberFormat("ar-u-nu-arab");
        const prefix =
          language === "not_a_locale"
            ? "Step 1 of 3"
            : `الخطوة ${number.format(1)} من ${number.format(3)}`;
        expect(tourText(el, ".counter")).to.equal(prefix);
        expect(tourText(el, '[role="status"]')).to.equal(`${prefix}. First. First step body.`);
      } finally {
        if (previous === null) document.documentElement.removeAttribute("lang");
        else document.documentElement.lang = previous;
      }
    });
  }
  let targets: HTMLElement;
  beforeEach(() => {
    targets = mountTargets();
  });
  afterEach(() => {
    targets.remove();
  });

  it("allows complete-message reordering and explicit empty control terms in the application registry", async () => {
    const override = {
      $code: "en-x-tour",
      skip: "",
      next: "Continue",
      tourStep: (current: string, total: string) => `${total} / ${current}`,
      tourStepAnnouncement: (current: string, total: string, title: string, body: string) =>
        `${body} | ${title} | ${total}/${current}`
    };
    registerTranslation(override);
    try {
      const el = await fixture<FluidTour>(
        html`<fluid-tour lang="en-x-tour" .steps=${steps}></fluid-tour>`
      );
      el.show();
      await settleTour(el);
      expect(tourText(el, ".counter")).to.equal("3 / 1");
      expect(tourText(el, '[role="status"]')).to.equal("First step body. | First | 3/1");
      expect(tourText(el, ".action-skip")).to.equal("");
      expect(tourText(el, ".action-next")).to.equal("Continue");
    } finally {
      unregisterTranslation(override.$code);
    }
  });

  for (const locale of tourLocales) {
    it(`localizes controls, counter and full announcement in ${locale.lang} while retaining events`, async () => {
      const el = await fixture<FluidTour>(
        html`<fluid-tour lang=${locale.lang} .steps=${steps}></fluid-tour>`
      );
      const changes: number[] = [];
      let finished = 0;
      el.addEventListener("fluid-step-change", (event) => {
        if (!(event instanceof CustomEvent)) throw new Error("Expected a step CustomEvent");
        changes.push(event.detail.index);
      });
      el.addEventListener("fluid-finish", () => finished++);
      el.show();
      await settleTour(el);
      const number = new Intl.NumberFormat([locale.lang, "en"]);
      const first = locale.step(number.format(1), number.format(3));
      expect(tourText(el, ".counter")).to.equal(first);
      expect(tourText(el, '[role="status"]')).to.equal(`${first}. First. First step body.`);
      expect(tourText(el, ".action-skip")).to.equal(locale.skip);
      expect(tourText(el, ".action-next")).to.equal(locale.next);
      clickTourAction(el, ".action-next");
      await settleTour(el);
      expect(tourText(el, ".action-back")).to.equal(locale.back);
      expect(tourText(el, '[role="status"]')).to.equal(
        `${locale.step(number.format(2), number.format(3))}. Second. Second step body.`
      );
      clickTourAction(el, ".action-back");
      await settleTour(el);
      clickTourAction(el, ".action-next");
      await settleTour(el);
      clickTourAction(el, ".action-next");
      await settleTour(el);
      expect(tourText(el, ".action-next")).to.equal(locale.done);
      clickTourAction(el, ".action-next");
      await settleTour(el);
      expect(changes).to.deep.equal([1, 0, 1, 2]);
      expect(finished).to.equal(1);
      expect(el.open).to.equal(false);
    });

    it(`updates open tour messages to ${locale.lang} without moving focus or emitting events`, async () => {
      const wrapper = await fixture<HTMLDivElement>(
        html`<div lang="en"><fluid-tour .steps=${steps}></fluid-tour></div>`
      );
      const el = wrapper.querySelector<FluidTour>("fluid-tour")!;
      el.show();
      await settleTour(el);
      const skip = el.shadowRoot!.querySelector<HTMLElement>(".action-skip")!;
      skip.focus();
      const focused = el.shadowRoot!.activeElement;
      expect(
        focused === skip,
        `Skip focus: ${focused?.localName ?? "none"} ${focused?.className ?? ""}`
      ).to.equal(true);
      const events: Event[] = [];
      for (const type of ["fluid-step-change", "fluid-finish", "fluid-skip"])
        el.addEventListener(type, (event) => events.push(event));
      wrapper.lang = locale.lang;
      await aTimeout(0);
      await settleTour(el);
      const number = new Intl.NumberFormat([locale.lang, "en"]);
      expect(tourText(el, '[role="status"]')).to.equal(
        `${locale.step(number.format(1), number.format(3))}. First. First step body.`
      );
      expect(
        el.shadowRoot!.activeElement === focused,
        "Locale changes preserve the focused control"
      ).to.equal(true);
      expect(el.index).to.equal(0);
      expect(el.open).to.equal(true);
      expect(el.steps).to.equal(steps);
      expect(events).to.deep.equal([]);
    });

    it(`preserves author text as text in ${locale.lang}`, async () => {
      const applicationSteps: FluidTourStep[] = [
        { target: "#a", title: "<b>My title</b>", body: "<img src=x onerror=alert(1)> & body" }
      ];
      const before = JSON.stringify(applicationSteps);
      const el = await fixture<FluidTour>(
        html`<fluid-tour lang=${locale.lang} .steps=${applicationSteps}></fluid-tour>`
      );
      el.show();
      await settleTour(el);
      expect(tourText(el, ".title")).to.equal(applicationSteps[0]!.title);
      expect(tourText(el, ".body")).to.equal(applicationSteps[0]!.body);
      expect(el.shadowRoot!.querySelector("b, img")).to.equal(null);
      expect(tourText(el, '[role="status"]')).to.contain(applicationSteps[0]!.body);
      expect(JSON.stringify(applicationSteps)).to.equal(before);
    });
  }

  it("reacts to closed shadow context and reconnect without replacing application steps", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div lang="nl"></div>`);
    const shadow = wrapper.attachShadow({ mode: "closed" });
    const el = document.createElement("fluid-tour");
    el.steps = steps;
    shadow.append(el);
    await elementUpdated(el);
    el.show();
    await settleTour(el);
    wrapper.lang = "de";
    await aTimeout(0);
    await settleTour(el);
    expect(tourText(el, '[role="status"]')).to.equal("Schritt 1 von 3. First. First step body.");
    el.remove();
    wrapper.lang = "es";
    shadow.append(el);
    await settleTour(el);
    expect(tourText(el, '[role="status"]')).to.equal("Paso 1 de 3. First. First step body.");
    expect(el.steps).to.equal(steps);
    el.skip();
    await settleTour(el);
  });

  it("updates an own language override and restores ancestor inheritance on removal", async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div lang="nl"><fluid-tour lang="en" .steps=${steps}></fluid-tour></div>`
    );
    const el = wrapper.querySelector<FluidTour>("fluid-tour")!;
    el.show();
    await settleTour(el);
    wrapper.lang = "de";
    await aTimeout(0);
    await settleTour(el);
    expect(tourText(el, ".counter")).to.equal("Step 1 of 3");
    el.removeAttribute("lang");
    await aTimeout(0);
    await settleTour(el);
    expect(tourText(el, ".counter")).to.equal("Schritt 1 von 3");
  });

  for (const dictionary of [enXA, arXB]) {
    it(`renders pseudo controls and whole messages for ${dictionary.$code}`, async () => {
      const el = await fixture<FluidTour>(
        html`<fluid-tour lang=${dictionary.$code} .steps=${steps}></fluid-tour>`
      );
      el.show();
      await settleTour(el);
      const skip: unknown = Reflect.get(dictionary, "skip");
      const announce: unknown = Reflect.get(dictionary, "tourStepAnnouncement");
      expect(typeof skip).to.equal("string");
      expect(typeof announce).to.equal("function");
      if (typeof announce !== "function") throw new Error("Missing pseudo announcement callback");
      const number = new Intl.NumberFormat([dictionary.$code, "en"]);
      expect(tourText(el, ".action-skip")).to.equal(skip);
      expect(tourText(el, '[role="status"]')).to.equal(
        announce(number.format(1), number.format(3), "First", "First step body.")
      );
      expect(tourText(el, ".title")).to.equal("First");
      expect(tourText(el, ".body")).to.equal("First step body.");
    });
  }
});

describe("<fluid-tour>", () => {
  let targets: HTMLElement;

  beforeEach(() => {
    targets = mountTargets();
  });

  afterEach(() => {
    targets.remove();
  });

  it("renders nonmodal dialog semantics because the page remains interactive", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour .steps=${steps}></fluid-tour>`);
    const panel = el.shadowRoot!.querySelector(".panel")!;
    expect(panel.getAttribute("role")).to.equal("dialog");
    expect(panel.hasAttribute("aria-modal")).to.equal(false);
  });

  it("does not focus detached or closed action controls from a stale frame", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour .steps=${steps}></fluid-tour>`);
    const opener = targets.querySelector<HTMLButtonElement>("#a")!;
    opener.focus();
    el.show();
    await elementUpdated(el);
    let lateFocusCalls = 0;
    el.shadowRoot!.querySelectorAll<HTMLElement>("fluid-button").forEach((button) => {
      button.focus = () => {
        lateFocusCalls++;
      };
    });
    el.skip();
    await el.updateComplete;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(lateFocusCalls).to.equal(0);
    expect(document.activeElement).to.equal(opener);
  });

  it("dismisses on focus leaving while preserving the destination", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour .steps=${steps}></fluid-tour>`);
    const [opener, destination] = [...targets.querySelectorAll<HTMLButtonElement>("button")];
    opener!.focus();
    el.show();
    await elementUpdated(el);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const events: Event[] = [];
    el.addEventListener("fluid-skip", (event) => events.push(event));
    destination!.focus();
    await el.updateComplete;
    expect(el.open).to.equal(false);
    expect(document.activeElement).to.equal(destination);
    expect(events.length).to.equal(1);
  });

  it("shows the current step's title, body, and counter", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    expect(el.shadowRoot!.querySelector(".title")!.textContent).to.contain("First");
    expect(el.shadowRoot!.querySelector(".body")!.textContent).to.contain("First step body.");
    expect(el.shadowRoot!.querySelector(".counter")!.textContent).to.contain("Step 1 of 3");
  });

  it("advances with next() and fires fluid-step-change", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    setTimeout(() => el.next());
    const event = await oneEvent(el, "fluid-step-change");
    expect(event.detail.index).to.equal(1);
    await elementUpdated(el);
    expect(el.index).to.equal(1);
  });

  it("goes back with back()", async () => {
    const el = await fixture<FluidTour>(
      html`<fluid-tour open index="1" .steps=${steps}></fluid-tour>`
    );
    await elementUpdated(el);
    el.back();
    await elementUpdated(el);
    expect(el.index).to.equal(0);
  });

  it("does not go before the first step", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    el.back();
    expect(el.index).to.equal(0);
  });

  it("fires fluid-finish on the last step's Next", async () => {
    const el = await fixture<FluidTour>(
      html`<fluid-tour open index="2" .steps=${steps}></fluid-tour>`
    );
    await elementUpdated(el);
    setTimeout(() => el.next());
    const event = await oneEvent(el, "fluid-finish");
    expect(event).to.exist;
    expect(el.open).to.be.false;
  });

  it("renders Done (not Next) on the last step", async () => {
    const el = await fixture<FluidTour>(
      html`<fluid-tour open index="2" .steps=${steps}></fluid-tour>`
    );
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".action-next")!.textContent!.trim()).to.equal("Done");
  });

  it("hides the Back button on the first step", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".action-back")).to.be.null;
  });

  it("renders its action controls as fluid-button elements", async () => {
    const el = await fixture<FluidTour>(
      html`<fluid-tour open index="1" .steps=${steps}></fluid-tour>`
    );
    await elementUpdated(el);
    const next = el.shadowRoot!.querySelector(".action-next")!;
    const back = el.shadowRoot!.querySelector(".action-back")!;
    const skip = el.shadowRoot!.querySelector(".action-skip")!;
    expect(next.localName).to.equal("fluid-button");
    expect(back.localName).to.equal("fluid-button");
    expect(skip.localName).to.equal("fluid-button");
    // The advance action is the primary (emphasised) variant.
    expect(next.getAttribute("variant")).to.equal("primary");
  });

  it("fires fluid-skip from the Skip button", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    const skip = el.shadowRoot!.querySelector<HTMLElement>(".action-skip")!;
    const innerBtn = skip.shadowRoot!.querySelector<HTMLButtonElement>("button")!;
    setTimeout(() => innerBtn.click());
    const event = await oneEvent(el, "fluid-skip");
    expect(event).to.exist;
    expect(el.open).to.be.false;
  });

  it("fires fluid-skip on Escape", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    setTimeout(() =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    );
    const event = await oneEvent(el, "fluid-skip");
    expect(event).to.exist;
  });

  it("fires fluid-skip when a press lands outside the popover", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    // The scrim does not take pointer events, so a press outside reaches the
    // page underneath. Left alone, the tour survived a click that had already
    // moved the user somewhere else.
    setTimeout(() =>
      document.body.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, composed: true })
      )
    );
    const event = await oneEvent(el, "fluid-skip");
    expect(event).to.exist;
    expect(el.open).to.be.false;
  });

  it("survives a press on its own popover", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    const panel = el.shadowRoot!.querySelector<HTMLElement>(".panel")!;
    panel.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await aTimeout(20);
    expect(el.open).to.be.true;
  });

  it("stops listening for outside presses once closed", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    el.skip();
    await elementUpdated(el);
    let skipped = false;
    el.addEventListener("fluid-skip", () => (skipped = true));
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await aTimeout(20);
    expect(skipped).to.be.false;
  });

  it("steps forward / back with arrow keys", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await elementUpdated(el);
    expect(el.index).to.equal(1);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await elementUpdated(el);
    expect(el.index).to.equal(0);
  });

  it("announces the step in a live region", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    const live = el.shadowRoot!.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).to.contain("Step 1 of 3");
    expect(live.textContent).to.contain("First");
  });

  it("resolves targets when the tour lives inside a shadow root", async () => {
    // A host whose shadow root holds BOTH the spotlight target and the tour.
    // document.querySelector cannot pierce this boundary, so the tour must
    // resolve selectors against its own root node.
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <button id="shadow-target" style="position:fixed;top:40px;left:40px;width:80px;height:30px;">T</button>
      <fluid-tour id="shadow-tour"></fluid-tour>
    `;
    const tour = shadow.querySelector<FluidTour>("#shadow-tour")!;
    tour.steps = [{ target: "#shadow-target", title: "Hi", body: "Body.", placement: "bottom" }];
    tour.open = true;
    await elementUpdated(tour);
    await aTimeout(50);

    const highlight = tour.shadowRoot!.querySelector<HTMLElement>(".highlight")!;
    // A resolved target shows the spotlight cutout (display:block); an
    // unresolved selector hides it (display:none) and centres the popover.
    expect(highlight.style.display).to.equal("block");
    expect(parseFloat(highlight.style.width)).to.be.greaterThan(0);

    tour.open = false;
    host.remove();
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTour>(html`
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
        <fluid-tour open .steps=${steps}></fluid-tour>
      </div>
    `);
    const tour = el.querySelector<FluidTour>("fluid-tour")!;
    await elementUpdated(tour);
    await aTimeout(20);
    await expect(tour).to.be.accessible();
  });
});
