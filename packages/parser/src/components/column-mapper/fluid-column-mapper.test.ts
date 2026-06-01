import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidColumnMapper } from "./fluid-column-mapper.js";
import type { Blueprint } from "../../core/types.js";

const blueprint: Blueprint = {
  fields: [
    { key: "name", label: "Name", type: "string", required: true },
    { key: "email", type: "email" }
  ]
};

async function mount(): Promise<FluidColumnMapper> {
  const el = await fixture<FluidColumnMapper>(html`<fluid-column-mapper></fluid-column-mapper>`);
  el.blueprint = blueprint;
  el.columns = ["Name", "Email Address"];
  await el.updateComplete;
  return el;
}

describe("fluid-column-mapper", () => {
  it("is accessible", async () => {
    const el = await mount();
    await expect(el).to.be.accessible();
  });

  it("seeds the mapping from the fuzzy auto-map", async () => {
    const el = await mount();
    expect(el.mapping.name).to.equal("Name");
    expect(el.mapping.email).to.equal("Email Address");
  });

  it("renders one labelled select per field", async () => {
    const el = await mount();
    const selects = el.shadowRoot?.querySelectorAll("select");
    expect(selects?.length).to.equal(2);
    const label = el.shadowRoot?.querySelector("label");
    expect(label?.getAttribute("for")).to.equal("map-name");
  });

  it("emits fluid-mapping-change when a select changes", async () => {
    const el = await mount();
    const select = el.shadowRoot?.querySelector<HTMLSelectElement>("#map-email");
    expect(select).to.exist;
    setTimeout(() => {
      if (select) {
        select.value = "";
        select.dispatchEvent(new Event("change"));
      }
    });
    const event = await oneEvent(el, "fluid-mapping-change");
    expect(event.detail.mapping.email).to.equal(null);
  });

  it("marks an unmapped required field as invalid", async () => {
    const el = await fixture<FluidColumnMapper>(html`<fluid-column-mapper></fluid-column-mapper>`);
    el.blueprint = blueprint;
    el.columns = ["unrelated"];
    el.mapping = { name: null, email: null };
    await el.updateComplete;
    const nameSelect = el.shadowRoot?.querySelector<HTMLSelectElement>("#map-name");
    expect(nameSelect?.getAttribute("aria-invalid")).to.equal("true");
  });
});
