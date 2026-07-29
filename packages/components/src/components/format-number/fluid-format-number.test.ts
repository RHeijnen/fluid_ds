import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidFormatNumber } from "./fluid-format-number.js";

const text = (el: FluidFormatNumber): string =>
  (el.shadowRoot?.textContent ?? "").trim();

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
      html`<fluid-format-number
        value="1234567.89"
        locale="en-US"
      ></fluid-format-number>`
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
      html`<fluid-format-number
        value="1234567.89"
        locale="de-DE"
      ></fluid-format-number>`
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
      html`<fluid-format-number
        value="0.123"
        type="percent"
        locale="en-US"
      ></fluid-format-number>`
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
