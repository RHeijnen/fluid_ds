import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";
import type { FluidSegment } from "./fluid-segment.js";

/**
 * A horizontal pill-style group of mutually exclusive options.
 *
 * Implements the WAI-ARIA radiogroup pattern over `<fluid-segment>` children.
 *
 * @summary Switch between a small number of related options.
 *
 * @slot - One or more `<fluid-segment>` elements.
 *
 * @csspart base - The outer container.
 *
 * @cssproperty --fluid-segmented-bg - Background of the track. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-segmented-radius - Track corner radius. Falls back to --fluid-radius-lg.
 * @cssproperty --fluid-segmented-gap - Gap between segments. Falls back to --fluid-space-1.
 * @cssproperty --fluid-segmented-thumb-bg - The sliding active-thumb fill. Falls back to --fluid-surface-base.
 * @cssproperty [--fluid-segmented-thumb-duration=var(--fluid-duration-normal)] - Thumb slide duration (scaled by --fluid-motion).
 * @cssproperty [--fluid-segmented-thumb-easing=var(--fluid-easing-emphasized)] - Thumb slide easing.
 *
 * @csspart thumb - The sliding indicator behind the active segment.
 *
 * @uses-token --fluid-surface-muted - Default track background.
 * @uses-token --fluid-surface-base - Default thumb fill.
 * @uses-token --fluid-radius-lg - Default track corner radius.
 * @uses-token --fluid-space-1 - Default gap between segments.
 *
 * @fires fluid-change - Fired when the value changes. `event.detail.value`.
 * @cssproperty --fluid-segmented-control-shadow-sm - Component override for the corresponding semantic token.
 * @cssproperty --fluid-segmented-control-surface-base - Component override for the corresponding semantic token.
 * @cssproperty --fluid-segmented-control-surface-muted - Component override for the corresponding semantic token.
 */
