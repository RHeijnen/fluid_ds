import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidHero } from "./fluid-hero.js";

describe("<fluid-hero>", () => {
  it("renders the heading from the default slot", async () => {
    const el = await fixture<FluidHero>(html`
      <fluid-hero><h1>Welcome</h1></fluid-hero>
    `);
    const slot = el.shadowRoot!.querySelector("slot:not([name])") as HTMLSlotElement;
    expect(slot.assignedElements()[0]?.textContent).to.contain("Welcome");
  });

  it("does not inject its own heading (preserves the document outline)", async () => {
    const el = await fixture<FluidHero>(html`<fluid-hero><h1>Title</h1></fluid-hero>`);
    expect(el.shadowRoot!.querySelector("h1, h2, h3")).to.equal(null);
  });

  it("reflects align, media-position, and size", async () => {
    const el = await fixture<FluidHero>(html`
      <fluid-hero align="center" media-position="background" size="lg"><h1>X</h1></fluid-hero>
    `);
    expect(el.getAttribute("align")).to.equal("center");
    expect(el.getAttribute("media-position")).to.equal("background");
    expect(el.getAttribute("size")).to.equal("lg");
  });

  it("collapses optional regions whose slot is empty", async () => {
    const el = await fixture<FluidHero>(html`<fluid-hero><h1>Only a heading</h1></fluid-hero>`);
    await el.updateComplete;
    const eyebrow = el.shadowRoot!.querySelector('[part="eyebrow"]') as HTMLElement;
    const actions = el.shadowRoot!.querySelector('[part="actions"]') as HTMLElement;
    expect(eyebrow.hasAttribute("hidden")).to.equal(true);
    expect(actions.hasAttribute("hidden")).to.equal(true);
  });

  it("shows a region once its slot has content", async () => {
    const el = await fixture<FluidHero>(html`
      <fluid-hero>
        <span slot="eyebrow">Kicker</span>
        <h1>Heading</h1>
        <div slot="actions"><button>Go</button></div>
      </fluid-hero>
    `);
    await el.updateComplete;
    const eyebrow = el.shadowRoot!.querySelector('[part="eyebrow"]') as HTMLElement;
    const actions = el.shadowRoot!.querySelector('[part="actions"]') as HTMLElement;
    expect(eyebrow.hasAttribute("hidden")).to.equal(false);
    expect(actions.hasAttribute("hidden")).to.equal(false);
  });

  it("establishes a container for responsive layout", async () => {
    const el = await fixture<FluidHero>(html`<fluid-hero><h1>X</h1></fluid-hero>`);
    expect(el.style.containerType).to.equal("inline-size");
  });

  it("passes the a11y audit", async () => {
    const el = await fixture<FluidHero>(html`
      <fluid-hero>
        <span slot="eyebrow">New</span>
        <h1>Accessible hero</h1>
        <p slot="description">Supporting copy that explains the value.</p>
        <div slot="actions"><button>Get started</button></div>
      </fluid-hero>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
