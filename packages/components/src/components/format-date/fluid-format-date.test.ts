import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidFormatDate } from "./fluid-format-date.js";

const text = (el: FluidFormatDate): string =>
  (el.shadowRoot?.textContent ?? "").trim();

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