export class FluidSegmentedControl extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: inline-flex;
      }

      .base {
        position: relative;
        display: inline-flex;
        gap: var(--fluid-segmented-gap, var(--fluid-space-1));
        padding: var(--fluid-space-1);
        background: var(
          --fluid-segmented-bg,
          var(--fluid-segmented-control-surface-muted, var(--fluid-surface-muted))
        );
        border-radius: var(--fluid-segmented-radius, var(--fluid-radius-lg));
      }

      /* Sliding active indicator. Positioned over the selected segment via
       JS-measured custom props; the segments render transparent and sit above
       it (z-index) so only this thumb provides the "raised" selected surface. */
      .thumb {
        position: absolute;
        top: 0;
        left: 0;
        width: var(--_seg-w, 0);
        height: var(--_seg-h, 0);
        transform: translate(var(--_seg-x, 0), var(--_seg-y, 0));
        background: var(
          --fluid-segmented-thumb-bg,
          var(--fluid-segmented-control-surface-base, var(--fluid-surface-base))
        );
        border-radius: var(--fluid-segment-radius, var(--fluid-radius-md));
        box-shadow: var(--fluid-segmented-control-shadow-sm, var(--fluid-shadow-sm));
        opacity: 0;
        pointer-events: none;
        transition:
          transform
            calc(
              var(--fluid-segmented-thumb-duration, var(--fluid-duration-normal)) *
                var(--fluid-motion, 1)
            )
            var(--fluid-segmented-thumb-easing, var(--fluid-easing-emphasized)),
          width
            calc(
              var(--fluid-segmented-thumb-duration, var(--fluid-duration-normal)) *
                var(--fluid-motion, 1)
            )
            var(--fluid-segmented-thumb-easing, var(--fluid-easing-emphasized)),
          height
            calc(
              var(--fluid-segmented-thumb-duration, var(--fluid-duration-normal)) *
                var(--fluid-motion, 1)
            )
            var(--fluid-segmented-thumb-easing, var(--fluid-easing-emphasized));
      }
      .thumb.ready {
        opacity: 1;
      }
      /* First positioning must not slide in from 0,0. */
      .thumb.no-anim {
        transition: none;
      }
      ::slotted(fluid-segment) {
        position: relative;
        z-index: 1;
      }
    `
  ];

  /** Currently selected value. */
  @property() value = "";

  /** Accessible label for the group. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @query(".base") private baseEl!: HTMLElement;
  @query(".thumb") private thumbEl!: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private segmentObserver?: MutationObserver;
  /**
   * True for one tick right after the value changes. If a resize lands in the
   * same tick (e.g. a consumer rewrites spacing tokens this control's own
   * padding/gap read, so selecting an option also resizes the control), the
   * resize-driven reposition animates instead of snapping, so the thumb still
   * slides to its new spot. Pure resizes (no selection change) still snap.
   */
  private valueChangePending = false;
  private valueChangeTimer?: ReturnType<typeof setTimeout>;
  /**
   * True only when `value` was changed by a user gesture (click / keyboard).
   * Guards the `fluid-change` dispatch so auto-seeding the default value on
   * first render does not emit a change the user never made.
   */
  private userInitiated = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.listen(this, "keydown", this.handleKeyDown);
    if (typeof MutationObserver !== "undefined") {
      this.segmentObserver?.disconnect();
      this.segmentObserver = new MutationObserver(() => this.reconcileSegments());
      this.segmentObserver.observe(this, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "value"]
      });
    }
    this.reconcileSegments();
    this.resizeObserver?.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.segmentObserver?.disconnect();
    clearTimeout(this.valueChangeTimer);
  }

  protected override firstUpdated(): void {
    this.syncSelection();
    // Position the thumb after first layout, without sliding from 0,0.
    requestAnimationFrame(() => this.positionThumb(false));
    // On resize, snap (don't slide) UNLESS a selection just changed this tick.
    this.resizeObserver = new ResizeObserver(() => this.positionThumb(this.valueChangePending));
    this.resizeObserver.observe(this);
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.syncSelection();
      // Mark the selection change so a coincident resize animates too. Cleared
      // on the next task (after this frame's ResizeObserver delivery + paint).
      this.valueChangePending = true;
      clearTimeout(this.valueChangeTimer);
      this.valueChangeTimer = setTimeout(() => (this.valueChangePending = false), 0);
      this.positionThumb(true);
      // Only emit for user-initiated changes. Auto-seeding the default value in
      // syncSelection() also lands here, but the user never made that choice.
      if (this.userInitiated) {
        this.userInitiated = false;
        this.dispatchEvent(
          new CustomEvent("fluid-change", {
            detail: { value: this.value },
            bubbles: true,
            composed: true
          })
        );
      }
    }
  }

  /**
   * Move the sliding thumb over the selected segment. Measured with
   * getBoundingClientRect (works across the shadow boundary, unlike offsetLeft).
   * When `animate` is false (first paint / resize) the transition is suppressed
   * so the thumb snaps into place instead of sliding from the corner.
   */
  private positionThumb(animate: boolean): void {
    const base = this.baseEl;
    const thumb = this.thumbEl;
    if (!base || !thumb) return;
    const seg = this.getSegments().find((s) => s.value === this.value);
    if (!seg) {
      thumb.classList.remove("ready");
      return;
    }
    const b = base.getBoundingClientRect();
    const s = seg.getBoundingClientRect();
    if (!animate) thumb.classList.add("no-anim");
    thumb.style.setProperty("--_seg-x", `${s.left - b.left}px`);
    thumb.style.setProperty("--_seg-y", `${s.top - b.top}px`);
    thumb.style.setProperty("--_seg-w", `${s.width}px`);
    thumb.style.setProperty("--_seg-h", `${s.height}px`);
    thumb.classList.add("ready");
    if (!animate) {
      void thumb.offsetWidth; // flush the snap before re-enabling transitions
      requestAnimationFrame(() => thumb.classList.remove("no-anim"));
    }
  }

  private getSegments(): FluidSegment[] {
    return Array.from(this.querySelectorAll("fluid-segment")) as FluidSegment[];
  }

  private syncSelection(): void {
    const segments = this.getSegments();
    const selected = segments.find((segment) => segment.value === this.value && !segment.disabled);
    if (!selected) {
      this.value = segments.find((segment) => !segment.disabled)?.value ?? "";
    }
    for (const seg of segments) {
      seg.selected = !seg.disabled && seg.value === this.value;
    }
  }

  private reconcileSegments(): void {
    this.syncSelection();
    this.positionThumb(false);
  }

  private handleClick = (e: Event) => {
    const seg = (e.target as HTMLElement).closest("fluid-segment") as FluidSegment | null;
    if (!seg || seg.disabled) return;
    if (seg.value !== this.value) this.userInitiated = true;
    this.value = seg.value;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const segments = this.getSegments().filter((s) => !s.disabled);
    if (!segments.length) return;
    const currentIndex = segments.findIndex((s) => s.value === this.value);
    let next = currentIndex;
    switch (e.key) {
      case "ArrowRight":
        next = (currentIndex + (this.isRtl ? -1 : 1) + segments.length) % segments.length;
        break;
      case "ArrowLeft":
        next = (currentIndex + (this.isRtl ? 1 : -1) + segments.length) % segments.length;
        break;
      case "ArrowDown":
        next = (currentIndex + 1) % segments.length;
        break;
      case "ArrowUp":
        next = (currentIndex - 1 + segments.length) % segments.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = segments.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    if (segments[next]!.value !== this.value) this.userInitiated = true;
    this.value = segments[next]!.value;
    segments[next]!.focus();
  };

  private handleSlotChange = () => this.reconcileSegments();

  override render(): TemplateResult {
    return html`
      <div
        part="base"
        class="base"
        role="radiogroup"
        aria-label=${ifDefined(this.ariaLabel ?? undefined)}
        @click=${this.handleClick}
      >
        <div class="thumb no-anim" part="thumb" aria-hidden="true"></div>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}
