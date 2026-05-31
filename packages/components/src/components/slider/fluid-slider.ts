import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";

export type FluidSliderSize = "sm" | "md" | "lg";

/**
 * A range slider for numeric input.
 *
 * Wraps a native `<input type="range">` so we inherit keyboard handling
 * (arrows, Shift+arrows for ×10, Home/End, PageUp/PageDown) and pointer
 * drag for free, then style it as a token-aware track + thumb.
 *
 * Form-associated.
 *
 * @summary Numeric range input.
 *
 * @csspart base - The outer container.
 * @csspart input - The internal range input.
 *
 * Every styled property reads a component-scoped `--fluid-slider-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-slider-track-color - Unfilled track color. Falls back to --fluid-color-neutral-200.
 * @cssproperty --fluid-slider-fill-color - Filled portion color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-slider-thumb-color - Thumb color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-slider-track-size - Track thickness. Falls back to 8px.
 * @cssproperty --fluid-slider-radius - Track corner radius. Falls back to --fluid-radius-full.
 * @cssproperty --fluid-slider-font-family - Value-label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-slider-value-fg - Value-label text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-slider-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-slider-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-accent-base - Default fill + thumb color.
 * @uses-token --fluid-color-neutral-200 - Unfilled track color.
 * @uses-token --fluid-radius-full - Track corner radius.
 * @uses-token --fluid-text-secondary - Value-label text color.
 * @uses-token --fluid-font-family-sans - Value-label font family.
 * @uses-token --fluid-focus-ring-color - Active-drag halo + keyboard focus ring.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum pointer-target row height (24px AA / 44px AAA).
 * @uses-token --fluid-gradient-glossy - Thumb sheen.
 *
 * @fires fluid-input - Fires on every value change (drag, keypress).
 * @fires fluid-change - Fires when the user commits a change (release / blur).
 */
