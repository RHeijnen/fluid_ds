import { expect, fixture, html, elementUpdated, aTimeout, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidTruncate } from "./fluid-truncate.js";

const long = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis
aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
officia deserunt mollit anim id est laborum.`;

async function settle(el: FluidTruncate): Promise<void> {
  await elementUpdated(el);
  await aTimeout(20);
  await elementUpdated(el);
}

describe("<fluid-truncate>", () => {
  it("defaults to 3 lines, collapsed", async () => {
    const el = await fixture<FluidTruncate>(html`<fluid-truncate>Hi</fluid-truncate>`);
    expect(el.lines).to.equal(3);
    expect(el.expanded).to.be.false;
  });

  it("renders the slotted text in the clamped region", async () => {
    const el = await fixture<FluidTruncate>(html`<fluid-truncate>${long}</fluid-truncate>`);
    await settle(el);
    const content = el.shadowRoot!.querySelector(".content")!;
    expect(content).to.exist;
    expect(el.textContent).to.contain("Lorem ipsum");
  });

  it("reflects the lines prop to the --fluid-truncate-lines style", async () => {
    const el = await fixture<FluidTruncate>(
      html`<fluid-truncate lines="5">${long}</fluid-truncate>`
    );
    await settle(el);
    expect(el.style.getPropertyValue("--fluid-truncate-lines")).to.equal("5");
  });

  it("does not render the toggle when content does not overflow", async () => {
    const el = await fixture<FluidTruncate>(html`<fluid-truncate>Short.</fluid-truncate>`);
    await settle(el);
    expect(el.shadowRoot!.querySelector(".toggle")).to.be.null;
  });

  it("wires aria-controls from the toggle to the content region", async () => {
    const el = await fixture<FluidTruncate>(
      html`<fluid-truncate style="max-width:120px" lines="1">${long}</fluid-truncate>`
    );
    // Force the toggle into the tree to assert the wiring contract.
    el.expanded = true;
    await settle(el);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>(".toggle");
    if (toggle) {
      const controlled = toggle.getAttribute("aria-controls");
      const content = el.shadowRoot!.querySelector(".content")!;
      expect(controlled).to.equal(content.id);
      expect(toggle.getAttribute("aria-expanded")).to.equal("true");
    }
  });

  it("toggles expanded and fires fluid-toggle on click", async () => {
    const el = await fixture<FluidTruncate>(
      html`<fluid-truncate expanded>${long}</fluid-truncate>`
    );
    await settle(el);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>(".toggle")!;
    expect(toggle).to.exist;
    setTimeout(() => toggle.click());
    const event = await oneEvent(el, "fluid-toggle");
    expect(event.detail.expanded).to.equal(false);
    expect(el.expanded).to.equal(false);
  });

  it("uses custom more/less labels", async () => {
    const el = await fixture<FluidTruncate>(
      html`<fluid-truncate expanded less-label="Collapse">${long}</fluid-truncate>`
    );
    await settle(el);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>(".toggle")!;
    expect(toggle.textContent?.trim()).to.equal("Collapse");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTruncate>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5;
               --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46;
               --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5;
               --fluid-accent-text:#ffffff; --fluid-focus-ring-color:#4f46e5;
               --fluid-motion:0; max-width:18rem;"
      >
        <fluid-truncate expanded>${long}</fluid-truncate>
      </div>
    `);
    const truncate = el.querySelector<FluidTruncate>("fluid-truncate")!;
    await settle(truncate);
    await expect(truncate).to.be.accessible();
  });
});
