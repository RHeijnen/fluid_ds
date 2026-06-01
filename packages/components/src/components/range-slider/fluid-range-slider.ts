import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { reducedMotion } from "../../internal/motion.js";

type Thumb = "min" | "max";

/**
 * A dual-thumb range slider for selecting a numeric min/max range.
 *
 * Implements the WAI-ARIA APG Multi-Thumb Slider pattern: each thumb is its
 * own `role="slider"` with `aria-valuemin` / `aria-valuemax` / `aria-valuenow`
 * and a distinguishing accessible name ("Minimum" / "Maximum"). The thumbs
 * cannot cross: the minimum thumb's `aria-valuemax` is clamped to the current
 * maximum value, and vice versa. The selected range is a filled track segment
 * drawn between the two thumbs.
 *
 * Form-associated: the submitted value is "valueMin,valueMax" pushed through
 * ElementInternals via `syncFormValue()`.
 *
 * @summary Dual-thumb min/max range input.
 *
 * @csspart base - The outer container.
 * @csspart track - The unfilled track rail.
 * @csspart fill - The selected range segment between the thumbs.
 * @csspart thumb - Either thumb (both thumbs share this part).
 * @csspart thumb-min - The minimum thumb.
 * @csspart thumb-max - The maximum thumb.
 *
 * Every styled property reads a component-scoped `--fluid-range-slider-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-range-slider-track-color - Unfilled track color. Falls back to --fluid-color-neutral-200.
 * @cssproperty --fluid-range-slider-fill-color - Selected-range color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-range-slider-thumb-color - Thumb color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-range-slider-track-size - Track thickness. Falls back to 8px.
 * @cssproperty --fluid-range-slider-radius - Track corner radius. Falls back to --fluid-radius-full.
 * @cssproperty --fluid-range-slider-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-range-slider-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-accent-base - Default fill + thumb color.
 * @uses-token --fluid-color-neutral-200 - Unfilled track color.
 * @uses-token --fluid-radius-full - Track corner radius.
 * @uses-token --fluid-gradient-glossy - Thumb sheen.
 * @uses-token --fluid-focus-ring-color - Keyboard focus ring.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum pointer-target size (24px AA / 44px AAA).
 * @uses-token --fluid-duration-fast - Thumb state transition duration.
 * @uses-token --fluid-easing-standard - Thumb state transition easing.
 *
 * @fires fluid-input - Fires on every value change (drag, keypress) with detail { min, max }.
 * @fires fluid-change - Fires when the user commits a change (release / keyup) with detail { min, max }.
 */
