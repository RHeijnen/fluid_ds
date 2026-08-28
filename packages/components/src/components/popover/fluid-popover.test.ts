import { expect, fixture, html, oneEvent, aTimeout, waitUntil } from "@open-wc/testing";
import "./define.js";
import "../button/define.js";
import type { FluidPopover } from "./fluid-popover.js";

describe("<fluid-popover>", () => {
  it("passes a11y audits while closed and open", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover>
        <button slot="trigger">Open help</button>
        <p>Helpful content</p>
      </fluid-popover>
    `);
    await expect(el).to.be.accessible();
    el.open = true;
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it("starts closed", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover>
        <button slot="trigger">Open</button>
        <p>Content</p>
      </fluid-popover>
    `);
    expect(el.open).to.be.false;
  });

  it("opens on trigger click", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover>
        <button slot="trigger">Open</button>
        <p>Content</p>
      </fluid-popover>
    `);
    await el.updateComplete;
    const btn = el.querySelector<HTMLButtonElement>("button")!;
    setTimeout(() => btn.click());
    const event = await oneEvent(el, "fluid-show");
    expect(event.detail).to.equal(null);
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.open).to.be.true;
  });

  it("closes on Escape", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover open>
        <button slot="trigger">Open</button>
        <p>Content</p>
      </fluid-popover>
    `);
    await el.updateComplete;
    setTimeout(() =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    );
    const event = await oneEvent(el, "fluid-hide");
    expect(event.detail).to.equal(null);
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.open).to.be.false;
  });

  it("closes on outside pointerdown", async () => {
    const wrapper = await fixture(html`
      <div>
        <fluid-popover open>
          <button slot="trigger">a</button>
          <p>c</p>
        </fluid-popover>
        <span class="outside">x</span>
      </div>
    `);
    const el = wrapper.querySelector<FluidPopover>("fluid-popover")!;
    await el.updateComplete;
    wrapper
      .querySelector<HTMLElement>(".outside")!
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await aTimeout(20);
    expect(el.open).to.be.false;
  });

  it("sets aria-expanded on the trigger", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover>
        <button slot="trigger">Open</button>
        <p>Content</p>
      </fluid-popover>
    `);
    await el.updateComplete;
    const btn = el.querySelector<HTMLButtonElement>("button")!;
    expect(btn.getAttribute("aria-expanded")).to.equal("false");
    el.open = true;
    await el.updateComplete;
    expect(btn.getAttribute("aria-expanded")).to.equal("true");
  });

  it("moves focus into the panel and restores it to the trigger on close", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover>
        <button slot="trigger">Open</button>
        <button class="action">Apply</button>
      </fluid-popover>
    `);
    const trigger = el.querySelector<HTMLButtonElement>("[slot='trigger']")!;
    const action = el.querySelector<HTMLButtonElement>(".action")!;
    trigger.focus();

    const shown = oneEvent(el, "fluid-show");
    el.show();
    await shown;
    await waitUntil(() => document.activeElement === action, "popover moves focus into its panel");

    const hidden = oneEvent(el, "fluid-hide");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await hidden;
    expect(document.activeElement).to.equal(trigger);
  });

  it("does not let a pending focus frame enter a panel that has already closed", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover>
        <button slot="trigger">Open</button>
        <button class="action">Apply</button>
      </fluid-popover>
    `);
    const trigger = el.querySelector<HTMLButtonElement>("[slot='trigger']")!;
    const action = el.querySelector<HTMLButtonElement>(".action")!;
    trigger.focus();

    const shown = oneEvent(el, "fluid-show");
    el.show();
    await shown;
    const hidden = oneEvent(el, "fluid-hide");
    el.hide();
    await hidden;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    expect(el.open).to.be.false;
    expect(document.activeElement).to.equal(trigger);
    expect(document.activeElement).to.not.equal(action);
  });

  it("closes on trigger removal and releases the old trigger contract", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover>
        <button slot="trigger">Open</button>
        <button>Apply</button>
      </fluid-popover>
    `);
    const trigger = el.querySelector<HTMLButtonElement>("[slot='trigger']")!;
    const shown = oneEvent(el, "fluid-show");
    el.show();
    await shown;

    const hidden = oneEvent(el, "fluid-hide");
    trigger.remove();
    await hidden;

    expect(el.open).to.be.false;
    expect(trigger.hasAttribute("aria-expanded")).to.be.false;
    expect(trigger.hasAttribute("aria-haspopup")).to.be.false;
    trigger.click();
    await el.updateComplete;
    expect(el.open).to.be.false;
  });

  it("reanchors an open popover when its trigger is replaced", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover>
        <button slot="trigger">First</button>
        <button>Apply</button>
      </fluid-popover>
    `);
    const first = el.querySelector<HTMLButtonElement>("[slot='trigger']")!;
    const panel = el.shadowRoot!.querySelector<HTMLElement>(".panel")!;
    Object.defineProperty(first, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect(20, 20, 40, 20)
    });
    const shown = oneEvent(el, "fluid-show");
    el.show();
    await shown;
    await waitUntil(() => panel.style.left === "20px", "popover positions from its first trigger");

    const second = document.createElement("button");
    second.slot = "trigger";
    second.textContent = "Second";
    Object.defineProperty(second, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect(220, 20, 40, 20)
    });
    first.replaceWith(second);

    await waitUntil(
      () => panel.style.left === "220px",
      "popover repositions from its replacement trigger"
    );
    expect(el.open).to.be.true;
    expect(first.hasAttribute("aria-expanded")).to.be.false;
    expect(first.hasAttribute("aria-haspopup")).to.be.false;
    expect(second.getAttribute("aria-expanded")).to.equal("true");
    second.click();
    await el.updateComplete;
    expect(el.open).to.be.false;
  });

  it("resumes positioning and interaction after an open reconnect", async () => {
    const host = await fixture<HTMLElement>(html`<div></div>`);
    const el = document.createElement("fluid-popover") as FluidPopover;
    el.innerHTML = `<button slot="trigger">Open</button><button>Apply</button>`;
    const trigger = el.querySelector<HTMLButtonElement>("[slot='trigger']")!;
    Object.defineProperty(trigger, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect(40, 30, 40, 20)
    });
    host.append(el);
    await el.updateComplete;
    const shown = oneEvent(el, "fluid-show");
    el.show();
    await shown;

    el.remove();
    Object.defineProperty(trigger, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect(180, 30, 40, 20)
    });
    host.append(el);
    await el.updateComplete;
    const panel = el.shadowRoot!.querySelector<HTMLElement>(".panel")!;
    await waitUntil(() => panel.style.left === "180px", "popover resumes tracking after reconnect");

    const hidden = oneEvent(el, "fluid-hide");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await hidden;
    expect(el.open).to.be.false;
  });

  it("does not open when disabled", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover disabled>
        <button slot="trigger">Open</button>
        <p>Content</p>
      </fluid-popover>
    `);
    await el.updateComplete;
    el.querySelector<HTMLButtonElement>("button")!.click();
    await aTimeout(20);
    expect(el.open).to.be.false;
  });

  it("does not fire fluid-hide on first render of a closed popover", async () => {
    let hidden = false;
    const el = await fixture<FluidPopover>(html`
      <fluid-popover @fluid-hide=${() => (hidden = true)}>
        <button slot="trigger">Open</button>
        <p>Content</p>
      </fluid-popover>
    `);
    await el.updateComplete;
    await aTimeout(0);
    expect(hidden).to.be.false;
  });

  it("tears down document listeners and autoUpdate on disconnect", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover>
        <button slot="trigger">Open</button>
        <p>Content</p>
      </fluid-popover>
    `);
    await el.updateComplete;
    el.show();
    await oneEvent(el, "fluid-show");

    // Track that the autoUpdate cleanup callback is invoked on disconnect.
    let cleanupCalled = false;
    const originalCleanup = (el as unknown as { cleanup?: () => void }).cleanup;
    (el as unknown as { cleanup?: () => void }).cleanup = () => {
      cleanupCalled = true;
      originalCleanup?.();
    };

    let leaked = false;
    el.addEventListener("fluid-hide", () => (leaked = true));

    el.remove();
    expect(cleanupCalled).to.be.true;

    // Document listeners must be gone: these should not reopen/close anything.
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await aTimeout(20);
    expect(leaked).to.be.false;
  });

  /* Rework: override ladder. */

  it("panel background reads the --fluid-popover-* override ladder", async () => {
    const el = await fixture<FluidPopover>(html`
      <fluid-popover open>
        <button slot="trigger">Open</button>
        <p>Content</p>
      </fluid-popover>
    `);
    el.style.setProperty("--fluid-popover-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const panel = el.shadowRoot!.querySelector<HTMLElement>(".panel")!;
    expect(getComputedStyle(panel).backgroundColor).to.equal("rgb(1, 2, 3)");
  });
});
