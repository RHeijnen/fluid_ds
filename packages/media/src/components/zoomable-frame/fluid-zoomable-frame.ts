import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";

/**
 * A pan + zoom container. Wraps any element (image, iframe, SVG) and
 * lets the user zoom with the scroll wheel and pan by dragging.
 * Native buttons provide zoom and pan without dragging, including keyboard
 * activation. No composite APG pattern applies; each action is a native button.
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
 * @uses-token --fluid-shadow-sm - Zoom button elevation.
 * @uses-token --fluid-space-3 - Controls strip inset from the edges.
 * @uses-token --fluid-space-2 - Gap between zoom buttons.
 * @uses-token --fluid-target-min - Conformance-aware control target size.
 *
 * @fires fluid-zoom - Fired when the zoom level changes; detail = { scale }.
 */
export class FluidZoomableFrame extends FluidElement {
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
      flex-wrap: wrap;
      max-width: calc(100% - 2 * var(--fluid-space-3));
      gap: var(--fluid-space-2);
      z-index: 1;
    }

    .button {
      all: unset;
      cursor: pointer;
      width: 2rem;
      height: 2rem;
      min-width: var(--fluid-target-min, 24px);
      min-height: var(--fluid-target-min, 24px);
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
    /* Keep native pointer focus on the button, not its decorative descendants.
       WebKit can otherwise restart shadow-root Tab navigation after a click. */
    .button > svg,
    .button > span {
      pointer-events: none;
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

  /** Distance in CSS pixels moved by each pan control. Panning is unbounded. */
  @property({ type: Number, attribute: "pan-step" }) panStep = 40;

  /** Translatable names for the native controls. */
  @property({ attribute: "zoom-in-label" }) get zoomInLabel(): string {
    return this.zoomInLabelOverride ?? this.term("zoomIn");
  }
  set zoomInLabel(value: string | null) {
    this.zoomInLabelOverride = value;
  }
  private zoomInLabelOverride: string | null = null;
  @property({ attribute: "zoom-out-label" }) get zoomOutLabel(): string {
    return this.zoomOutLabelOverride ?? this.term("zoomOut");
  }
  set zoomOutLabel(value: string | null) {
    this.zoomOutLabelOverride = value;
  }
  private zoomOutLabelOverride: string | null = null;
  @property({ attribute: "reset-label" }) get resetLabel(): string {
    return this.resetLabelOverride ?? this.term("resetZoom");
  }
  set resetLabel(value: string | null) {
    this.resetLabelOverride = value;
  }
  private resetLabelOverride: string | null = null;
  @property({ attribute: "pan-left-label" }) get panLeftLabel(): string {
    return this.panLeftLabelOverride ?? this.term("panLeft");
  }
  set panLeftLabel(value: string | null) {
    this.panLeftLabelOverride = value;
  }
  private panLeftLabelOverride: string | null = null;
  @property({ attribute: "pan-right-label" }) get panRightLabel(): string {
    return this.panRightLabelOverride ?? this.term("panRight");
  }
  set panRightLabel(value: string | null) {
    this.panRightLabelOverride = value;
  }
  private panRightLabelOverride: string | null = null;
  @property({ attribute: "pan-up-label" }) get panUpLabel(): string {
    return this.panUpLabelOverride ?? this.term("panUp");
  }
  set panUpLabel(value: string | null) {
    this.panUpLabelOverride = value;
  }
  private panUpLabelOverride: string | null = null;
  @property({ attribute: "pan-down-label" }) get panDownLabel(): string {
    return this.panDownLabelOverride ?? this.term("panDown");
  }
  set panDownLabel(value: string | null) {
    this.panDownLabelOverride = value;
  }
  private panDownLabelOverride: string | null = null;

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
    this.addEventListener("lostpointercapture", this.onPointerUp);
    this.addEventListener("wheel", this.onWheel, { passive: false });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("pointerdown", this.onPointerDown);
    this.removeEventListener("pointermove", this.onPointerMove);
    this.removeEventListener("pointerup", this.onPointerUp);
    this.removeEventListener("pointercancel", this.onPointerUp);
    this.removeEventListener("lostpointercapture", this.onPointerUp);
    this.removeEventListener("wheel", this.onWheel);
    if (this.activePointer !== null) this.releaseDrag(this.activePointer);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("scale") || changed.has("minScale") || changed.has("maxScale")) {
      this.scale = this.clampScale(this.scale);
    }
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
    const min = Number.isFinite(this.minScale) && this.minScale > 0 ? this.minScale : 0.5;
    const max =
      Number.isFinite(this.maxScale) && this.maxScale >= min ? this.maxScale : Math.max(min, 5);
    return Math.max(min, Math.min(max, Number.isFinite(s) ? s : 1));
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
    // Host listeners see retargeted shadow events. Inspect the composed path so
    // control presses retain native focus and activation instead of starting a drag.
    if (
      e.button !== 0 ||
      this.dragging ||
      e
        .composedPath()
        .some(
          (node) => node instanceof Element && node.matches("button, a, input, select, textarea")
        )
    )
      return;
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
    this.releaseDrag(e.pointerId);
  };

  private releaseDrag(pointerId: number): void {
    this.dragging = false;
    this.activePointer = null;
    this.removeAttribute("data-dragging");
    try {
      if (this.hasPointerCapture(pointerId)) this.releasePointerCapture(pointerId);
    } catch {
      // pointer capture state can be invalidated on disconnect.
    }
  }

  /** Zoom in by the configured step. */
  zoomIn(): void {
    this.scale = this.clampScale(this.scale + this.zoomStep);
  }

  /** Zoom out by the configured step. */
  zoomOut(): void {
    this.scale = this.clampScale(this.scale - this.zoomStep);
  }

  private get zoomStep(): number {
    return Number.isFinite(this.step) && this.step > 0 ? this.step : 0.25;
  }

  private get panDistance(): number {
    return Number.isFinite(this.panStep) && this.panStep > 0 ? this.panStep : 40;
  }

  /** Pan by CSS pixels without requiring a drag gesture. */
  panBy(x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    this.x += x;
    this.y += y;
    this.applyTransform();
  }

  /** Reset zoom + pan. */
  reset(): void {
    this.scale = this.clampScale(1);
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
                aria-label=${this.zoomOutLabel}
                @click=${() => this.zoomOut()}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                part="button"
                class="button"
                type="button"
                aria-label=${this.resetLabel}
                @click=${() => this.reset()}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                </svg>
              </button>
              <button
                part="button"
                class="button"
                type="button"
                aria-label=${this.zoomInLabel}
                @click=${() => this.zoomIn()}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button
                part="button"
                class="button"
                type="button"
                aria-label=${this.panLeftLabel}
                @click=${() => this.panBy(-this.panDistance, 0)}
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                part="button"
                class="button"
                type="button"
                aria-label=${this.panRightLabel}
                @click=${() => this.panBy(this.panDistance, 0)}
              >
                <span aria-hidden="true">→</span>
              </button>
              <button
                part="button"
                class="button"
                type="button"
                aria-label=${this.panUpLabel}
                @click=${() => this.panBy(0, -this.panDistance)}
              >
                <span aria-hidden="true">↑</span>
              </button>
              <button
                part="button"
                class="button"
                type="button"
                aria-label=${this.panDownLabel}
                @click=${() => this.panBy(0, this.panDistance)}
              >
                <span aria-hidden="true">↓</span>
              </button>
            </div>
          `}
    `;
  }
}
