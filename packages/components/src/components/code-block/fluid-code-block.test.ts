import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidCodeBlock } from "./fluid-code-block.js";

describe("<fluid-code-block>", () => {
  describe("<fluid-code-block> localized defaults", () => {
    for (const [locale, copyLabel, copiedLabel] of [
      ["nl", "TypeScript-code kopiëren", "Gekopieerd"],
      ["de", "TypeScript-Code kopieren", "Kopiert"],
      ["fr", "Copier le code TypeScript", "Copié"],
      ["es", "Copiar código TypeScript", "Copiado"],
      ["ar", "نسخ شفرة TypeScript", "تم النسخ"],
      ["fr-CA", "Copier le code TypeScript", "Copié"]
    ] as const) {
      it(`localizes parameterized copy and copied states in ${locale} without changing application content`, async () => {
        const descriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
        let written = "";
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text: string) => {
              written = text;
            }
          }
        });
        try {
          const wrapper = await fixture<HTMLDivElement>(html`
            <div lang="en">
              <fluid-code-block
                language="TypeScript"
                filename="Application.ts"
                code="const application = true;"
              ></fluid-code-block>
            </div>
          `);
          const control = wrapper.querySelector<FluidCodeBlock>("fluid-code-block")!;
          wrapper.lang = locale;
          await new Promise((resolve) => setTimeout(resolve, 0));
          await control.updateComplete;
          const icon = () => control.shadowRoot!.querySelector("fluid-icon")!;
          expect(icon().getAttribute("label")).to.equal(copyLabel);
          expect(control.shadowRoot!.querySelector(".label")!.textContent!.trim()).to.equal(
            "Application.ts"
          );
          const copied = oneEvent(control, "fluid-copy");
          control.shadowRoot!.querySelector<HTMLElement>(".copy")!.click();
          const event = await copied;
          await control.updateComplete;
          expect(written).to.equal("const application = true;");
          expect(event.detail.text).to.equal(written);
          expect(icon().getAttribute("label")).to.equal(copiedLabel);
          wrapper.lang = "nl";
          await new Promise((resolve) => setTimeout(resolve, 0));
          await control.updateComplete;
          expect(icon().getAttribute("label")).to.equal("Gekopieerd");
        } finally {
          if (descriptor) Object.defineProperty(navigator, "clipboard", descriptor);
          else Reflect.deleteProperty(navigator, "clipboard");
        }
      });
    }

    const readLabels = (control: FluidCodeBlock) => [
      control.shadowRoot!.querySelector("fluid-icon")!.getAttribute("label")
    ];
    for (const [locale, expected] of [
      ["nl", ["Code kopiëren"]],
      ["de", ["Code kopieren"]],
      ["fr", ["Copier le code"]],
      ["es", ["Copiar código"]],
      ["ar", ["نسخ الشفرة"]],
      ["fr-CA", ["Copier le code"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-code-block code="Application code" filename="Application.ts"></fluid-code-block>
          </div>
        `);
        const control = wrapper.querySelector<FluidCodeBlock>("fluid-code-block")!;
        await control.updateComplete;

        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidCodeBlock>(
        html`<fluid-code-block
          code="Application code"
          filename="Application.ts"
        ></fluid-code-block>`
      );
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Code kopiëren"]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Code kopieren"]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["نسخ الشفرة"]);
    });
  });

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
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    try {
      const el = await fixture<FluidCodeBlock>(html`
        <fluid-code-block code="hello"></fluid-code-block>
      `);
      await el.updateComplete;
      const copied = oneEvent(el, "fluid-copy");
      el.shadowRoot!.querySelector<HTMLElement>(".copy")!.click();
      const event = (await copied) as CustomEvent;
      expect(event.detail.text).to.equal("hello");
    } finally {
      if (descriptor) Object.defineProperty(navigator, "clipboard", descriptor);
      else Reflect.deleteProperty(navigator, "clipboard");
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
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
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
      if (descriptor) Object.defineProperty(navigator, "clipboard", descriptor);
      else Reflect.deleteProperty(navigator, "clipboard");
    }
  });

  it("swaps the copy icon to 'check' while copied, then back", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
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
      if (descriptor) Object.defineProperty(navigator, "clipboard", descriptor);
      else Reflect.deleteProperty(navigator, "clipboard");
    }
  });

  it("clears the copy-reset timer on disconnect so it does not fire on a detached element", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
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
      if (descriptor) Object.defineProperty(navigator, "clipboard", descriptor);
      else Reflect.deleteProperty(navigator, "clipboard");
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
