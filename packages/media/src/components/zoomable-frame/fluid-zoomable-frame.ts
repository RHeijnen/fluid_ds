import { LitElement, html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";

/**
 * A pan + zoom container. Wraps any element (image, iframe, SVG) and
 * lets the user zoom with the scroll wheel and pan by dragging.
 * Buttons for zoom in/out/reset are shown by default.
 *
 * @summary Pan + zoom container.
 *
 * @slot - The content to make zoomable (first slotted element).
 *
 * @csspart base - The viewport.
 * @csspart content - The transformed wrapper.
 * @csspart controls - The zoom button strip.
 * @csspart button - A single zoom button.
 *
 * @cssproperty --fluid-zoom-bg - Viewport background.
 * @cssproperty --fluid-zoom-button-bg - Zoom button background.
 * @cssproperty --fluid-zoom-button-fg - Zoom button foreground color.
 * @cssproperty --fluid-zoom-button-hover-bg - Zoom button hover background.
 * @cssproperty --fluid-zoom-focus-ring - Focus ring color.
 *
 * @uses-token --fluid-surface-muted - Default viewport background.
 * @uses-token --fluid-surface-base - Button background.
 * @uses-token --fluid-text-primary - Button color.
 * @uses-token --fluid-focus-ring-color - Focus ring.
 *
 * @fires fluid-zoom - Fired when the zoom level changes; detail = { scale }.
 */
export class FluidZoomableFrame extends LitElement {
  static override styles = css`
    :host {
      position: relative;
      display: block;
      overflow: hidden;
      background: var(--fluid-zoom-bg, var(--fluid-surface-muted));
      touch-action: none;
      user-select: none;
      cursor: grab;
    }

    :host([data-dragging]) {
      cursor: grabbing;
    }

    .content {
      transform-origin: 0 0;
      will-change: transform;
      pointer-events: none; /* drag handled by host */
    }

    /* allow inner clicks (e.g. iframe) only when not zoomed/panned */
    :host([scale="1"]) .content {
      pointer-events: auto;
    }

    .controls {
      position: absolute;
      bottom: var(--fluid-space-3);
      right: var(--fluid-space-3);
      display: flex;
      gap: var(--fluid-space-2);
      z-index: 1;
    }

    .button {
      all: unset;
      cursor: pointer;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--fluid-zoom-button-bg, var(--fluid-surface-base));
      color: var(--fluid-zoom-button-fg, var(--fluid-text-primary));
      box-shadow: var(--fluid-shadow-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .button:hover {
      background: var(--fluid-zoom-button-hover-bg, var(--fluid-surface-muted));
    }
    .button:focus-visible {
      outline: 2px solid var(--fluid-zoom-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 2px;
    }
  `;

  /** Current zoom factor. */
  @property({ type: Number, reflect: true }) scale = 1;

  /** Minimum zoom. */
  @property({ type: Number, attribute: "min-scale" }) minScale = 0.5;

  /** Maximum zoom. */
  @property({ type: Number, attribute: "max-scale" }) maxScale = 5;

  /** Zoom step for buttons. */
  @property({ type: Number }) step = 0.25;

  /** Hide the floating zoom buttons. */
  @property({ type: Boolean, attribute: "no-controls" }) noControls = false;

  @query(".content") private contentEl!: HTMLDivElement;

  private x = 0;
  private y = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private activePointer: number | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    // Listen on host so we catch events from slotted content too.
    this.addEventListener("pointerdown", this.onPointerDown);
    this.addEventListener("pointermove", this.onPointerMove);
    this.addEventListener("pointerup", this.onPointerUp);
    this.addEventListener("pointercancel", this.onPointerUp);
    this.addEventListener("wheel", this.onWheel, { passive: false });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("pointerdown", this.onPointerDown);
    this.removeEventListener("pointermove", this.onPointerMove);
    this.removeEventListener("pointerup", this.onPointerUp);
    this.removeEventListener("pointercancel", this.onPointerUp);
    this.removeEventListener("wheel", this.onWheel);
  }

  protected override updated(changed: PropertyValues<this>): void {
    this.applyTransform();
    if (changed.has("scale")) {
      this.dispatchEvent(
        new CustomEvent("fluid-zoom", {
          detail: { scale: this.scale },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  private applyTransform(): void {
    if (this.contentEl) {
      this.contentEl.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.scale})`;
    }
  }

  private clampScale(s: number) {
    return Math.max(this.minScale, Math.min(this.maxScale, s));
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const next = this.clampScale(this.scale * delta);
    const rect = this.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = next / this.scale;
    this.x = px - (px - this.x) * factor;
    this.y = py - (py - this.y) * factor;
    this.scale = next;
  };

  private onPointerDown = (e: PointerEvent) => {
    // Ignore presses that originated on a control button.
    if ((e.target as HTMLElement | null)?.closest("[part=button]")) return;
    this.dragging = true;
    this.activePointer = e.pointerId;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.setAttribute("data-dragging", "");
    try {
      this.setPointerCapture(e.pointerId);
    } catch {
      // setPointerCapture can throw if the host is no longer connected.
    }
    e.preventDefault();
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging || e.pointerId !== this.activePointer) return;
    this.x += e.clientX - this.lastX;
    this.y += e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.applyTransform();
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== this.activePointer) return;
    this.dragging = false;
    this.activePointer = null;
    this.removeAttribute("data-dragging");
    try {
      if (this.hasPointerCapture(e.pointerId)) this.releasePointerCapture(e.pointerId);
    } catch {
      // pointer capture state can be invalidated on disconnect.
    }
  };

  /** Zoom in by the configured step. */
  zoomIn(): void {
    this.scale = this.clampScale(this.scale + this.step);
  }

  /** Zoom out by the configured step. */
  zoomOut(): void {
    this.scale = this.clampScale(this.scale - this.step);
  }

  /** Reset zoom + pan. */
  reset(): void {
    this.scale = 1;
    this.x = 0;
    this.y = 0;
    this.applyTransform();
  }

  override render(): TemplateResult {
    return html`
      <div part="content" class="content"><slot></slot></div>
      ${this.noControls
        ? ""
        : html`
            <div part="controls" class="controls">
              <button
                part="button"
                class="button"
                type="button"
                aria-label="Zoom out"
                @click=${() => this.zoomOut()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
              </button>
              <button
                part="button"
                class="button"
                type="button"
                aria-label="Reset zoom"
                @click=${() => this.reset()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>
              </button>
              <button
                part="button"
                class="button"
                type="button"
                aria-label="Zoom in"
                @click=${() => this.zoomIn()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          `}
    `;
  }
}
