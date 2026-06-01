import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidDescriptionList } from "./fluid-description-list.js";
import type { FluidDescriptionItem } from "./fluid-description-item.js";

describe("<fluid-description-list>", () => {
  it("renders the list wrapper with role=list", async () => {
    const el = await fixture<FluidDescriptionList>(html`
      <fluid-description-list>
        <fluid-description-item><span slot="term">A</span>1</fluid-description-item>
      </fluid-description-list>
    `);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base).to.exist;
    expect(base.getAttribute("role")).to.equal("list");
  });

  it("forwards aria-label to the list wrapper", async () => {
    const el = await fixture<FluidDescriptionList>(html`
      <fluid-description-list aria-label="Account details">
        <fluid-description-item><span slot="term">A</span>1</fluid-description-item>
      </fluid-description-list>
    `);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute("aria-label")).to.equal("Account details");
  });

  it("gives each item role=listitem", async () => {
    const el = await fixture<FluidDescriptionList>(html`
      <fluid-description-list>
        <fluid-description-item><span slot="term">A</span>1</fluid-description-item>
        <fluid-description-item><span slot="term">B</span>2</fluid-description-item>
      </fluid-description-list>
    `);
    const items = el.querySelectorAll("fluid-description-item");
    items.forEach((item) => expect(item.getAttribute("role")).to.equal("listitem"));
  });

  it("defaults to a single column with no columns attribute", async () => {
    const el = await fixture<FluidDescriptionList>(html`
      <fluid-description-list>
        <fluid-description-item><span slot="term">A</span>1</fluid-description-item>
      </fluid-description-list>
    `);
    await elementUpdated(el);
    expect(el.columns).to.equal(1);
    expect(el.hasAttribute("columns")).to.be.false;
  });

  it("strips the columns attribute when set back to 1", async () => {
    const el = await fixture<FluidDescriptionList>(html`
      <fluid-description-list columns="2">
        <fluid-description-item><span slot="term">A</span>1</fluid-description-item>
      </fluid-description-list>
    `);
    await elementUpdated(el);
    expect(el.hasAttribute("columns")).to.be.true;
    el.columns = 1;
    await elementUpdated(el);
    expect(el.hasAttribute("columns")).to.be.false;
  });

  it("lays out as a grid when columns > 1", async () => {
    const el = await fixture<FluidDescriptionList>(html`
      <fluid-description-list columns="2">
        <fluid-description-item><span slot="term">A</span>1</fluid-description-item>
        <fluid-description-item><span slot="term">B</span>2</fluid-description-item>
      </fluid-description-list>
    `);
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!;
    expect(getComputedStyle(base).display).to.equal("grid");
    expect(el.style.getPropertyValue("--_dl-columns")).to.equal("2");
  });

  it("reflects the divider attribute", async () => {
    const el = await fixture<FluidDescriptionList>(html`
      <fluid-description-list divider>
        <fluid-description-item><span slot="term">A</span>1</fluid-description-item>
      </fluid-description-list>
    `);
    expect(el.hasAttribute("divider")).to.be.true;
  });

  it("passes an a11y audit", async () => {
    const el = await fixture(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
        "
      >
        <fluid-description-list columns="2" divider aria-label="Account details">
          <fluid-description-item>
            <span slot="term">Name</span>
            Ada Lovelace
          </fluid-description-item>
          <fluid-description-item>
            <span slot="term">Email</span>
            ada@example.com
          </fluid-description-item>
          <fluid-description-item>
            <span slot="term">Role</span>
            Administrator
          </fluid-description-item>
        </fluid-description-list>
      </div>
    `);
    const list = el.querySelector<FluidDescriptionList>("fluid-description-list")!;
    await elementUpdated(list);
    await aTimeout(20);
    await expect(list).to.be.accessible();
  });
});

describe("<fluid-description-item>", () => {
  it("exposes base, term, and detail parts", async () => {
    const el = await fixture<FluidDescriptionItem>(html`
      <fluid-description-item><span slot="term">Name</span>Ada</fluid-description-item>
    `);
    expect(el.shadowRoot!.querySelector('[part="base"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="term"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="detail"]')).to.exist;
  });

  it("carries role=listitem", async () => {
    const el = await fixture<FluidDescriptionItem>(html`
      <fluid-description-item><span slot="term">Name</span>Ada</fluid-description-item>
    `);
    expect(el.getAttribute("role")).to.equal("listitem");
  });

  it("renders the term and detail slots", async () => {
    const el = await fixture<FluidDescriptionItem>(html`
      <fluid-description-item>
        <span slot="term">Email</span>
        ada@example.com
      </fluid-description-item>
    `);
    const termSlot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="term"]')!;
    const detailSlot = el.shadowRoot!.querySelector<HTMLSlotElement>("slot:not([name])")!;
    const termNodes = termSlot.assignedNodes({ flatten: true });
    const detailNodes = detailSlot.assignedNodes({ flatten: true });
    expect(termNodes.map((n) => n.textContent).join("")).to.contain("Email");
    expect(detailNodes.map((n) => n.textContent).join("")).to.contain("ada@example.com");
  });

  it("passes an a11y audit", async () => {
    // The item carries role="listitem", which is only valid inside a list, so
    // audit it within a list container (its real usage). Auditing a bare
    // listitem would (correctly) trip axe's aria-required-parent rule.
    const el = await fixture(html`
      <div
        style="
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
        "
        role="list"
      >
        <fluid-description-item>
          <span slot="term">Name</span>
          Ada Lovelace
        </fluid-description-item>
      </div>
    `);
    const item = el.querySelector<FluidDescriptionItem>("fluid-description-item")!;
    await elementUpdated(item);
    await aTimeout(20);
    await expect(item).to.be.accessible();
  });
});
