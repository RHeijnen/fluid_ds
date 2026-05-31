import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";

/**
 * Two- or three-state checkbox. Toggles a single option on/off, or sits in
 * an indeterminate state to indicate "partial selection" of a group of
 * sub-checkboxes (e.g. some items selected in a list).
 *
 * Form-associated. Submits its `value` (default "on") when checked.
 *
 * @summary Two- / three-state form checkbox.
 *
 * @slot - Optional visible label rendered to the right of the box.
 *
 * @csspart base - The outer label wrapper.
 * @csspart control - The square indicator.
 * @csspart label - The label slot wrapper.
 *
 * Every styled property reads a component-scoped `--fluid-checkbox-*` token
 * that falls back to a main semantic var (the override ladder). The
 * `@cssproperty` list is the complete set of override knobs; `@uses-token` is
 * every main var they fall back to.
 *
 * @cssproperty --fluid-checkbox-bg - Box background when unchecked. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-checkbox-bg-on - Box background when checked/indeterminate. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-checkbox-border - Box border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-checkbox-border-hover - Box border on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-checkbox-border-width - Box border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-checkbox-radius - Box corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-checkbox-fg - Label text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-checkbox-check-color - Check mark / dash color. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-checkbox-gap - Gap between box and label. Falls back to --fluid-space-2.
 * @cssproperty --fluid-checkbox-font-family - Label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-checkbox-font-size - Label font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-checkbox-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-checkbox-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-surface-base - Default unchecked background.
 * @uses-token --fluid-border-default - Default border.
 * @uses-token --fluid-border-strong - Border on hover.
 * @uses-token --fluid-accent-base - Checked background.
 * @uses-token --fluid-accent-text - Check mark color.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum hit-target height (24px AA / 44px AAA).
 * @uses-token --fluid-text-primary - Label text color.
 * @uses-token --fluid-field-border-width - Default box border width.
 * @uses-token --fluid-radius-sm - Box corner radius.
 * @uses-token --fluid-space-2 - Gap between box and label.
 * @uses-token --fluid-font-family-sans - Label font family.
 * @uses-token --fluid-font-size-md - Label font size.
 * @uses-token --fluid-gradient-glossy - Checked-box sheen.
 * @uses-token --fluid-duration-fast - State transition duration.
 * @uses-token --fluid-easing-standard - State transition easing.
 *
 * @fires fluid-change - Fired when the checked state changes. detail.checked is the new boolean.
 */
