import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
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

  it("does not clobber a user-edited mapping when columns change", async () => {
    const el = await mount();
    // Auto-map seeded the initial mapping. Simulate a user override.
    el.mapping = { ...el.mapping, name: "Email Address" };
    await el.updateComplete;
    // New columns arrive: the hasMapping guard must keep the edited mapping.
    el.columns = ["Name", "Email Address", "Phone"];
    await el.updateComplete;
    expect(el.mapping.name).to.equal("Email Address");
  });

  it("seeds the mapping when columns arrive with an empty mapping", async () => {
    const el = await fixture<FluidColumnMapper>(html`<fluid-column-mapper></fluid-column-mapper>`);
    el.blueprint = blueprint;
    el.mapping = {};
    await el.updateComplete;
    // Empty mapping + columns means the auto-map should seed it.
    el.columns = ["Name", "Email Address"];
    await el.updateComplete;
    expect(el.mapping.name).to.equal("Name");
    expect(el.mapping.email).to.equal("Email Address");
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

  it("exposes required state through native semantics and normalizes removed columns", async () => {
    const el = await mount();
    const select = el.shadowRoot!.querySelector<HTMLSelectElement>("#map-name")!;
    expect(select.required).to.be.true;
    el.columns = ["Email Address"];
    await el.updateComplete;
    expect(el.mapping.name).to.equal(null);
    expect(select.value).to.equal("");
    expect(select.validity.valueMissing).to.be.true;
    expect(select.getAttribute("aria-invalid")).to.equal("true");
  });

  it("allows explicit source reuse and emits an isolated full mapping payload", async () => {
    const el = await mount();
    const select = el.shadowRoot!.querySelector<HTMLSelectElement>("#map-email")!;
    const events: CustomEvent[] = [];
    el.addEventListener("fluid-mapping-change", (event) => events.push(event as CustomEvent));
    select.value = "Name";
    select.dispatchEvent(new Event("change"));
    await el.updateComplete;
    expect(events).to.have.length(1);
    expect(events[0]!.detail.mapping).to.deep.equal({ name: "Name", email: "Name" });
    expect(events[0]!.bubbles).to.be.true;
    expect(events[0]!.composed).to.be.true;
    events[0]!.detail.mapping.name = null;
    expect(el.mapping.name).to.equal("Name");
  });

  it("localizes native-select prompts live without changing application data or emitting events", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-column-mapper></fluid-column-mapper>
      </div>
    `);
    const el = wrapper.querySelector<FluidColumnMapper>("fluid-column-mapper")!;
    const callerBlueprint: Blueprint = {
      fields: [
        { key: "caller-key", label: 'Caller <field> & "العربية"', type: "string", required: true },
        { key: "optional", label: "Optional caller field", type: "string" }
      ]
    };
    const columns = ['Source <column> & "العربية"'];
    el.blueprint = callerBlueprint;
    el.columns = columns;
    el.mapping = { "caller-key": null, optional: null };
    await aTimeout(0);
    await el.updateComplete;

    const events: Event[] = [];
    el.addEventListener("fluid-mapping-change", (event) => events.push(event));
    const mapping = el.mapping;
    const selects = el.shadowRoot!.querySelectorAll("select");
    expect(el.shadowRoot!.querySelector(".base")!.getAttribute("dir")).to.equal("rtl");
    expect(el.shadowRoot!.querySelector("[part=required]")!.getAttribute("title")).to.equal(
      "مطلوب"
    );
    expect(selects[0]!.options[0]!.textContent!.trim()).to.equal("اختر عمودًا…");
    expect(selects[1]!.options[0]!.textContent!.trim()).to.equal("(غير معيّن)");
    expect(selects[0]).to.be.instanceOf(HTMLSelectElement);
    expect(selects[0]!.options[1]!.textContent).to.equal(columns[0]);
    expect(el.shadowRoot!.querySelector("label")!.textContent).to.include(
      callerBlueprint.fields[0]!.label
    );

    wrapper.lang = "fr-CA";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".base")!.getAttribute("dir")).to.equal("ltr");
    expect(selects[0]!.options[0]!.textContent!.trim()).to.equal("Sélectionner une colonne…");
    expect(selects[1]!.options[0]!.textContent!.trim()).to.equal("(non associé)");
    expect(el.blueprint).to.equal(callerBlueprint);
    expect(el.columns).to.equal(columns);
    expect(el.mapping).to.equal(mapping);
    expect(events).to.deep.equal([]);
  });
});
