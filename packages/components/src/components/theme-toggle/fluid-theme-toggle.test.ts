import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidThemeToggle } from "./fluid-theme-toggle.js";

const A11Y_VARS = [
  "--fluid-surface-base:#ffffff",
  "--fluid-surface-muted:#f4f4f5",
  "--fluid-text-primary:#18181b",
  "--fluid-text-secondary:#3f3f46",
  "--fluid-border-default:#e4e4e7",
  "--fluid-accent-base:#4f46e5",
  "--fluid-accent-text:#ffffff",
  "--fluid-motion:0"
].join(";");

describe("<fluid-theme-toggle>", () => {
  beforeEach(() => {
    try {
      localStorage.removeItem("fluid-theme");
      localStorage.removeItem("fluid-brand");
    } catch {
      /* ignore */
    }
    document.documentElement.removeAttribute("data-fluid-theme");
    document.documentElement.removeAttribute("data-fluid-brand");
  });

  it("renders a theme button with aria-label and aria-pressed", async () => {
    const el = await fixture<FluidThemeToggle>(html`<fluid-theme-toggle></fluid-theme-toggle>`);
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="theme-button"]')!;
    expect(button).to.exist;
    expect(button.getAttribute("aria-label")).to.equal("Toggle dark mode");
    expect(button.getAttribute("aria-pressed")).to.equal("false");
  });

  it("flips data-fluid-theme and aria-pressed on click", async () => {
    const el = await fixture<FluidThemeToggle>(html`<fluid-theme-toggle></fluid-theme-toggle>`);
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="theme-button"]')!;
    button.click();
    await elementUpdated(el);
    expect(el.theme).to.equal("dark");
    expect(document.documentElement.getAttribute("data-fluid-theme")).to.equal("dark");
    expect(button.getAttribute("aria-pressed")).to.equal("true");
  });

  it("persists the choice to localStorage", async () => {
    const el = await fixture<FluidThemeToggle>(html`<fluid-theme-toggle></fluid-theme-toggle>`);
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="theme-button"]')!.click();
    await elementUpdated(el);
    expect(localStorage.getItem("fluid-theme")).to.equal("dark");
  });

  it("restores the saved theme on connect", async () => {
    localStorage.setItem("fluid-theme", "dark");
    const el = await fixture<FluidThemeToggle>(html`<fluid-theme-toggle></fluid-theme-toggle>`);
    expect(el.theme).to.equal("dark");
    expect(document.documentElement.getAttribute("data-fluid-theme")).to.equal("dark");
  });

  it("fires fluid-theme-change with the new theme", async () => {
    const el = await fixture<FluidThemeToggle>(html`<fluid-theme-toggle></fluid-theme-toggle>`);
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="theme-button"]')!;
    setTimeout(() => button.click());
    const event = await oneEvent(el, "fluid-theme-change");
    expect(event.detail.theme).to.equal("dark");
  });

  it("renders no brand button without brands", async () => {
    const el = await fixture<FluidThemeToggle>(html`<fluid-theme-toggle></fluid-theme-toggle>`);
    expect(el.shadowRoot!.querySelector('[part="brand-button"]')).to.be.null;
  });

  it("cycles data-fluid-brand when brands is set", async () => {
    const el = await fixture<FluidThemeToggle>(
      html`<fluid-theme-toggle .brands=${["", "midnight", "corporate"]}></fluid-theme-toggle>`
    );
    const brandButton = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="brand-button"]')!;
    expect(brandButton).to.exist;
    brandButton.click();
    await elementUpdated(el);
    expect(document.documentElement.getAttribute("data-fluid-brand")).to.equal("midnight");
    brandButton.click();
    await elementUpdated(el);
    expect(document.documentElement.getAttribute("data-fluid-brand")).to.equal("corporate");
  });

  it("passes a11y audit", async () => {
    const el = await fixture(html`
      <div
        style="${A11Y_VARS}"
      >
        <fluid-theme-toggle .brands=${["", "midnight"]}></fluid-theme-toggle>
      </div>
    `);
    const toggle = el.querySelector<FluidThemeToggle>("fluid-theme-toggle")!;
    await elementUpdated(toggle);
    await aTimeout(20);
    await expect(toggle).to.be.accessible();
  });
});
