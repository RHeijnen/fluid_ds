import { html, css, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import "../button/define.js";

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
 * @cssproperty --fluid-signature-pad-height - Drawing surface height. Falls back to 10rem.
 * @cssproperty --fluid-signature-pad-max-width - Widest the pad will draw. Falls back to 32rem.
 * @cssproperty --fluid-signature-pad-ink - Stroke color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-signature-pad-bg - Surface color. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-signature-pad-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-signature-pad-radius - Corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-signature-pad-guideline - Baseline rule color. Falls back to --fluid-text-secondary.
 * @csspart actions - The undo/clear button group shown while signed.
 *
 * @uses-token --fluid-text-primary - Default ink.
 * @uses-token --fluid-surface-subtle - Default surface.
 * @uses-token --fluid-border-default - Default border and baseline rule.
 * @uses-token --fluid-radius-sm - Default corner radius.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width.
 *
 * A prepared signature can be placed instead of drawn: the Upload control and
 * dragging an image onto the pad both call `placeImage`, which layers the
 * bitmap beneath any strokes, fits it inside the pad without upscaling, and
 * includes it in the export. The placed layer stays adjustable — drag it to
 * move, pull the corner grip to scale, Fit to return to the centred
 * contain-fit — and the outline chrome is DOM, never exported ink.
 *
 * @fires fluid-change - Fired when the ink changes: a stroke completed, an
 *   image placed, an undo, or a clear. `detail.signed` says whether any ink
 *   remains; `detail.strokes` is the stroke count.
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
  /**
   * Invitation shown while the pad is empty. Copy comes in through properties
   * rather than a catalogue - the application knows what language its reader
   * speaks - with English defaults so a bare tag is already usable.
   */
  @property() placeholder = "Sign here";
  @property({ attribute: "clear-label" }) clearLabel = "Clear";
  @property({ attribute: "undo-label" }) undoLabel = "Undo";
  @property({ attribute: "upload-label" }) uploadLabel = "Upload";
  @property({ attribute: "fit-label" }) fitLabel = "Fit";

  @state() private strokes: SignaturePoint[][] = [];
  /**
   * A prepared signature, placed rather than drawn.
   *
   * Plenty of people keep a scanned signature on their machine; forcing them
   * to re-draw a worse one with a mouse would be the pad insisting on its own
   * mechanism. The image is a layer beneath the strokes — initials can still
   * be added over it — and it lives in the model like the strokes do, so
   * resize replays it and the export includes it.
   */
  @state() private placed?: ImageBitmap | HTMLImageElement;
  /**
   * Where the placed image sits, in CSS pixels of the pad.
   *
   * A scan rarely arrives at the right size, so the placed layer stays
   * adjustable: drag to move it, pull the corner handle to scale it. The
   * rectangle is the one source of truth — the on-screen overlay and the
   * exported bitmap both draw from it, so what is adjusted is what is
   * submitted.
   */
  @state() private placement?: { x: number; y: number; width: number; height: number };
  private adjusting?: {
    mode: "move" | "resize";
    startX: number;
    startY: number;
    origin: { x: number; y: number; width: number; height: number };
  };
  @query("canvas") private canvas?: HTMLCanvasElement;

  private active?: SignaturePoint[];
  private resizeObserver?: ResizeObserver;

  static override styles = css`
    :host {
      display: block;
      max-width: var(--fluid-signature-pad-max-width, 32rem);
    }
    .base {
      position: relative;
      border: 1px dashed
        var(--fluid-signature-pad-border, var(--fluid-border-default, #d5dbe3));
      border-radius: var(--fluid-signature-pad-radius, var(--fluid-radius-sm, 0.5rem));
      background: var(--fluid-signature-pad-bg, var(--fluid-surface-base, #fff));
      /* A whisper of depth reads as a writable surface rather than a gap. */
      box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.04);
      overflow: hidden;
      transition: border-color var(--fluid-duration-fast, 120ms) ease;
    }
    .base:hover {
      border-color: var(--fluid-accent-base, #4f46e5);
    }
    :host([signed]) .base {
      border-style: solid;
      border-color: var(--fluid-accent-base, #4f46e5);
    }
    :host([disabled]) .base {
      opacity: 0.55;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: var(--fluid-signature-pad-height, 10rem);
      touch-action: none;
      cursor: crosshair;
    }
    canvas:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-focus-ring-color, var(--fluid-accent-base, #4f46e5));
      outline-offset: -2px;
    }
    /*
     * The paper-form affordance: a cross by a baseline. Drawn in CSS, not
     * ink, so none of it appears in the exported image; hidden once signed so
     * the scenery never competes with the signature.
     */
    .guide {
      position: absolute;
      inset-inline: 8%;
      bottom: 22%;
      display: flex;
      align-items: flex-end;
      gap: var(--fluid-space-2, 0.5rem);
      border-bottom: 1px solid
        var(--fluid-signature-pad-guideline, var(--fluid-text-secondary, #5b6b7b));
      opacity: 0.45;
      pointer-events: none;
    }
    .guide .cross {
      font-size: 0.85rem;
      line-height: 1.6;
      color: var(--fluid-text-secondary, #5b6b7b);
    }
    .hint {
      position: absolute;
      inset: 0;
      padding-top: 1.5rem;
      display: grid;
      place-items: center;
      color: var(--fluid-text-secondary, #5b6b7b);
      font-size: var(--fluid-font-size-sm, 0.85rem);
      opacity: 0.7;
      pointer-events: none;
    }
    .actions {
      position: absolute;
      top: var(--fluid-space-2, 0.5rem);
      inset-inline-end: var(--fluid-space-2, 0.5rem);
      display: flex;
      gap: var(--fluid-space-1, 0.25rem);
    }
    /*
     * The adjustable layer's chrome: an outline and a corner grip over the
     * placed image. DOM rather than ink, so the export never carries it; no
     * pointer events of its own, so the canvas underneath handles the drag.
     */
    .frame {
      position: absolute;
      border: 1px dashed var(--fluid-accent-base, #4f46e5);
      border-radius: 2px;
      pointer-events: none;
    }
    .frame .grip {
      position: absolute;
      right: -5px;
      bottom: -5px;
      width: 10px;
      height: 10px;
      border: 1px solid var(--fluid-surface-base, #fff);
      border-radius: 2px;
      background: var(--fluid-accent-base, #4f46e5);
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

  /**
   * Steps back through the ink: the most recent stroke first, the placed
   * image once no strokes remain. A tremored start deserves better than a
   * full clear.
   */
  undo(): void {
    if (this.strokes.length) {
      this.strokes = this.strokes.slice(0, -1);
    } else if (this.placed) {
      this.placed = undefined;
      this.placement = undefined;
    } else {
      return;
    }
    this.redraw();
    this.syncInk();
  }

  clear(): void {
    if (!this.strokes.length && !this.placed) return;
    this.strokes = [];
    this.placed = undefined;
    this.placement = undefined;
    this.redraw();
    this.syncInk();
  }

  /**
   * Places a prepared signature image onto the pad.
   *
   * Accepts whatever the file input or a drop hands over. The image is fitted
   * inside the pad with a margin, centred, never upscaled past its own size —
   * a 200px scan on a 500px pad should read as a signature, not as wallpaper.
   */
  async placeImage(source: Blob | string): Promise<void> {
    if (this.disabled) return;
    const image = await this.decodeImage(source);
    if (!image) return;
    this.placed = image;
    this.placement = this.containFit(image);
    this.redraw();
    this.syncInk();
  }

  /** Fitted inside the pad with a margin, centred, never upscaled. */
  private containFit(image: { width: number; height: number }) {
    const rect = this.canvas?.getBoundingClientRect() ?? { width: 480, height: 160 };
    const margin = 12;
    const fit = Math.min(
      1,
      (rect.width - margin * 2) / image.width,
      (rect.height - margin * 2) / image.height
    );
    const width = image.width * fit;
    const height = image.height * fit;
    return {
      x: (rect.width - width) / 2,
      y: (rect.height - height) / 2,
      width,
      height
    };
  }

  /** Puts the placed image back to its centred contain-fit. */
  refit(): void {
    if (!this.placed) return;
    this.placement = this.containFit(this.placed);
    this.redraw();
  }

  private async decodeImage(
    source: Blob | string
  ): Promise<ImageBitmap | HTMLImageElement | undefined> {
    try {
      if (typeof createImageBitmap === "function" && typeof source !== "string") {
        return await createImageBitmap(source);
      }
      const url = typeof source === "string" ? source : URL.createObjectURL(source);
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("undecodable image"));
        image.src = url;
      });
      if (typeof source !== "string") URL.revokeObjectURL(url);
      return image;
    } catch {
      // An undecodable file places nothing; the pad stays as it was.
      return undefined;
    }
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
    this.signed = this.strokes.length > 0 || this.placed !== undefined;
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
    if (this.placed && this.placement) {
      context.drawImage(
        this.placed,
        this.placement.x,
        this.placement.y,
        this.placement.width,
        this.placement.height
      );
    }
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

  private readonly onDrop = (event: DragEvent): void => {
    if (this.disabled) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    event.preventDefault();
    void this.placeImage(file);
  };

  private pickFile(): void {
    this.renderRoot.querySelector<HTMLInputElement>(".file")?.click();
  }

  private onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (file) void this.placeImage(file);
  }

  /** Whether a canvas point falls on the placed image. */
  private onPlaced(x: number, y: number): boolean {
    const p = this.placement;
    return !!p && x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height;
  }

  /** Whether a canvas point falls on the resize corner of the placed image. */
  private onHandle(x: number, y: number): boolean {
    const p = this.placement;
    if (!p) return false;
    const grip = 14;
    return Math.abs(x - (p.x + p.width)) <= grip && Math.abs(y - (p.y + p.height)) <= grip;
  }

  private beginAdjust(event: PointerEvent, mode: "move" | "resize"): void {
    if (!this.placement || !this.canvas) return;
    // Capture keeps the drag alive past the pad's edge; a pointer that
    // vanished between down and here (or a synthetic one) is no reason to
    // refuse the drag that is still happening on-screen.
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      /* uncapturable pointer; the drag still works while it stays inside */
    }
    const { x, y } = this.samplePoint(event);
    this.adjusting = { mode, startX: x, startY: y, origin: { ...this.placement } };
  }

  private adjust(event: PointerEvent): void {
    if (!this.adjusting || !this.placement || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const { x, y } = this.samplePoint(event);
    const { mode, startX, startY, origin } = this.adjusting;
    if (mode === "move") {
      const nx = origin.x + (x - startX);
      const ny = origin.y + (y - startY);
      this.placement = {
        ...this.placement,
        x: Math.min(Math.max(nx, -origin.width * 0.5), rect.width - origin.width * 0.5),
        y: Math.min(Math.max(ny, -origin.height * 0.5), rect.height - origin.height * 0.5)
      };
    } else {
      // Uniform scale from the anchor corner, floored so the image can never
      // be shrunk into something unclickable.
      const scale = Math.max(
        24 / origin.width,
        Math.min(
          (origin.width + (x - startX)) / origin.width,
          (origin.height + (y - startY)) / origin.height
        )
      );
      this.placement = {
        x: origin.x,
        y: origin.y,
        width: origin.width * scale,
        height: origin.height * scale
      };
    }
    this.redraw();
  }

  private endAdjust(): void {
    if (!this.adjusting) return;
    this.adjusting = undefined;
    // The composite changed even though no stroke did.
    this.syncInk();
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.disabled || !this.canvas) return;
    const { x, y } = this.samplePoint(event);
    if (this.onHandle(x, y)) {
      event.preventDefault();
      this.beginAdjust(event, "resize");
      return;
    }
    if (this.onPlaced(x, y)) {
      event.preventDefault();
      this.beginAdjust(event, "move");
      return;
    }
    // Pointer capture keeps the stroke alive when the pen wanders past the
    // edge mid-word; the stroke ends when the pointer lifts, not when it
    // leaves.
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.active = [this.samplePoint(event)];
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.adjusting) {
      this.adjust(event);
      return;
    }
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
    if (this.adjusting) {
      this.endAdjust();
      return;
    }
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
      <div
        class="base"
        part="base"
        @dragover=${(event: DragEvent) => {
          if (!this.disabled) event.preventDefault();
        }}
        @drop=${this.onDrop}
      >
        ${this.signed
          ? ""
          : html`
              <div class="hint">${this.placeholder}</div>
              <div class="guide"><span class="cross">✕</span></div>
              <div class="actions" part="actions">
                <fluid-button size="sm" variant="ghost" @click=${this.pickFile}>
                  ${this.uploadLabel}
                </fluid-button>
              </div>
            `}
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
        ${this.signed
          ? html`
              <div class="actions" part="actions">
                ${this.placed
                  ? html`<fluid-button size="sm" variant="ghost" @click=${() => this.refit()}>
                      ${this.fitLabel}
                    </fluid-button>`
                  : ""}
                <fluid-button size="sm" variant="ghost" @click=${() => this.undo()}>
                  ${this.undoLabel}
                </fluid-button>
                <fluid-button size="sm" variant="ghost" @click=${() => this.clear()}>
                  ${this.clearLabel}
                </fluid-button>
              </div>
            `
          : ""}
        ${this.placed && this.placement
          ? html`
              <div
                class="frame"
                style=${`left:${this.placement.x}px;top:${this.placement.y}px;width:${this.placement.width}px;height:${this.placement.height}px;`}
              >
                <span class="grip"></span>
              </div>
            `
          : ""}
        <input
          class="file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          hidden
          @change=${this.onFilePicked}
        />
      </div>
    `;
  }
}
