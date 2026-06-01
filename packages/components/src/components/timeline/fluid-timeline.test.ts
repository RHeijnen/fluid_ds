import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidTimeline } from "./fluid-timeline.js";
import type { FluidTimelineItem } from "./fluid-timeline-item.js";

describe("<fluid-timeline>", () => {
  it("renders the list wrapper with role=list", async () => {
    const el = await fixture<FluidTimeline>(html`
      <fluid-timeline>
        <fluid-timeline-item>First</fluid-timeline-item>
      </fluid-timeline>
    `);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base).to.exist;
    expect(base.getAttribute("role")).to.equal("list");
  });

  it("forwards aria-label to the list wrapper", async () => {
    const el = await fixture<FluidTimeline>(html`
      <fluid-timeline aria-label="Order history">
        <fluid-timeline-item>First</fluid-timeline-item>
      </fluid-timeline>
    `);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute("aria-label")).to.equal("Order history");
  });

  it("gives each item role=listitem", async () => {
    const el = await fixture<FluidTimeline>(html`
      <fluid-timeline>
        <fluid-timeline-item>One</fluid-timeline-item>
        <fluid-timeline-item>Two</fluid-timeline-item>
      </fluid-timeline>
    `);
    const items = el.querySelectorAll("fluid-timeline-item");
    items.forEach((item) => expect(item.getAttribute("role")).to.equal("listitem"));
  });

  it("marks only the last item as last", async () => {
    const el = await fixture<FluidTimeline>(html`
      <fluid-timeline>
        <fluid-timeline-item>One</fluid-timeline-item>
        <fluid-timeline-item>Two</fluid-timeline-item>
        <fluid-timeline-item>Three</fluid-timeline-item>
      </fluid-timeline>
    `);
    await elementUpdated(el);
    const items = Array.from(
      el.querySelectorAll("fluid-timeline-item")
    ) as FluidTimelineItem[];
    expect(items[0]!.last).to.be.false;
    expect(items[1]!.last).to.be.false;
    expect(items[2]!.last).to.be.true;
  });

  it("hides the trailing line on the last item", async () => {
    const el = await fixture<FluidTimeline>(html`
      <fluid-timeline>
        <fluid-timeline-item>One</fluid-timeline-item>
        <fluid-timeline-item>Two</fluid-timeline-item>
      </fluid-timeline>
    `);
    await elementUpdated(el);
    const items = Array.from(
      el.querySelectorAll("fluid-timeline-item")
    ) as FluidTimelineItem[];
    await elementUpdated(items[1]!);
    const lastLine = items[1]!.shadowRoot!.querySelector<HTMLElement>(".line")!;
    expect(getComputedStyle(lastLine).display).to.equal("none");
  });
});

describe("<fluid-timeline-item>", () => {
  it("exposes marker and content parts", async () => {
    const el = await fixture<FluidTimelineItem>(html`
      <fluid-timeline-item>Event</fluid-timeline-item>
    `);
    expect(el.shadowRoot!.querySelector('[part="marker"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="content"]')).to.exist;
  });

  it("reflects the tone attribute", async () => {
    const el = await fixture<FluidTimelineItem>(html`
      <fluid-timeline-item tone="success">Done</fluid-timeline-item>
    `);
    expect(el.getAttribute("tone")).to.equal("success");
  });

  it("renders the slotted content", async () => {
    const el = await fixture<FluidTimelineItem>(html`
      <fluid-timeline-item><strong>Shipped</strong></fluid-timeline-item>
    `);
    expect(el.textContent?.trim()).to.equal("Shipped");
  });

  it("hides the time row when no time slot is supplied", async () => {
    const el = await fixture<FluidTimelineItem>(html`
      <fluid-timeline-item>No time</fluid-timeline-item>
    `);
    await elementUpdated(el);
    const time = el.shadowRoot!.querySelector(".time")!;
    expect(time.classList.contains("empty")).to.be.true;
  });

  it("shows the time row when a time slot is supplied", async () => {
    const el = await fixture<FluidTimelineItem>(html`
      <fluid-timeline-item>
        <span slot="time">09:24</span>
        Order placed
      </fluid-timeline-item>
    `);
    await elementUpdated(el);
    const time = el.shadowRoot!.querySelector(".time")!;
    expect(time.classList.contains("empty")).to.be.false;
  });

  it("keeps the marker decorative (aria-hidden)", async () => {
    const el = await fixture<FluidTimelineItem>(html`
      <fluid-timeline-item>Event</fluid-timeline-item>
    `);
    const marker = el.shadowRoot!.querySelector('[part="marker"]')!;
    expect(marker.getAttribute("aria-hidden")).to.equal("true");
  });

  it("passes an a11y audit", async () => {
    const el = await fixture(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-success-base:#15803d;
          --fluid-success-text:#ffffff;
          --fluid-danger-base:#b91c1c;
          --fluid-danger-text:#ffffff;
          --fluid-warning-base:#b45309;
          --fluid-info-base:#1d4ed8;
          --fluid-info-text:#ffffff;
        "
      >
        <fluid-timeline aria-label="Order history">
          <fluid-timeline-item tone="success">
            <span slot="time">09:24</span>
            <strong>Order placed</strong>
          </fluid-timeline-item>
          <fluid-timeline-item tone="info">
            <span slot="time">10:02</span>
            <strong>Payment confirmed</strong>
          </fluid-timeline-item>
        </fluid-timeline>
      </div>
    `);
    const timeline = el.querySelector<FluidTimeline>("fluid-timeline")!;
    await elementUpdated(timeline);
    await aTimeout(20);
    await expect(timeline).to.be.accessible();
  });
});
