import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../button/define.js";
import type { FluidTooltip } from "./fluid-tooltip.js";

describe("<fluid-tooltip>", () => {
  it("renders with hidden popover by default", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi"><button>Trigger</button></fluid-tooltip>
    `);
    const popover = el.shadowRoot!.querySelector(".popover")!;
    expect(popover.classList.contains("visible")).to.be.false;
    expect(popover.getAttribute("aria-hidden")).to.equal("true");
  });

  it("sets aria-describedby on the anchor element", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi"><button>Trigger</button></fluid-tooltip>
    `);
    await el.updateComplete;
    const button = el.querySelector("button")!;
    expect(button.getAttribute("aria-describedby")).to.match(/^fluid-tooltip-\d+$/);
  });

  it("shows on focus", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" show-delay="0">
        <button>Trigger</button>
      </fluid-tooltip>
    `);
    el.showDelay = 0;
    const button = el.querySelector("button")!;
    setTimeout(() => button.focus());
    const event = await oneEvent(el, "fluid-show");
    expect(event).to.exist;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.true;
  });

  it("hides on blur", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi"><button>Trigger</button></fluid-tooltip>
    `);
    el.showDelay = 0;
    const button = el.querySelector("button")!;
    button.focus();
    await oneEvent(el, "fluid-show");
    setTimeout(() => button.blur());
    await oneEvent(el, "fluid-hide");
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.false;
  });

  it("hides on Escape", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi"><button>Trigger</button></fluid-tooltip>
    `);
    el.showDelay = 0;
    const button = el.querySelector("button")!;
    button.focus();
    await oneEvent(el, "fluid-show");
    setTimeout(() => el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    await oneEvent(el, "fluid-hide");
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.false;
  });

  it("respects open prop", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" open><button>Trigger</button></fluid-tooltip>
    `);
    await el.updateComplete;
    await aTimeout(50);
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.true;
  });

  it("ignores show when disabled", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" disabled><button>Trigger</button></fluid-tooltip>
    `);
    el.showDelay = 0;
    el.querySelector("button")!.focus();
    await aTimeout(20);
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.false;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Save changes">
        <button>Save</button>
      </fluid-tooltip>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder. */

  it("popover background reads the --fluid-tooltip-* override ladder", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" open><button>Trigger</button></fluid-tooltip>
    `);
    el.style.setProperty("--fluid-tooltip-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const popover = el.shadowRoot!.querySelector<HTMLElement>(".popover")!;
    expect(getComputedStyle(popover).backgroundColor).to.equal("rgb(1, 2, 3)");
  });
});
