import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidRichTextEditor } from "./fluid-rich-text-editor.js";

async function editor(): Promise<FluidRichTextEditor> {
  const el = await fixture<FluidRichTextEditor>(html`<fluid-rich-text-editor></fluid-rich-text-editor>`);
  await elementUpdated(el);
  await aTimeout(0);
  return el;
}

function editable(el: FluidRichTextEditor): HTMLDivElement {
  return el.shadowRoot!.querySelector<HTMLDivElement>('[part="editable"]')!;
}

describe("<fluid-rich-text-editor>", () => {
  it("renders a toolbar with the toolbar role and an orientation", async () => {
    const el = await editor();
    const toolbar = el.shadowRoot!.querySelector('[part="toolbar"]')!;
    expect(toolbar.getAttribute("role")).to.equal("toolbar");
    expect(toolbar.getAttribute("aria-orientation")).to.equal("horizontal");
    expect(toolbar.getAttribute("aria-label")).to.be.a("string").and.not.empty;
  });

  it("exposes the editable region as a multi-line textbox named from label", async () => {
    const el = await fixture<FluidRichTextEditor>(
      html`<fluid-rich-text-editor label="My editor"></fluid-rich-text-editor>`
    );
    await elementUpdated(el);
    const ed = editable(el);
    expect(ed.getAttribute("role")).to.equal("textbox");
    expect(ed.getAttribute("aria-multiline")).to.equal("true");
    expect(ed.getAttribute("aria-label")).to.equal("My editor");
    expect(ed.getAttribute("contenteditable")).to.equal("true");
  });

  it("defaults the accessible name to 'Rich text editor'", async () => {
    const el = await editor();
    expect(editable(el).getAttribute("aria-label")).to.equal("Rich text editor");
  });

  it("uses roving tabindex: exactly one button is tabbable", async () => {
    const el = await editor();
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="button"]');
    const tabbable = [...buttons].filter((b) => b.getAttribute("tabindex") === "0");
    expect(tabbable.length).to.equal(1);
    expect(buttons[0]!.getAttribute("tabindex")).to.equal("0");
  });

  it("moves the active button with ArrowRight / Home / End", async () => {
    const el = await editor();
    const toolbar = el.shadowRoot!.querySelector('[part="toolbar"]')!;
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="button"]');
    toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await elementUpdated(el);
    expect(buttons[1]!.getAttribute("tabindex")).to.equal("0");
    toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await elementUpdated(el);
    expect(buttons[buttons.length - 1]!.getAttribute("tabindex")).to.equal("0");
    toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await elementUpdated(el);
    expect(buttons[0]!.getAttribute("tabindex")).to.equal("0");
  });

  it("gives toggle buttons aria-pressed and action buttons none", async () => {
    const el = await editor();
    const buttons = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="button"]');
    // Bold is a toggle.
    expect(buttons[0]!.getAttribute("aria-pressed")).to.equal("false");
    // Clear formatting (last) is an action.
    expect(buttons[buttons.length - 1]!.hasAttribute("aria-pressed")).to.equal(false);
  });

  it("reflects and updates the value property", async () => {
    const el = await editor();
    el.value = "<p>Hello</p>";
    await elementUpdated(el);
    expect(editable(el).innerHTML).to.equal("<p>Hello</p>");
    expect(el.value).to.equal("<p>Hello</p>");
  });

  it("emits fluid-change with the current HTML on input", async () => {
    const el = await editor();
    const ed = editable(el);
    ed.innerHTML = "<p>typed</p>";
    setTimeout(() => ed.dispatchEvent(new Event("input", { bubbles: true })));
    const ev = await oneEvent(el, "fluid-change");
    expect(ev.detail.value).to.equal("<p>typed</p>");
  });

  it("shows the placeholder via the data-placeholder attribute while empty", async () => {
    const el = await fixture<FluidRichTextEditor>(
      html`<fluid-rich-text-editor placeholder="Type here"></fluid-rich-text-editor>`
    );
    await elementUpdated(el);
    expect(editable(el).getAttribute("data-placeholder")).to.equal("Type here");
  });

  it("passes the a11y audit", async () => {
    const el = await fixture<FluidRichTextEditor>(html`
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
        <fluid-rich-text-editor label="Accessible editor"></fluid-rich-text-editor>
      </div>
    `);
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el.querySelector("fluid-rich-text-editor")!).to.be.accessible();
  });
});
