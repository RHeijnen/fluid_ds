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
    expect(el.shadowRoot!.querySelector(".action-next")!.textContent!.trim()).to.equal("Done");
  });

  it("hides the Back button on the first step", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".action-back")).to.be.null;
  });

  it("renders its action controls as fluid-button elements", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open index="1" .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    const next = el.shadowRoot!.querySelector(".action-next")!;
    const back = el.shadowRoot!.querySelector(".action-back")!;
    const skip = el.shadowRoot!.querySelector(".action-skip")!;
    expect(next.localName).to.equal("fluid-button");
    expect(back.localName).to.equal("fluid-button");
    expect(skip.localName).to.equal("fluid-button");
    // The advance action is the primary (emphasised) variant.
    expect(next.getAttribute("variant")).to.equal("primary");
  });

  it("fires fluid-skip from the Skip button", async () => {
    const el = await fixture<FluidTour>(html`<fluid-tour open .steps=${steps}></fluid-tour>`);
    await elementUpdated(el);
    const skip = el.shadowRoot!.querySelector<HTMLElement>(".action-skip")!;
    const innerBtn = skip.shadowRoot!.querySelector<HTMLButtonElement>("button")!;
    setTimeout(() => innerBtn.click());
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

  it("resolves targets when the tour lives inside a shadow root", async () => {
    // A host whose shadow root holds BOTH the spotlight target and the tour.
    // document.querySelector cannot pierce this boundary, so the tour must
    // resolve selectors against its own root node.
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <button id="shadow-target" style="position:fixed;top:40px;left:40px;width:80px;height:30px;">T</button>
      <fluid-tour id="shadow-tour"></fluid-tour>
    `;
    const tour = shadow.querySelector<FluidTour>("#shadow-tour")!;
    tour.steps = [{ target: "#shadow-target", title: "Hi", body: "Body.", placement: "bottom" }];
    tour.open = true;
    await elementUpdated(tour);
    await aTimeout(50);

    const highlight = tour.shadowRoot!.querySelector<HTMLElement>(".highlight")!;
    // A resolved target shows the spotlight cutout (display:block); an
    // unresolved selector hides it (display:none) and centres the popover.
    expect(highlight.style.display).to.equal("block");
    expect(parseFloat(highlight.style.width)).to.be.greaterThan(0);

    tour.open = false;
    host.remove();
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
