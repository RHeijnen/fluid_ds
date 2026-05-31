import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidCopyButton } from "./fluid-copy-button.js";

describe("<fluid-copy-button>", () => {
  it("renders a button", async () => {
    const el = await fixture<FluidCopyButton>(
      html`<fluid-copy-button value="hello"></fluid-copy-button>`
    );
    expect(el.shadowRoot!.querySelector("button")).to.exist;
  });

  it("fires fluid-copy on click", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    const el = await fixture<FluidCopyButton>(
      html`<fluid-copy-button value="text"></fluid-copy-button>`
    );
    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>("button")!;
    setTimeout(() => btn.click());
    const event = (await oneEvent(el, "fluid-copy")) as CustomEvent;
    expect(event.detail.success).to.be.true;
    expect(event.detail.text).to.equal("text");
  });

  it("shows success state after a successful copy", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    const el = await fixture<FluidCopyButton>(
      html`<fluid-copy-button value="x" feedback-duration="50"></fluid-copy-button>`
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    await aTimeout(10);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".copied")).to.exist;
  });

  it("returns to idle after feedback duration", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    const el = await fixture<FluidCopyButton>(
      html`<fluid-copy-button value="x" feedback-duration="20"></fluid-copy-button>`
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    await aTimeout(100);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".copied")).to.be.null;
  });

  it("does nothing when disabled", async () => {
    const el = await fixture<FluidCopyButton>(
      html`<fluid-copy-button value="x" disabled></fluid-copy-button>`
    );
    let fired = false;
    el.addEventListener("fluid-copy", () => (fired = true));
    el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    await aTimeout(20);
    expect(fired).to.be.false;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCopyButton>(
      html`<fluid-copy-button value="hello"></fluid-copy-button>`
    );
    await expect(el).to.be.accessible();
  });
});
