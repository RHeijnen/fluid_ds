import { html, css, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

let truncateId = 0;

/**
 * Clamps slotted text to a fixed number of lines and reveals the rest with a
 * show-more / show-less toggle. The toggle is a real disclosure `<button>`:
 * its `aria-expanded` state controls the clamped region (`aria-controls`), and
 * it only renders when the content actually overflows, measured by comparing
 * the region's `scrollHeight` against its `clientHeight` via a `ResizeObserver`.
 *
 * Follows the WAI-ARIA Disclosure pattern:
 * <https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/>.
 *
 * @summary Line-clamped text with a show-more / show-less toggle.
 *
 * @slot - The text (or inline content) to clamp.
 *
 * @csspart base - The wrapping container.
 * @csspart content - The clamped region whose visibility the toggle controls.
 * @csspart toggle - The show-more / show-less disclosure button.
 *
 * @cssproperty --fluid-truncate-toggle-fg - Toggle button text color.
 *
 * @uses-token --fluid-accent-base - Default toggle text color.
 * @uses-token --fluid-focus-ring-color - Toggle focus ring color.
 * @uses-token --fluid-target-min - Minimum interactive target size.
 * @uses-token --fluid-focus-ring-width - Focus ring thickness.
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 *
 * @fires fluid-toggle - Dispatched when the user expands or collapses the
 *   content. `detail.expanded` is the new state.
 */
export class FluidTruncate extends FluidElement {
  static override styles = [
    css`
      :host {
        display: block;
        font-family: var(--fluid-font-family-sans);
        line-height: var(--fluid-font-line-height-normal, 1.5);
        color: inherit;
      }

      :host([hidden]) {
        display: none;
      }

      .content {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: var(--fluid-truncate-lines, 3);
        line-clamp: var(--fluid-truncate-lines, 3);
        overflow: hidden;
      }

      .content.expanded {
        display: block;
        -webkit-line-clamp: unset;
        line-clamp: unset;
        overflow: visible;
      }

      ::slotted(*) {
        margin: 0 !important;
      }

      .toggle {
        all: unset;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        margin-top: var(--fluid-space-1);
        padding: 0;
        min-height: max(24px, var(--fluid-target-min, 0px));
        font: inherit;
        font-weight: var(--fluid-font-weight-medium);
        color: var(--fluid-truncate-toggle-fg, var(--fluid-accent-base));
        cursor: pointer;
        border-radius: var(--fluid-radius-sm);
        text-decoration: underline;
        text-underline-offset: 2px;
        transition: opacity var(--fluid-duration-fast, 120ms) var(--fluid-easing-standard, ease);
      }

      .toggle:hover {
        opacity: 0.8;
      }

      .toggle:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-truncate-toggle-fg, var(--fluid-focus-ring-color, var(--fluid-accent-base)));
        outline-offset: var(--fluid-focus-ring-offset, 2px);
      }
    `,
    reducedMotion
  ];

  /** Number of lines to clamp to when collapsed. */
  @property({ type: Number, reflect: true }) lines = 3;

  /** Whether the content is currently expanded. Reflected. */
  @property({ type: Boolean, reflect: true }) expanded = false;

  /** Label for the expand action. */
  @property({ attribute: "more-label" }) moreLabel = "Show more";

  /** Label for the collapse action. */
  @property({ attribute: "less-label" }) lessLabel = "Show less";

  /** Whether the clamped content overflows its box (drives the toggle). */
  @state() private overflowing = false;

  @query(".content") private contentEl!: HTMLElement;

  private readonly contentId = `fluid-truncate-${++truncateId}`;
  private resizeObserver?: ResizeObserver;

  override connectedCallback(): void {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => this.measure());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  override firstUpdated(): void {
    if (this.contentEl && this.resizeObserver) {
      this.resizeObserver.observe(this.contentEl);
    }
    this.scheduleMeasure();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has("lines")) {
      this.style.setProperty("--fluid-truncate-lines", String(this.lines));
      this.scheduleMeasure();
    }
  }

  /**
   * Measure on the next frame, never synchronously inside the update cycle.
   * `measure()` writes the reactive `overflowing` state, so calling it during
   * `firstUpdated`/`updated` would schedule a second update and trip Lit's
   * change-in-update warning. Deferring runs it after the cycle settles.
   */
  private scheduleMeasure(): void {
    requestAnimationFrame(() => this.measure());
  }

  /** Compare the natural height against the clamped height. */
  private measure(): void {
    const el = this.contentEl;
    if (!el) return;
    if (this.expanded) {
      // While expanded the box is not clamped, so we cannot re-measure
      // overflow; keep the toggle visible so the user can collapse again.
      this.overflowing = true;
      return;
    }
    this.overflowing = el.scrollHeight - el.clientHeight > 1;
  }

  private toggle = (): void => {
    this.expanded = !this.expanded;
    this.dispatchEvent(
      new CustomEvent("fluid-toggle", {
        detail: { expanded: this.expanded },
        bubbles: true,
        composed: true
      })
    );
    // Re-measure on the next frame once the clamp has been re-applied.
    this.updateComplete.then(() => {
      if (!this.expanded) this.measure();
    });
  };

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <div
          part="content"
          id=${this.contentId}
          class="content ${this.expanded ? "expanded" : ""}"
        >
          <slot @slotchange=${() => this.measure()}></slot>
        </div>
        ${this.overflowing
          ? html`
              <button
                part="toggle"
                class="toggle"
                type="button"
                aria-expanded=${this.expanded ? "true" : "false"}
                aria-controls=${this.contentId}
                @click=${this.toggle}
              >
                ${this.expanded ? this.lessLabel : this.moreLabel}
              </button>
            `
          : ""}
      </div>
    `;
  }
}
