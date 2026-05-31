import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidToast } from "./fluid-toast.js";
import type { FluidToastItem } from "./fluid-toast-item.js";

describe("<fluid-toast>", () => {
  it("renders as a region", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    expect(el.getAttribute("role")).to.equal("region");
  });

  it("toast() appends an item", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    el.toast({ message: "Hi", duration: 0 });
    expect(el.querySelectorAll("fluid-toast-item").length).to.equal(1);
  });

  it("auto-dismisses after duration", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    const item = el.toast({ message: "bye", duration: 10 });
    await oneEvent(item, "fluid-dismiss");
    await aTimeout(10);
    expect(el.querySelectorAll("fluid-toast-item").length).to.equal(0);
  });

  it("sticky toasts don't auto-dismiss", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    el.toast({ message: "sticky", duration: 0 });
    await aTimeout(60);
    expect(el.querySelectorAll("fluid-toast-item").length).to.equal(1);
  });

  it("clear() dismisses all toasts", async () => {
    const el = await fixture<FluidToast>(html`<fluid-toast></fluid-toast>`);
    el.toast({ message: "a", duration: 0 });
    el.toast({ message: "b", duration: 0 });
    el.clear();
    await aTimeout(250);
    expect(el.querySelectorAll("fluid-toast-item").length).to.equal(0);
  });
});

describe("<fluid-toast-item>", () => {
  it("uses role=alert for danger variant", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item variant="danger" .duration=${0}>Oops</fluid-toast-item>
    `);
    expect(el.getAttribute("role")).to.equal("alert");
  });

  it("uses role=status for other variants", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${0}>Info</fluid-toast-item>
    `);
    expect(el.getAttribute("role")).to.equal("status");
  });

  /* Rework: override ladder + AAA target floor. */

  it("background reads the --fluid-toast-item-* override ladder", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${0}>x</fluid-toast-item>
    `);
    el.style.setProperty("--fluid-toast-item-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the close button respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidToastItem>(html`
      <fluid-toast-item .duration=${0}>x</fluid-toast-item>
    `);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const close = el.shadowRoot!.querySelector<HTMLElement>(".close")!;
    expect(close.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
