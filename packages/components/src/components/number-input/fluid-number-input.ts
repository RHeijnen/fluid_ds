import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidFormAssociated } from "../../internal/form-associated.js";

registerIcon(
  "chevron-up",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m18 15-6-6-6 6"/></svg>`
);
registerIcon(
  "chevron-down",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>`
);

/**
 * Numeric input with stepper buttons. Uses the same field shell as
 * `<fluid-input>` for visual consistency, but exposes increment/decrement
 * controls and constrains input to numeric values.
 *
 * Form-associated.
 *
 * @summary Numeric field with stepper buttons.
 *
 * @csspart base - The outer container.
 * @csspart input - The internal numeric input.
 * @csspart steppers - The stepper buttons wrapper.
 * @csspart stepper-up - The increment button.
 * @csspart stepper-down - The decrement button.
 *
 * Every styled property reads a component-scoped `--fluid-number-input-*` token
 * that falls back to a main semantic var (the override ladder). The
 * `@cssproperty` list is the complete set of override knobs; `@uses-token` is
 * every main var they fall back to.
 *
 * @cssproperty --fluid-number-input-bg - Field background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-number-input-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-number-input-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-number-input-border-hover - Border on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-number-input-border-focus - Border when focused. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-number-input-border-width - Border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-number-input-radius - Corner radius. Falls back to --fluid-field-border-radius.
 * @cssproperty --fluid-number-input-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-number-input-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-number-input-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-number-input-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-number-input-invalid-border - Border when invalid. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-number-input-stepper-bg - Stepper background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-number-input-stepper-fg - Stepper foreground. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-number-input-stepper-hover-bg - Stepper hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-number-input-stepper-hover-fg - Stepper hover foreground. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-number-input-stepper-border - Divider between input and steppers. Falls back to --fluid-border-default.
 *
 * @uses-token --fluid-surface-base - Default field + stepper background.
 * @uses-token --fluid-surface-muted - Stepper hover background.
 * @uses-token --fluid-border-default - Default border + stepper dividers.
 * @uses-token --fluid-border-strong - Border on hover.
 * @uses-token --fluid-accent-base - Border when focused.
 * @uses-token --fluid-danger-base - Border/ring when invalid (theme-independent).
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum field height floor (24px AA / 44px AAA).
 * @uses-token --fluid-text-primary - Input text.
 * @uses-token --fluid-text-secondary - Stepper + placeholder text.
 * @uses-token --fluid-field-border-width - Default border width.
 * @uses-token --fluid-field-border-radius - Default corner radius.
 * @uses-token --fluid-field-height-md - Default field height.
 * @uses-token --fluid-field-padding-x-md - Input inline padding.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-duration-fast - Border/shadow transition duration.
 * @uses-token --fluid-easing-standard - Border/shadow transition easing.
 *
 * @fires fluid-input - Fired on every keystroke / stepper click.
 * @fires fluid-change - Fired when the value is committed.
 */
export class FluidNumberInput extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: inline-flex;
      width: 100%;
      max-width: 100%;
    }

    /*
     * Override ladder: every styled property reads a --fluid-number-input-*
     * token that falls back to a main semantic var. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
    .base {
      display: inline-flex;
      align-items: stretch;
      width: 100%;
      background: var(--fluid-number-input-bg, var(--fluid-surface-base));
      border: var(--fluid-number-input-border-width, var(--fluid-field-border-width)) solid
        var(--fluid-number-input-border, var(--fluid-border-default));
      border-radius: var(--fluid-number-input-radius, var(--fluid-field-border-radius));
      overflow: hidden;
      transition:
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
      font-family: var(--fluid-number-input-font-family, var(--fluid-font-family-sans));
      color: var(--fluid-number-input-fg, var(--fluid-text-primary));
      /*
       * min-height reads --fluid-target-min as a floor (max()), so AAA
       * (data-fluid-conformance="aaa") lifts the field to a 44px target
       * (SC 2.5.5) while AA leaves the design height untouched.
       */
      min-height: max(var(--fluid-field-height-md, 2.25rem), var(--fluid-target-min, 0px));
    }

    .base:hover:not(.disabled):not(.focused) {
      border-color: var(--fluid-number-input-border-hover, var(--fluid-border-strong));
    }

    .base.focused {
      border-color: var(--fluid-number-input-border-focus, var(--fluid-accent-base));
      box-shadow: 0 0 0
        var(--fluid-number-input-focus-ring-width, var(--fluid-focus-ring-width))
        var(--fluid-number-input-focus-ring, var(--fluid-focus-ring-color));
    }

    .base.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /*
     * Invalid uses the theme-independent danger tone (NOT a hard-coded red),
     * so it stays correct across brands + dark mode. Validity is also conveyed
     * via aria-invalid + the message, never by color alone (SC 1.4.1).
     */
    .base.invalid {
      border-color: var(--fluid-number-input-invalid-border, var(--fluid-danger-base));
    }
    .base.invalid.focused {
      box-shadow: 0 0 0
        var(--fluid-number-input-focus-ring-width, var(--fluid-focus-ring-width))
        color-mix(
          in srgb,
          var(--fluid-number-input-invalid-border, var(--fluid-danger-base)) 35%,
          transparent
        );
    }

    input {
      all: unset;
      flex: 1 1 auto;
      min-width: 0;
      box-sizing: border-box;
      padding: 0 var(--fluid-field-padding-x-md);
      font: inherit;
      color: inherit;
      font-variant-numeric: tabular-nums;
      text-align: left;
      -moz-appearance: textfield; /* Hide native stepper in Firefox */
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input::placeholder {
      color: var(--fluid-number-input-placeholder-fg, var(--fluid-text-secondary));
    }

    .steppers {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      border-left: var(--fluid-field-border-width) solid
        var(--fluid-number-input-stepper-border, var(--fluid-border-default));
    }

    .stepper {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      flex: 1 1 0;
      cursor: pointer;
      color: var(--fluid-number-input-stepper-fg, var(--fluid-text-secondary));
      background: var(--fluid-number-input-stepper-bg, var(--fluid-surface-base));
      transition: background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    .stepper:hover:not(.disabled) {
      background: var(--fluid-number-input-stepper-hover-bg, var(--fluid-surface-muted));
      color: var(--fluid-number-input-stepper-hover-fg, var(--fluid-text-primary));
    }
    .stepper:focus-visible {
      outline: var(--fluid-number-input-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-number-input-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: -2px;
    }
    .stepper:not(:last-child) {
      border-bottom: var(--fluid-field-border-width) solid
        var(--fluid-number-input-stepper-border, var(--fluid-border-default));
    }
    .stepper.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .stepper fluid-icon {
      width: 0.85em;
      height: 0.85em;
    }
  `;

  @query("input") private inputEl!: HTMLInputElement;

  /** Current value (as string for form submission). */
  @property() override value = "";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Placeholder text. */
  @property() placeholder = "";

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Read-only state. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Required for form validation. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Minimum value. */
  @property({ type: Number }) min?: number;

  /** Maximum value. */
  @property({ type: Number }) max?: number;

  /** Step size (default 1). */
  @property({ type: Number }) step = 1;

  /** Hide stepper buttons (when you only want the numeric formatting / validation). */
  @property({ type: Boolean, attribute: "no-steppers" }) noSteppers = false;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private focused = false;
  @state() private invalid = false;

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "";
    this.invalid = false;
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
    if (changed.has("value")) this.syncFormValue();
  }

  protected override updated(): void {
    this.refreshValidity();
  }

  private refreshValidity(): void {
    if (!this.inputEl) return;
    if (!this.inputEl.validity.valid) {
      this.setValidity(flagsFromValidity(this.inputEl.validity), this.inputEl.validationMessage, this.inputEl);
      this.invalid = true;
    } else {
      this.setValidity({});
      this.invalid = false;
    }
  }

  private clampedValue(next: number): number {
    let v = next;
    if (this.min !== undefined) v = Math.max(this.min, v);
    if (this.max !== undefined) v = Math.min(this.max, v);
    return v;
  }

  /** Increment by `step`, clamped to min/max. */
  stepUp(): void {
    if (this.disabled || this.readonly) return;
    const current = Number(this.value || 0);
    const next = this.clampedValue(current + this.step);
    if (Number.isFinite(next)) {
      this.value = String(next);
      this.emit("fluid-input");
      this.emit("fluid-change");
    }
  }

  /** Decrement by `step`, clamped to min/max. */
  stepDown(): void {
    if (this.disabled || this.readonly) return;
    const current = Number(this.value || 0);
    const next = this.clampedValue(current - this.step);
    if (Number.isFinite(next)) {
      this.value = String(next);
      this.emit("fluid-input");
      this.emit("fluid-change");
    }
  }

  private emit(name: string): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
    this.emit("fluid-input");
  };

  private handleChange = () => this.emit("fluid-change");
  private handleFocus = () => (this.focused = true);
  private handleBlur = () => {
    this.focused = false;
    this.refreshValidity();
  };

  override render(): TemplateResult {
    const upDisabled =
      this.disabled || (this.max !== undefined && Number(this.value || 0) >= this.max);
    const downDisabled =
      this.disabled || (this.min !== undefined && Number(this.value || 0) <= this.min);
    return html`
      <div
        part="base"
        class=${classMap({
          base: true,
          focused: this.focused,
          disabled: this.disabled,
          invalid: this.invalid
        })}
      >
        <input
          part="input"
          type="number"
          inputmode="numeric"
          .value=${live(this.value)}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          min=${ifDefined(this.min)}
          max=${ifDefined(this.max)}
          step=${this.step}
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          aria-invalid=${this.invalid ? "true" : "false"}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        />
        ${this.noSteppers
          ? ""
          : html`
              <div part="steppers" class="steppers">
                <button
                  part="stepper-up"
                  class="stepper ${upDisabled ? "disabled" : ""}"
                  type="button"
                  tabindex="-1"
                  aria-label="Increase"
                  ?disabled=${upDisabled}
                  @click=${() => this.stepUp()}
                >
                  <fluid-icon name="chevron-up"></fluid-icon>
                </button>
                <button
                  part="stepper-down"
                  class="stepper ${downDisabled ? "disabled" : ""}"
                  type="button"
                  tabindex="-1"
                  aria-label="Decrease"
                  ?disabled=${downDisabled}
                  @click=${() => this.stepDown()}
                >
                  <fluid-icon name="chevron-down"></fluid-icon>
                </button>
              </div>
            `}
      </div>
    `;
  }
}

function flagsFromValidity(v: ValidityState): ValidityStateFlags {
  return {
    valueMissing: v.valueMissing,
    badInput: v.badInput,
    rangeOverflow: v.rangeOverflow,
    rangeUnderflow: v.rangeUnderflow,
    stepMismatch: v.stepMismatch,
    customError: v.customError
  };
}
