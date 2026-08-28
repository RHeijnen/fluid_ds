import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidToolbar } from "./fluid-toolbar.js";

const press = (el: Element, key: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true }));

describe("<fluid-toolbar>", () => {
  it("exposes role=toolbar on the base part", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="Actions">
        <button>One</button>
        <button>Two</button>
      </fluid-toolbar>
    `);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute("role")).to.equal("toolbar");
  });

  it("forwards aria-label onto the toolbar role element", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="Text formatting">
        <button>One</button>
      </fluid-toolbar>
    `);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute("aria-label")).to.equal("Text formatting");
  });

  it("reflects orientation to aria-orientation (horizontal default)", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A"><button>One</button></fluid-toolbar>
    `);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(el.orientation).to.equal("horizontal");
    expect(base.getAttribute("aria-orientation")).to.equal("horizontal");
  });

  it("reflects vertical orientation to aria-orientation", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar orientation="vertical" aria-label="A">
        <button>One</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute("aria-orientation")).to.equal("vertical");
    expect(el.getAttribute("orientation")).to.equal("vertical");
  });

  it("makes the toolbar a single tab stop (roving tabindex)", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const buttons = Array.from(el.querySelectorAll("button"));
    expect(buttons[0]!.tabIndex).to.equal(0);
    expect(buttons[1]!.tabIndex).to.equal(-1);
    expect(buttons[2]!.tabIndex).to.equal(-1);
  });

  it("ArrowRight moves the tab stop forward (horizontal)", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button>Two</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[0]!.focus();
    press(buttons[0]!, "ArrowRight");
    expect(buttons[1]!.tabIndex).to.equal(0);
    expect(buttons[0]!.tabIndex).to.equal(-1);
    expect(el.shadowRoot!.activeElement ?? document.activeElement).to.exist;
  });

  it("ArrowRight wraps from last to first", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button>Two</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[1]!.focus();
    press(buttons[1]!, "ArrowRight");
    expect(buttons[0]!.tabIndex).to.equal(0);
  });

  it("ArrowLeft wraps from first to last", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button>Two</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[0]!.focus();
    press(buttons[0]!, "ArrowLeft");
    expect(buttons[1]!.tabIndex).to.equal(0);
  });

  it("uses Up/Down arrows when vertical", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar orientation="vertical" aria-label="A">
        <button>One</button>
        <button>Two</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[0]!.focus();
    press(buttons[0]!, "ArrowDown");
    expect(buttons[1]!.tabIndex).to.equal(0);
    press(buttons[1]!, "ArrowUp");
    expect(buttons[0]!.tabIndex).to.equal(0);
  });

  it("Home and End jump to the ends", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[0]!.focus();
    press(buttons[0]!, "End");
    expect(buttons[2]!.tabIndex).to.equal(0);
    press(buttons[2]!, "Home");
    expect(buttons[0]!.tabIndex).to.equal(0);
  });

  it("skips disabled controls when roving", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button disabled>Two</button>
        <button>Three</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const buttons = Array.from(el.querySelectorAll("button"));
    // Disabled control is never in the tab order.
    expect(buttons[1]!.tabIndex).to.not.equal(0);
    buttons[0]!.focus();
    press(buttons[0]!, "ArrowRight");
    expect(buttons[2]!.tabIndex).to.equal(0);
  });

  it("moves the tab stop when the active control becomes aria-disabled", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </fluid-toolbar>
    `);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[1]!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(buttons[1]!.tabIndex).to.equal(0);

    buttons[1]!.setAttribute("aria-disabled", "true");
    await aTimeout(0);

    expect(buttons[0]!.tabIndex).to.equal(0);
    expect(buttons[1]!.tabIndex).to.equal(-1);
    expect(buttons[2]!.tabIndex).to.equal(-1);
  });

  it("preserves the active tab stop across dynamic membership changes", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button>Two</button>
      </fluid-toolbar>
    `);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[1]!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    const added = document.createElement("button");
    added.textContent = "Three";
    el.prepend(added);
    await aTimeout(0);

    expect(buttons[1]!.tabIndex).to.equal(0);
    expect(added.tabIndex).to.equal(-1);

    buttons[1]!.remove();
    await aTimeout(0);

    expect(added.tabIndex).to.equal(0);
    expect(buttons[0]!.tabIndex).to.equal(-1);
  });

  it("rebuilds roving state after reconnect and skips controls disabled while detached", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button>Two</button>
      </fluid-toolbar>
    `);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[1]!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    el.remove();
    buttons[1]!.disabled = true;
    document.body.append(el);
    await aTimeout(0);

    expect(buttons[0]!.tabIndex).to.equal(0);
    expect(buttons[1]!.tabIndex).to.equal(-1);
  });

  it("manages every nested control rather than only the first control in a wrapper", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="Search actions">
        <span>
          <input aria-label="Query" />
          <button>Clear</button>
        </span>
        <button>Submit</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const input = el.querySelector("input")!;
    const buttons = Array.from(el.querySelectorAll("button"));

    expect([input.tabIndex, ...buttons.map((button) => button.tabIndex)]).to.deep.equal([
      0, -1, -1
    ]);
    input.focus();
    press(input, "ArrowRight");
    expect(buttons[0]!.tabIndex).to.equal(0);
    press(buttons[0]!, "ArrowRight");
    expect(buttons[1]!.tabIndex).to.equal(0);
  });

  it("uses inherited RTL direction for horizontal arrow navigation", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div dir="rtl">
        <fluid-toolbar aria-label="Actions">
          <button data-key="one">One</button>
          <button data-key="two">Two</button>
          <button data-key="three">Three</button>
        </fluid-toolbar>
      </div>
    `);
    const el = wrapper.querySelector<FluidToolbar>("fluid-toolbar")!;
    await elementUpdated(el);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[1]!.focus();

    press(buttons[1]!, "ArrowRight");
    expect(buttons.find((button) => button.tabIndex === 0)?.dataset.key).to.equal("one");
    press(buttons[0]!, "ArrowLeft");
    expect(buttons.find((button) => button.tabIndex === 0)?.dataset.key).to.equal("two");
  });

  it("makes the focused control the tab stop on focusin", async () => {
    const el = await fixture<FluidToolbar>(html`
      <fluid-toolbar aria-label="A">
        <button>One</button>
        <button>Two</button>
      </fluid-toolbar>
    `);
    await elementUpdated(el);
    const buttons = Array.from(el.querySelectorAll("button"));
    buttons[1]!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(buttons[1]!.tabIndex).to.equal(0);
    expect(buttons[0]!.tabIndex).to.equal(-1);
  });

  it("passes a11y audit", async () => {
    const el = await fixture(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff;"
      >
        <fluid-toolbar aria-label="Formatting">
          <button>Bold</button>
          <button>Italic</button>
          <button>Underline</button>
        </fluid-toolbar>
      </div>
    `);
    const toolbar = el.querySelector<FluidToolbar>("fluid-toolbar")!;
    await elementUpdated(toolbar);
    await aTimeout(20);
    await expect(toolbar).to.be.accessible();
  });
});
