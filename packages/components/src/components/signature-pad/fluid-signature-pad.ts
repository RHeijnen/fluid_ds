import { html, css, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/** One sampled point of a stroke, in CSS pixels with the pointer's pressure. */
interface SignaturePoint {
  x: number;
  y: number;
  /** 0..1; synthesised from velocity for pointers that report none. */
  pressure: number;
  time: number;
}

/**
 * A drawn signature, captured as ink rather than as a picture.
 *
 * Strokes are recorded as point sequences and the canvas is only ever a
 * rendering of them: the pad can therefore redraw losslessly when it is
 * resized or when the display scale changes, undo a stroke instead of only
 * wiping everything, and export crisp bitmaps at the device's real
 * resolution. Line width follows pointer pressure where the hardware reports
 * it and falls back to stroke velocity where it does not, which is what makes
 * a mouse signature look drawn rather than plotted.
 *
 * Form-associated: the submitted value is a PNG data URL of the ink, empty
 * while nothing has been drawn.
 *
 * @summary Pointer-drawn signature capture with pressure, undo and export.
 *
 * @csspart base - The outer container.
 * @csspart canvas - The drawing surface.
 *
 * Every styled property reads a component-scoped `--fluid-signature-pad-*`
 * token that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-signature-pad-height - Drawing surface height. Falls back to 9rem.
 * @cssproperty --fluid-signature-pad-ink - Stroke color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-signature-pad-bg - Surface color. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-signature-pad-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-signature-pad-radius - Corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-signature-pad-guideline - Baseline rule color. Falls back to --fluid-border-default.
 *
 * @uses-token --fluid-text-primary - Default ink.
 * @uses-token --fluid-surface-subtle - Default surface.
 * @uses-token --fluid-border-default - Default border and baseline rule.
 * @uses-token --fluid-radius-sm - Default corner radius.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width.
 *
 * @fires fluid-change - Fired when the ink changes: a stroke completed, an
 *   undo, or a clear. `detail.signed` says whether any ink remains;
 *   `detail.strokes` is the stroke count.
 */
export class FluidSignaturePad extends FluidElement {
  static formAssociated = true;
  protected readonly internals: ElementInternals;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  /** Accessible name for the drawing surface. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** True while at least one stroke of ink is on the pad. Read-only. */
  @property({ type: Boolean, reflect: true }) signed = false;

  @state() private strokes: SignaturePoint[][] = [];
  @query("canvas") private canvas?: HTMLCanvasElement;

  private active?: SignaturePoint[];
  private resizeObserver?: ResizeObserver;

  static override styles = css`
    :host {
      display: block;
    }
    .base {
      position: relative;
      border: 1px dashed
        var(--fluid-signature-pad-border, var(--fluid-border-default, #d5dbe3));
      border-radius: var(--fluid-signature-pad-radius, var(--fluid-radius-sm, 0.5rem));
      background: var(--fluid-signature-pad-bg, var(--fluid-surface-subtle, #f6f8fa));
      overflow: hidden;
    }
    :host([signed]) .base {
      border-style: solid;
    }
    :host([disabled]) .base {
      opacity: 0.55;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: var(--fluid-signature-pad-height, 9rem);
      touch-action: none;
      cursor: crosshair;
    }
    canvas:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-focus-ring-color, var(--fluid-accent-base, #4f46e5));
      outline-offset: -2px;
    }
    /*
     * The baseline gives an empty pad the affordance of a paper form's
     * signature line; it is drawn in CSS rather than in ink so it never
     * appears in the exported image.
     */
    .guideline {
      position: absolute;
      inset-inline: 12%;
      bottom: 28%;
      border-bottom: 1px solid
        var(--fluid-signature-pad-guideline, var(--fluid-border-default, #d5dbe3));
      pointer-events: none;
    }
  `;

  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** The ink as a PNG data URL at device resolution, or undefined when empty. */
  toDataURL(type = "image/png"): string | undefined {
    if (!this.signed || !this.canvas) return undefined;
    return this.canvas.toDataURL(type);
  }

  /** Removes the most recent stroke; a tremored start deserves better than a full clear. */
  undo(): void {
    if (!this.strokes.length) return;
    this.strokes = this.strokes.slice(0, -1);
    this.redraw();
    this.syncInk();
  }

  clear(): void {
    if (!this.strokes.length) return;
    this.strokes = [];
    this.redraw();
    this.syncInk();
  }

  formResetCallback(): void {
    this.clear();
  }

  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override firstUpdated(): void {
    // Redrawing from the stroke model is what makes a resize lossless: the
    // points are CSS-pixel coordinates, so a wider pad simply has more room to
    // the right of the existing ink.
    this.resizeObserver = new ResizeObserver(() => this.redraw());
    if (this.canvas) this.resizeObserver.observe(this.canvas);
    this.registerCleanup(() => this.resizeObserver?.disconnect());
  }

  private syncInk(): void {
    this.signed = this.strokes.length > 0;
    this.internals.setFormValue(this.toDataURL() ?? "");
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { signed: this.signed, strokes: this.strokes.length },
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Pressure a pointer did not report, recovered from how fast it moved.
   *
   * Mice and many touchscreens say 0 or a constant 0.5; a signature drawn at
   * uniform width from those reads as plotted line art. Fast movement thins
   * the line and slow movement thickens it — the same relationship a real pen
   * has — clamped so neither a flick nor a pause leaves artifacts.
   */
  private effectivePressure(point: SignaturePoint, previous?: SignaturePoint): number {
    if (point.pressure > 0 && point.pressure !== 0.5) return point.pressure;
    if (!previous) return 0.5;
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    const elapsed = Math.max(1, point.time - previous.time);
    const speed = distance / elapsed; // px per ms
    return Math.min(0.9, Math.max(0.2, 0.7 - speed * 0.35));
  }

  private strokeWidth(pressure: number): number {
    return 0.8 + pressure * 2.6;
  }

  private ink(): string {
    return (
      getComputedStyle(this).getPropertyValue("--fluid-signature-pad-ink").trim() ||
      getComputedStyle(this).getPropertyValue("--fluid-text-primary").trim() ||
      "#111"
    );
  }

  /**
   * Draws one stroke as quadratic segments through midpoints.
   *
   * Raw pointer samples are a polyline, and a polyline's corners are visible
   * at signature speeds. Curving through midpoints uses each sample as a
   * control point instead of a vertex, which is the standard smoothing that
   * makes captured ink look continuous. Width is interpolated per segment.
   */
  private drawStroke(context: CanvasRenderingContext2D, stroke: SignaturePoint[]): void {
    if (!stroke.length) return;
    context.strokeStyle = this.ink();
    context.lineCap = "round";
    context.lineJoin = "round";
    const first = stroke[0];
    if (!first) return;
    if (stroke.length === 1) {
      context.beginPath();
      context.arc(first.x, first.y, this.strokeWidth(first.pressure) / 2, 0, Math.PI * 2);
      context.fillStyle = context.strokeStyle;
      context.fill();
      return;
    }
    for (let index = 1; index < stroke.length; index += 1) {
      const previous = stroke[index - 1];
      const point = stroke[index];
      if (!previous || !point) continue;
      const middle = { x: (previous.x + point.x) / 2, y: (previous.y + point.y) / 2 };
      context.beginPath();
      context.lineWidth = this.strokeWidth(
        (this.effectivePressure(previous, stroke[index - 2]) +
          this.effectivePressure(point, previous)) /
          2
      );
      const earlier = stroke[index - 2];
      if (!earlier) {
        context.moveTo(previous.x, previous.y);
        context.lineTo(middle.x, middle.y);
      } else {
        const previousMiddle = {
          x: (earlier.x + previous.x) / 2,
          y: (earlier.y + previous.y) / 2
        };
        context.moveTo(previousMiddle.x, previousMiddle.y);
        context.quadraticCurveTo(previous.x, previous.y, middle.x, middle.y);
      }
      context.stroke();
    }
    const last = stroke[stroke.length - 1];
    const beforeLast = stroke[stroke.length - 2];
    if (!last || !beforeLast) return;
    context.beginPath();
    context.lineWidth = this.strokeWidth(this.effectivePressure(last, beforeLast));
    context.moveTo((beforeLast.x + last.x) / 2, (beforeLast.y + last.y) / 2);
    context.lineTo(last.x, last.y);
    context.stroke();
  }

  /** Sizes the backing store to the device and replays every stroke. */
  private redraw(): void {
    const canvas = this.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * scale));
    const height = Math.max(1, Math.round(rect.height * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    for (const stroke of this.strokes) this.drawStroke(context, stroke);
  }

  private samplePoint(event: PointerEvent): SignaturePoint {
    const rect = (this.canvas as HTMLCanvasElement).getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: event.pressure,
      time: event.timeStamp
    };
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.disabled || !this.canvas) return;
    // Pointer capture keeps the stroke alive when the pen wanders past the
    // edge mid-word; the stroke ends when the pointer lifts, not when it
    // leaves.
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.active = [this.samplePoint(event)];
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.active) return;
    // Coalesced events carry the samples the compositor batched between
    // frames; using them is the difference between 60 points a second and the
    // pen's real sampling rate.
    const events =
      typeof event.getCoalescedEvents === "function" && event.getCoalescedEvents().length
        ? event.getCoalescedEvents()
        : [event];
    for (const sample of events) this.active.push(this.samplePoint(sample));
    // Only the growing stroke needs paint while the pointer is down.
    const context = this.canvas?.getContext("2d");
    if (context) this.drawStroke(context, this.active);
  }

  private onPointerUp(): void {
    if (!this.active) return;
    // A bare tap leaves a dot, which is deliberate: initials and diacritics
    // are dots, and rejecting them makes the pad argue with real signatures.
    this.strokes = [...this.strokes, this.active];
    this.active = undefined;
    this.redraw();
    this.syncInk();
  }

  override render(): TemplateResult {
    return html`
      <div class="base" part="base">
        ${this.signed ? "" : html`<div class="guideline"></div>`}
        <canvas
          part="canvas"
          role="img"
          tabindex=${this.disabled ? -1 : 0}
          aria-label=${this.ariaLabel ?? "Signature"}
          @pointerdown=${this.onPointerDown}
          @pointermove=${this.onPointerMove}
          @pointerup=${this.onPointerUp}
          @pointercancel=${this.onPointerUp}
        ></canvas>
      </div>
    `;
  }
}
