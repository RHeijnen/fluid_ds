import { html, css, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Two-pane resizable split. Drag the divider between the panels (or use
 * arrow keys when focused) to resize. The position is expressed as a
 * percentage from the start edge.
 *
 * Set `orientation="vertical"` to stack panels with a horizontal divider.
 *
 * @summary Resizable two-pane split layout.
 *
 * @slot start - The first panel (left in horizontal, top in vertical).
 * @slot end - The second panel.
 *
 * @csspart base - Container.
 * @csspart panel - Each panel wrapper.
 * @csspart divider - The draggable divider handle.
 *
 * @cssproperty --fluid-split-divider-size - Divider thickness.
 * @cssproperty --fluid-split-divider-color - Divider color.
 * @cssproperty --fluid-split-divider-active-color - Divider color on hover / drag.
 * @cssproperty --fluid-split-divider-focus-ring - Focus ring color on the divider.
 *
 * @uses-token --fluid-border-default - Default divider color.
 * @uses-token --fluid-focus-ring-color - Focus ring on the divider.
 *
 * @fires fluid-reposition - Fired whenever the split changes (pointer drag or keyboard); detail = { position }.
 * @cssproperty --fluid-split-panel-accent-base - Component override for the corresponding semantic token.
 * @cssproperty --fluid-split-panel-border-default - Component override for the corresponding semantic token.
 * @cssproperty --fluid-split-panel-border-strong - Component override for the corresponding semantic token.
 * @cssproperty --fluid-split-panel-focus-ring-color - Component override for the corresponding semantic token.
 */
export class FluidSplitPanel extends FluidElement {
  static override styles = css`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
      min-height: 8rem;
    }

    :host([orientation="vertical"]) {
      flex-direction: column;
    }

    .panel {
      overflow: auto;
      flex-shrink: 0;
    }

    .divider {
      flex: 0 0 var(--fluid-split-divider-size, 4px);
      background: var(--fluid-split-divider-color, var(--fluid-split-panel-border-default, var(--fluid-border-default)));
      cursor: col-resize;
      touch-action: none;
      transition: background
        calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease;
      position: relative;
    }
    :host([orientation="vertical"]) .divider {
      cursor: row-resize;
    }
    .divider:hover,
    .divider[data-dragging] {
      background: var(--fluid-split-divider-active-color, var(--fluid-split-panel-accent-base, var(--fluid-accent-base, var(--fluid-border-strong)))der-strong, var(--fluid-split-panel-border-strong, var(--fluid-border-strong)))));
    }
    .divider:focus-visible {
      outline: 2px solid var(--fluid-split-divider-focus-ring, var(--fluid-split-panel-focus-ring-color, var(--fluid-focus-ring-color)));
      outline-offset: 1px;
    }

    :host([disabled]) .divider {
      cursor: default;
      pointer-events: none;
      opacity: 0.5;
    }
  `;

  /** Position of the divider, in percent from the start edge (0–100). */
  @property({ type: Number, reflect: true }) position = 50;

  /** Orientation. */
  @property({ reflect: true }) orientation: "horizontal" | "vertical" = "horizontal";

  /** Disable resizing. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Min position percent. */
  @property({ type: Number, attribute: "min-position" }) minPosition = 0;

  /** Max position percent. */
  @property({ type: Number, attribute: "max-position" }) maxPosition = 100;

  /** Accessible name for the divider, announced by screen readers. */
  @property()
  get label(): string {
    return this.labelOverride ?? this.term("resizePanels");
  }
  set label(value: string | null) {
    this.labelOverride = value;
  }
  private labelOverride: string | null = null;

  @query(".divider") private divider!: HTMLDivElement;

  @state() private dragging = false;

  private clamp(p: number) {
    return Math.min(this.maxPosition, Math.max(this.minPosition, p));
  }

  /**
   * Clamp, assign, and (only when the value actually changes) fire
   * `fluid-reposition`. Shared by the pointer-drag and keyboard paths so both
   * emit the event, as the docs promise.
   */
  private setPosition(next: number) {
    const clamped = this.clamp(next);
    if (clamped === this.position) return;
    this.position = clamped;
    this.dispatchEvent(
      new CustomEvent("fluid-reposition", {
        detail: { position: clamped },
        bubbles: true,
        composed: true
      })
    );
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.disabled) return;
    this.dragging = true;
    this.divider.setPointerCapture(e.pointerId);
    this.divider.setAttribute("data-dragging", "");
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const rect = this.getBoundingClientRect();
    const pct =
      this.orientation === "vertical"
        ? ((e.clientY - rect.top) / rect.height) * 100
        : ((e.clientX - rect.left) / rect.width) * 100;
    this.setPosition(pct);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.divider.hasPointerCapture(e.pointerId))
      this.divider.releasePointerCapture(e.pointerId);
    this.divider.removeAttribute("data-dragging");
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    const step = e.shiftKey ? 10 : 1;
    const decrement = this.orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const increment = this.orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    if (e.key === decrement) {
      e.preventDefault();
      this.setPosition(this.position - step);
    } else if (e.key === increment) {
      e.preventDefault();
      this.setPosition(this.position + step);
    } else if (e.key === "Home") {
      e.preventDefault();
      this.setPosition(this.minPosition);
    } else if (e.key === "End") {
      e.preventDefault();
      this.setPosition(this.maxPosition);
    }
  };

  override render(): TemplateResult {
    const startSize = `${this.position}%`;
    const endSize = `${100 - this.position}%`;
    const sizeProp = this.orientation === "vertical" ? "height" : "width";
    return html`
      <div part="panel" class="panel start" style="${sizeProp}: ${startSize}">
        <slot name="start"></slot>
      </div>
      <div
        part="divider"
        class="divider"
        role="separator"
        tabindex=${this.disabled ? -1 : 0}
        aria-label=${this.label}
        aria-orientation=${this.orientation === "vertical" ? "horizontal" : "vertical"}
        aria-valuemin=${this.minPosition}
        aria-valuemax=${this.maxPosition}
        aria-valuenow=${this.position}
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @keydown=${this.onKeyDown}
      ></div>
      <div part="panel" class="panel end" style="${sizeProp}: ${endSize}">
        <slot name="end"></slot>
      </div>
    `;
  }
}