export class FluidCheckbox extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: inline-flex;
    }

    :host([hidden]) {
      display: none;
    }

    /*
     * Override ladder: every styled property reads a --fluid-checkbox-* token
     * that falls back to a main semantic var. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
    .base {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-checkbox-gap, var(--fluid-space-2));
      cursor: pointer;
      user-select: none;
      color: var(--fluid-checkbox-fg, var(--fluid-text-primary));
      font-family: var(--fluid-checkbox-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-checkbox-font-size, var(--fluid-font-size-md));
      /*
       * SC 2.5.8 Target Size. The box is only ~18px, so the clickable <label>
       * reads --fluid-target-min as a floor, a label-less checkbox still
       * presents a >=24px (AA) / 44px (AAA) hit target without enlarging the
       * box graphic.
       */
      min-height: var(--fluid-target-min, 0px);
    }

    .base.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .control {
      position: relative;
      flex-shrink: 0;
      width: 1.125rem;
      height: 1.125rem;
      background-color: var(--fluid-checkbox-bg, var(--fluid-surface-base));
      border: var(--fluid-checkbox-border-width, var(--fluid-field-border-width, 1px)) solid
        var(--fluid-checkbox-border, var(--fluid-border-default));
      border-radius: var(--fluid-checkbox-radius, var(--fluid-radius-sm));
      transition:
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    .base:hover:not(.disabled) .control {
      border-color: var(--fluid-checkbox-border-hover, var(--fluid-border-strong));
    }

    .base.checked .control,
    .base.indeterminate .control {
      background-color: var(--fluid-checkbox-bg-on, var(--fluid-accent-base));
      background-image: var(--fluid-gradient-glossy);
      border-color: var(--fluid-checkbox-bg-on, var(--fluid-accent-base));
    }

    .base.focused .control {
      box-shadow: 0 0 0
        var(--fluid-checkbox-focus-ring-width, var(--fluid-focus-ring-width))
        var(--fluid-checkbox-focus-ring, var(--fluid-focus-ring-color));
    }

    @media (prefers-reduced-motion: reduce) {
      .control,
      .check,
      .dash {
        transition-duration: 0s;
      }
    }

    /* Check mark (SVG path-drawn so it animates cleanly). */
    .check {
      position: absolute;
      inset: 0;
      stroke: var(--fluid-checkbox-check-color, var(--fluid-accent-text));
      stroke-width: 2.5;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 16;
      stroke-dashoffset: 16;
      transition: stroke-dashoffset var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    .base.checked .check {
      stroke-dashoffset: 0;
    }

    /* Indeterminate uses a horizontal bar instead of the check. */
    .dash {
      position: absolute;
      left: 25%;
      right: 25%;
      top: 50%;
      height: 2px;
      background: var(--fluid-checkbox-check-color, var(--fluid-accent-text));
      transform: translateY(-50%) scaleX(0);
      transform-origin: center;
      border-radius: 2px;
      transition: transform var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    .base.indeterminate .dash {
      transform: translateY(-50%) scaleX(1);
    }

    /* Visually hidden but focusable input. */
    input {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }

    ::slotted(*) {
      pointer-events: none;
    }
  `;

  @query("input") private inputEl!: HTMLInputElement;

  /** Checked state. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Indeterminate (mixed) state. Visual only, `checked` still controls form value. */
  @property({ type: Boolean, reflect: true }) indeterminate = false;

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Value submitted when checked. */
  @property() override value = "on";

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required state for form validation. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Accessible label when no slot content. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private focused = false;

  override formResetCallback(): void {
    this.checked = this.hasAttribute("checked");
    this.indeterminate = this.hasAttribute("indeterminate");
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    this.checked = state === this.value;
  }

  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  override blur(): void {
    this.inputEl?.blur();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("checked") || changed.has("value")) {
      this.internals.setFormValue(this.checked ? this.value : null);
    }
    if (changed.has("required") || changed.has("checked")) {
      if (this.required && !this.checked) {
        this.setValidity({ valueMissing: true }, "Please check this box.");
      } else {
        this.setValidity({});
      }
    }
  }

  protected override updated(): void {
    if (this.inputEl) this.inputEl.indeterminate = this.indeterminate;
    if (this.required && !this.checked && this.inputEl) {
      this.setValidity({ valueMissing: true }, "Please check this box.", this.inputEl);
    }
  }

  private handleChange = () => {
    this.checked = this.inputEl.checked;
    // Checking always clears indeterminate (consistent with native behavior).
    this.indeterminate = false;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true
      })
    );
  };

  private handleFocus = () => (this.focused = true);
  private handleBlur = () => (this.focused = false);

  override render(): TemplateResult {
    return html`
      <label
        part="base"
        class=${classMap({
          base: true,
          checked: this.checked,
          indeterminate: this.indeterminate,
          disabled: this.disabled,
          focused: this.focused
        })}
      >
        <input
          type="checkbox"
          .checked=${this.checked}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-checked=${this.indeterminate
            ? "mixed"
            : this.checked
              ? "true"
              : "false"}
          aria-label=${this.ariaLabel ?? ""}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        />
        <span part="control" class="control">
          <svg class="check" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M4 9.5 L8 13 L14 5.5" />
          </svg>
          <span class="dash"></span>
        </span>
        <span part="label"><slot></slot></span>
      </label>
    `;
  }
}
