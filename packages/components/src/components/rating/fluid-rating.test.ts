import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidRating } from "./fluid-rating.js";

describe("<fluid-rating>", () => {
  it("renders the max number of stars", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating max="5"></fluid-rating>`);
    expect(el.shadowRoot!.querySelectorAll(".star").length).to.equal(5);
  });

  it("clicking the nth star sets value to n+1", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating></fluid-rating>`);
    const stars = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".star");
    setTimeout(() => stars[2]!.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal(3);
    expect(el.value).to.equal(3);
  });

  it("ignores clicks in readonly mode", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating readonly value="2"></fluid-rating>`);
    el.shadowRoot!.querySelector<HTMLButtonElement>(".star")!.click();
    await el.updateComplete;
    expect(el.value).to.equal(2);
  });

  it("ArrowRight increments by precision", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating value="2"></fluid-rating>`);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(3);
  });

  it("Home/End jump to 0/max", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating value="3" max="5"></fluid-rating>`);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(5);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal(0);
  });

  it("submits its value with a form", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-rating name="score" value="4"></fluid-rating>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("score")).to.equal("4");
  });

  it("supports half-step precision", async () => {
    const el = await fixture<FluidRating>(
      html`<fluid-rating precision="0.5" value="0"></fluid-rating>`
    );
    el.value = 2.5;
    await el.updateComplete;
    expect(el.value).to.equal(2.5);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidRating>(
      html`<fluid-rating aria-label="Rate this product"></fluid-rating>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("active color reads the --fluid-rating-* override ladder", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating value="5"></fluid-rating>`);
    el.style.setProperty("--fluid-rating-active-color", "rgb(1, 2, 3)");
    await el.updateComplete;
    const activeLayer = el.shadowRoot!.querySelector<HTMLElement>(".layer-active")!;
    expect(getComputedStyle(activeLayer).color).to.equal("rgb(1, 2, 3)");
  });

  it("each star respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidRating>(html`<fluid-rating></fluid-rating>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const star = el.shadowRoot!.querySelector<HTMLElement>(".star")!;
    expect(star.getBoundingClientRect().width).to.be.greaterThanOrEqual(44);
  });
});