export class FluidSlider extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: inline-flex;
      width: 100%;
    }

    .base {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-3);
      width: 100%;
      font-family: var(--fluid-slider-font-family, var(--fluid-font-family-sans));
    }

    .base.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    /*
     * SC 2.5.8 Target Size. The visible track is thin, so the input row reads
     * --fluid-target-min as a floor, the full row is the pointer target, so
     * AAA (44px) gives a comfortable drag area without thickening the track.
     */
    input[type="range"] {
      flex: 1 1 auto;
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      height: max(1.5rem, var(--fluid-target-min, 0px));
      cursor: pointer;
      padding: 0;
      margin: 0;
    }

    input[type="range"]:focus-visible {
      outline: none;
    }

    /*
     * Track, 8px tall, fully rounded. Inset shadow at the top sells it as
     * a "well" the thumb glides along.
     */
    input[type="range"]::-webkit-slider-runnable-track {
      height: var(--fluid-slider-track-size, 8px);
      border-radius: var(--fluid-slider-radius, var(--fluid-radius-full));
      background: var(--track-bg);
      box-shadow: inset 0 1px 1px rgb(0 0 0 / 0.06);
    }
    input[type="range"]::-moz-range-track {
      height: var(--fluid-slider-track-size, 8px);
      border-radius: var(--fluid-slider-radius, var(--fluid-radius-full));
      background: var(--track-bg);
      box-shadow: inset 0 1px 1px rgb(0 0 0 / 0.06);
    }

    /*
     * Thumb, a vertical capsule "grab handle" (6×22), not a circle. The
     * non-disc shape is the signature: it reads as "this is meant to be
     * grabbed and slid." Combined with the deeper track, it gives the
     * slider a recognizable look distinct from generic native sliders.
     */
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: 6px;
      height: 22px;
      margin-top: -7px;
      background-color: var(--fluid-slider-thumb-color, var(--fluid-accent-base));
      background-image: var(--fluid-gradient-glossy);
      border: none;
      border-radius: 3px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 0.18),
        0 2px 4px rgb(0 0 0 / 0.1),
        inset 0 1px 0 rgb(255 255 255 / 0.3);
      transition:
        width var(--fluid-duration-fast) var(--fluid-easing-standard),
        height var(--fluid-duration-fast) var(--fluid-easing-standard),
        margin-top var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    input[type="range"]::-moz-range-thumb {
      width: 6px;
      height: 22px;
      background-color: var(--fluid-slider-thumb-color, var(--fluid-accent-base));
      background-image: var(--fluid-gradient-glossy);
      border: none;
      border-radius: 3px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 0.18),
        0 2px 4px rgb(0 0 0 / 0.1),
        inset 0 1px 0 rgb(255 255 255 / 0.3);
      transition:
        width var(--fluid-duration-fast) var(--fluid-easing-standard),
        height var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    /* Hover, thumb thickens to invite the grab. */
    input[type="range"]:hover::-webkit-slider-thumb {
      width: 8px;
      height: 24px;
      margin-top: -8px;
    }
    input[type="range"]:hover::-moz-range-thumb {
      width: 8px;
      height: 24px;
    }

    /* Active, thumb expands plus accent glow halo. */
    input[type="range"]:active::-webkit-slider-thumb {
      width: 10px;
      height: 26px;
      margin-top: -9px;
      box-shadow:
        0 0 0 6px color-mix(in srgb, var(--fluid-slider-thumb-color, var(--fluid-accent-base)) 18%, transparent),
        0 2px 4px rgb(0 0 0 / 0.15);
    }
    input[type="range"]:active::-moz-range-thumb {
      width: 10px;
      height: 26px;
      box-shadow:
        0 0 0 6px color-mix(in srgb, var(--fluid-slider-thumb-color, var(--fluid-accent-base)) 18%, transparent),
        0 2px 4px rgb(0 0 0 / 0.15);
    }

    input[type="range"]:focus-visible::-webkit-slider-thumb {
      box-shadow:
        0 0 0 var(--fluid-slider-focus-ring-width, var(--fluid-focus-ring-width))
          var(--fluid-slider-focus-ring, var(--fluid-focus-ring-color)),
        0 2px 4px rgb(0 0 0 / 0.15);
    }
    input[type="range"]:focus-visible::-moz-range-thumb {
      box-shadow:
        0 0 0 var(--fluid-slider-focus-ring-width, var(--fluid-focus-ring-width))
          var(--fluid-slider-focus-ring, var(--fluid-focus-ring-color)),
        0 2px 4px rgb(0 0 0 / 0.15);
    }

    .value {
      flex-shrink: 0;
      min-width: 2.5rem;
      text-align: right;
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-slider-value-fg, var(--fluid-text-secondary));
      font-variant-numeric: tabular-nums;
    }
  `;

  @query("input") private inputEl!: HTMLInputElement;

  /** Current value as string. */
  @property() override value = "50";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Min value. */
  @property({ type: Number }) min = 0;

  /** Max value. */
  @property({ type: Number }) max = 100;

  /** Step. */
  @property({ type: Number }) step = 1;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Show the current value as a label. */
  @property({ type: Boolean, attribute: "show-value" }) showValue = false;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  /** Format function for the value label and aria-valuetext. */
  @property({ attribute: false }) valueFormatter?: (value: number) => string;

  @state() private numericValue = 50;

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? String((this.min + this.max) / 2);
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.numericValue = Number(this.value);
      this.syncFormValue();
    }
  }

  protected override updated(): void {
    // A native <input type="range"> positions its thumb from value + min + max
    // + step. During the initial render those are committed in template order,
    // so the value can land before min/max/step and get clamped to the default
    // range (thumb stuck at min) while our gradient fill already reflects the
    // real value, they visibly desync. Re-assert the value AFTER the full
    // render commit, when min/max/step are present, so the thumb matches.
    if (this.inputEl && this.inputEl.value !== this.value) {
      this.inputEl.value = this.value;
    }
  }

  private get percent(): number {
    return ((this.numericValue - this.min) / (this.max - this.min)) * 100;
  }

  private handleInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent("fluid-input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  };

  private handleChange = () => {
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  };

  override render(): TemplateResult {
    const pct = Math.max(0, Math.min(100, this.percent));
    // Native <input type="range"> thumbs are "thumb-inset": at value 0 the
    // thumb's LEFT edge sits at the track's left edge (so the thumb's
    // CENTER is half a thumb-width to the right of 0), and at value 100 the
    // thumb's right edge sits flush at the track's right edge. A naive
    // gradient stop at `pct%` would therefore drift away from the thumb's
    // visible center by up to half the thumb width near the endpoints:
    // the fill ends well before / well past where the thumb sits, which
    // reads as broken to anyone looking at the slider statically.
    //
    // Compensate by offsetting the gradient stop by:
    //   (0.5 − pct/100) × THUMB_W
    //, positive at low values (pushing the fill right toward the thumb
    //   center), zero at 50%, negative at high values. The thumb itself
    //   still grows on hover (8px) and active (10px), but the resting
    //   look, what the user sees most of the time, now lines up.
    const THUMB_W = 6;
    const offsetPx = (0.5 - pct / 100) * THUMB_W;
    const stop = `calc(${pct}% + ${offsetPx.toFixed(2)}px)`;
    const trackBg = `linear-gradient(to right,
      var(--fluid-slider-fill-color, var(--fluid-accent-base)) 0%,
      var(--fluid-slider-fill-color, var(--fluid-accent-base)) ${stop},
      var(--fluid-slider-track-color, var(--fluid-color-neutral-200)) ${stop},
      var(--fluid-slider-track-color, var(--fluid-color-neutral-200)) 100%)`;
    const labelText = this.valueFormatter
      ? this.valueFormatter(this.numericValue)
      : this.value;
    return html`
      <div
        part="base"
        class="base ${this.disabled ? "disabled" : ""}"
        style="--track-bg: ${trackBg}"
      >
        <input
          part="input"
          type="range"
          .value=${this.value}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          ?disabled=${this.disabled}
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          aria-valuetext=${ifDefined(this.valueFormatter ? labelText : undefined)}
          @input=${this.handleInput}
          @change=${this.handleChange}
        />
        ${this.showValue ? html`<span class="value">${labelText}</span>` : ""}
      </div>
    `;
  }
}