export class FluidRangeSlider extends FluidFormAssociated {
  static override formAssociated = true;

  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
        width: 100%;
      }

      .base {
        position: relative;
        width: 100%;
        /*
         * SC 2.5.8 Target Size. The visible rail is thin, so the row reads
         * --fluid-target-min as a floor: the full-height row is the pointer
         * target, giving AAA (44px) a comfortable drag area without
         * thickening the rail itself.
         */
        height: max(1.5rem, var(--fluid-target-min, 0px));
        touch-action: none;
      }

      .base.disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      /* The rail (unfilled track), centered vertically in the target row. */
      .track {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        height: var(--fluid-range-slider-track-size, 8px);
        border-radius: var(--fluid-range-slider-radius, var(--fluid-radius-full));
        background: var(--fluid-range-slider-track-color, var(--fluid-color-neutral-200));
        box-shadow: inset 0 1px 1px rgb(0 0 0 / 0.06);
      }

      /* The selected-range segment between the two thumbs. */
      .fill {
        position: absolute;
        top: 0;
        bottom: 0;
        border-radius: var(--fluid-range-slider-radius, var(--fluid-radius-full));
        background: var(--fluid-range-slider-fill-color, var(--fluid-accent-base));
      }

      /*
       * Thumb, a vertical capsule "grab handle" (matching fluid-slider's
       * signature shape) centered on its value via left + translateX(-50%).
       */
      .thumb {
        position: absolute;
        top: 50%;
        width: 6px;
        height: 22px;
        transform: translate(-50%, -50%);
        background-color: var(--fluid-range-slider-thumb-color, var(--fluid-accent-base));
        background-image: var(--fluid-gradient-glossy);
        border: none;
        border-radius: 3px;
        padding: 0;
        cursor: pointer;
        box-shadow:
          0 1px 2px rgb(0 0 0 / 0.18),
          0 2px 4px rgb(0 0 0 / 0.1),
          inset 0 1px 0 rgb(255 255 255 / 0.3);
        transition:
          width var(--fluid-duration-fast) var(--fluid-easing-standard),
          height var(--fluid-duration-fast) var(--fluid-easing-standard),
          box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      .thumb:focus {
        outline: none;
      }

      /* Hover, thumb thickens to invite the grab. */
      .thumb:hover {
        width: 8px;
        height: 24px;
      }

      /* Active, thumb expands plus an accent glow halo. */
      .thumb.dragging {
        width: 10px;
        height: 26px;
        box-shadow:
          0 0 0 6px
            color-mix(
              in srgb,
              var(--fluid-range-slider-thumb-color, var(--fluid-accent-base)) 18%,
              transparent
            ),
          0 2px 4px rgb(0 0 0 / 0.15);
      }

      .thumb:focus-visible {
        box-shadow:
          0 0 0 var(--fluid-range-slider-focus-ring-width, var(--fluid-focus-ring-width))
            var(--fluid-range-slider-focus-ring, var(--fluid-focus-ring-color)),
          0 2px 4px rgb(0 0 0 / 0.15);
      }
    `
  ];

  @query(".base") private baseEl!: HTMLElement;
  @query('[part~="thumb-min"]') private thumbMinEl!: HTMLElement;

  /** Form control value, serialized as "valueMin,valueMax". */
  @property() override value = "25,75";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Range lower bound. */
  @property({ type: Number }) min = 0;

  /** Range upper bound. */
  @property({ type: Number }) max = 100;

  /** Step increment. */
  @property({ type: Number }) step = 1;

  /** Current minimum-thumb value. */
  @property({ type: Number, attribute: "value-min" }) valueMin = 25;

  /** Current maximum-thumb value. */
  @property({ type: Number, attribute: "value-max" }) valueMax = 75;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Format function for aria-valuetext on both thumbs. */
  @property({ attribute: false }) valueFormatter?: (value: number) => string;

  @state() private dragging: Thumb | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    // Publish the form value synchronously on connect. Lit's first update is
    // async, so without this a `new FormData(form)` read immediately after the
    // element parses would see no value. We serialize the current value-min /
    // value-max (already parsed from the attributes by the reactive property
    // setters) so the form sees them before the first render settles.
    this.value = `${this.valueMin},${this.valueMax}`;
    this.syncFormValue();
  }

  override formResetCallback(): void {
    const attrMin = this.getAttribute("value-min");
    const attrMax = this.getAttribute("value-max");
    this.valueMin = attrMin !== null ? Number(attrMin) : this.min;
    this.valueMax = attrMax !== null ? Number(attrMax) : this.max;
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") {
      const [lo, hi] = state.split(",");
      if (lo !== undefined) this.valueMin = Number(lo);
      if (hi !== undefined) this.valueMax = Number(hi);
    }
  }

  override focus(options?: FocusOptions): void {
    this.thumbMinEl?.focus(options);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has("valueMin") ||
      changed.has("valueMax") ||
      changed.has("min") ||
      changed.has("max")
    ) {
      this.clamp();
      this.value = `${this.valueMin},${this.valueMax}`;
      this.syncFormValue();
    }
  }

  /**
   * Normalize the two thumbs so the minimum never sits above the maximum. We
   * deliberately do NOT force the values into [min, max] here: the submitted
   * form value mirrors the configured value-min / value-max as-is (matching
   * fluid-slider, which serializes the raw value and leaves range clamping to
   * interaction and rendering). Keyboard / pointer moves clamp into range via
   * setThumb(), and the visible fill / thumb positions are clamped to 0-100%
   * in percentOf()/render(), so an out-of-range configured value stays visually
   * sane without rewriting what the consumer asked to submit.
   */
  private clamp(): void {
    if (this.valueMin > this.valueMax) {
      const lo = Math.min(this.valueMin, this.valueMax);
      const hi = Math.max(this.valueMin, this.valueMax);
      this.valueMin = lo;
      this.valueMax = hi;
    }
  }

  private percentOf(value: number): number {
    if (this.max === this.min) return 0;
    return ((value - this.min) / (this.max - this.min)) * 100;
  }

  private emit(type: "fluid-input" | "fluid-change"): void {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail: { min: this.valueMin, max: this.valueMax },
        bubbles: true,
        composed: true
      })
    );
  }

  /** Round a raw numeric value to the nearest step within bounds. */
  private snap(raw: number): number {
    const stepped = Math.round((raw - this.min) / this.step) * this.step + this.min;
    return Math.min(Math.max(stepped, this.min), this.max);
  }

  private setThumb(thumb: Thumb, next: number): boolean {
    const snapped = this.snap(next);
    if (thumb === "min") {
      const clamped = Math.min(snapped, this.valueMax);
      if (clamped === this.valueMin) return false;
      this.valueMin = clamped;
    } else {
      const clamped = Math.max(snapped, this.valueMin);
      if (clamped === this.valueMax) return false;
      this.valueMax = clamped;
    }
    return true;
  }

  private handleKeydown(thumb: Thumb, e: KeyboardEvent): void {
    if (this.disabled) return;
    const current = thumb === "min" ? this.valueMin : this.valueMax;
    const bigStep = Math.max(this.step, (this.max - this.min) / 10);
    let next: number | null = null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = current + this.step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = current - this.step;
        break;
      case "PageUp":
        next = current + bigStep;
        break;
      case "PageDown":
        next = current - bigStep;
        break;
      case "Home":
        next = thumb === "min" ? this.min : this.valueMin;
        break;
      case "End":
        next = thumb === "max" ? this.max : this.valueMax;
        break;
      default:
        return;
    }
    e.preventDefault();
    if (this.setThumb(thumb, next)) {
      this.emit("fluid-input");
      this.emit("fluid-change");
    }
  }

  /** Convert a clientX coordinate into a snapped value along the rail. */
  private valueFromPointer(clientX: number): number {
    const rect = this.baseEl.getBoundingClientRect();
    if (rect.width === 0) return this.min;
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return this.snap(this.min + ratio * (this.max - this.min));
  }

  private handlePointerDown(thumb: Thumb, e: PointerEvent): void {
    if (this.disabled) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.focus();
    target.setPointerCapture(e.pointerId);
    this.dragging = thumb;
  }

  private handlePointerMove = (thumb: Thumb, e: PointerEvent): void => {
    if (this.dragging !== thumb) return;
    if (this.setThumb(thumb, this.valueFromPointer(e.clientX))) {
      this.emit("fluid-input");
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (this.dragging === null) return;
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
    this.dragging = null;
    this.emit("fluid-change");
  };

  private renderThumb(thumb: Thumb): TemplateResult {
    const value = thumb === "min" ? this.valueMin : this.valueMax;
    const ariaMin = thumb === "min" ? this.min : this.valueMin;
    const ariaMax = thumb === "min" ? this.valueMax : this.max;
    const label = thumb === "min" ? "Minimum" : "Maximum";
    const valueText = this.valueFormatter ? this.valueFormatter(value) : undefined;
    return html`
      <button
        type="button"
        part="thumb thumb-${thumb}"
        class="thumb ${this.dragging === thumb ? "dragging" : ""}"
        style="left: ${this.percentOf(value)}%"
        role="slider"
        aria-label=${label}
        aria-valuemin=${ariaMin}
        aria-valuemax=${ariaMax}
        aria-valuenow=${value}
        aria-valuetext=${ifDefined(valueText)}
        aria-disabled=${this.disabled ? "true" : "false"}
        tabindex=${this.disabled ? -1 : 0}
        @keydown=${(e: KeyboardEvent) => this.handleKeydown(thumb, e)}
        @pointerdown=${(e: PointerEvent) => this.handlePointerDown(thumb, e)}
        @pointermove=${(e: PointerEvent) => this.handlePointerMove(thumb, e)}
        @pointerup=${this.handlePointerUp}
        @pointercancel=${this.handlePointerUp}
      ></button>
    `;
  }

  override render(): TemplateResult {
    const lo = Math.max(0, Math.min(100, this.percentOf(this.valueMin)));
    const hi = Math.max(0, Math.min(100, this.percentOf(this.valueMax)));
    return html`
      <div part="base" class="base ${this.disabled ? "disabled" : ""}">
        <div part="track" class="track"></div>
        <div part="fill" class="fill" style="left: ${lo}%; right: ${100 - hi}%"></div>
        ${this.renderThumb("min")} ${this.renderThumb("max")}
      </div>
    `;
  }
}
