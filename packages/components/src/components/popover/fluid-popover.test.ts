import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../button/define.js";
import type { FluidPopover } from "./fluid-popover.js";

describe("<fluid-popover>", () => {
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
    expect(event).to.exist;
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
    await oneEvent(el, "fluid-hide");
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
