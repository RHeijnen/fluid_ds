import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidDetails } from "./fluid-details.js";
import type { FluidAccordion } from "./fluid-accordion.js";

describe("<fluid-details>", () => {
  it("renders collapsed by default", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details>
        <span slot="summary">Q</span>
        <p>A</p>
      </fluid-details>
    `);
    expect(el.open).to.be.false;
    expect(el.shadowRoot!.querySelector(".body")!.hasAttribute("hidden")).to.be.true;
  });

  it("toggles on summary click", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details>
        <span slot="summary">Q</span>
        <p>A</p>
      </fluid-details>
    `);
    const summary = el.shadowRoot!.querySelector<HTMLButtonElement>(".summary")!;
    setTimeout(() => summary.click());
    const event = (await oneEvent(el, "fluid-toggle")) as CustomEvent;
    expect(event.detail.open).to.be.true;
  });

  it("toggles on Space and Enter", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details><span slot="summary">Q</span><p>A</p></fluid-details>
    `);
    const summary = el.shadowRoot!.querySelector<HTMLButtonElement>(".summary")!;
    summary.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.true;
    summary.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.false;
  });

  it("does not toggle when disabled", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details disabled>
        <span slot="summary">Q</span>
        <p>A</p>
      </fluid-details>
    `);
    el.shadowRoot!.querySelector<HTMLButtonElement>(".summary")!.click();
    await el.updateComplete;
    expect(el.open).to.be.false;
  });

  it("wires aria-controls and aria-labelledby", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details>
        <span slot="summary">Q</span>
        <p>A</p>
      </fluid-details>
    `);
    await el.updateComplete;
    const summary = el.shadowRoot!.querySelector(".summary")!;
    const body = el.shadowRoot!.querySelector(".body")!;
    expect(summary.getAttribute("aria-controls")).to.equal(body.id);
    expect(body.getAttribute("aria-labelledby")).to.equal(summary.id);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details>
        <span slot="summary">Section title</span>
        <p>Content</p>
      </fluid-details>
    `);
    await expect(el).to.be.accessible();
  });
});

describe("<fluid-accordion>", () => {
  it("allows multiple panels open by default", async () => {
    const el = await fixture<FluidAccordion>(html`
      <fluid-accordion>
        <fluid-details open><span slot="summary">A</span>a</fluid-details>
        <fluid-details open><span slot="summary">B</span>b</fluid-details>
      </fluid-accordion>
    `);
    await el.updateComplete;
    const panels = el.querySelectorAll<FluidDetails>("fluid-details");
    expect(panels[0]!.open).to.be.true;
    expect(panels[1]!.open).to.be.true;
  });

  it("single mode closes others when one opens", async () => {
    const el = await fixture<FluidAccordion>(html`
      <fluid-accordion single>
        <fluid-details open><span slot="summary">A</span>a</fluid-details>
        <fluid-details><span slot="summary">B</span>b</fluid-details>
        <fluid-details><span slot="summary">C</span>c</fluid-details>
      </fluid-accordion>
    `);
    await el.updateComplete;
    const panels = el.querySelectorAll<FluidDetails>("fluid-details");
    panels[1]!.open = true;
    await el.updateComplete;
    expect(panels[0]!.open).to.be.false;
    expect(panels[1]!.open).to.be.true;
    expect(panels[2]!.open).to.be.false;
  });

  /* Rework: override ladder + AAA target floor. */

  it("summary color reads the --fluid-details-* override ladder", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details><span slot="summary">Title</span>Body</fluid-details>
    `);
    el.style.setProperty("--fluid-details-summary-fg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const summary = el.shadowRoot!.querySelector<HTMLElement>(".summary")!;
    expect(getComputedStyle(summary).color).to.equal("rgb(1, 2, 3)");
  });

  it("the summary button respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details><span slot="summary">Title</span>Body</fluid-details>
    `);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const summary = el.shadowRoot!.querySelector<HTMLElement>(".summary")!;
    expect(summary.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
