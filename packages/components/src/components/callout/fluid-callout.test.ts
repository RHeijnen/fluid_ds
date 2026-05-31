import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidCallout } from "./fluid-callout.js";

describe("<fluid-callout>", () => {
  it("renders body content", async () => {
    const el = await fixture<FluidCallout>(
      html`<fluid-callout>Hello world.</fluid-callout>`
    );
    expect(el.textContent?.trim()).to.include("Hello world.");
  });

  it("uses role=status by default", async () => {
    const el = await fixture<FluidCallout>(html`<fluid-callout>Body</fluid-callout>`);
    expect(el.shadowRoot!.querySelector("[part='base']")!.getAttribute("role")).to.equal(
      "status"
    );
  });

  it("uses role=alert for danger variant", async () => {
    const el = await fixture<FluidCallout>(
      html`<fluid-callout variant="danger">Body</fluid-callout>`
    );
    expect(el.shadowRoot!.querySelector("[part='base']")!.getAttribute("role")).to.equal(
      "alert"
    );
  });

  it("hides the dismiss button by default", async () => {
    const el = await fixture<FluidCallout>(html`<fluid-callout>Body</fluid-callout>`);
    expect(el.shadowRoot!.querySelector(".close")).to.be.null;
  });

  it("fires fluid-dismiss when the close button is clicked", async () => {
    const el = await fixture<FluidCallout>(
      html`<fluid-callout dismissible>Body</fluid-callout>`
    );
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".close")!;
    setTimeout(() => button.click());
    const event = await oneEvent(el, "fluid-dismiss");
    expect(event).to.exist;
  });

  it("renders default variant icon", async () => {
    const el = await fixture<FluidCallout>(
      html`<fluid-callout variant="info">Body</fluid-callout>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("fluid-icon")).to.exist;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCallout>(html`
      <fluid-callout variant="info" dismissible>
        <span slot="header">Heads up</span>
        Body content.
      </fluid-callout>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("background reads the --fluid-callout-* override ladder", async () => {
    const el = await fixture<FluidCallout>(html`<fluid-callout>Body</fluid-callout>`);
    el.style.setProperty("--fluid-callout-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the dismiss button respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidCallout>(html`<fluid-callout dismissible>Body</fluid-callout>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const close = el.shadowRoot!.querySelector<HTMLElement>(".close")!;
    expect(close.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
