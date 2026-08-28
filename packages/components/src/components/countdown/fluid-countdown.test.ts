import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidCountdown } from "./fluid-countdown.js";
import {
  english,
  registerTranslation,
  unregisterTranslation
} from "../../internal/localization.js";
import { nl } from "../../locales/nl.js";
import { de } from "../../locales/de.js";
import { fr } from "../../locales/fr.js";
import { es } from "../../locales/es.js";
import { ar } from "../../locales/ar.js";
import { enXA } from "../../locales/en-xa.js";
import { arXB } from "../../locales/ar-xb.js";
const countdownLocales = [
  {
    lang: "nl",
    complete: "Het aftellen is voltooid.",
    remaining: (value: string) => `Nog ${value}.`
  },
  { lang: "de", complete: "Countdown beendet.", remaining: (value: string) => `Noch ${value}.` },
  {
    lang: "fr",
    complete: "Compte à rebours terminé.",
    remaining: (value: string) => `Il reste ${value}.`
  },
  {
    lang: "es",
    complete: "Cuenta atrás finalizada.",
    remaining: (value: string) => `Tiempo restante: ${value}.`
  },
  {
    lang: "ar",
    complete: "اكتمل العد التنازلي.",
    remaining: (value: string) => `الوقت المتبقي: ${value}.`
  },
  {
    lang: "fr-CA",
    complete: "Compte à rebours terminé.",
    remaining: (value: string) => `Il reste ${value}.`
  }
];

function durationIn(lang: string, values: Array<[string, number]>): string {
  return new Intl.ListFormat([lang, "en"], { style: "long", type: "conjunction" }).format(
    values.map(([unit, value]) =>
      new Intl.NumberFormat([lang, "en"], {
        style: "unit",
        unit,
        unitDisplay: "long"
      }).format(value)
    )
  );
}

function announcementOf(el: FluidCountdown): string {
  return el.shadowRoot!.querySelector('[aria-live="polite"]')!.textContent!.trim();
}

/** Controlled one-second interval clock for observable lifecycle unit regressions. */
function intervalClock() {
  const originalSet = Object.getOwnPropertyDescriptor(window, "setInterval")!;
  const originalClear = Object.getOwnPropertyDescriptor(window, "clearInterval")!;
  const originalNow = Date.now;
  let now = Date.parse("2026-08-26T12:00:00Z");
  let nextId = 0;
  const callbacks = new Map<number, () => void>();
  const setInterval = (handler: TimerHandler, delay?: number): number => {
    if (typeof handler !== "function" || delay !== 1000)
      throw new Error("Expected a one-second callback");
    const id = ++nextId;
    callbacks.set(id, () => handler());
    return id;
  };
  const clearInterval = (id?: number): void => {
    if (id !== undefined) callbacks.delete(id);
  };
  Object.defineProperty(window, "setInterval", { ...originalSet, value: setInterval });
  Object.defineProperty(window, "clearInterval", { ...originalClear, value: clearInterval });
  Date.now = () => now;
  return {
    advance(seconds: number) {
      for (let second = 0; second < seconds; second++) {
        now += 1000;
        for (const [id, callback] of [...callbacks]) if (callbacks.has(id)) callback();
      }
    },
    restore() {
      Object.defineProperty(window, "setInterval", originalSet);
      Object.defineProperty(window, "clearInterval", originalClear);
      Date.now = originalNow;
    }
  };
}

