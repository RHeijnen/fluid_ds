import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidFormatBytes } from "./fluid-format-bytes.js";

const text = (el: FluidFormatBytes): string =>
  (el.shadowRoot?.textContent ?? "").trim();

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
      html`<fluid-format-bytes
        value="1500000"
        unit="bit"
        locale="en-US"
      ></fluid-format-bytes>`
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
      html`<fluid-format-bytes
        value="1024"
        base="binary"
        locale="en-US"
      ></fluid-format-bytes>`
    );
    expect(text(kib)).to.equal("1 KiB");

    const mib = await fixture<FluidFormatBytes>(
      html`<fluid-format-bytes
        value="1048576"
        base="binary"
        locale="en-US"
      ></fluid-format-bytes>`
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
    expect(text(el)).to.equal("1 mebibytes");
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
