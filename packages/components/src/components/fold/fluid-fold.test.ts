import { expect, fixture, html, elementUpdated, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidFold } from "./fluid-fold.js";

const toggleOf = (el: FluidFold) =>
  el.shadowRoot!.querySelector<HTMLButtonElement>(".toggle")!;
const bodyOf = (el: FluidFold) =>
  el.shadowRoot!.querySelector<HTMLElement>(".body")!;

describe("<fluid-fold>", () => {
  it("starts folded: content hidden, disclosure collapsed", async () => {
    const el = await fixture<FluidFold>(
      html`<fluid-fold><p>Underneath</p></fluid-fold>`
    );
    expect(el.open).to.equal(false);
    expect(toggleOf(el).getAttribute("aria-expanded")).to.equal("false");
    expect(bodyOf(el).hasAttribute("hidden")).to.equal(true);
  });

  it("wires the disclosure contract: button controls the labelled region", async () => {
    const el = await fixture<FluidFold>(html`<fluid-fold></fluid-fold>`);
    const toggle = toggleOf(el);
    const body = bodyOf(el);
    expect(toggle.getAttribute("aria-controls")).to.equal(body.id);
    expect(body.getAttribute("role")).to.equal("region");
    expect(body.getAttribute("aria-labelledby")).to.equal(toggle.id);
  });

  it("unfolds on click and reports the transition", async () => {
    const el = await fixture<FluidFold>(
      html`<fluid-fold><p>Underneath</p></fluid-fold>`
    );
    setTimeout(() => toggleOf(el).click());
    const event = await oneEvent(el, "fluid-toggle");
    expect(event.detail.open).to.equal(true);
    await elementUpdated(el);
    expect(toggleOf(el).getAttribute("aria-expanded")).to.equal("true");
    expect(bodyOf(el).hasAttribute("hidden")).to.equal(false);
  });

  it("does not fire a toggle just for being mounted open", async () => {
    const heard: Event[] = [];
    document.addEventListener("fluid-toggle", (event) => heard.push(event), {
      once: true
    });
    await fixture<FluidFold>(html`<fluid-fold open></fluid-fold>`);
    expect(heard).to.have.length(0);
  });

  it("says its other label while open, when given one", async () => {
    const el = await fixture<FluidFold>(
      html`<fluid-fold label="Show more" open-label="Show less"></fluid-fold>`
    );
    expect(toggleOf(el).textContent).to.contain("Show more");
    el.open = true;
    await elementUpdated(el);
    expect(toggleOf(el).textContent).to.contain("Show less");
  });

  it("ignores a click while disabled", async () => {
    const el = await fixture<FluidFold>(html`<fluid-fold disabled></fluid-fold>`);
    toggleOf(el).click();
    await elementUpdated(el);
    expect(el.open).to.equal(false);
  });

  it("toggles from the imperative API", async () => {
    const el = await fixture<FluidFold>(html`<fluid-fold></fluid-fold>`);
    el.show();
    await elementUpdated(el);
    expect(el.open).to.equal(true);
    el.hide();
    await elementUpdated(el);
    expect(el.open).to.equal(false);
  });

  it("passes a11y audit folded and unfolded", async () => {
    const el = await fixture<FluidFold>(
      html`<fluid-fold><p>Underneath</p></fluid-fold>`
    );
    await expect(el).to.be.accessible();
    el.open = true;
    await elementUpdated(el);
    await expect(el).to.be.accessible();
  });
});
