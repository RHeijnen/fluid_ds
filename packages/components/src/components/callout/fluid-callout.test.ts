import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidCallout, FluidCalloutDismissEvent } from "../../index.js";

// @ts-expect-error Callout dismissal detail is exactly null.
const invalidCalloutEvent: FluidCalloutDismissEvent = new CustomEvent("fluid-dismiss", {
  detail: false
});
void invalidCalloutEvent;

describe("<fluid-callout>", () => {
  it("renders body content", async () => {
    const el = await fixture<FluidCallout>(html`<fluid-callout>Hello world.</fluid-callout>`);
    expect(el.textContent?.trim()).to.include("Hello world.");
  });

  it("uses role=status by default", async () => {
    const el = await fixture<FluidCallout>(html`<fluid-callout>Body</fluid-callout>`);
    expect(el.shadowRoot!.querySelector("[part='base']")!.getAttribute("role")).to.equal("status");
  });

  it("uses role=alert for danger variant", async () => {
    const el = await fixture<FluidCallout>(
      html`<fluid-callout variant="danger">Body</fluid-callout>`
    );
    expect(el.shadowRoot!.querySelector("[part='base']")!.getAttribute("role")).to.equal("alert");
  });

  it("hides the dismiss button by default", async () => {
    const el = await fixture<FluidCallout>(html`<fluid-callout>Body</fluid-callout>`);
    expect(el.shadowRoot!.querySelector(".close")).to.be.null;
  });

  it("fires fluid-dismiss when the close button is clicked", async () => {
    const el = await fixture<FluidCallout>(html`<fluid-callout dismissible>Body</fluid-callout>`);
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>(".close")!;
    setTimeout(() => button.click());
    const event = (await oneEvent(el, "fluid-dismiss")) as FluidCalloutDismissEvent;
    expect(event.detail).to.equal(null);
  });

  it("remains caller-owned across dismiss, removal, and reinsertion", async () => {
    const host = await fixture<HTMLDivElement>(
      html`<div><fluid-callout dismissible>Body</fluid-callout></div>`
    );
    const el = host.querySelector<FluidCallout>("fluid-callout")!;
    let dismisses = 0;
    el.addEventListener("fluid-dismiss", () => {
      dismisses++;
      el.remove();
    });

    el.shadowRoot!.querySelector<HTMLButtonElement>(".close")!.click();
    expect(el.isConnected).to.equal(false);
    expect(dismisses).to.equal(1);

    host.append(el);
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>(".close")!.click();
    expect(el.isConnected).to.equal(false);
    expect(dismisses).to.equal(2);
  });

  it("keeps one live root while content, severity role, and icon change", async () => {
    const el = await fixture<FluidCallout>(
      html`<fluid-callout variant="info">Initial status</fluid-callout>`
    );
    const liveRoot = el.shadowRoot!.querySelector<HTMLElement>("[part='base']")!;
    expect(liveRoot.getAttribute("role")).to.equal("status");
    expect(el.shadowRoot!.querySelector("fluid-icon")!.getAttribute("name")).to.equal("info");

    el.textContent = "Updated status";
    await aTimeout(0);
    expect(el.shadowRoot!.querySelector("[part='base']")).to.equal(liveRoot);
    const contentSlot = liveRoot.querySelector<HTMLSlotElement>(".body > slot:not([name])")!;
    expect(
      contentSlot
        .assignedNodes({ flatten: true })
        .map((node) => node.textContent)
        .join("")
    ).to.equal("Updated status");

    el.variant = "danger";
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("[part='base']")).to.equal(liveRoot);
    expect(liveRoot.getAttribute("role")).to.equal("alert");
    expect(el.shadowRoot!.querySelector("fluid-icon")!.getAttribute("name")).to.equal(
      "alert-triangle"
    );

    el.variant = "success";
    await el.updateComplete;
    expect(liveRoot.getAttribute("role")).to.equal("status");
    expect(el.shadowRoot!.querySelector("fluid-icon")!.getAttribute("name")).to.equal("check");
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
