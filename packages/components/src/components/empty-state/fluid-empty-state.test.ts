import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidEmptyState } from "./fluid-empty-state.js";

describe("<fluid-empty-state>", () => {
  it("renders the heading", async () => {
    const el = await fixture<FluidEmptyState>(html`<fluid-empty-state heading="Nothing here">Body</fluid-empty-state>`);
    expect(el.shadowRoot!.querySelector('[part="heading"]')?.textContent).to.contain("Nothing here");
  });

  it("renders slotted description + actions", async () => {
    const el = await fixture<FluidEmptyState>(html`
      <fluid-empty-state heading="Empty">
        Some description
        <button slot="actions">Do it</button>
      </fluid-empty-state>
    `);
    const actions = el.shadowRoot!.querySelector('[part="actions"] slot') as HTMLSlotElement;
    expect(actions.assignedElements().length).to.equal(1);
  });

  it("passes the a11y audit", async () => {
    const el = await fixture<FluidEmptyState>(html`<fluid-empty-state heading="No data">Add something to begin.</fluid-empty-state>`);
    await expect(el).to.be.accessible();
  });
});
