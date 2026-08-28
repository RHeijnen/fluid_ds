import { expect, fixture, html, oneEvent, aTimeout, waitUntil } from "@open-wc/testing";
import "./define.js";
import "../button/define.js";
import type { FluidTooltip, FluidTooltipHideEvent, FluidTooltipShowEvent } from "../../index.js";

// @ts-expect-error Tooltip lifecycle detail is exactly null.
const invalidTooltipEvent: FluidTooltipShowEvent = new CustomEvent("fluid-show", { detail: {} });
void invalidTooltipEvent;

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
    const event = (await oneEvent(el, "fluid-show")) as FluidTooltipShowEvent;
    expect(event.detail).to.equal(null);
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
    const event = (await oneEvent(el, "fluid-hide")) as FluidTooltipHideEvent;
    expect(event.detail).to.equal(null);
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
    setTimeout(() =>
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    );
    await oneEvent(el, "fluid-hide");
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.false;
  });

  it("remains visible while either hover or focus still targets the trigger", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" show-delay="0" hide-delay="0">
        <button>Trigger</button>
      </fluid-tooltip>
    `);
    const button = el.querySelector<HTMLButtonElement>("button")!;
    button.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, composed: true }));
    button.focus();
    await oneEvent(el, "fluid-show");

    el.dispatchEvent(new PointerEvent("pointerleave"));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.true;

    button.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, composed: true }));
    button.blur();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.true;

    const hidden = oneEvent(el, "fluid-hide");
    el.dispatchEvent(new PointerEvent("pointerleave"));
    await hidden;
  });

  it("Escape cancels a pending delayed show", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" show-delay="80"><button>Trigger</button></fluid-tooltip>
    `);
    const button = el.querySelector<HTMLButtonElement>("button")!;
    let shown = false;
    el.addEventListener("fluid-show", () => (shown = true));
    button.focus();
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    await aTimeout(160);
    expect(shown).to.be.false;
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

  it("keeps an authored open tooltip visible across pointer and focus exits", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" open><button>Trigger</button></fluid-tooltip>
    `);
    await waitUntil(
      () => el.shadowRoot!.querySelector(".popover")!.classList.contains("visible"),
      "authored open tooltip becomes visible"
    );
    el.dispatchEvent(new PointerEvent("pointerleave"));
    el.dispatchEvent(new FocusEvent("focusout", { bubbles: true, composed: true }));
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.true;

    el.open = false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.false;
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

  it("does not fire fluid-show or leak timers after disconnect", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" show-delay="50"><button>Trigger</button></fluid-tooltip>
    `);
    await el.updateComplete;
    const button = el.querySelector("button")!;
    expect(button.getAttribute("aria-describedby")).to.match(/^fluid-tooltip-\d+$/);

    let shown = false;
    el.addEventListener("fluid-show", () => (shown = true));

    // Schedule a show, then remove before the show-delay elapses.
    button.focus();
    el.remove();

    // Advance well past show-delay; the cleared timer must never fire.
    await aTimeout(120);
    expect(shown).to.be.false;
    expect(el.shadowRoot!.querySelector(".popover")!.classList.contains("visible")).to.be.false;
    // detachAnchor() must have stripped the description on disconnect.
    expect(button.hasAttribute("aria-describedby")).to.be.false;
  });

  it("closes and releases its description when the trigger is removed", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" show-delay="0"><button>Trigger</button></fluid-tooltip>
    `);
    const button = el.querySelector<HTMLButtonElement>("button")!;
    button.focus();
    await oneEvent(el, "fluid-show");

    const hidden = oneEvent(el, "fluid-hide");
    button.remove();
    await hidden;
    expect(button.hasAttribute("aria-describedby")).to.be.false;
    expect(el.shadowRoot!.querySelector(".popover")!.getAttribute("aria-hidden")).to.equal("true");
  });

  it("reanchors a visible tooltip when its trigger is replaced", async () => {
    const el = await fixture<FluidTooltip>(html`
      <fluid-tooltip content="Hi" open placement="bottom"><button>First</button></fluid-tooltip>
    `);
    const first = el.querySelector<HTMLButtonElement>("button")!;
    const popover = el.shadowRoot!.querySelector<HTMLElement>(".popover")!;
    Object.defineProperty(first, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect(30, 20, 40, 20)
    });
    await waitUntil(() => popover.classList.contains("visible"), "tooltip opens");
    Object.defineProperty(popover, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect(0, 0, 80, 24)
    });
    Object.defineProperty(popover, "offsetWidth", { configurable: true, value: 80 });
    Object.defineProperty(popover, "offsetHeight", { configurable: true, value: 24 });

    const second = document.createElement("button");
    second.textContent = "Second";
    Object.defineProperty(second, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect(230, 20, 40, 20)
    });
    first.replaceWith(second);

    await waitUntil(
      () => popover.style.left === "210px",
      "tooltip follows its replacement trigger"
    );
    expect(first.hasAttribute("aria-describedby")).to.be.false;
    expect(second.getAttribute("aria-describedby")).to.match(/^fluid-tooltip-\d+$/);
  });

  it("restores its trigger relationship and interaction after reconnect", async () => {
    const host = await fixture<HTMLElement>(html`<div></div>`);
    const el = document.createElement("fluid-tooltip") as FluidTooltip;
    el.content = "Hi";
    el.showDelay = 0;
    el.innerHTML = `<button>Trigger</button>`;
    const button = el.querySelector<HTMLButtonElement>("button")!;
    host.append(el);
    await el.updateComplete;
    expect(button.getAttribute("aria-describedby")).to.match(/^fluid-tooltip-\d+$/);

    el.remove();
    expect(button.hasAttribute("aria-describedby")).to.be.false;
    host.append(el);
    await waitUntil(
      () => button.hasAttribute("aria-describedby"),
      "tooltip rewires after reconnect"
    );

    button.focus();
    await oneEvent(el, "fluid-show");
    expect(el.shadowRoot!.querySelector(".popover")!.getAttribute("aria-hidden")).to.equal("false");
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