describe("<fluid-countdown> controlled interval lifecycle", () => {
  it("keeps a manually paused autostart countdown paused through reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div></div>`);
    const clock = intervalClock();
    const el = document.createElement("fluid-countdown");
    el.seconds = 3;
    const ticks: number[] = [];
    el.addEventListener("fluid-tick", (event) => {
      if (!(event instanceof CustomEvent)) throw new Error("Expected a tick CustomEvent");
      ticks.push(event.detail.remaining);
    });
    try {
      wrapper.append(el);
      await elementUpdated(el);
      el.pause();
      el.remove();
      clock.advance(2);
      wrapper.append(el);
      await elementUpdated(el);
      clock.advance(2);
      expect(ticks).to.deep.equal([2]);
      expect(el.shadowRoot!.querySelector(".digit")!.textContent!.trim()).to.equal("02");
    } finally {
      el.pause();
      clock.restore();
    }
  });
  it("keeps default autostart's first tick consistent with the first rendered remaining value", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div></div>`);
    const clock = intervalClock();
    const el = document.createElement("fluid-countdown");
    el.seconds = 3;
    const ticks: number[] = [];
    let complete = 0;
    el.addEventListener("fluid-tick", (event) => {
      if (!(event instanceof CustomEvent)) throw new Error("Expected a tick CustomEvent");
      ticks.push(event.detail.remaining);
    });
    el.addEventListener("fluid-complete", () => complete++);
    try {
      wrapper.append(el);
      await elementUpdated(el);
      expect(ticks).to.deep.equal([2]);
      expect(el.shadowRoot!.querySelector(".digit")!.textContent!.trim()).to.equal("02");
      clock.advance(1);
      await elementUpdated(el);
      expect(ticks).to.deep.equal([2, 1]);
      expect(el.shadowRoot!.querySelector(".digit")!.textContent!.trim()).to.equal("01");
      clock.advance(3);
      expect(ticks).to.deep.equal([2, 1, 0]);
      expect(complete).to.equal(1);
    } finally {
      el.pause();
      clock.restore();
    }
  });
  it("does not emit extra ticks after immediate completion", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="1" .autostart=${false}></fluid-countdown>`
    );
    const clock = intervalClock();
    const ticks: number[] = [];
    let complete = 0;
    el.addEventListener("fluid-tick", (event) => {
      if (!(event instanceof CustomEvent)) throw new Error("Expected a tick CustomEvent");
      ticks.push(event.detail.remaining);
    });
    el.addEventListener("fluid-complete", () => complete++);
    try {
      el.start();
      clock.advance(3);
      expect(ticks).to.deep.equal([0]);
      expect(complete).to.equal(1);
    } finally {
      el.pause();
      clock.restore();
    }
  });

  for (const mode of ["seconds", "target"]) {
    it(`resumes active ${mode} countdown once after reconnect, without detached ticks`, async () => {
      const wrapper = await fixture<HTMLDivElement>(
        html`<div><fluid-countdown seconds="8" .autostart=${false}></fluid-countdown></div>`
      );
      const el = wrapper.querySelector<FluidCountdown>("fluid-countdown")!;
      const clock = intervalClock();
      const ticks: number[] = [];
      let complete = 0;
      el.addEventListener("fluid-tick", (event) => {
        if (!(event instanceof CustomEvent)) throw new Error("Expected a tick CustomEvent");
        ticks.push(event.detail.remaining);
      });
      el.addEventListener("fluid-complete", () => complete++);
      try {
        if (mode === "target") {
          el.target = new Date(Date.now() + 8000).toISOString();
          await elementUpdated(el);
        }
        el.start();
        clock.advance(1);
        expect(ticks).to.deep.equal(mode === "seconds" ? [7, 6] : [8, 7]);
        el.remove();
        clock.advance(2);
        expect(ticks).to.have.length(2);
        wrapper.append(el);
        await elementUpdated(el);
        clock.advance(1);
        expect(ticks).to.deep.equal(mode === "seconds" ? [7, 6, 5, 4] : [8, 7, 5, 4]);
        clock.advance(4);
        expect(ticks.slice(-4)).to.deep.equal([3, 2, 1, 0]);
        clock.advance(2);
        expect(ticks).to.have.length(8);
        expect(complete).to.equal(1);
      } finally {
        el.pause();
        clock.restore();
      }
    });
  }
});

