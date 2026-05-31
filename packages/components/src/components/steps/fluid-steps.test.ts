import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidSteps } from "./fluid-steps.js";
import type { FluidStep } from "./fluid-step.js";

const sample = html`
  <fluid-steps current="1" aria-label="Checkout">
    <fluid-step>Account</fluid-step>
    <fluid-step>Shipping</fluid-step>
    <fluid-step>Payment</fluid-step>
    <fluid-step>Review</fluid-step>
  </fluid-steps>
`;

describe("<fluid-steps>", () => {
  it("derives complete / current / upcoming state from `current`", async () => {
    const el = await fixture<FluidSteps>(sample);
    await el.updateComplete;
    const steps = el.querySelectorAll<FluidStep>("fluid-step");
    expect(steps[0]!.state).to.equal("complete");
    expect(steps[1]!.state).to.equal("current");
    expect(steps[2]!.state).to.equal("upcoming");
    expect(steps[3]!.state).to.equal("upcoming");
  });

  it("sets aria-current=step on the current step only", async () => {
    const el = await fixture<FluidSteps>(sample);
    await el.updateComplete;
    const steps = el.querySelectorAll<FluidStep>("fluid-step");
    await steps[1]!.updateComplete;
    expect(steps[1]!.getAttribute("aria-current")).to.equal("step");
    expect(steps[0]!.hasAttribute("aria-current")).to.be.false;
    expect(steps[2]!.hasAttribute("aria-current")).to.be.false;
  });

  it("numbers steps 1-based and shows a check icon for complete steps", async () => {
    const el = await fixture<FluidSteps>(sample);
    await el.updateComplete;
    const steps = el.querySelectorAll<FluidStep>("fluid-step");
    await steps[0]!.updateComplete;
    await steps[1]!.updateComplete;
    // Complete step renders a check icon, not a number.
    expect(steps[0]!.shadowRoot!.querySelector("fluid-icon")).to.exist;
    // Current step renders its 1-based number.
    const currentIndicator = steps[1]!.shadowRoot!.querySelector(".indicator")!;
    expect(currentIndicator.textContent!.trim()).to.equal("2");
  });

  it("first step suppresses its leading connector", async () => {
    const el = await fixture<FluidSteps>(sample);
    await el.updateComplete;
    const steps = el.querySelectorAll<FluidStep>("fluid-step");
    await steps[0]!.updateComplete;
    await steps[1]!.updateComplete;
    expect(steps[0]!.shadowRoot!.querySelector(".connector")!.classList.contains("hidden")).to.be
      .true;
    expect(steps[1]!.shadowRoot!.querySelector(".connector")!.classList.contains("hidden")).to.be
      .false;
  });

  it("presentational by default: steps render no <button>", async () => {
    const el = await fixture<FluidSteps>(sample);
    await el.updateComplete;
    const step = el.querySelector<FluidStep>("fluid-step")!;
    await step.updateComplete;
    expect(step.shadowRoot!.querySelector("button")).to.not.exist;
  });

  it("clickable mode renders a <button> and fires fluid-step-change", async () => {
    const el = await fixture<FluidSteps>(html`
      <fluid-steps current="2" clickable aria-label="Wizard">
        <fluid-step>One</fluid-step>
        <fluid-step>Two</fluid-step>
        <fluid-step>Three</fluid-step>
      </fluid-steps>
    `);
    await el.updateComplete;
    const steps = el.querySelectorAll<FluidStep>("fluid-step");
    await steps[0]!.updateComplete;
    const btn = steps[0]!.shadowRoot!.querySelector("button")!;
    expect(btn).to.exist;
    setTimeout(() => btn.click());
    const event = (await oneEvent(el, "fluid-step-change")) as CustomEvent;
    expect(event.detail.index).to.equal(0);
  });

  it("does not fire fluid-step-change when not clickable", async () => {
    const el = await fixture<FluidSteps>(sample);
    await el.updateComplete;
    let fired = false;
    el.addEventListener("fluid-step-change", () => (fired = true));
    el.querySelector<FluidStep>("fluid-step")!.click();
    await el.updateComplete;
    expect(fired).to.be.false;
  });

  it("mirrors orientation onto each step", async () => {
    const el = await fixture<FluidSteps>(html`
      <fluid-steps orientation="vertical" current="0" aria-label="V">
        <fluid-step>A</fluid-step>
        <fluid-step>B</fluid-step>
      </fluid-steps>
    `);
    await el.updateComplete;
    const step = el.querySelector<FluidStep>("fluid-step")!;
    expect(step.orientation).to.equal("vertical");
    expect(step.getAttribute("orientation")).to.equal("vertical");
  });

  it("indicator color reads the --fluid-step-* override ladder", async () => {
    const el = await fixture<FluidSteps>(sample);
    await el.updateComplete;
    const step = el.querySelectorAll<FluidStep>("fluid-step")[1]!; // current
    step.style.setProperty("--fluid-step-current-bg", "rgb(1, 2, 3)");
    await step.updateComplete;
    const indicator = step.shadowRoot!.querySelector(".indicator")!;
    expect(getComputedStyle(indicator).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("clickable step respects --fluid-target-min (AAA hit area) when vertical", async () => {
    const el = await fixture<FluidSteps>(html`
      <fluid-steps orientation="vertical" clickable current="0" aria-label="V">
        <fluid-step>A</fluid-step>
        <fluid-step>B</fluid-step>
      </fluid-steps>
    `);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const step = el.querySelector<FluidStep>("fluid-step")!;
    await step.updateComplete;
    const btn = step.shadowRoot!.querySelector<HTMLElement>("button")!;
    expect(btn.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });

  it("mirrors variant onto each step and reflects it", async () => {
    const el = await fixture<FluidSteps>(html`
      <fluid-steps variant="chip" current="1" aria-label="Chip">
        <fluid-step>A</fluid-step>
        <fluid-step>B</fluid-step>
      </fluid-steps>
    `);
    await el.updateComplete;
    const step = el.querySelector<FluidStep>("fluid-step")!;
    await step.updateComplete;
    expect(step.variant).to.equal("chip");
    expect(step.getAttribute("variant")).to.equal("chip");
  });

  it("chip variant still fires fluid-step-change when clickable", async () => {
    const el = await fixture<FluidSteps>(html`
      <fluid-steps variant="chip" current="2" clickable aria-label="Chip">
        <fluid-step>One</fluid-step>
        <fluid-step>Two</fluid-step>
        <fluid-step>Three</fluid-step>
      </fluid-steps>
    `);
    await el.updateComplete;
    const steps = el.querySelectorAll<FluidStep>("fluid-step");
    await steps[0]!.updateComplete;
    const btn = steps[0]!.shadowRoot!.querySelector("button")!;
    expect(btn).to.exist;
    setTimeout(() => btn.click());
    const event = (await oneEvent(el, "fluid-step-change")) as CustomEvent;
    expect(event.detail.index).to.equal(0);
  });

  it("passes a11y audit (chip)", async () => {
    const el = await fixture<FluidSteps>(html`
      <fluid-steps variant="chip" current="1" clickable aria-label="Chip">
        <fluid-step>One</fluid-step>
        <fluid-step>Two</fluid-step>
        <fluid-step>Three</fluid-step>
      </fluid-steps>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it("passes a11y audit (presentational)", async () => {
    const el = await fixture<FluidSteps>(sample);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it("passes a11y audit (clickable)", async () => {
    const el = await fixture<FluidSteps>(html`
      <fluid-steps current="1" clickable aria-label="Wizard">
        <fluid-step>One</fluid-step>
        <fluid-step>Two</fluid-step>
        <fluid-step>Three</fluid-step>
      </fluid-steps>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
