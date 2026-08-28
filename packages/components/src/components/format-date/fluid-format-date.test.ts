import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidFormatDate } from "./fluid-format-date.js";

describe("<fluid-format-date> formatting language context", () => {
  for (const instant of ["2024-03-31T00:30:00Z", "2024-03-31T01:30:00Z"]) {
    it(`preserves timezone and hour-cycle options around the DST boundary at ${instant}`, async () => {
      const { wrapper, control } = await mount("nl");
      control.date = instant;
      control.dateStyle = "short";
      control.timeStyle = "long";
      control.timeZone = "Europe/Amsterdam";
      control.hourCycle = "h23";
      await settle(control);
      const options = {
        dateStyle: "short",
        timeStyle: "long",
        timeZone: "Europe/Amsterdam",
        hourCycle: "h23"
      } as const;
      expect(output(control)).to.equal(
        new Intl.DateTimeFormat("nl", options).format(new Date(instant))
      );
      wrapper.lang = "ar";
      await settle(control);
      expect(output(control)).to.equal(
        new Intl.DateTimeFormat("ar", options).format(new Date(instant))
      );
      expect(control.date).to.equal(instant);
      expect(control.hourCycle).to.equal("h23");
    });
  }

  it("preserves an explicit calendar and numbering-system extension", async () => {
    const { control } = await mount("fr");
    control.locale = "ar-SA-u-ca-islamic-nu-arab";
    await settle(control);
    expect(output(control)).to.equal(expected("ar-SA-u-ca-islamic-nu-arab"));
  });

  it("uses English as the final fallback for an explicit unsupported locale", async () => {
    const { control } = await mount("fr");
    control.locale = "zz-ZZ";
    await settle(control);
    expect(output(control)).to.equal(expected("en"));
    expect(control.locale).to.equal("zz-ZZ");
  });
  const output = (control: FluidFormatDate): string =>
    control.shadowRoot?.textContent?.trim() ?? "";
  const expected = (locale: string): string =>
    new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(
      new Date("2024-06-15T14:30:00Z")
    );
  async function settle(control: FluidFormatDate): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }
  function create(): FluidFormatDate {
    const control = document.createElement("fluid-format-date") as FluidFormatDate;
    control.date = "2024-06-15T14:30:00Z";
    control.dateStyle = "full";
    control.timeZone = "UTC";
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
      expect(control.date).to.equal("2024-06-15T14:30:00Z");
      expect(control.timeZone).to.equal("UTC");
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
    expect(control.date).to.equal("2024-06-15T14:30:00Z");
    expect(control.timeZone).to.equal("UTC");
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
      expect(output(control)).to.equal("2024-06-15T14:30:00.000Z");
    });
  }
});

const text = (el: FluidFormatDate): string => (el.shadowRoot?.textContent ?? "").trim();

const sample = "2024-06-15T14:30:00Z";

describe("<fluid-format-date>", () => {
  it("formats an ISO 8601 string", async () => {
    const el = await fixture<FluidFormatDate>(
      html`<fluid-format-date
        date=${sample}
        date-style="medium"
        time-zone="UTC"
        locale="en-US"
      ></fluid-format-date>`
    );
    expect(text(el)).to.equal("Jun 15, 2024");
  });

  it("formats a numeric timestamp", async () => {
    const ms = Date.parse(sample);
    const el = await fixture<FluidFormatDate>(html`<fluid-format-date></fluid-format-date>`);
    el.date = ms;
    el.dateStyle = "medium";
    el.timeZone = "UTC";
    el.locale = "en-US";
    await el.updateComplete;
    expect(text(el)).to.equal("Jun 15, 2024");
  });

  it("formats a Date object passed as a property", async () => {
    const el = await fixture<FluidFormatDate>(html`<fluid-format-date></fluid-format-date>`);
    el.date = new Date(sample);
    el.dateStyle = "medium";
    el.timeZone = "UTC";
    el.locale = "en-US";
    await el.updateComplete;
    expect(text(el)).to.equal("Jun 15, 2024");
  });

  it("renders empty output for an invalid date", async () => {
    const el = await fixture<FluidFormatDate>(
      html`<fluid-format-date date="not-a-date"></fluid-format-date>`
    );
    expect(text(el)).to.equal("");
  });

  it("applies dateStyle options", async () => {
    const el = await fixture<FluidFormatDate>(
      html`<fluid-format-date
        date=${sample}
        date-style="full"
        time-zone="UTC"
        locale="en-US"
      ></fluid-format-date>`
    );
    expect(text(el)).to.equal("Saturday, June 15, 2024");
  });

  it("respects the locale (fr-FR)", async () => {
    const el = await fixture<FluidFormatDate>(
      html`<fluid-format-date
        date=${sample}
        date-style="long"
        time-zone="UTC"
        locale="fr-FR"
      ></fluid-format-date>`
    );
    expect(text(el)).to.equal("15 juin 2024");
  });

  it("combines date and time styles", async () => {
    const el = await fixture<FluidFormatDate>(
      html`<fluid-format-date
        date=${sample}
        date-style="medium"
        time-style="short"
        time-zone="UTC"
        hour-cycle="h23"
        locale="en-US"
      ></fluid-format-date>`
    );
    expect(text(el)).to.equal("Jun 15, 2024, 14:30");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidFormatDate>(
      html`<fluid-format-date date=${sample}></fluid-format-date>`
    );
    await expect(el).to.be.accessible();
  });
});
