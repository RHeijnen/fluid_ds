import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
  type Placement
} from "@floating-ui/dom";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Low-level positioning primitive. Anchors one element ("the popup") to a
 * reference element ("the anchor") and keeps them positioned together as
 * the page scrolls or resizes.
 *
 * This is the building block underneath higher-level components like
 * `<fluid-popover>`, `<fluid-dropdown>`, and the listbox inside `<fluid-select>`.
 * Use it directly when you need precise positioning without the overlay
 * behavior of popover/dropdown.
 *
 * @summary Floating-ui-driven anchored element.
 *
 * @slot anchor - The reference element. Required.
 * @slot - The popup content.
 *
 * @csspart base - The outer container.
 * @csspart popup - The positioned popup element.
 *
 * @cssproperty --fluid-popup-z-index - Stacking layer.
 *
 * @fires fluid-reposition - Fired after each (re)positioning, with detail.placement
 *   reflecting the post-flip placement.
 */
export class FluidPopup extends FluidElement {
  static override styles = css`
    :host {
      display: contents;
    }

    .popup {
      position: fixed;
      top: 0;
      left: 0;
      z-index: var(--fluid-popup-z-index, 1000);
    }

    :host([active]:not([open])) .popup,
    :host(:not([active])) .popup {
      display: none;
    }
  `;

  @query(".popup") private popupEl!: HTMLElement;

  /** Whether the popup is currently active (mounted + positioned). */
  @property({ type: Boolean, reflect: true }) active = false;

  /**
   * Open vs. closed. Distinct from `active` because some consumers want to
   * KEEP the popup mounted (for animation) but hide it.
   */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Floating-ui placement. */
  @property() placement: Placement = "bottom-start";

  /** Distance in px between the anchor and the popup. */
  @property({ type: Number }) distance = 0;

  /** Cross-axis offset in px. */
  @property({ type: Number }) skidding = 0;

  /** Strategy, "fixed" lets the popup escape ancestor overflow clipping. */
  @property() strategy: "absolute" | "fixed" = "fixed";

  /** Whether the popup should match the anchor's width. */
  @property({ type: Boolean, attribute: "match-width" }) matchWidth = false;

  /** When true, `flip` middleware is enabled, popup flips to opposite side when out of view. */
  @property({ type: Boolean }) flip = true;

  /** When true, `shift` middleware is enabled, popup shifts in-bounds along the cross axis. */
  @property({ type: Boolean }) shift = true;

  /**
   * CSS selector of the anchor element, OR an HTMLElement reference passed as
   * a property. When neither is set, the first slotted element with
   * `slot="anchor"` is used.
   */
  @property({ attribute: "anchor" }) anchorSelector = "";

  /** Programmatically-set anchor (alternative to `anchor` attr or slot). */
  @property({ attribute: false }) anchorElement: HTMLElement | null = null;

  private cleanup?: () => void;
  private resolvedAnchor: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.active = true;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanup?.();
    this.active = false;
  }

  protected override firstUpdated(): void {
    this.resolveAnchor();
    this.startTracking();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("anchorSelector") || changed.has("anchorElement")) {
      this.resolveAnchor();
      this.restartTracking();
    }
    if (changed.has("open") || changed.has("placement") || changed.has("distance")) {
      this.restartTracking();
    }
  }

  private resolveAnchor(): void {
    if (this.anchorElement) {
      this.resolvedAnchor = this.anchorElement;
      return;
    }
    if (this.anchorSelector) {
      this.resolvedAnchor = (this.getRootNode() as Document | ShadowRoot).querySelector<HTMLElement>(
        this.anchorSelector
      );
      return;
    }
    const slotted = this.shadowRoot
      ?.querySelector<HTMLSlotElement>("slot[name='anchor']")
      ?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    this.resolvedAnchor = slotted ?? null;
  }

  private restartTracking(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    if (this.open) this.startTracking();
  }

  private startTracking(): void {
    if (!this.open || !this.resolvedAnchor || !this.popupEl) return;
    this.cleanup = autoUpdate(this.resolvedAnchor, this.popupEl, () => this.reposition());
    this.reposition();
  }

  private async reposition(): Promise<void> {
    if (!this.resolvedAnchor || !this.popupEl) return;
    const middleware = [
      offset({ mainAxis: this.distance, crossAxis: this.skidding })
    ];
    if (this.flip) {
      middleware.push(flip({ boundary: "clippingAncestors", rootBoundary: "viewport" }));
    }
    if (this.shift) {
      middleware.push(shift({ padding: 4 }));
    }
    if (this.matchWidth) {
      middleware.push(
        size({
          apply: ({ rects, elements }) => {
            elements.floating.style.width = `${rects.reference.width}px`;
          }
        })
      );
    }
    const { x, y, placement } = await computePosition(this.resolvedAnchor, this.popupEl, {
      placement: this.placement,
      strategy: this.strategy,
      middleware
    });
    Object.assign(this.popupEl.style, { left: `${x}px`, top: `${y}px` });
    this.dispatchEvent(
      new CustomEvent("fluid-reposition", {
        detail: { placement },
        bubbles: true,
        composed: true
      })
    );
  }

  /** Force a reposition. Call after the anchor or popup content changes. */
  reposition_(): void {
    void this.reposition();
  }

  override render(): TemplateResult {
    return html`
      <slot name="anchor" @slotchange=${() => this.resolveAnchor()}></slot>
      <div part="popup" class="popup">
        <slot></slot>
      </div>
    `;
  }
}
