import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidStat } from "./fluid-stat.js";

describe("<fluid-stat>", () => {
  it("renders label and value", async () => {
    const el = await fixture<FluidStat>(html`<fluid-stat label="Revenue" value="$10k"></fluid-stat>`);
    expect(el.shadowRoot!.querySelector('[part="label"]')?.textContent).to.contain("Revenue");
    expect(el.shadowRoot!.querySelector('[part="value"]')?.textContent).to.contain("$10k");
  });

  it("shows the change with a trend arrow and exposes a group label", async () => {
    const el = await fixture<FluidStat>(html`<fluid-stat label="Revenue" value="$10k" change="+12%" trend="up"></fluid-stat>`);
    const change = el.shadowRoot!.querySelector('[part="change"]')!;
    expect(change.getAttribute("data-trend")).to.equal("up");
    expect(change.textContent).to.contain("+12%");
    expect(el.shadowRoot!.querySelector('[role="group"]')?.getAttribute("aria-label")).to.contain("+12%");
  });

  it("omits the change when not set", async () => {
    const el = await fixture<FluidStat>(html`<fluid-stat label="Revenue" value="$10k"></fluid-stat>`);
    expect(el.shadowRoot!.querySelector('[part="change"]')).to.be.null;
  });

  it("passes the a11y audit", async () => {
    const host = await fixture<HTMLElement>(html`
      <div style="--fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-success-text:#15803d;">
        <fluid-stat label="Revenue" value="$48.2k" change="+12%" trend="up"></fluid-stat>
      </div>
    `);
    await expect(host.querySelector("fluid-stat")!).to.be.accessible();
  });
});
