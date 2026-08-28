import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidDrawer } from "./fluid-drawer.js";

const eventWithin = (target: EventTarget, type: string, timeout = 250): Promise<Event> =>
  Promise.race([
    oneEvent(target, type),
    aTimeout(timeout).then(() => {
      throw new Error(`Timed out waiting for ${type}`);
    })
  ]);

describe("<fluid-drawer>", () => {
  it("passes a11y audits while closed and open", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="Filters"><p>Drawer body</p></fluid-drawer>
    `);
    expect(el.hasAttribute("aria-label")).to.equal(false);
    expect(el.shadowRoot!.querySelector("dialog")!.getAttribute("aria-label")).to.equal("Filters");
    await expect(el).to.be.accessible();
    el.show();
    await el.updateComplete;
    await expect(el).to.be.accessible();
    el.hide();
  });

  it("renders closed by default", async () => {
    const el = await fixture<FluidDrawer>(html` <fluid-drawer aria-label="x">Body</fluid-drawer> `);
    expect(el.open).to.be.false;
  });

  it("opens via show()", async () => {
    const el = await fixture<FluidDrawer>(html` <fluid-drawer aria-label="x">Body</fluid-drawer> `);
    setTimeout(() => el.show());
    const event = await oneEvent(el, "fluid-show");
    expect(event.detail).to.equal(null);
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.open).to.be.true;
  });

  it("supports placement attribute", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x" placement="start">Body</fluid-drawer>
    `);
    expect(el.placement).to.equal("start");
  });

  it("fires fluid-hide on close", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x" open>Body</fluid-drawer>
    `);
    await el.updateComplete;
    setTimeout(() => el.hide());
    const event = await oneEvent(el, "fluid-hide");
    expect(event.detail).to.equal(null);
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
  });

  it("restores an open modal after reconnect without duplicate lifecycle events", async () => {
    const host = await fixture<HTMLDivElement>(
      html`<div><fluid-drawer aria-label="Filters">Body</fluid-drawer></div>`
    );
    const el = host.querySelector<FluidDrawer>("fluid-drawer")!;
    const events: string[] = [];
    el.addEventListener("fluid-show", () => events.push("show"));
    el.addEventListener("fluid-hide", () => events.push("hide"));

    try {
      el.show();
      await el.updateComplete;
      el.remove();
      host.append(el);
      await el.updateComplete;
      await aTimeout(0);

      const dialog = el.shadowRoot!.querySelector<HTMLDialogElement>("dialog")!;
      expect(el.open).to.equal(true);
      expect(dialog.open).to.equal(true);
      expect(dialog.matches(":modal")).to.equal(true);
      expect(events).to.deep.equal(["show"]);
    } finally {
      if (el.open) {
        const hideEvent = eventWithin(el, "fluid-hide");
        el.hide();
        await el.updateComplete;
        await hideEvent;
      }
    }
    expect(events).to.deep.equal(["show", "hide"]);
  });

  it("maps logical start and end placement in RTL", async () => {
    const host = await fixture<HTMLDivElement>(html`
      <div dir="rtl"><fluid-drawer aria-label="Filters" placement="start">Body</fluid-drawer></div>
    `);
    const el = host.querySelector<FluidDrawer>("fluid-drawer")!;
    const panel = el.shadowRoot!.querySelector<HTMLElement>(".panel")!;

    let style = getComputedStyle(panel);
    expect(style.right).to.equal("0px");
    expect(style.left).to.equal("auto");

    el.placement = "end";
    await el.updateComplete;
    style = getComputedStyle(panel);
    expect(style.left).to.equal("0px");
    expect(style.right).to.equal("auto");
  });

  it("closes safely when its original opener has been removed", async () => {
    const host = await fixture<HTMLDivElement>(html`
      <div>
        <button>Open</button>
        <fluid-drawer aria-label="Filters">Body</fluid-drawer>
      </div>
    `);
    const opener = host.querySelector<HTMLButtonElement>("button")!;
    const el = host.querySelector<FluidDrawer>("fluid-drawer")!;

    try {
      opener.focus();
      el.show();
      await el.updateComplete;
      opener.remove();
      const hideEvent = eventWithin(el, "fluid-hide");
      el.hide();
      await el.updateComplete;
      await hideEvent;
      expect(document.activeElement?.isConnected).to.equal(true);
    } finally {
      if (el.open) {
        el.hide();
        await el.updateComplete;
        await aTimeout(0);
      }
    }
  });

  it("honors the documented no-light-dismiss attribute", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="Persistent filters" no-light-dismiss open>Body</fluid-drawer>
    `);
    try {
      const dialog = el.shadowRoot!.querySelector<HTMLDialogElement>("dialog")!;
      dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await el.updateComplete;
      expect(el.open).to.equal(true);
      expect(dialog.matches(":modal")).to.equal(true);
    } finally {
      if (el.open) {
        el.hide();
        await el.updateComplete;
        await aTimeout(0);
      }
    }
  });

  /* Rework: override ladder + AAA target floor. */

  it("panel background reads the --fluid-drawer-* override ladder", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x" open>Body</fluid-drawer>
    `);
    el.style.setProperty("--fluid-drawer-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const panel = el.shadowRoot!.querySelector<HTMLElement>(".panel")!;
    expect(getComputedStyle(panel).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the close button respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer aria-label="x" open>Body</fluid-drawer>
    `);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const close = el.shadowRoot!.querySelector<HTMLElement>(".close")!;
    expect(close.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });

  it("uses slotted label content as the native dialog accessible name", async () => {
    const el = await fixture<FluidDrawer>(html`
      <fluid-drawer open
        ><h2 slot="label">Filters</h2>
        <p>Body</p></fluid-drawer
      >
    `);
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    expect(dialog.getAttribute("aria-labelledby")).to.equal("fluid-drawer-label");
    expect(dialog.hasAttribute("aria-label")).to.equal(false);
  });
});
