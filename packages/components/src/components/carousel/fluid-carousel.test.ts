import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidCarousel } from "./fluid-carousel.js";

const threeSlides = html`
  <fluid-carousel>
    <fluid-carousel-item>One</fluid-carousel-item>
    <fluid-carousel-item>Two</fluid-carousel-item>
    <fluid-carousel-item>Three</fluid-carousel-item>
  </fluid-carousel>
`;

describe("<fluid-carousel>", () => {
  it("renders one pagination dot per slide", async () => {
    const el = await fixture<FluidCarousel>(threeSlides);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".dot").length).to.equal(3);
  });

  it("fires fluid-slide-change with detail.index when the active slide changes", async () => {
    const el = await fixture<FluidCarousel>(threeSlides);
    await el.updateComplete;
    const scroller = el.shadowRoot!.querySelector<HTMLElement>(".scroller")!;
    // Simulate the snap-scroller landing on the second slide.
    setTimeout(() => {
      scroller.scrollLeft = scroller.clientWidth;
      scroller.dispatchEvent(new Event("scroll"));
    });
    const event = await oneEvent(el, "fluid-slide-change");
    expect(event.detail.index).to.equal(1);
  });

  it("ArrowRight/ArrowLeft/Home/End move between slides", async () => {
    const el = await fixture<FluidCarousel>(threeSlides);
    await el.updateComplete;
    const scroller = el.shadowRoot!.querySelector<HTMLElement>(".scroller")!;
    let target = -1;
    // Capture the scroll target rather than relying on real smooth scrolling.
    scroller.scrollTo = ((opts: ScrollToOptions) => {
      target = opts.left ?? 0;
    }) as typeof scroller.scrollTo;
    const width = scroller.clientWidth || 100;
    Object.defineProperty(scroller, "clientWidth", { value: width, configurable: true });

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
    expect(target).to.equal(width * 2);

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
    expect(target).to.equal(0);

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(target).to.equal(width * 1);
  });

  it("disables prev at start and next at end (loop off)", async () => {
    const el = await fixture<FluidCarousel>(threeSlides);
    await el.updateComplete;
    const [prev, next] = Array.from(
      el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".nav-button")
    );
    // At index 0, prev is disabled, next is enabled.
    expect(prev.disabled).to.be.true;
    expect(next.disabled).to.be.false;
  });

  it("uses the APG slide-picker pattern (no tablist/tab roles)", async () => {
    const el = await fixture<FluidCarousel>(threeSlides);
    await el.updateComplete;
    const pagination = el.shadowRoot!.querySelector(".pagination")!;
    expect(pagination.getAttribute("role")).to.not.equal("tablist");
    const dot = el.shadowRoot!.querySelector(".dot")!;
    expect(dot.getAttribute("role")).to.be.null;
    expect(dot.getAttribute("aria-current")).to.equal("true");
  });

  it("clears the autoplay interval on disconnect (no advance after remove)", async () => {
    const el = await fixture<FluidCarousel>(html`
      <fluid-carousel autoplay="20">
        <fluid-carousel-item>One</fluid-carousel-item>
        <fluid-carousel-item>Two</fluid-carousel-item>
      </fluid-carousel>
    `);
    await el.updateComplete;

    let advanced = false;
    const scroller = el.shadowRoot!.querySelector<HTMLElement>(".scroller")!;
    scroller.scrollTo = (() => {
      advanced = true;
    }) as typeof scroller.scrollTo;

    el.remove();

    // Wait past several autoplay intervals; nothing should advance.
    await new Promise((r) => setTimeout(r, 80));
    expect(advanced).to.be.false;
  });

  it("does not start autoplay under prefers-reduced-motion", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false;
        },
        onchange: null
      }) as unknown as MediaQueryList) as typeof window.matchMedia;

    try {
      const el = await fixture<FluidCarousel>(html`
        <fluid-carousel autoplay="20">
          <fluid-carousel-item>One</fluid-carousel-item>
          <fluid-carousel-item>Two</fluid-carousel-item>
        </fluid-carousel>
      `);
      await el.updateComplete;

      let advanced = false;
      const scroller = el.shadowRoot!.querySelector<HTMLElement>(".scroller")!;
      scroller.scrollTo = (() => {
        advanced = true;
      }) as typeof scroller.scrollTo;

      await new Promise((r) => setTimeout(r, 80));
      expect(advanced).to.be.false;
    } finally {
      window.matchMedia = original;
    }
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCarousel>(threeSlides);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
