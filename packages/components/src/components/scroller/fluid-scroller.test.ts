import { expect, fixture, html, waitUntil } from "@open-wc/testing";
import "./define.js";
import type { FluidScroller } from "./fluid-scroller.js";

const container = (el: FluidScroller) =>
  el.shadowRoot!.querySelector<HTMLDivElement>(".container")!;

const fade = (el: FluidScroller, edge: "start" | "end") =>
  el.shadowRoot!.querySelector<HTMLDivElement>(`.fade.${edge}`)!;

describe("<fluid-scroller>", () => {
  it("renders with defaults", async () => {
    const el = await fixture<FluidScroller>(html`<fluid-scroller></fluid-scroller>`);
    expect(el.orientation).to.equal("horizontal");
    expect(el.noScrollbar).to.equal(false);
    expect(container(el)).to.exist;
  });

  it("reflects the orientation attribute", async () => {
    const el = await fixture<FluidScroller>(
      html`<fluid-scroller orientation="vertical"></fluid-scroller>`
    );
    await el.updateComplete;
    expect(el.getAttribute("orientation")).to.equal("vertical");
  });

  it("hides the native scrollbar with no-scrollbar", async () => {
    const el = await fixture<FluidScroller>(html`<fluid-scroller no-scrollbar></fluid-scroller>`);
    await el.updateComplete;
    expect(el.noScrollbar).to.equal(true);
    expect(container(el).style.scrollbarWidth).to.equal("none");
  });

  it("toggles the start fade indicator when scrolled", async () => {
    const el = await fixture<FluidScroller>(html`
      <fluid-scroller style="width: 100px">
        <div style="width: 1000px">wide content</div>
      </fluid-scroller>
    `);
    await el.updateComplete;
    const c = container(el);

    // At the start there is more content to the right but nothing to the left.
    expect(fade(el, "start").hasAttribute("data-visible")).to.equal(false);
    expect(fade(el, "end").hasAttribute("data-visible")).to.equal(true);

    // Scroll right: the start fade should appear.
    c.scrollLeft = 200;
    c.dispatchEvent(new Event("scroll"));
    await el.updateComplete;
    expect(fade(el, "start").hasAttribute("data-visible")).to.equal(true);
  });

  it("disconnects the ResizeObserver when removed from the DOM", async () => {
    // Spy on ResizeObserver so we can assert the instance is disconnected on
    // teardown. This is the regression guard for the lifecycle leak: the
    // observer must not keep a live reference to the detached element.
    const RealResizeObserver = window.ResizeObserver;
    const instances: { disconnected: boolean }[] = [];

    class SpyResizeObserver {
      disconnected = false;
      constructor() {
        instances.push(this);
      }
      observe() {
        this.disconnected = false;
      }
      unobserve() {}
      disconnect() {
        this.disconnected = true;
      }
    }
    window.ResizeObserver = SpyResizeObserver as unknown as typeof ResizeObserver;

    try {
      const el = await fixture<FluidScroller>(html`<fluid-scroller></fluid-scroller>`);
      await el.updateComplete;

      expect(instances).to.have.lengthOf(1);
      const observer = instances[0];
      if (!observer) throw new Error("Scroller did not create its observer");
      expect(observer.disconnected).to.equal(false);

      el.remove();

      expect(observer.disconnected).to.equal(true);
    } finally {
      window.ResizeObserver = RealResizeObserver;
    }
  });

  it("reacts to scrollbar changes after the first render", async () => {
    const el = await fixture<FluidScroller>(html`<fluid-scroller></fluid-scroller>`);
    el.noScrollbar = true;
    await el.updateComplete;
    expect(container(el).style.scrollbarWidth).to.equal("none");
    el.noScrollbar = false;
    await el.updateComplete;
    expect(container(el).style.scrollbarWidth).to.equal("");
  });

  it("updates fades when slotted content resizes, including after reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <fluid-scroller style="width:100px"><div style="width:50px">Content</div></fluid-scroller>
      </div>
    `);
    const el = wrapper.querySelector<FluidScroller>("fluid-scroller")!;
    const content = el.querySelector<HTMLElement>("div")!;
    await el.updateComplete;
    expect(fade(el, "end").hasAttribute("data-visible")).to.equal(false);
    content.style.width = "500px";
    await waitUntil(
      () => fade(el, "end").hasAttribute("data-visible"),
      "content resize updates overflow"
    );
    el.remove();
    wrapper.append(el);
    await el.updateComplete;
    content.style.width = "50px";
    await waitUntil(
      () => !fade(el, "end").hasAttribute("data-visible"),
      "reconnected observer updates overflow"
    );
  });

  it("tracks logical start and end fades in RTL", async () => {
    const el = await fixture<FluidScroller>(html`
      <fluid-scroller dir="rtl" style="width:100px"
        ><div style="width:500px">Content</div></fluid-scroller
      >
    `);
    await el.updateComplete;
    const c = container(el);
    expect(c.scrollWidth - c.clientWidth).to.equal(400);
    expect(fade(el, "start").hasAttribute("data-visible")).to.equal(false);
    expect(fade(el, "end").hasAttribute("data-visible")).to.equal(true);
    c.scrollLeft = -400;
    c.dispatchEvent(new Event("scroll"));
    await el.updateComplete;
    expect(c.scrollLeft).to.equal(-400);
    expect(fade(el, "start").hasAttribute("data-visible")).to.equal(true);
    expect(fade(el, "end").hasAttribute("data-visible")).to.equal(false);
    expect(fade(el, "start").getBoundingClientRect().right).to.equal(
      el.getBoundingClientRect().right
    );
  });

  it("passes an accessibility audit", async () => {
    const el = await fixture<FluidScroller>(html`
      <fluid-scroller>
        <div>scrollable content</div>
      </fluid-scroller>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
