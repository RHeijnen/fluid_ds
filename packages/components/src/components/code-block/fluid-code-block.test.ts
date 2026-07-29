import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
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

  it("copies the slotted text content when no code prop is set", async () => {
    let written = "";
    const original = navigator.clipboard?.writeText;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          written = text;
        }
      }
    });
    try {
      const el = await fixture<FluidCodeBlock>(html`
        <fluid-code-block>slotted code</fluid-code-block>
      `);
      await el.updateComplete;
      const copyBtn = el.shadowRoot!.querySelector<HTMLElement>(".copy")!;
      setTimeout(() => copyBtn.click());
      const event = (await oneEvent(el, "fluid-copy")) as CustomEvent;
      expect(event.detail.text).to.equal("slotted code");
      expect(written).to.equal("slotted code");
    } finally {
      if (original) {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: original }
        });
      }
    }
  });

  it("swaps the copy icon to 'check' while copied, then back", async () => {
    const original = navigator.clipboard?.writeText;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    try {
      const el = await fixture<FluidCodeBlock>(html`
        <fluid-code-block code="x"></fluid-code-block>
      `);
      await el.updateComplete;
      const icon = () => el.shadowRoot!.querySelector("fluid-icon")!;
      expect(icon().getAttribute("name")).to.equal("copy");

      el.shadowRoot!.querySelector<HTMLElement>(".copy")!.click();
      await oneEvent(el, "fluid-copy");
      await el.updateComplete;
      expect(icon().getAttribute("name")).to.equal("check");

      await aTimeout(1600);
      await el.updateComplete;
      expect(icon().getAttribute("name")).to.equal("copy");
    } finally {
      if (original) {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: original }
        });
      }
    }
  });

  it("clears the copy-reset timer on disconnect so it does not fire on a detached element", async () => {
    const original = navigator.clipboard?.writeText;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    try {
      const el = await fixture<FluidCodeBlock>(html`
        <fluid-code-block code="x"></fluid-code-block>
      `);
      await el.updateComplete;

      el.shadowRoot!.querySelector<HTMLElement>(".copy")!.click();
      await oneEvent(el, "fluid-copy");
      await el.updateComplete;

      // Track any reactive update requested after the element is detached. If
      // the timer is cleared on disconnect, the 1.5s reset callback must never
      // run, so requestUpdate must not be called from it.
      let updatedAfterRemoval = false;
      const proto = el as unknown as { requestUpdate: () => void };
      const realRequestUpdate = proto.requestUpdate.bind(el);
      proto.requestUpdate = (...args: unknown[]) => {
        updatedAfterRemoval = true;
        return (realRequestUpdate as (...a: unknown[]) => void)(...args);
      };

      // Remove the element within the 1.5s reset window.
      el.remove();

      // Wait past the reset timeout.
      await aTimeout(1700);
      expect(updatedAfterRemoval).to.be.false;
    } finally {
      if (original) {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: original }
        });
      }
    }
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCodeBlock>(html`
      <fluid-code-block code="example" language="ts"></fluid-code-block>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
