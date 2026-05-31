import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidCodeBlock } from "./fluid-code-block.js";

describe("<fluid-code-block>", () => {
  it("renders the code prop", async () => {
    const el = await fixture<FluidCodeBlock>(html`
      <fluid-code-block code="const x = 1;"></fluid-code-block>
    `);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("code")?.textContent).to.include("const x = 1;");
  });

  it("renders slotted text content", async () => {
    const el = await fixture<FluidCodeBlock>(html`
      <fluid-code-block>const y = 2;</fluid-code-block>
    `);
    await el.updateComplete;
    expect(el.textContent?.trim()).to.include("const y = 2;");
  });

  it("hides copy button when no-copy", async () => {
    const el = await fixture<FluidCodeBlock>(html`
      <fluid-code-block code="x" no-copy></fluid-code-block>
    `);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".copy")).to.be.null;
  });

  it("fires fluid-copy when copy button clicked", async () => {
    // Stub clipboard API
    const original = navigator.clipboard?.writeText;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    const el = await fixture<FluidCodeBlock>(html`
      <fluid-code-block code="hello"></fluid-code-block>
    `);
    await el.updateComplete;
    const copyBtn = el.shadowRoot!.querySelector<HTMLElement>(".copy")!;
    setTimeout(() => copyBtn.click());
    const event = (await oneEvent(el, "fluid-copy")) as CustomEvent;
    expect(event.detail.text).to.equal("hello");
    if (original) {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: original }
      });
    }
  });

  it("shows the filename in the header bar", async () => {
    const el = await fixture<FluidCodeBlock>(html`
      <fluid-code-block filename="theme.css" code="body{}"></fluid-code-block>
    `);
    await el.updateComplete;
    const header = el.shadowRoot!.querySelector('[part="header"]');
    expect(header).to.not.be.null;
    expect(header!.textContent).to.include("theme.css");
  });

  it("falls back to the language label when no filename is set", async () => {
    const el = await fixture<FluidCodeBlock>(html`
      <fluid-code-block language="ts" code="const x = 1;"></fluid-code-block>
    `);
    await el.updateComplete;
    const label = el.shadowRoot!.querySelector(".label");
    expect(label?.textContent?.trim()).to.equal("ts");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCodeBlock>(html`
      <fluid-code-block code="example" language="ts"></fluid-code-block>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
