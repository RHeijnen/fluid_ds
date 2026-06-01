import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidTour, FluidTourStep } from "./fluid-tour.js";

const steps: FluidTourStep[] = [
  { target: "#a", title: "First", body: "First step body.", placement: "bottom" },
  { target: "#b", title: "Second", body: "Second step body.", placement: "bottom" },
  { target: "#c", title: "Third", body: "Third step body.", placement: "bottom" }
];

/** Mount a few real targets the tour can spotlight. */
function mountTargets(): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = `<button id="a">A</button><button id="b">B</button><button id="c">C</button>`;
  document.body.appendChild(host);
  return host;
}

describe("<fluid-tour>", () => {
  let targets: HTMLElement;

  beforeEach(() => {
    targets = mountTargets();
  });

  afterEach(() => {
    targets.remove();
  });

  it("renders the dialog with modal semantics", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour .steps=${steps}></fluid-tour>`);
    const panel = el.shadowRoot!.querySelector(".panel")!;
    expect(panel.getAttribute("role")).to.equal("dialog");
    expect(panel.getAttribute("aria-modal")).to.equal("true");
  });

  it("shows the current step's title, body, and counter", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    expect(el.shadowRoot!.querySelector(".title")!.textContent).to.contain("First");
    expect(el.shadowRoot!.querySelector(".body")!.textContent).to.contain("First step body.");
    expect(el.shadowRoot!.querySelector(".counter")!.textContent).to.contain("Step 1 of 3");
  });

  it("advances with next() and fires fluid-step-change", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    setTimeout(() => el.next());
    const event = await oneEvent(el, "fluid-step-change");
    expect(event.detail.index).to.equal(1);
    await elementUpdated(el);
    expect(el.index).to.equal(1);
  });

  it("goes back with back()", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open index="1" .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    el.back();
    await elementUpdated(el);
    expect(el.index).to.equal(0);
  });

  it("does not go before the first step", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    el.back();
    expect(el.index).to.equal(0);
  });

  it("fires fluid-finish on the last step's Next", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open index="2" .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    setTimeout(() => el.next());
    const event = await oneEvent(el, "fluid-finish");
    expect(event).to.exist;
    expect(el.open).to.be.false;
  });

  it("renders Done (not Next) on the last step", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open index="2" .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".btn-primary")!.textContent!.trim()).to.equal("Done");
  });

  it("hides the Back button on the first step", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".btn-secondary")).to.be.null;
  });

  it("fires fluid-skip from the Skip button", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    const skip = el.shadowRoot!.querySelector<HTMLButtonElement>(".btn-ghost")!;
    setTimeout(() => skip.click());
    const event = await oneEvent(el, "fluid-skip");
    expect(event).to.exist;
    expect(el.open).to.be.false;
  });

  it("fires fluid-skip on Escape", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    setTimeout(() =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    );
    const event = await oneEvent(el, "fluid-skip");
    expect(event).to.exist;
  });

  it("steps forward / back with arrow keys", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await elementUpdated(el);
    expect(el.index).to.equal(1);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await elementUpdated(el);
    expect(el.index).to.equal(0);
  });

  it("announces the step in a live region", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    await aTimeout(20);
    const live = el.shadowRoot!.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).to.contain("Step 1 of 3");
    expect(live.textContent).to.contain("First");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTour>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-motion:0;
        "
      >
        <fluid-tour open .steps=${steps}></fluid-tour>
      </div>
    `);
    const tour = el.querySelector<FluidTour>("fluid-tour")!;
    await elementUpdated(tour);
    await aTimeout(20);
    await expect(tour).to.be.accessible();
  });
});