describe("<fluid-countdown> localized complete messages", () => {
  for (const language of ["fr", "ar"]) {
    it(`uses the controller's navigator fallback for complete messages in ${language} (unit stub)`, async () => {
      const descriptor = Object.getOwnPropertyDescriptor(navigator, "language");
      const documentLang = document.documentElement.getAttribute("lang");
      const bodyLang = document.body.getAttribute("lang");
      try {
        Object.defineProperty(navigator, "language", { configurable: true, value: language });
        document.documentElement.removeAttribute("lang");
        document.body.removeAttribute("lang");
        const el = await fixture<FluidCountdown>(
          html`<fluid-countdown seconds="21" .autostart=${false}></fluid-countdown>`
        );
        el.start();
        el.pause();
        await elementUpdated(el);
        const duration = durationIn(language, [["second", 20]]);
        expect(announcementOf(el)).to.equal(
          language === "fr" ? `Il reste ${duration}.` : `الوقت المتبقي: ${duration}.`
        );
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
    it(`aligns complete message context for nearest language ${JSON.stringify(language)}`, async () => {
      const previous = document.documentElement.getAttribute("lang");
      try {
        document.documentElement.lang = "fr";
        const wrapper = await fixture<HTMLDivElement>(
          html`<div lang="de">
            <fluid-countdown lang=${language} seconds="21" .autostart=${false}></fluid-countdown>
          </div>`
        );
        const el = wrapper.querySelector<FluidCountdown>("fluid-countdown")!;
        el.start();
        el.pause();
        await elementUpdated(el);
        const expected =
          language === ""
            ? `Il reste ${durationIn("fr", [["second", 20]])}.`
            : language === "not_a_locale"
              ? "20 seconds remaining."
              : `الوقت المتبقي: ${durationIn(language, [["second", 20]])}.`;
        expect(announcementOf(el)).to.equal(expected);
      } finally {
        if (previous === null) document.documentElement.removeAttribute("lang");
        else document.documentElement.lang = previous;
      }
    });
  }
  it("preserves whole-message application registry overrides and responds to replacement", async () => {
    const override = {
      $code: "en-x-countdown",
      countdownRemaining: (duration: string) => `Application: ${duration}`,
      countdownComplete: "Application complete"
    };
    registerTranslation(override);
    try {
      const el = await fixture<FluidCountdown>(
        html`<fluid-countdown
          lang="en-x-countdown"
          seconds="21"
          .autostart=${false}
        ></fluid-countdown>`
      );
      el.start();
      el.pause();
      await elementUpdated(el);
      expect(announcementOf(el)).to.equal("Application: 20 seconds");
      const replacement = { ...override, countdownRemaining: () => "" };
      registerTranslation(replacement);
      await aTimeout(0);
      await elementUpdated(el);
      expect(announcementOf(el)).to.equal("");
    } finally {
      unregisterTranslation(override.$code);
    }
  });
  for (const locale of countdownLocales) {
    it(`formats the full paused duration in ${locale.lang} without changing ASCII clock digits`, async () => {
      const el = await fixture<FluidCountdown>(
        html`<fluid-countdown
          lang=${locale.lang}
          seconds="3661"
          format="clock"
          .autostart=${false}
        ></fluid-countdown>`
      );
      el.start();
      el.pause();
      await elementUpdated(el);
      expect(announcementOf(el)).to.equal(
        locale.remaining(
          durationIn(locale.lang, [
            ["hour", 1],
            ["minute", 1]
          ])
        )
      );
      expect(
        [...el.shadowRoot!.querySelectorAll(".digit")].map((node) => node.textContent!.trim())
      ).to.deep.equal(["01", "01", "00"]);
    });

    it(`updates an existing paused announcement when the ancestor changes to ${locale.lang}`, async () => {
      const wrapper = await fixture<HTMLDivElement>(
        html`<div lang="en">
          <fluid-countdown seconds="21" .autostart=${false}></fluid-countdown>
        </div>`
      );
      const el = wrapper.querySelector<FluidCountdown>("fluid-countdown")!;
      const ticks: number[] = [];
      el.addEventListener("fluid-tick", (event) => {
        if (!(event instanceof CustomEvent)) throw new Error("Expected a tick CustomEvent");
        ticks.push(event.detail.remaining);
      });
      el.start();
      el.pause();
      await elementUpdated(el);
      wrapper.lang = locale.lang;
      await aTimeout(0);
      await elementUpdated(el);
      expect(announcementOf(el)).to.equal(
        locale.remaining(durationIn(locale.lang, [["second", 20]]))
      );
      expect(ticks).to.deep.equal([20]);
    });

    it(`translates completed state to ${locale.lang} without firing completion twice`, async () => {
      const el = await fixture<FluidCountdown>(
        html`<fluid-countdown lang="en" seconds="1" .autostart=${false}></fluid-countdown>`
      );
      let completions = 0;
      el.addEventListener("fluid-complete", () => completions++);
      el.start();
      el.pause();
      await elementUpdated(el);
      el.lang = locale.lang;
      await aTimeout(0);
      await elementUpdated(el);
      expect(announcementOf(el)).to.equal(locale.complete);
      expect(completions).to.equal(1);
      el.reset();
      await elementUpdated(el);
      expect(announcementOf(el)).to.equal("");
      expect(completions).to.equal(1);
    });
  }

  for (const days of [1, 2, 3, 11, 100]) {
    it(`uses Intl Arabic unit grammar for ${days} days`, async () => {
      const el = await fixture<FluidCountdown>(
        html`<fluid-countdown
          lang="ar"
          .seconds=${days * 86400 + 1}
          .autostart=${false}
        ></fluid-countdown>`
      );
      el.start();
      el.pause();
      await elementUpdated(el);
      expect(announcementOf(el)).to.equal(`الوقت المتبقي: ${durationIn("ar", [["day", days]])}.`);
    });
  }

  it("keeps the ten-second announcement snapshot while locale and current seconds change", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown lang="en" seconds="22" .autostart=${false}></fluid-countdown>`
    );
    const ticks: number[] = [];
    el.addEventListener("fluid-tick", (event) => {
      if (!(event instanceof CustomEvent)) throw new Error("Expected a tick CustomEvent");
      ticks.push(event.detail.remaining);
    });
    el.start();
    el.pause();
    await elementUpdated(el);
    expect(announcementOf(el)).to.equal("");
    el.start();
    el.pause();
    await elementUpdated(el);
    expect(announcementOf(el)).to.equal("20 seconds remaining.");
    el.start();
    el.pause();
    await elementUpdated(el);
    el.lang = "fr";
    await aTimeout(0);
    await elementUpdated(el);
    expect(announcementOf(el)).to.equal(`Il reste ${durationIn("fr", [["second", 20]])}.`);
    expect(ticks).to.deep.equal([21, 20, 19]);
  });

  it("reacts inside a closed shadow root and refreshes paused messages on reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div lang="nl"></div>`);
    const shadow = wrapper.attachShadow({ mode: "closed" });
    const el = document.createElement("fluid-countdown");
    el.autostart = false;
    el.seconds = 21;
    shadow.append(el);
    await elementUpdated(el);
    el.start();
    el.pause();
    await elementUpdated(el);
    wrapper.lang = "de";
    await aTimeout(0);
    await elementUpdated(el);
    expect(announcementOf(el)).to.equal(`Noch ${durationIn("de", [["second", 20]])}.`);
    el.remove();
    wrapper.lang = "es";
    shadow.append(el);
    await elementUpdated(el);
    expect(announcementOf(el)).to.equal(`Tiempo restante: ${durationIn("es", [["second", 20]])}.`);
  });

  for (const label of ["", "Time remaining", "Application timer"]) {
    it(`preserves explicit accessible label ${JSON.stringify(label)} during locale changes`, async () => {
      const el = await fixture<FluidCountdown>(
        html`<fluid-countdown
          lang="nl"
          aria-label=${label}
          seconds="21"
          .autostart=${false}
        ></fluid-countdown>`
      );
      el.start();
      el.pause();
      el.lang = "ar";
      await aTimeout(0);
      await elementUpdated(el);
      expect(el.shadowRoot!.querySelector('[role="timer"]')!.getAttribute("aria-label")).to.equal(
        label
      );
      expect(el.getAttribute("aria-label")).to.equal(label);
      expect(announcementOf(el)).to.equal(`الوقت المتبقي: ${durationIn("ar", [["second", 20]])}.`);
    });
  }

  for (const dictionary of [english, nl, de, fr, es, ar, enXA, arXB]) {
    it(`provides all eight whole-message/control terms in ${dictionary.$code}`, () => {
      for (const key of [
        "countdownComplete",
        "countdownRemaining",
        "tourStep",
        "tourStepAnnouncement",
        "skip",
        "back",
        "next",
        "done"
      ]) {
        expect(Object.hasOwn(dictionary, key), key).to.equal(true);
        const value: unknown = Reflect.get(dictionary, key);
        expect(typeof value, key).to.equal(
          ["countdownRemaining", "tourStep", "tourStepAnnouncement"].includes(key)
            ? "function"
            : "string"
        );
      }
    });
  }

  for (const dictionary of [enXA, arXB]) {
    it(`renders the pseudo completion message for ${dictionary.$code}`, async () => {
      const el = await fixture<FluidCountdown>(
        html`<fluid-countdown
          lang=${dictionary.$code}
          seconds="0"
          .autostart=${false}
        ></fluid-countdown>`
      );
      el.start();
      await elementUpdated(el);
      const expected: unknown = Reflect.get(dictionary, "countdownComplete");
      expect(typeof expected).to.equal("string");
      expect(announcementOf(el)).to.equal(expected);
      expect(announcementOf(el)).not.to.equal("Countdown complete.");
    });
  }
});

describe("<fluid-countdown>", () => {
  it("renders a role=timer region", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="90" .autostart=${false}></fluid-countdown>`
    );
    const region = el.shadowRoot!.querySelector('[role="timer"]');
    expect(region).to.exist;
  });

  it("renders labelled segments for a multi-unit duration", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="3661" format="segments" .autostart=${false}></fluid-countdown>`
    );
    const labels = [...el.shadowRoot!.querySelectorAll(".label")].map((n) => n.textContent?.trim());
    expect(labels).to.include("hrs");
    expect(labels).to.include("min");
    expect(labels).to.include("sec");
  });

  it("renders a HH:MM:SS clock in clock format", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="3661" format="clock" .autostart=${false}></fluid-countdown>`
    );
    const digits = [...el.shadowRoot!.querySelectorAll(".digit")].map((n) => n.textContent?.trim());
    // 1h 1m 1s -> 01:01:01
    expect(digits).to.deep.equal(["01", "01", "01"]);
    const seps = el.shadowRoot!.querySelectorAll(".separator");
    expect(seps.length).to.equal(2);
  });

  it("does not autostart when autostart is false", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="5" .autostart=${false}></fluid-countdown>`
    );
    let ticked = false;
    el.addEventListener("fluid-tick", () => (ticked = true));
    await aTimeout(1100);
    expect(ticked).to.be.false;
  });

  it("fires fluid-tick when running", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="5" .autostart=${false}></fluid-countdown>`
    );
    setTimeout(() => el.start());
    const event = await oneEvent(el, "fluid-tick");
    expect(event.detail.remaining).to.be.a("number");
    el.pause();
  });

  it("fires fluid-complete at zero", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="1" .autostart=${false}></fluid-countdown>`
    );
    setTimeout(() => el.start());
    const event = await oneEvent(el, "fluid-complete");
    expect(event).to.exist;
  });

  it("reset restores the initial duration", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="3" .autostart=${false}></fluid-countdown>`
    );
    el.start();
    await aTimeout(1100);
    el.reset();
    await elementUpdated(el);
    const digits = el.shadowRoot!.querySelectorAll(".digit");
    expect(digits[digits.length - 1]!.textContent?.trim()).to.equal("03");
  });

  it("clears its interval on disconnect", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="60"></fluid-countdown>`
    );
    let ticked = false;
    el.addEventListener("fluid-tick", () => (ticked = true));
    el.remove();
    await aTimeout(1100);
    expect(ticked).to.be.false;
  });

  it("passes a11y audit", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
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
        <fluid-countdown seconds="90" .autostart=${false}></fluid-countdown>
      </div>
    `);
    const el = wrapper.querySelector<FluidCountdown>("fluid-countdown")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
