import { html, css, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Before/after image comparison. Provide two equally-sized images (or any
 * content) in the `before` and `after` slots. The user drags a divider
 * across the viewport to reveal more or less of the "after" image.
 *
 * The divider supports keyboard control when focused (arrow keys to
 * move 1%, shift+arrow for 10%).
 *
 * @summary Before/after comparison slider.
 *
 * @slot before - The "before" content (shown on the left/start side).
 * @slot after - The "after" content (shown on the right/end side, revealed by drag).
 * @slot handle - Override the default drag handle.
 *
 * @csspart base - The container.
 * @csspart before - The before pane.
 * @csspart after - The after pane.
 * @csspart divider - The vertical divider line.
 * @csspart handle - The draggable handle.
 *
 * @cssproperty --fluid-comparison-divider-color - Divider line color.
 * @cssproperty --fluid-comparison-handle-bg - Handle background.
 * @cssproperty --fluid-comparison-handle-fg - Handle icon color.
 * @cssproperty --fluid-comparison-focus-ring - Focus ring color.
 *
 * @uses-token --fluid-color-primary - Default divider color.
 * @uses-token --fluid-surface-base - Default handle background.
 * @uses-token --fluid-focus-ring-color - Focus ring.
 *
 * @fires fluid-position-change - Fired during drag; detail = { position }.
 */
export class FluidComparison extends FluidElement {
  static override styles = css`
    :host {
      position: relative;
      display: block;
      overflow: hidden;
      width: 100%;
      user-select: none;
      touch-action: pan-y;
      --_pos: 50;
    }

    .pane {
      position: relative;
      width: 100%;
    }

    /*
     * The "after" pane sits at exactly the same size as "before" and is
     * masked by clip-path. This keeps the after image at its NATURAL size
     * (so it lines up pixel-for-pixel with before) and only hides the
     * portion to the right of the divider, the previous width-clipping
     * approach was actually squashing the image, producing a diagonal-looking
     * boundary.
     */
    .after {
      position: absolute;
      inset: 0;
      clip-path: inset(0 calc(100% - var(--_pos) * 1%) 0 0);
    }

    .divider {
      position: absolute;
      top: 0;
      bottom: 0;
      left: calc(var(--_pos) * 1%);
      width: 2px;
      background: var(--fluid-comparison-divider-color, var(--fluid-color-primary));
      transform: translateX(-1px);
      pointer-events: none;
    }

    .handle {
      position: absolute;
      top: 50%;
      left: calc(var(--_pos) * 1%);
      transform: translate(-50%, -50%);
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: var(--fluid-comparison-handle-bg, var(--fluid-surface-base));
      border: 2px solid var(--fluid-comparison-divider-color, var(--fluid-color-primary));
      cursor: ew-resize;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--fluid-comparison-handle-fg, var(--fluid-color-primary));
      box-shadow: var(--fluid-shadow-md);
      touch-action: none;
    }
    .handle:focus-visible {
      outline: 2px solid var(--fluid-comparison-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 3px;
    }

    .handle svg {
      width: 1rem;
      height: 1rem;
    }

    ::slotted(img),
    ::slotted(video) {
      display: block;
      width: 100%;
      height: auto;
    }
  `;

  /** Position of the divider, percent from start (0–100). */
  @property({ type: Number, reflect: true }) position = 50;

  @query(".handle") private handle!: HTMLDivElement;

  @state() private dragging = false;

  protected override updated(): void {
    this.style.setProperty("--_pos", String(this.position));
  }

  private setPosition(p: number): void {
    const clamped = Math.max(0, Math.min(100, p));
    if (clamped !== this.position) {
      this.position = clamped;
      this.dispatchEvent(
        new CustomEvent("fluid-position-change", {
          detail: { position: clamped },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    this.dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const rect = this.getBoundingClientRect();
    this.setPosition(((e.clientX - rect.left) / rect.width) * 100);
  };

  private onPointerUp = (e: PointerEvent) => {
    this.dragging = false;
    const t = e.currentTarget as HTMLElement;
    if (t.hasPointerCapture(e.pointerId)) t.releasePointerCapture(e.pointerId);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      this.setPosition(this.position - step);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      this.setPosition(this.position + step);
    } else if (e.key === "Home") {
      e.preventDefault();
      this.setPosition(0);
    } else if (e.key === "End") {
      e.preventDefault();
      this.setPosition(100);
    }
  };

  /** Click anywhere in the container jumps the divider. */
  private onContainerClick = (e: MouseEvent) => {
    if (this.dragging) return;
    if (e.target === this.handle) return;
    const rect = this.getBoundingClientRect();
    this.setPosition(((e.clientX - rect.left) / rect.width) * 100);
  };

  override render(): TemplateResult {
    return html`
      <div part="base" @click=${this.onContainerClick}>
        <div part="before" class="pane before">
          <slot name="before"></slot>
        </div>
        <div part="after" class="pane after">
          <slot name="after"></slot>
        </div>
        <div part="divider" class="divider"></div>
        <div
          part="handle"
          class="handle"
          role="slider"
          tabindex="0"
          aria-label="Comparison slider"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${Math.round(this.position)}
          @pointerdown=${this.onPointerDown}
          @pointermove=${this.onPointerMove}
          @pointerup=${this.onPointerUp}
          @pointercancel=${this.onPointerUp}
          @keydown=${this.onKeyDown}
        >
          <slot name="handle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </slot>
        </div>
      </div>
    `;
  }
}
