import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidFormatBytes } from "./fluid-format-bytes.js";

describe("<fluid-format-bytes> formatting language context", () => {
  it("localizes binary numerals without changing IEC symbols or numeric values", async () => {
    const { wrapper, control } = await mount("fr");
    control.value = -1536;
    control.base = "binary";
    await settle(control);
    expect(output(control)).to.equal(
      `${new Intl.NumberFormat("fr", { maximumFractionDigits: 1 }).format(-1.5)} KiB`
    );
    wrapper.lang = "ar";
    await settle(control);
    expect(output(control)).to.equal(
      `${new Intl.NumberFormat("ar", { maximumFractionDigits: 1 }).format(-1.5)} KiB`
    );
    expect(control.value).to.equal(-1536);
    expect(control.base).to.equal("binary");
  });

  it("uses English as the final fallback for an explicit unsupported locale", async () => {
    const { control } = await mount("fr");
    control.locale = "zz-ZZ";
    await settle(control);
    expect(output(control)).to.equal(expected("en"));
    expect(control.locale).to.equal("zz-ZZ");
  });
  const output = (control: FluidFormatBytes): string =>
    control.shadowRoot?.textContent?.trim() ?? "";
  const expected = (locale: string): string =>
    new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "megabyte",
      unitDisplay: "short",
      maximumFractionDigits: 1
    }).format(1.5);
  async function settle(control: FluidFormatBytes): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }
  function create(): FluidFormatBytes {
    const control = document.createElement("fluid-format-bytes") as FluidFormatBytes;
    control.value = 1500000;
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
      expect(control.value).to.equal(1500000);
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
    expect(control.value).to.equal(1500000);
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
      const control = create();
      control.locale = invalid;
      control.lang = "fr";
      expect(() => control.render()).to.throw(RangeError);
    });
  }
});

const text = (el: FluidFormatBytes): string => (el.shadowRoot?.textContent ?? "").trim();

describe("<fluid-format-bytes>", () => {
  it("renders defaults", async () => {
    const el = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes value="0"></fluid-format-bytes>`
    );
    expect(el.base).to.equal("decimal");
    expect(el.unit).to.equal("byte");
    expect(el.display).to.equal("short");
  });

  it("formats decimal (SI) bytes", async () => {
    const el = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes value="1500" locale="en-US"></fluid-format-bytes>`
    );
    expect(text(el)).to.equal("1.5 kB");
  });

  it("scales up SI magnitudes", async () => {
    const el = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes value="1500000" locale="en-US"></fluid-format-bytes>`
    );
    expect(text(el)).to.equal("1.5 MB");
  });

  it("formats bits", async () => {
    const el = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes value="1500000" unit="bit" locale="en-US"></fluid-format-bytes>`
    );
    expect(text(el)).to.equal("1.5 Mb");
  });

  it("respects the locale (fr-FR uses a comma decimal)", async () => {
    const el = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes value="1500000" locale="fr-FR"></fluid-format-bytes>`
    );
    // fr-FR formats with a comma decimal separator.
    expect(text(el)).to.match(/^1,5\s/);
  });

  it("formats negative values with a minus sign", async () => {
    const el = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes value="-1500" locale="en-US"></fluid-format-bytes>`
    );
    expect(text(el)).to.match(/^-1\.5\s*kB$/);
  });

  // Regression: base="binary" must emit honest IEC suffixes (KiB/MiB), never
  // SI names (kB/MB), since it divides by 1024. Intl.NumberFormat has no
  // kibibyte/mebibyte units, so the suffix is appended by hand.
  it("labels binary base with IEC suffixes, not SI names", async () => {
    const kib = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes value="1024" base="binary" locale="en-US"></fluid-format-bytes>`
    );
    expect(text(kib)).to.equal("1 KiB");

    const mib = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes value="1048576" base="binary" locale="en-US"></fluid-format-bytes>`
    );
    expect(text(mib)).to.equal("1 MiB");
    // Must not regress to the SI label.
    expect(text(mib)).to.not.contain("MB");
  });

  it("binary base in long display uses the IEC long name", async () => {
    const el = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes
        value="1048576"
        base="binary"
        display="long"
        locale="en-US"
      ></fluid-format-bytes>`
    );
    expect(text(el)).to.equal("1 mebibyte");
  });

  it("uses localized singular and plural IEC long-unit grammar", async () => {
    const el = await fixture<FluidFormatBytes>(html`
      <fluid-format-bytes
        value="1048576"
        base="binary"
        display="long"
        locale="fr"
      ></fluid-format-bytes>
    `);
    expect(text(el)).to.equal("1 mébioctet");
    el.value = 2097152;
    await el.updateComplete;
    expect(text(el)).to.equal("2 mébioctets");
    el.locale = "de";
    await el.updateComplete;
    expect(text(el)).to.equal("2 Mebibytes");
  });

  it("selects plural grammar from the same rounded quantity that is displayed", async () => {
    const el = await fixture<FluidFormatBytes>(html`
      <fluid-format-bytes
        value=${1048576 * 1.04}
        base="binary"
        display="long"
        locale="en"
      ></fluid-format-bytes>
    `);
    expect(text(el)).to.equal("1 mebibyte");
    el.value = 1048576 * 2.04;
    el.locale = "ar";
    await el.updateComplete;
    expect(text(el)).to.equal(
      `${new Intl.NumberFormat("ar", { maximumFractionDigits: 1 }).format(2.04)} ميبي بايتان`
    );
  });

  it("uses Arabic plural categories for long IEC units", async () => {
    const el = await fixture<FluidFormatBytes>(html`
      <fluid-format-bytes
        value="2097152"
        base="binary"
        display="long"
        locale="ar"
      ></fluid-format-bytes>
    `);
    expect(text(el)).to.equal(`${new Intl.NumberFormat("ar").format(2)} ميبي بايتان`);
    el.value = 3145728;
    await el.updateComplete;
    expect(text(el)).to.equal(`${new Intl.NumberFormat("ar").format(3)} ميبي بايتات`);
  });

  it("updates inherited long-unit language while preserving value and display mode", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="en">
        <fluid-format-bytes value="-1536" base="binary" display="long"></fluid-format-bytes>
      </div>
    `);
    const el = wrapper.querySelector<FluidFormatBytes>("fluid-format-bytes")!;
    expect(text(el)).to.equal("-1.5 kibibytes");
    wrapper.lang = "fr";
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
    // French cardinal rules classify fractional 1.5 in the `one` category.
    expect(text(el)).to.match(/^-1,5 kibioctet$/);
    expect(el.value).to.equal(-1536);
    expect(el.display).to.equal("long");
    expect(el.base).to.equal("binary");
  });

  it("binary bits use the bibit suffix", async () => {
    const el = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes
        value="1048576"
        base="binary"
        unit="bit"
        locale="en-US"
      ></fluid-format-bytes>`
    );
    expect(text(el)).to.equal("1 Mibit");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes value="1500"></fluid-format-bytes>`
    );
    await expect(el).to.be.accessible();
  });
});
