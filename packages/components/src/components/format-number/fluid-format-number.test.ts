import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidFormatNumber } from "./fluid-format-number.js";

describe("<fluid-format-number> formatting language context", () => {
  it("retains explicit currency and precision options through inherited locale changes", async () => {
    const { wrapper, control } = await mount("fr");
    control.type = "currency";
    control.currency = "EUR";
    control.minimumFractionDigits = 3;
    control.maximumFractionDigits = 3;
    await settle(control);
    const options = {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    } as const;
    expect(output(control)).to.equal(new Intl.NumberFormat("fr", options).format(control.value));
    wrapper.lang = "ar";
    await settle(control);
    expect(output(control)).to.equal(new Intl.NumberFormat("ar", options).format(control.value));
    expect(control.value).to.equal(1234567.89);
    expect(control.currency).to.equal("EUR");
  });

  it("uses English as the final fallback for an explicit unsupported locale", async () => {
    const { control } = await mount("fr");
    control.locale = "zz-ZZ";
    await settle(control);
    expect(output(control)).to.equal(expected("en"));
    expect(control.locale).to.equal("zz-ZZ");
  });
  const output = (control: FluidFormatNumber): string =>
    control.shadowRoot?.textContent?.trim() ?? "";
  const expected = (locale: string): string => new Intl.NumberFormat(locale).format(1234567.89);
  async function settle(control: FluidFormatNumber): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }
  function create(): FluidFormatNumber {
    const control = document.createElement("fluid-format-number") as FluidFormatNumber;
    control.value = 1234567.89;
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
      expect(control.value).to.equal(1234567.89);
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
    expect(control.value).to.equal(1234567.89);
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
      expect(output(control)).to.equal("1234567.89");
    });
  }
});

const text = (el: FluidFormatNumber): string => (el.shadowRoot?.textContent ?? "").trim();

describe("<fluid-format-number>", () => {
  it("renders defaults", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number value="0"></fluid-format-number>`
    );
    expect(el.value).to.equal(0);
    expect(el.type).to.equal("decimal");
    expect(el.noGrouping).to.equal(false);
  });

  it("formats a decimal with thousand separators", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number value="1234567.89" locale="en-US"></fluid-format-number>`
    );
    expect(text(el)).to.equal("1,234,567.89");
  });

  it("drops grouping when no-grouping is set", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number
        value="1234567.89"
        no-grouping
        locale="en-US"
      ></fluid-format-number>`
    );
    expect(text(el)).to.equal("1234567.89");
  });

  it("respects the locale (de-DE swaps the separators)", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number value="1234567.89" locale="de-DE"></fluid-format-number>`
    );
    expect(text(el)).to.equal("1.234.567,89");
  });

  it("formats currency", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number
        value="1234.5"
        type="currency"
        currency="USD"
        locale="en-US"
      ></fluid-format-number>`
    );
    expect(text(el)).to.equal("$1,234.50");
  });

  it("honours currency-display=code", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number
        value="1234.5"
        type="currency"
        currency="EUR"
        currency-display="code"
        locale="en-US"
      ></fluid-format-number>`
    );
    expect(text(el)).to.contain("EUR");
  });

  it("formats a percent", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number value="0.123" type="percent" locale="en-US"></fluid-format-number>`
    );
    expect(text(el)).to.equal("12%");
  });

  it("formats a unit", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number
        value="85"
        type="unit"
        unit="kilometer-per-hour"
        locale="en-US"
      ></fluid-format-number>`
    );
    expect(text(el)).to.equal("85 km/h");
  });

  it("uses the unit long display name", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number
        value="2.5"
        type="unit"
        unit="liter"
        unit-display="long"
        locale="en-US"
      ></fluid-format-number>`
    );
    expect(text(el)).to.equal("2.5 liters");
  });

  // Regression: an inconsistent options combination (here, fraction-digit
  // bounds with min > max) makes Intl.NumberFormat throw. The render() must
  // swallow that and fall back to String(value) rather than rendering nothing.
  it("falls back to String(value) when options are inconsistent", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number
        value="42"
        minimum-fraction-digits="5"
        maximum-fraction-digits="2"
        locale="en-US"
      ></fluid-format-number>`
    );
    expect(text(el)).to.equal("42");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidFormatNumber>(
      html`<fluid-format-number value="1234.5"></fluid-format-number>`
    );
    await expect(el).to.be.accessible();
  });
});
