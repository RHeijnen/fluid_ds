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

  it("hides the actions wrapper when no actions are slotted", async () => {
    const el = await fixture<FluidEmptyState>(html`<fluid-empty-state heading="Empty">Body</fluid-empty-state>`);
    const wrapper = el.shadowRoot!.querySelector('[part="actions"]') as HTMLElement;
    expect(wrapper.hasAttribute("hidden")).to.equal(true);
  });

  it("shows the actions wrapper when actions are slotted", async () => {
    const el = await fixture<FluidEmptyState>(html`
      <fluid-empty-state heading="Empty">
        Body
        <button slot="actions">Do it</button>
      </fluid-empty-state>
    `);
    const wrapper = el.shadowRoot!.querySelector('[part="actions"]') as HTMLElement;
    expect(wrapper.hasAttribute("hidden")).to.equal(false);
  });

  it("passes the a11y audit", async () => {
    const el = await fixture<FluidEmptyState>(html`<fluid-empty-state heading="No data">Add something to begin.</fluid-empty-state>`);
    await expect(el).to.be.accessible();
  });
});
