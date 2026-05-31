import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidButton } from "./fluid-button.js";

describe("<fluid-button>", () => {
  it("renders with default variant and size", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button>Click</fluid-button>`);
    expect(el.variant).to.equal("primary");
    expect(el.size).to.equal("md");
    expect(el).shadowDom.to.equal(`
      <button
        class="button variant-primary size-md"
        part="base"
        type="button"
        aria-disabled="false"
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </button>
    `);
  });

  it("reflects variant and size attributes", async () => {
    const el = await fixture<FluidButton>(
      html`<fluid-button variant="ghost" size="lg">Hi</fluid-button>`
    );
    expect(el.getAttribute("variant")).to.equal("ghost");
    expect(el.getAttribute("size")).to.equal("lg");
  });

  it("fires fluid-click on activation", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button>Click</fluid-button>`);
    setTimeout(() => el.shadowRoot!.querySelector("button")!.click());
    const event = await oneEvent(el, "fluid-click");
    expect(event).to.exist;
    expect(event.bubbles).to.be.true;
    expect(event.composed).to.be.true;
  });

  it("does not fire fluid-click when disabled", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button disabled>Click</fluid-button>`);
    let fired = false;
    el.addEventListener("fluid-click", () => (fired = true));
    el.shadowRoot!.querySelector("button")!.click();
    expect(fired).to.be.false;
  });

  it("sets aria-disabled when disabled is set", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button>Click</fluid-button>`);
    expect(el.getAttribute("aria-disabled")).to.equal("false");
    el.disabled = true;
    await el.updateComplete;
    expect(el.getAttribute("aria-disabled")).to.equal("true");
  });

  it("passes basic accessibility audit", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button>Label</fluid-button>`);
    await expect(el).to.be.accessible();
  });

  /*
   * SC 2.5.8 Target Size (Minimum) [NEW in WCAG 2.2 AA]. Every size
   * variant, including sm, must hit 24×24 CSS px without depending
   * on label length or icon presence. min-block-size + min-inline-size
   * on the inner button enforce the floor.
   * https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
   */
  it("size=sm meets the 24×24 target-size minimum (SC 2.5.8)", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button size="sm">x</fluid-button>`);
    const inner = el.shadowRoot!.querySelector("button")!;
    const rect = inner.getBoundingClientRect();
    expect(rect.width).to.be.at.least(24);
    expect(rect.height).to.be.at.least(24);
  });

  /*
   * SC 4.1.2 Name, Role, Value. Icon-only buttons MUST carry an
   * aria-label on the host that's forwarded to the inner <button>.
   * Without forwarding, the slotted decorative icon leaves the
   * button effectively unlabelled.
   */
  it("forwards aria-label to the inner button (SC 4.1.2)", async () => {
    const el = await fixture<FluidButton>(
      html`<fluid-button aria-label="More options"></fluid-button>`
    );
    const inner = el.shadowRoot!.querySelector("button")!;
    expect(inner.getAttribute("aria-label")).to.equal("More options");
  });

  /*
   * delegatesFocus: true means calling .focus() on the host forwards
   * to the inner native <button>. Without it, host.focus() no-ops and
   * keyboard users land on nothing.
   */
  it("delegates focus from the host to the inner button", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button>Hi</fluid-button>`);
    const inner = el.shadowRoot!.querySelector("button")!;
    el.focus();
    expect(el.shadowRoot!.activeElement).to.equal(inner);
  });

  /*
   * Slotted-label typography must NOT inherit the host page's line-height.
   * The label lives in the light DOM, so a prose context with a large
   * line-height (e.g. Starlight docs at 1.75) would otherwise balloon the
   * button height. :host pins line-height so the button stays compact
   * regardless of surrounding page CSS. Regression for the docs-vs-
   * Storybook height mismatch.
   */
  it("ignores an inherited prose line-height (stays compact)", async () => {
    const wrap = await fixture<HTMLElement>(
      html`<div style="line-height: 2.5; font-size: 16px;">
        <fluid-button>
          <fluid-icon slot="prefix" name="download"></fluid-icon>
          Download
        </fluid-button>
      </div>`
    );
    const el = wrap.querySelector("fluid-button") as FluidButton;
    await el.updateComplete;
    const inner = el.shadowRoot!.querySelector("button")!;
    // A md button with tight line-height + 8px block padding lands well
    // under 40px. Pre-fix, inheriting line-height:2.5 pushed it past 44.
    expect(inner.getBoundingClientRect().height).to.be.lessThan(40);
  });

  /*
   * Markdown / MDX wraps loose label text in a <p> with prose margins.
   * As a flex item, that <p>'s margin grows the button to its margin-box
   *, which is exactly why the docs button ballooned to ~48px while
   * Storybook (raw text node) stayed ~33px. ::slotted(*) { margin: 0 }
   * must neutralize it. Regression for the docs-vs-Storybook mismatch.
   */
  it("ignores margins on a slotted block label (e.g. MDX <p>)", async () => {
    const el = await fixture<FluidButton>(
      html`<fluid-button><p style="margin: 1em 0;">Save changes</p></fluid-button>`
    );
    await el.updateComplete;
    const inner = el.shadowRoot!.querySelector("button")!;
    expect(inner.getBoundingClientRect().height).to.be.lessThan(40);
  });

  /*
   * Tone resolution. Explicit `tone` always wins; without one, primary
   * resolves to "brand" and secondary / ghost resolve to "neutral" so
   * existing markup keeps its visual identity (this is the contract
   * the visual change docs are based on).
   */
  it("explicit tone reflects to data-tone", async () => {
    const el = await fixture<FluidButton>(
      html`<fluid-button tone="danger">Delete</fluid-button>`
    );
    expect(el.dataset.tone).to.equal("danger");
  });

  it("defaults to brand tone on primary, neutral on secondary/ghost", async () => {
    const primary = await fixture<FluidButton>(html`<fluid-button>P</fluid-button>`);
    expect(primary.dataset.tone).to.equal("brand");
    const secondary = await fixture<FluidButton>(
      html`<fluid-button variant="secondary">S</fluid-button>`
    );
    expect(secondary.dataset.tone).to.equal("neutral");
    const ghost = await fixture<FluidButton>(
      html`<fluid-button variant="ghost">G</fluid-button>`
    );
    expect(ghost.dataset.tone).to.equal("neutral");
  });

  it("setting tone after construction updates data-tone", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button>Hi</fluid-button>`);
    expect(el.dataset.tone).to.equal("brand");
    el.tone = "success";
    await el.updateComplete;
    expect(el.dataset.tone).to.equal("success");
    el.tone = undefined;
    el.variant = "ghost";
    await el.updateComplete;
    expect(el.dataset.tone).to.equal("neutral");
  });

  /* Loading state, spinner, aria-busy, blocks activation but stays focusable. */
  it("loading: spinner + aria-busy, blocks clicks, stays focusable, name stable", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button loading>Save</fluid-button>`);
    const inner = el.shadowRoot!.querySelector("button")!;
    expect(inner.getAttribute("aria-busy")).to.equal("true");
    expect(inner.getAttribute("aria-disabled")).to.equal("true");
    // aria-disabled, NOT native disabled, must stay focusable.
    expect(inner.hasAttribute("disabled")).to.be.false;
    expect(el.shadowRoot!.querySelector(".spinner")).to.exist;
    let fired = false;
    el.addEventListener("fluid-click", () => (fired = true));
    inner.click();
    expect(fired).to.be.false;
    // label stays in the DOM → accessible name unchanged (SC 2.5.3)
    expect(el.textContent!.trim()).to.equal("Save");
  });

  /* Toggle button, aria-pressed reflects + flips, fires fluid-change. */
  it("toggle: reflects aria-pressed and flips on activation", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button toggle>Mute</fluid-button>`);
    const inner = el.shadowRoot!.querySelector("button")!;
    expect(inner.getAttribute("aria-pressed")).to.equal("false");
    let detail: { pressed: boolean } | null = null;
    el.addEventListener("fluid-change", (e) => (detail = (e as CustomEvent).detail));
    inner.click();
    await el.updateComplete;
    expect(el.pressed).to.be.true;
    expect(inner.getAttribute("aria-pressed")).to.equal("true");
    expect(detail).to.deep.equal({ pressed: true });
  });

  it("non-toggle buttons do not expose aria-pressed", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button>Go</fluid-button>`);
    expect(el.shadowRoot!.querySelector("button")!.hasAttribute("aria-pressed")).to.be
      .false;
  });

  /* Caret, built-in dropdown chevron. */
  it("caret: renders the chevron part; a label-less caret is icon-only", async () => {
    const labelled = await fixture<FluidButton>(
      html`<fluid-button caret>Menu</fluid-button>`
    );
    expect(labelled.shadowRoot!.querySelector(".caret")).to.exist;
    expect(
      labelled.shadowRoot!.querySelector("button")!.classList.contains("icon-only")
    ).to.be.false;

    const caretOnly = await fixture<FluidButton>(
      html`<fluid-button caret aria-label="More"></fluid-button>`
    );
    await caretOnly.updateComplete;
    expect(
      caretOnly.shadowRoot!.querySelector("button")!.classList.contains("icon-only")
    ).to.be.true;
  });

  it("does not render a caret by default", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button>Plain</fluid-button>`);
    expect(el.shadowRoot!.querySelector(".caret")).to.not.exist;
  });

  /*
   * A <fluid-dropdown> stamps aria-haspopup / aria-expanded / aria-controls on
   * the host trigger. The button forwards them to the inner native button:
   * the element that actually carries the button role (SC 4.1.2).
   */
  it("forwards host-level aria-haspopup/expanded/controls to the inner button", async () => {
    const el = await fixture<FluidButton>(html`<fluid-button caret>Trigger</fluid-button>`);
    el.setAttribute("aria-haspopup", "menu");
    el.setAttribute("aria-expanded", "true");
    el.setAttribute("aria-controls", "menu-1");
    // MutationObserver → requestUpdate is async; let the re-render settle.
    await el.updateComplete;
    await el.updateComplete;
    const inner = el.shadowRoot!.querySelector("button")!;
    expect(inner.getAttribute("aria-haspopup")).to.equal("menu");
    expect(inner.getAttribute("aria-expanded")).to.equal("true");
    expect(inner.getAttribute("aria-controls")).to.equal("menu-1");
  });
});
