import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidMeter } from "./fluid-meter.js";

const tokens = [
  "--fluid-surface-base:#ffffff",
  "--fluid-surface-muted:#f4f4f5",
  "--fluid-text-primary:#18181b",
  "--fluid-text-secondary:#3f3f46",
  "--fluid-border-default:#e4e4e7",
  "--fluid-accent-base:#4f46e5",
  "--fluid-accent-text:#ffffff",
  "--fluid-success-base:#15803d",
  "--fluid-success-text:#ffffff",
  "--fluid-danger-base:#b91c1c",
  "--fluid-danger-text:#ffffff",
  "--fluid-warning-base:#a16207",
  "--fluid-motion:0"
].join(";");

describe("<fluid-meter>", () => {
  it("exposes role=meter and the aria value attributes", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="42" label="Score"></fluid-meter>`
    );
    await elementUpdated(el);
    expect(el.getAttribute("role")).to.equal("meter");
    expect(el.getAttribute("aria-valuemin")).to.equal("0");
    expect(el.getAttribute("aria-valuemax")).to.equal("100");
    expect(el.getAttribute("aria-valuenow")).to.equal("42");
    expect(el.getAttribute("aria-label")).to.equal("Score");
  });

  it("clamps the value into [min, max]", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="150" min="0" max="100" label="x"></fluid-meter>`
    );
    await elementUpdated(el);
    expect(el.getAttribute("aria-valuenow")).to.equal("100");
  });

  it("honors a custom min/max range", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="3" min="0" max="8" label="x"></fluid-meter>`
    );
    await elementUpdated(el);
    expect(el.getAttribute("aria-valuemin")).to.equal("0");
    expect(el.getAttribute("aria-valuemax")).to.equal("8");
    expect(el.getAttribute("aria-valuenow")).to.equal("3");
    const fill = el.shadowRoot!.querySelector<HTMLElement>(".fill")!;
    // 3 of [0,8] is 37.5%. The component writes "37.50%", but the CSSOM
    // serializes the inline width back without the trailing zero.
    expect(fill.style.width).to.equal("37.5%");
  });

  it("conveys the band in aria-valuetext, never color alone", async () => {
    // optimum high (90): value 85 in the high segment is good.
    const good = await fixture<FluidMeter>(
      html`<fluid-meter value="85" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(good);
    expect(good.getAttribute("aria-valuetext")).to.contain("good");

    // value 50 (medium segment) is one step from the high optimum: fair.
    const fair = await fixture<FluidMeter>(
      html`<fluid-meter value="50" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(fair);
    expect(fair.getAttribute("aria-valuetext")).to.contain("fair");

    // value 10 (low segment) is two steps from the high optimum: poor.
    const poor = await fixture<FluidMeter>(
      html`<fluid-meter value="10" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(poor);
    expect(poor.getAttribute("aria-valuetext")).to.contain("poor");
  });

  it("maps each band to a status-tone fill class", async () => {
    const poor = await fixture<FluidMeter>(
      html`<fluid-meter value="10" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(poor);
    expect(poor.shadowRoot!.querySelector(".fill")!.classList.contains("band-even-less-good")).to
      .be.true;

    const good = await fixture<FluidMeter>(
      html`<fluid-meter value="85" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(good);
    expect(good.shadowRoot!.querySelector(".fill")!.classList.contains("band-optimum")).to.be.true;
  });

  it("omits the band from value text when no banding is configured", async () => {
    const el = await fixture<FluidMeter>(html`<fluid-meter value="40" label="x"></fluid-meter>`);
    await elementUpdated(el);
    expect(el.getAttribute("aria-valuetext")).to.equal("40 of 100");
  });

  it("shows the value text when show-value is set", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="33" show-value label="x"></fluid-meter>`
    );
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent?.trim()).to.equal(
      "33 of 100"
    );
  });

  it("applies a custom formatter to the value text", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="6.2" min="0" max="8" show-value label="x"></fluid-meter>`
    );
    el.valueFormatter = (v) => `${v.toFixed(1)} V`;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent?.trim()).to.equal(
      "6.2 V of 8.0 V"
    );
  });

  it("fill reads the --fluid-meter-* override ladder", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="50" label="x"></fluid-meter>`
    );
    el.style.setProperty("--fluid-meter-fill", "rgb(1, 2, 3)");
    await elementUpdated(el);
    const fill = el.shadowRoot!.querySelector<HTMLElement>(".fill")!;
    expect(getComputedStyle(fill).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("passes an a11y audit", async () => {
    const el = await fixture<FluidMeter>(html`
      <div style="${tokens}">
        <fluid-meter value="72" low="33" high="66" optimum="80" show-value label="Disk usage">
          Disk usage
        </fluid-meter>
      </div>
    `);
    const meter = el.querySelector<FluidMeter>("fluid-meter")!;
    await elementUpdated(meter);
    await aTimeout(20);
    await expect(meter).to.be.accessible();
  });
});
