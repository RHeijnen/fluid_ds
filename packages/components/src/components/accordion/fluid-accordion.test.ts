import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
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
      <fluid-details
        ><span slot="summary">Q</span>
        <p>A</p></fluid-details
      >
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

  it("does not fire fluid-toggle on initial mount (closed)", async () => {
    let fired = false;
    const el = await fixture<FluidDetails>(html`
      <fluid-details>
        <span slot="summary">Q</span>
        <p>A</p>
      </fluid-details>
    `);
    el.addEventListener("fluid-toggle", () => (fired = true));
    // Let any post-connect updates settle.
    await el.updateComplete;
    expect(fired).to.be.false;
  });

  it("does not fire fluid-toggle on initial mount (open)", async () => {
    let fired = false;
    const el = await fixture<FluidDetails>(html`
      <fluid-details open>
        <span slot="summary">Q</span>
        <p>A</p>
      </fluid-details>
    `);
    el.addEventListener("fluid-toggle", () => (fired = true));
    await el.updateComplete;
    expect(fired).to.be.false;
  });

  it("fires fluid-toggle only on a real open/close transition", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details>
        <span slot="summary">Q</span>
        <p>A</p>
      </fluid-details>
    `);
    setTimeout(() => (el.open = true));
    const event = (await oneEvent(el, "fluid-toggle")) as CustomEvent;
    expect(event.detail.open).to.be.true;
  });

  it("preserves disclosure wiring when summary and body content are replaced", async () => {
    const el = await fixture<FluidDetails>(html`
      <fluid-details open>
        <span slot="summary">Original summary</span>
        <p>Original body</p>
      </fluid-details>
    `);
    const summaryButton = el.shadowRoot!.querySelector<HTMLButtonElement>(".summary")!;
    const body = el.shadowRoot!.querySelector<HTMLElement>(".body")!;
    const summaryId = summaryButton.id;
    const bodyId = body.id;
    let toggles = 0;
    el.addEventListener("fluid-toggle", () => toggles++);

    const replacementSummary = Object.assign(document.createElement("strong"), {
      slot: "summary",
      textContent: "Replacement summary"
    });
    const replacementBody = Object.assign(document.createElement("section"), {
      textContent: "Replacement body"
    });
    el.querySelector('[slot="summary"]')!.replaceWith(replacementSummary);
    el.querySelector("p")!.replaceWith(replacementBody);
    await el.updateComplete;

    const summarySlot = summaryButton.querySelector<HTMLSlotElement>('slot[name="summary"]')!;
    const bodySlot = body.querySelector<HTMLSlotElement>("slot:not([name])")!;
    expect(summaryButton.id).to.equal(summaryId);
    expect(body.id).to.equal(bodyId);
    expect(summaryButton.getAttribute("aria-controls")).to.equal(bodyId);
    expect(body.getAttribute("aria-labelledby")).to.equal(summaryId);
    expect(summarySlot.assignedElements({ flatten: true })).to.deep.equal([replacementSummary]);
    expect(bodySlot.assignedElements({ flatten: true })).to.deep.equal([replacementBody]);
    expect(summarySlot.assignedElements({ flatten: true })[0]!.textContent).to.equal(
      "Replacement summary"
    );
    expect(bodySlot.assignedElements({ flatten: true })[0]!.textContent).to.equal(
      "Replacement body"
    );
    expect(toggles).to.equal(0);
  });

  it("retains dynamic content and open state across reconnect without extra toggles", async () => {
    const host = await fixture<HTMLDivElement>(html`
      <div>
        <fluid-details open>
          <span slot="summary">Summary</span>
          <button>First action</button>
        </fluid-details>
      </div>
    `);
    const el = host.querySelector<FluidDetails>("fluid-details")!;
    let toggles = 0;
    el.addEventListener("fluid-toggle", () => toggles++);
    el.querySelector("button")!.textContent = "Updated action";

    el.remove();
    host.append(el);
    await el.updateComplete;

    const summary = el.shadowRoot!.querySelector<HTMLButtonElement>(".summary")!;
    const body = el.shadowRoot!.querySelector<HTMLElement>(".body")!;
    const bodySlot = body.querySelector<HTMLSlotElement>("slot:not([name])")!;
    expect(el.open).to.equal(true);
    expect(body.hasAttribute("hidden")).to.equal(false);
    expect(bodySlot.assignedElements({ flatten: true })[0]!.textContent).to.equal("Updated action");
    expect(summary.getAttribute("aria-controls")).to.equal(body.id);
    expect(toggles).to.equal(0);
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

  it("reconciles authored open panels in single mode and includes disabled panels", async () => {
    const el = await fixture<FluidAccordion>(html`
      <fluid-accordion single>
        <fluid-details open disabled><span slot="summary">A</span>a</fluid-details>
        <fluid-details open><span slot="summary">B</span>b</fluid-details>
        <fluid-details open><span slot="summary">C</span>c</fluid-details>
      </fluid-accordion>
    `);
    await aTimeout(0);
    const panels = el.querySelectorAll<FluidDetails>("fluid-details");
    expect(Array.from(panels, (panel) => panel.open)).to.deep.equal([true, false, false]);
  });

  it("keeps the first DOM-open panel when multiple mode becomes single", async () => {
    const el = await fixture<FluidAccordion>(html`
      <fluid-accordion>
        <fluid-details open><span slot="summary">A</span>a</fluid-details>
        <fluid-details open><span slot="summary">B</span>b</fluid-details>
      </fluid-accordion>
    `);
    const panels = el.querySelectorAll<FluidDetails>("fluid-details");
    el.single = true;
    await el.updateComplete;
    expect(Array.from(panels, (panel) => panel.open)).to.deep.equal([true, false]);
  });

  it("reconciles an already-open panel inserted into single mode without synthetic events", async () => {
    const el = await fixture<FluidAccordion>(html`
      <fluid-accordion single>
        <fluid-details open><span slot="summary">A</span>a</fluid-details>
      </fluid-accordion>
    `);
    let toggles = 0;
    el.addEventListener("fluid-toggle", () => (toggles += 1));
    const inserted = document.createElement("fluid-details") as FluidDetails;
    inserted.open = true;
    inserted.innerHTML = '<span slot="summary">B</span>b';
    el.append(inserted);
    await inserted.updateComplete;
    await aTimeout(0);
    const panels = el.querySelectorAll<FluidDetails>("fluid-details");
    expect(Array.from(panels, (panel) => panel.open)).to.deep.equal([true, false]);
    expect(toggles).to.equal(0);
  });

  it("reconciles detached child changes on reconnect and still lets a real open target win", async () => {
    const host = await fixture<HTMLDivElement>(html`
      <div>
        <fluid-accordion single>
          <fluid-details open><span slot="summary">A</span>a</fluid-details>
          <fluid-details><span slot="summary">B</span>b</fluid-details>
        </fluid-accordion>
      </div>
    `);
    const el = host.querySelector<FluidAccordion>("fluid-accordion")!;
    const panels = el.querySelectorAll<FluidDetails>("fluid-details");
    el.remove();
    panels[1]!.open = true;
    await panels[1]!.updateComplete;
    host.append(el);
    await aTimeout(0);
    expect(Array.from(panels, (panel) => panel.open)).to.deep.equal([true, false]);
    panels[1]!.open = true;
    await panels[1]!.updateComplete;
    await panels[0]!.updateComplete;
    expect(Array.from(panels, (panel) => panel.open)).to.deep.equal([false, true]);
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
