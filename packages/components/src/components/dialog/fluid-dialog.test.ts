import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidDialog } from "./fluid-dialog.js";

describe("<fluid-dialog>", () => {
  it("renders closed by default", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="x">Body</fluid-dialog>
    `);
    expect(el.open).to.be.false;
    expect(el.shadowRoot!.querySelector("dialog")!.open).to.be.false;
  });

  it("opens via show()", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="x">Body</fluid-dialog>
    `);
    setTimeout(() => el.show());
    const event = await oneEvent(el, "fluid-show");
    expect(event).to.exist;
    expect(el.open).to.be.true;
  });

  it("fires fluid-hide when closed", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="x" open>Body</fluid-dialog>
    `);
    await el.updateComplete;
    setTimeout(() => el.hide());
    const event = await oneEvent(el, "fluid-hide");
    expect(event).to.exist;
    expect(el.open).to.be.false;
  });

  it("renders the close button by default", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="x">Body</fluid-dialog>
    `);
    expect(el.shadowRoot!.querySelector(".close")).to.exist;
  });

  it("omits the close button when no-close-button is set", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="x" no-close-button>Body</fluid-dialog>
    `);
    expect(el.shadowRoot!.querySelector(".close")).to.be.null;
  });

  /* Rework: override ladder + AAA target floor. */

  it("panel background reads the --fluid-dialog-* override ladder", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="x" open>Body</fluid-dialog>
    `);
    el.style.setProperty("--fluid-dialog-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const panel = el.shadowRoot!.querySelector<HTMLElement>(".panel")!;
    expect(getComputedStyle(panel).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the close button respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="x" open>Body</fluid-dialog>
    `);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const close = el.shadowRoot!.querySelector<HTMLElement>(".close")!;
    expect(close.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
