import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidRelativeTime } from "./fluid-relative-time.js";

describe("<fluid-relative-time> formatting language context", () => {
  it("does not restart its refresh timer for language-only updates", async () => {
    const original = window.setTimeout;
    let scheduled = 0;
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay === 60_000) scheduled++;
      return original(handler, delay, ...args);
    }) as typeof window.setTimeout;
    try {
      const { wrapper, control } = await mount("fr");
      control.noSync = false;
      await settle(control);
      const before = scheduled;
      expect(before).to.be.greaterThan(0);
      wrapper.lang = "ar";
      await settle(control);
      expect(output(control)).to.equal(expected("ar"));
      expect(scheduled).to.equal(before);
      control.remove();
    } finally {
      window.setTimeout = original;
    }
  });

  it("uses English as the final fallback for an explicit unsupported locale", async () => {
    const { control } = await mount("fr");
    control.locale = "zz-ZZ";
    await settle(control);
    expect(output(control)).to.equal(expected("en"));
    expect(control.locale).to.equal("zz-ZZ");
  });
  const output = (control: FluidRelativeTime): string =>
    control.shadowRoot?.textContent?.trim() ?? "";
  const expected = (locale: string): string =>
    new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "long" }).format(-2, "minute");
  async function settle(control: FluidRelativeTime): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }
  function create(): FluidRelativeTime {
    const control = document.createElement("fluid-relative-time") as FluidRelativeTime;
    control.date = new Date(Date.now() - 120_000);
    control.noSync = true;
    control.numeric = "always";
    return control;
  }
  async function mount(language = "en") {
    const wrapper = await fixture<HTMLDivElement>("<div></div>");
    wrapper.lang = language;
    const control = create();
    wrapper.append(control);
    await settle(control);
    return { wrapper, control };
  }

  for (const locale of ["nl", "de", "fr", "es", "ar", "fr-CA", "ja", "ar-u-nu-latn"]) {
    it(`formats inherited ${locale} without requiring a registered dictionary`, async () => {
      const { control } = await mount(locale);
      expect(output(control)).to.equal(expected(locale));
      expect(control.locale).to.equal(null);
      expect(control.hasAttribute("locale")).to.equal(false);
      expect(control.noSync).to.equal(true);
      expect(control.numeric).to.equal("always");
    });
  }

  it("updates on ancestor language changes without materializing locale or lang overrides", async () => {
    const { wrapper, control } = await mount("fr");
    expect(output(control)).to.equal(expected("fr"));
    wrapper.lang = "ar";
    await settle(control);
    expect(output(control)).to.equal(expected("ar"));
    expect(control.locale).to.equal(null);
    expect(control.hasAttribute("locale")).to.equal(false);
    expect(control.hasAttribute("lang")).to.equal(false);
    expect(control.noSync).to.equal(true);
    expect(control.numeric).to.equal("always");
  });

  it("lets own lang override ancestry and restores ancestry when removed", async () => {
    const { wrapper, control } = await mount("fr");
    control.lang = "de";
    await settle(control);
    expect(output(control)).to.equal(expected("de"));
    wrapper.lang = "ar";
    await settle(control);
    expect(output(control)).to.equal(expected("de"));
    control.removeAttribute("lang");
    await settle(control);
    expect(output(control)).to.equal(expected("ar"));
  });

  it("preserves an explicit property locale through context changes and resets with null", async () => {
    const { wrapper, control } = await mount("fr");
    control.locale = "en";
    control.lang = "de";
    await settle(control);
    expect(output(control)).to.equal(expected("en"));
    wrapper.lang = "ar";
    await settle(control);
    expect(output(control)).to.equal(expected("en"));
    expect(control.locale).to.equal("en");
    control.locale = null;
    await settle(control);
    expect(output(control)).to.equal(expected("de"));
  });

  it("preserves an explicit locale attribute and resumes inheritance on removal", async () => {
    const { wrapper, control } = await mount("fr");
    control.setAttribute("locale", "de");
    await settle(control);
    expect(output(control)).to.equal(expected("de"));
    wrapper.lang = "ar";
    await settle(control);
    expect(output(control)).to.equal(expected("de"));
    control.removeAttribute("locale");
    await settle(control);
    expect(output(control)).to.equal(expected("ar"));
  });

  for (const mode of ["open", "closed"] as const) {
    it(`reacts to language changes across a ${mode} shadow root`, async () => {
      const wrapper = await fixture<HTMLDivElement>('<div lang="fr"></div>');
      const host = document.createElement("div");
      const root = host.attachShadow({ mode });
      const context = document.createElement("div");
      const control = create();
      context.append(control);
      root.append(context);
      wrapper.append(host);
      await settle(control);
      expect(output(control)).to.equal(expected("fr"));
      context.lang = "de";
      await settle(control);
      expect(output(control)).to.equal(expected("de"));
      context.removeAttribute("lang");
      host.lang = "ar";
      await settle(control);
      expect(output(control)).to.equal(expected("ar"));
    });
  }

  it("keeps a slotted formatter's light-DOM language instead of the slot's language", async () => {
    const wrapper = await fixture<HTMLDivElement>('<div lang="fr"></div>');
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });
    const slot = document.createElement("slot");
    slot.lang = "de";
    root.append(slot);
    const control = create();
    host.append(control);
    wrapper.append(host);
    await settle(control);
    expect(output(control)).to.equal(expected("fr"));
  });

  it("resolves the new language after detached moves and reconnect", async () => {
    const { control } = await mount("fr");
    const destination = await fixture<HTMLDivElement>('<div lang="de"></div>');
    control.remove();
    destination.append(control);
    await settle(control);
    expect(output(control)).to.equal(expected("de"));
    control.remove();
    control.locale = "en";
    destination.lang = "ar";
    destination.append(control);
    await settle(control);
    expect(output(control)).to.equal(expected("en"));
    control.locale = null;
    await settle(control);
    expect(output(control)).to.equal(expected("ar"));
  });

  it("treats an empty nearest language as an English boundary", async () => {
    const { control } = await mount("fr");
    control.lang = "";
    await settle(control);
    expect(output(control)).to.equal(expected("en"));
  });

  for (const language of ["not_a_locale", "zz-ZZ"]) {
    it(`falls back to English for unusable inherited language ${language}`, async () => {
      const { control } = await mount(language);
      expect(output(control)).to.equal(expected("en"));
    });
  }

  it("follows document language when no nearer declaration exists", async () => {
    const previous = document.documentElement.getAttribute("lang");
    try {
      document.documentElement.lang = "fr";
      const { wrapper, control } = await mount();
      wrapper.removeAttribute("lang");
      await settle(control);
      expect(output(control)).to.equal(expected("fr"));
      document.documentElement.lang = "ar";
      await settle(control);
      expect(output(control)).to.equal(expected("ar"));
      document.documentElement.removeAttribute("lang");
      await settle(control);
      expect(output(control)).to.equal(expected("en"));
    } finally {
      if (previous === null) document.documentElement.removeAttribute("lang");
      else document.documentElement.setAttribute("lang", previous);
    }
  });

  for (const invalid of ["", "not_a_locale"]) {
    it(`preserves the existing malformed explicit locale behavior for ${JSON.stringify(invalid)}`, async () => {
      const { control } = await mount("fr");
      control.locale = invalid;
      await settle(control);
      expect(output(control)).to.equal(new Date(control.date).toISOString());
    });
  }
});

