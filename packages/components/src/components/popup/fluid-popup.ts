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
} from "../../internal/position.js";
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
 * @summary Anchored floating element.
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

  /** Placement relative to the anchor. */
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
  private direction: "ltr" | "rtl" | undefined;
  private positionRequest = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.resolveAnchor();
    if (this.hasUpdated) {
      this.restartTracking();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanup?.();
    this.positionRequest += 1;
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
    if (
      changed.has("open") ||
      changed.has("placement") ||
      changed.has("distance") ||
      changed.has("skidding") ||
      changed.has("strategy") ||
      changed.has("matchWidth") ||
      changed.has("flip") ||
      changed.has("shift")
    ) {
      if (changed.has("matchWidth") && !this.matchWidth) {
        this.popupEl?.style.removeProperty("width");
      }
      this.restartTracking();
    }
    const direction = this.localize.dir;
    if (direction !== this.direction) {
      this.direction = direction;
      if (this.open) void this.reposition();
    }
  }

  private resolveAnchor(): void {
    if (this.anchorElement) {
      this.resolvedAnchor = this.anchorElement;
    } else if (this.anchorSelector) {
      this.resolvedAnchor = (
        this.getRootNode() as Document | ShadowRoot
      ).querySelector<HTMLElement>(this.anchorSelector);
    } else {
      const slotted = this.shadowRoot
        ?.querySelector<HTMLSlotElement>("slot[name='anchor']")
        ?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
      this.resolvedAnchor =
        slotted ?? this.querySelector<HTMLElement>(":scope > [slot='anchor']") ?? null;
    }
    this.active = this.resolvedAnchor !== null;
  }

  private handleAnchorChange(): void {
    this.resolveAnchor();
    this.restartTracking();
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
    const request = ++this.positionRequest;
    const anchor = this.resolvedAnchor;
    const popup = this.popupEl;
    const middleware = [offset({ mainAxis: this.distance, crossAxis: this.skidding })];
    if (this.flip) {
      middleware.push(flip());
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
    const { x, y, placement } = await computePosition(anchor, popup, {
      placement: this.placement,
      strategy: this.strategy,
      middleware
    });
    if (request !== this.positionRequest || anchor !== this.resolvedAnchor || !this.isConnected)
      return;
    Object.assign(popup.style, { left: `${x}px`, top: `${y}px` });
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
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>
      <div part="popup" class="popup">
        <slot></slot>
      </div>
    `;
  }
}
