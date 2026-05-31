import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Star rating control. Form-associated. Supports half steps, custom symbols
 * via slot, keyboard navigation (left/right arrows), and read-only mode for
 * displaying average ratings.
 *
 * Default symbol is a star; pass your own via the `symbol` slot to use hearts,
 * thumbs, etc.
 *
 * @summary Numeric score expressed as a row of selectable symbols.
 *
 * @slot symbol - Custom symbol used for each star. Defaults to a filled star SVG.
 *
 * @csspart base - The outer container.
 * @csspart star - Each star element.
 *
 * Every styled property reads a component-scoped `--fluid-rating-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-rating-active-color - Color of selected stars. Falls back to --fluid-color-amber-500.
 * @cssproperty --fluid-rating-inactive-color - Color of unselected stars. Falls back to --fluid-color-neutral-300.
 * @cssproperty --fluid-rating-symbol-size - Symbol size. Falls back to 1.5rem.
 * @cssproperty --fluid-rating-gap - Gap between symbols. Falls back to --fluid-space-1.
 * @cssproperty --fluid-rating-focus-ring - Keyboard focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-rating-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-color-amber-500 - Default active (filled) color.
 * @uses-token --fluid-color-neutral-300 - Default inactive color.
 * @uses-token --fluid-space-1 - Default gap between symbols.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum per-symbol hit-target size (24px AA / 44px AAA).
 * @uses-token --fluid-radius-sm - Focus ring corner radius.
 * @uses-token --fluid-duration-fast - Hover-scale transition duration.
 * @uses-token --fluid-easing-standard - Hover-scale transition easing.
 *
 * @fires fluid-change - Fired when the user commits a new rating. detail.value is the new number.
 */
export class FluidRating extends FluidElement {
  static formAssociated = true;
  protected readonly internals: ElementInternals;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  get form(): HTMLFormElement | null {
    return this.internals.form;
  }
  get validity(): ValidityState {
    return this.internals.validity;
  }
  checkValidity(): boolean {
    return this.internals.checkValidity();
  }
  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  formResetCallback(): void {
    this.value = Number(this.getAttribute("value") ?? "0");
  }

  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }
  static override styles = css`
    :host {
      display: inline-flex;
    }

    .base {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-rating-gap, var(--fluid-space-1));
      font-size: var(--fluid-rating-symbol-size, 1.5rem);
      line-height: 1;
      color: var(--fluid-rating-inactive-color, var(--fluid-color-neutral-300));
      border-radius: var(--fluid-radius-sm);
    }

    /*
     * The host carries role="slider" + the keyboard handler, so it's the focus
     * target. Render a visible ring on it that reads --fluid-focus-ring-width
     * (3px at AAA).
     */
    :host(:focus-visible) {
      outline: none;
    }
    :host(:focus-visible) .base {
      outline: var(--fluid-rating-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-rating-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 2px;
    }

    :host([disabled]) .base {
      opacity: 0.5;
    }

    /*
     * SC 2.5.8 Target Size. Each symbol floors its box to --fluid-target-min,
     * so AA keeps the 24px star and AAA grows the per-star hit area (and the
     * symbol with it) to 44px, no per-size override needed.
     */
    .star {
      position: relative;
      display: inline-block;
      width: max(1em, var(--fluid-target-min, 0px));
      height: max(1em, var(--fluid-target-min, 0px));
      cursor: pointer;
      color: inherit;
      transition: transform var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    .star:hover:not(.disabled) {
      transform: scale(1.1);
    }

    .star.disabled {
      cursor: default;
    }

    /* Two stacked symbols, the inactive layer fills the slot fully, and the
       active layer overlays on top, masked from the left to the current value.
       This lets us paint a half-filled star without needing different SVGs. */
    .layer {
      position: absolute;
      inset: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .layer-active {
      color: var(--fluid-rating-active-color, var(--fluid-color-amber-500));
      overflow: hidden;
    }

    /* Default symbol, a star. SVG so it scales cleanly. */
    .symbol {
      width: 100%;
      height: 100%;
      display: inline-block;
    }
  `;

  /** Current value (0 to `max`). Supports decimal values when `precision` < 1. */
  @property({ type: Number }) value = 0;

  /** Maximum value (number of symbols rendered). */
  @property({ type: Number }) max = 5;

  /** Smallest selectable step. Use 0.5 for half-stars. */
  @property({ type: Number }) precision = 1;

  /** Read-only mode, clicks ignored, used to display averages. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Form control name. */
  @property({ reflect: true }) name = "";

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = "Rating";

  @state() private hoverValue: number | null = null;

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.internals.setFormValue(String(this.value));
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "slider");
    this.setAttribute("aria-valuemin", "0");
    this.tabIndex = this.readonly || this.disabled ? -1 : 0;
    this.addEventListener("keydown", this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.handleKeyDown);
  }

  protected override updated(): void {
    this.setAttribute("aria-valuemax", String(this.max));
    this.setAttribute("aria-valuenow", String(this.value));
    this.tabIndex = this.readonly || this.disabled ? -1 : 0;
  }

  private clamp(v: number): number {
    return Math.max(0, Math.min(this.max, Math.round(v / this.precision) * this.precision));
  }

  private commit(next: number): void {
    if (this.readonly || this.disabled) return;
    const clamped = this.clamp(next);
    if (clamped === this.value) return;
    this.value = clamped;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleClick = (e: MouseEvent, index: number) => {
    if (this.readonly || this.disabled) return;
    // Half-step support: if click is on the left half, set to index + 0.5
    if (this.precision < 1) {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const isLeftHalf = e.clientX - rect.left < rect.width / 2;
      this.commit(index + (isLeftHalf ? 0.5 : 1));
    } else {
      this.commit(index + 1);
    }
  };

  private handleHover = (e: MouseEvent, index: number) => {
    if (this.readonly || this.disabled) return;
    if (this.precision < 1) {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const isLeftHalf = e.clientX - rect.left < rect.width / 2;
      this.hoverValue = index + (isLeftHalf ? 0.5 : 1);
    } else {
      this.hoverValue = index + 1;
    }
  };

  private handleLeave = () => {
    this.hoverValue = null;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.readonly || this.disabled) return;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        this.commit(this.value + this.precision);
        return;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        this.commit(this.value - this.precision);
        return;
      case "Home":
        e.preventDefault();
        this.commit(0);
        return;
      case "End":
        e.preventDefault();
        this.commit(this.max);
        return;
    }
  };

  private renderSymbol(): TemplateResult {
    return html`
      <svg class="symbol" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    `;
  }

  override render(): TemplateResult {
    const displayValue = this.hoverValue ?? this.value;
    return html`
      <div part="base" class="base" @pointerleave=${this.handleLeave}>
        ${Array.from({ length: this.max }, (_, i) => {
          const fill = Math.max(0, Math.min(1, displayValue - i));
          // Stars are presentation-only, the host element carries the slider
          // role + keyboard handler, so nesting interactive buttons here would
          // trip axe's nested-interactive rule and confuse screen readers.
          return html`
            <span
              part="star"
              class="star ${this.readonly || this.disabled ? "disabled" : ""}"
              role="presentation"
              @click=${(e: MouseEvent) => this.handleClick(e, i)}
              @pointermove=${(e: MouseEvent) => this.handleHover(e, i)}
            >
              <span class="layer">${html`<slot name="symbol">${this.renderSymbol()}</slot>`}</span>
              <span class="layer layer-active" style="width: ${fill * 100}%;">
                ${this.renderSymbol()}
              </span>
            </span>
          `;
        })}
      </div>
    `;
  }
}