describe("<fluid-relative-time>", () => {
  it("passes an a11y audit", async () => {
    const el = await fixture<FluidRelativeTime>(html`
      <fluid-relative-time .date=${new Date(Date.now() - 60_000)} locale="en"></fluid-relative-time>
    `);
    await expect(el).to.be.accessible();
  });

  it("formats a known past date", async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 3);
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time .date=${past} locale="en" numeric="always"></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim()).to.equal("3 hours ago");
  });

  it("formats a known future date", async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time .date=${future} locale="en" numeric="always"></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim()).to.equal("in 2 days");
  });

  it('uses phrasing like "yesterday" when numeric is "auto"', async () => {
    const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time
        .date=${yesterday}
        locale="en"
        numeric="auto"
      ></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim().toLowerCase()).to.equal("yesterday");
  });

  it("respects locale switching", async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time .date=${past} locale="en" numeric="always"></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim()).to.equal("3 days ago");
    el.locale = "es";
    await elementUpdated(el);
    expect(el.shadowRoot!.textContent?.trim()).to.equal("hace 3 días");
  });

  it("falls back gracefully for an invalid date", async () => {
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time date="not-a-date"></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim()).to.equal("");
  });

  it("does not schedule the refresh timer when no-sync is set", async () => {
    const realSetTimeout = window.setTimeout;
    const delays: unknown[] = [];
    (window as unknown as { setTimeout: typeof setTimeout }).setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) => {
      delays.push(timeout);
      return realSetTimeout(handler, timeout, ...args);
    }) as typeof setTimeout;
    try {
      const el = await fixture<FluidRelativeTime>(
        html`<fluid-relative-time
          .date=${new Date(Date.now() - 1000 * 60 * 5)}
          no-sync
        ></fluid-relative-time>`
      );
      expect(el.noSync).to.be.true;
      // The 60s auto-refresh timer must never be scheduled.
      expect(delays).to.not.include(60_000);
    } finally {
      (window as unknown as { setTimeout: typeof setTimeout }).setTimeout = realSetTimeout;
    }
  });

  it("clears its pending refresh timer on disconnect", async () => {
    const realClearTimeout = window.clearTimeout;
    let clearCount = 0;
    (window as unknown as { clearTimeout: typeof clearTimeout }).clearTimeout = ((id?: number) => {
      clearCount += 1;
      return realClearTimeout(id);
    }) as typeof clearTimeout;
    try {
      const el = await fixture<FluidRelativeTime>(
        html`<fluid-relative-time
          .date=${new Date(Date.now() - 1000 * 60 * 5)}
        ></fluid-relative-time>`
      );
      clearCount = 0;
      el.remove();
      // The pending refresh timer must be cleared so it cannot keep
      // re-rendering after the element leaves the DOM.
      expect(clearCount).to.be.greaterThan(0);
    } finally {
      (window as unknown as { clearTimeout: typeof clearTimeout }).clearTimeout = realClearTimeout;
    }
  });

  it("does not re-render after the element is removed", async () => {
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time
        .date=${new Date(Date.now() - 1000 * 60 * 5)}
      ></fluid-relative-time>`
    );
    el.remove();
    let updated = false;
    const realRequestUpdate = el.requestUpdate.bind(el);
    el.requestUpdate = ((...args: unknown[]) => {
      updated = true;
      return (realRequestUpdate as (...a: unknown[]) => unknown)(...args);
    }) as typeof el.requestUpdate;
    // The cleared 60s timer must not fire; give the loop a brief window.
    await aTimeout(50);
    expect(updated).to.be.false;
  });
});
