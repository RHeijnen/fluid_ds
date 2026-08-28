import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidDialog } from "./fluid-dialog.js";

describe("<fluid-dialog>", () => {
  it("passes a11y audits while closed and open", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="Account settings"><p>Dialog body</p></fluid-dialog>
    `);
    expect(el.hasAttribute("aria-label")).to.equal(false);
    expect(el.shadowRoot!.querySelector("dialog")!.getAttribute("aria-label")).to.equal(
      "Account settings"
    );
    await expect(el).to.be.accessible();
    el.show();
    await el.updateComplete;
    await expect(el).to.be.accessible();
    el.hide();
  });

  it("renders closed by default", async () => {
    const el = await fixture<FluidDialog>(html` <fluid-dialog aria-label="x">Body</fluid-dialog> `);
    expect(el.open).to.be.false;
    expect(el.shadowRoot!.querySelector("dialog")!.open).to.be.false;
  });

  it("opens via show()", async () => {
    const el = await fixture<FluidDialog>(html` <fluid-dialog aria-label="x">Body</fluid-dialog> `);
    setTimeout(() => el.show());
    const event = await oneEvent(el, "fluid-show");
    expect(event.detail).to.equal(null);
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.open).to.be.true;
  });

  it("fires fluid-hide when closed", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="x" open>Body</fluid-dialog>
    `);
    await el.updateComplete;
    setTimeout(() => el.hide());
    const event = await oneEvent(el, "fluid-hide");
    expect(event.detail).to.equal(null);
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
    expect(el.open).to.be.false;
  });

  it("restores modality after reconnect without duplicate lifecycle events", async () => {
    const el = await fixture<FluidDialog>(html` <fluid-dialog aria-label="x">Body</fluid-dialog> `);
    const events: string[] = [];
    el.addEventListener("fluid-show", () => events.push("show"));
    el.addEventListener("fluid-hide", () => events.push("hide"));
    el.show();
    await el.updateComplete;

    const parent = el.parentElement!;
    el.remove();
    parent.append(el);
    await el.updateComplete;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const dialog = el.shadowRoot!.querySelector("dialog")!;
    expect(el.open).to.equal(true);
    expect(dialog.open).to.equal(true);
    expect(dialog.matches(":modal")).to.equal(true);
    expect(el.shadowRoot!.activeElement?.classList.contains("close")).to.equal(true);
    expect(events).to.deep.equal(["show"]);

    const hideEvent = oneEvent(el, "fluid-hide");
    el.hide();
    await el.updateComplete;
    await hideEvent;
    expect(events).to.deep.equal(["show", "hide"]);
  });

  it("stacks nested modals and restores focus through both opener levels", async () => {
    const host = await fixture<HTMLDivElement>(html`
      <div>
        <button id="outer-opener">Open outer</button>
        <fluid-dialog aria-label="Outer dialog">
          <button id="inner-opener">Open inner</button>
          <fluid-dialog aria-label="Inner dialog">
            <button id="inner-action">Inner action</button>
          </fluid-dialog>
        </fluid-dialog>
      </div>
    `);
    const externalOpener = host.querySelector<HTMLButtonElement>("#outer-opener")!;
    const outer = host.querySelector<FluidDialog>("fluid-dialog")!;
    const inner = outer.querySelector<FluidDialog>("fluid-dialog")!;
    const innerOpener = outer.querySelector<HTMLButtonElement>("#inner-opener")!;
    const innerAction = inner.querySelector<HTMLButtonElement>("#inner-action")!;
    innerAction.setAttribute("autofocus", "");

    try {
      externalOpener.focus();
      outer.show();
      await outer.updateComplete;
      innerOpener.focus();
      inner.show();
      await inner.updateComplete;

      expect(inner.shadowRoot!.querySelector("dialog")!.matches(":modal")).to.equal(true);
      expect(document.activeElement).to.equal(innerAction);

      const innerHide = oneEvent(inner, "fluid-hide");
      inner.hide();
      await inner.updateComplete;
      await innerHide;
      expect(outer.shadowRoot!.querySelector("dialog")!.matches(":modal")).to.equal(true);
      expect(document.activeElement).to.equal(innerOpener);

      const outerHide = oneEvent(outer, "fluid-hide");
      outer.hide();
      await outer.updateComplete;
      await outerHide;
      expect(document.activeElement).to.equal(externalOpener);
    } finally {
      if (inner.open) {
        inner.hide();
        await inner.updateComplete;
        await aTimeout(0);
      }
      if (outer.open) {
        outer.hide();
        await outer.updateComplete;
        await aTimeout(0);
      }
    }
  });

  it("defers a disconnected show until reconnect without errors or duplicate events", async () => {
    const host = await fixture<HTMLDivElement>(
      html`<div><fluid-dialog aria-label="Deferred dialog">Body</fluid-dialog></div>`
    );
    const el = host.querySelector<FluidDialog>("fluid-dialog")!;
    let shows = 0;
    let updateError: unknown;
    el.addEventListener("fluid-show", () => shows++);

    el.remove();
    el.show();
    try {
      await el.updateComplete;
    } catch (error) {
      updateError = error;
    }

    if (updateError) el.open = false;
    host.append(el);
    await el.updateComplete.catch(() => undefined);
    if (!updateError) {
      await aTimeout(0);
      expect(el.shadowRoot!.querySelector("dialog")!.matches(":modal")).to.equal(true);
      expect(shows).to.equal(1);
    }

    try {
      expect(updateError).to.equal(undefined);
    } finally {
      if (el.open) {
        el.hide();
        await el.updateComplete;
        await aTimeout(0);
      }
    }
  });

  it("closes safely when its original opener has been removed", async () => {
    const host = await fixture<HTMLDivElement>(html`
      <div>
        <button>Open</button>
        <fluid-dialog aria-label="Dialog">Body</fluid-dialog>
      </div>
    `);
    const opener = host.querySelector<HTMLButtonElement>("button")!;
    const el = host.querySelector<FluidDialog>("fluid-dialog")!;

    try {
      opener.focus();
      el.show();
      await el.updateComplete;
      opener.remove();
      const hideEvent = oneEvent(el, "fluid-hide");
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
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog aria-label="Persistent dialog" no-light-dismiss open>Body</fluid-dialog>
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

  it("renders the close button by default", async () => {
    const el = await fixture<FluidDialog>(html` <fluid-dialog aria-label="x">Body</fluid-dialog> `);
    expect(el.shadowRoot!.querySelector(".close")).to.exist;
  });

  it("keeps the internal close glyph decorative and closes through the translated button", async () => {
    const el = await fixture<FluidDialog>(
      html`<fluid-dialog aria-label="Settings" open>Body</fluid-dialog>`
    );
    await el.updateComplete;
    const close = el.shadowRoot!.querySelector<HTMLButtonElement>(".close")!;
    const glyph = close.querySelector("svg")!;
    expect(close.getAttribute("aria-label")).to.equal("Close dialog");
    expect(glyph.getAttribute("aria-hidden")).to.equal("true");
    setTimeout(() => close.click());
    await oneEvent(el, "fluid-hide");
    expect(el.open).to.equal(false);
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

  it("renders slot=heading content in the title row as a label alias", async () => {
    const el = await fixture<FluidDialog>(html`
      <fluid-dialog open
        ><h2 slot="heading">Settings</h2>
        <p>Body</p></fluid-dialog
      >
    `);
    const labelSlot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="label"]')!;
    const flattened = labelSlot.assignedNodes({ flatten: true });
    const hasHeading = flattened.some(
      (n) => n instanceof HTMLElement && n.textContent === "Settings"
    );
    expect(hasHeading).to.equal(true);
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    expect(dialog.getAttribute("aria-labelledby")).to.equal("fluid-dialog-label");
    expect(dialog.hasAttribute("aria-label")).to.equal(false);
  });
});
