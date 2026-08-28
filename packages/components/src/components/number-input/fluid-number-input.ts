import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons/registry";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { FormDisabledController } from "../../internal/form-disabled.js";
import {
  FIELD_HELP_ID,
  fieldChromeStyles,
  renderFieldChrome
} from "../../internal/field-chrome.js";

export type FluidNumberInputSize = "sm" | "md" | "lg";
export type FluidNumberInputStepperVariant = "plus-minus" | "chevrons";

registerIcon(
  "number-input-plus",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`
);
registerIcon(
  "number-input-minus",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg>`
);
registerIcon(
  "number-input-chevron-up",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m18 15-6-6-6 6"/></svg>`
);
registerIcon(
  "number-input-chevron-down",
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
 * @slot prefix - Rendered before the numeric value (currency symbols, icons, etc.).
 * @slot suffix - Rendered after the numeric value (units, icons, etc.).
 *
 * @csspart label - The optional visible label.
 * @csspart help-text - Optional help text below the field.
 * @csspart base - The outer container.
 * @csspart input - The internal numeric input.
 * @csspart prefix - The prefix affix box.
 * @csspart suffix - The suffix affix box.
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
 * @cssproperty --fluid-number-input-font-size - Font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-number-input-font-size-sm - Small font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-number-input-font-size-md - Medium font size. Falls back to --fluid-number-input-font-size, then --fluid-font-size-md.
 * @cssproperty --fluid-number-input-font-size-lg - Large font size. Falls back to --fluid-font-size-lg.
 * @cssproperty --fluid-number-input-line-height - Input line height. Falls back to --fluid-font-line-height-normal.
 * @cssproperty --fluid-number-input-height - Field height. Falls back to --fluid-field-height-md.
 * @cssproperty --fluid-number-input-height-sm - Small field height. Falls back to --fluid-field-height-sm.
 * @cssproperty --fluid-number-input-height-md - Medium field height. Falls back to --fluid-number-input-height, then --fluid-field-height-md.
 * @cssproperty --fluid-number-input-height-lg - Large field height. Falls back to --fluid-field-height-lg.
 * @cssproperty --fluid-number-input-padding-x - Input horizontal padding. Falls back to --fluid-field-padding-x-md.
 * @cssproperty --fluid-number-input-padding-x-sm - Small horizontal padding. Falls back to --fluid-field-padding-x-sm.
 * @cssproperty --fluid-number-input-padding-x-md - Medium horizontal padding. Falls back to --fluid-number-input-padding-x, then --fluid-field-padding-x-md.
 * @cssproperty --fluid-number-input-padding-x-lg - Large horizontal padding. Falls back to --fluid-field-padding-x-lg.
 * @cssproperty --fluid-number-input-target-min - Minimum target-size floor. Falls back to --fluid-target-min.
 * @cssproperty --fluid-number-input-duration - Transition duration. Falls back to --fluid-duration-fast.
 * @cssproperty --fluid-number-input-easing - Transition easing. Falls back to --fluid-easing-standard.
 * @cssproperty --fluid-number-input-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-number-input-focus-ring-color - Focus ring color. Falls back to the legacy --fluid-number-input-focus-ring, then --fluid-focus-ring-color.
 * @cssproperty --fluid-number-input-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-number-input-invalid-border - Border when invalid. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-number-input-disabled-bg - Disabled field background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-number-input-disabled-fg - Disabled field foreground. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-number-input-disabled-opacity - Disabled opacity. Defaults to 0.5.
 * @cssproperty --fluid-number-input-stepper-bg - Stepper background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-number-input-stepper-fg - Stepper foreground. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-number-input-stepper-hover-bg - Stepper hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-number-input-stepper-hover-fg - Stepper hover foreground. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-number-input-stepper-border - Divider between input and steppers. Falls back to --fluid-border-default.
 * @cssproperty --fluid-number-input-affix-bg - Prefix/suffix background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-number-input-affix-fg - Prefix/suffix foreground. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-number-input-affix-border - Prefix/suffix divider. Falls back to --fluid-border-default.
 * @cssproperty --fluid-number-input-stepper-size - Stepper inline size. Falls back to the field height.
 * @cssproperty --fluid-number-input-stepper-size-sm - Small stepper inline size. Falls back to the small field height.
 * @cssproperty --fluid-number-input-stepper-size-md - Medium stepper inline size. Falls back to --fluid-number-input-stepper-size, then the medium field height.
 * @cssproperty --fluid-number-input-stepper-size-lg - Large stepper inline size. Falls back to the large field height.
 * @cssproperty --fluid-number-input-stepper-icon-size - Stepper icon size. Defaults to 0.85em.
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
 * @uses-token --fluid-font-size-md - Default font size.
 * @uses-token --fluid-duration-fast - Border/shadow transition duration.
 * @uses-token --fluid-easing-standard - Border/shadow transition easing.
 *
 * @fires fluid-input - Fired on every keystroke / stepper click.
 * @fires fluid-change - Fired when the value is committed.
 */
export class FluidNumberInput extends FluidFormAssociated {
  private readonly formDisabled = new FormDisabledController(this);
  // Native constraint validation must be able to focus the shadow control.
  static override shadowRootOptions: ShadowRootInit = {
    ...FluidFormAssociated.shadowRootOptions,
    delegatesFocus: true
  };

  static override styles = [
    fieldChromeStyles,
    css`
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
      .size-sm {
        --_fluid-number-input-font-size: var(
          --fluid-number-input-font-size-sm,
          var(--fluid-font-size-sm)
        );
        --_fluid-number-input-height: var(
          --fluid-number-input-height-sm,
          var(--fluid-field-height-sm, 1.75rem)
        );
        --_fluid-number-input-padding-x: var(
          --fluid-number-input-padding-x-sm,
          var(--fluid-field-padding-x-sm)
        );
        --_fluid-number-input-stepper-size: var(
          --fluid-number-input-stepper-size-sm,
          var(--fluid-number-input-height-sm, var(--fluid-field-height-sm, 1.75rem))
        );
      }
      .size-md {
        --_fluid-number-input-font-size: var(
          --fluid-number-input-font-size-md,
          var(--fluid-number-input-font-size, var(--fluid-font-size-md))
        );
        --_fluid-number-input-height: var(
          --fluid-number-input-height-md,
          var(--fluid-number-input-height, var(--fluid-field-height-md, 2.25rem))
        );
        --_fluid-number-input-padding-x: var(
          --fluid-number-input-padding-x-md,
          var(--fluid-number-input-padding-x, var(--fluid-field-padding-x-md))
        );
        --_fluid-number-input-stepper-size: var(
          --fluid-number-input-stepper-size-md,
          var(
            --fluid-number-input-stepper-size,
            var(
              --fluid-number-input-height-md,
              var(--fluid-number-input-height, var(--fluid-field-height-md, 2.25rem))
            )
          )
        );
      }
      .size-lg {
        --_fluid-number-input-font-size: var(
          --fluid-number-input-font-size-lg,
          var(--fluid-font-size-lg)
        );
        --_fluid-number-input-height: var(
          --fluid-number-input-height-lg,
          var(--fluid-field-height-lg, 2.75rem)
        );
        --_fluid-number-input-padding-x: var(
          --fluid-number-input-padding-x-lg,
          var(--fluid-field-padding-x-lg)
        );
        --_fluid-number-input-stepper-size: var(
          --fluid-number-input-stepper-size-lg,
          var(--fluid-number-input-height-lg, var(--fluid-field-height-lg, 2.75rem))
        );
      }

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
          border-color var(--fluid-number-input-duration, var(--fluid-duration-fast))
            var(--fluid-number-input-easing, var(--fluid-easing-standard)),
          box-shadow var(--fluid-number-input-duration, var(--fluid-duration-fast))
            var(--fluid-number-input-easing, var(--fluid-easing-standard));
        font-family: var(--fluid-number-input-font-family, var(--fluid-font-family-sans));
        font-size: var(--_fluid-number-input-font-size);
        color: var(--fluid-number-input-fg, var(--fluid-text-primary));
        /*
       * min-height reads --fluid-target-min as a floor (max()), so AAA
       * (data-fluid-conformance="aaa") lifts the field to a 44px target
       * (SC 2.5.5) while AA leaves the design height untouched.
       */
        min-height: max(
          var(--_fluid-number-input-height),
          var(--fluid-number-input-target-min, var(--fluid-target-min, 0px))
        );
      }

      .base:hover:not(.disabled):not(.focused) {
        border-color: var(--fluid-number-input-border-hover, var(--fluid-border-strong));
      }

      .base.focused {
        border-color: var(--fluid-number-input-border-focus, var(--fluid-accent-base));
        box-shadow: 0 0 0 var(--fluid-number-input-focus-ring-width, var(--fluid-focus-ring-width))
          var(
            --fluid-number-input-focus-ring-color,
            var(--fluid-number-input-focus-ring, var(--fluid-focus-ring-color))
          );
      }

      .base.disabled {
        background: var(--fluid-number-input-disabled-bg, var(--fluid-surface-subtle));
        color: var(--fluid-number-input-disabled-fg, var(--fluid-text-secondary));
        opacity: var(--fluid-number-input-disabled-opacity, 0.5);
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
        box-shadow: 0 0 0 var(--fluid-number-input-focus-ring-width, var(--fluid-focus-ring-width))
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
        padding: 0 var(--_fluid-number-input-padding-x);
        font: inherit;
        color: inherit;
        line-height: var(--fluid-number-input-line-height, var(--fluid-font-line-height-normal));
        font-variant-numeric: tabular-nums;
        text-align: start;
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

      .affix {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        align-self: stretch;
        flex-shrink: 0;
        padding: 0 var(--_fluid-number-input-padding-x);
        color: var(--fluid-number-input-affix-fg, var(--fluid-text-secondary));
        background: var(--fluid-number-input-affix-bg, var(--fluid-surface-subtle));
      }
      .affix[hidden] {
        display: none;
      }
      .prefix {
        border-inline-end: var(--fluid-number-input-border-width, var(--fluid-field-border-width))
          solid var(--fluid-number-input-affix-border, var(--fluid-border-default));
      }
      .suffix {
        border-inline-start: var(--fluid-number-input-border-width, var(--fluid-field-border-width))
          solid var(--fluid-number-input-affix-border, var(--fluid-border-default));
      }
      .affix.flush {
        padding: 0;
        align-items: stretch;
      }
      ::slotted([slot="prefix"]),
      ::slotted([slot="suffix"]) {
        margin: 0;
      }

      .steppers {
        display: flex;
        flex-direction: row;
        flex-shrink: 0;
        border-inline-start: var(--fluid-number-input-border-width, var(--fluid-field-border-width))
          solid var(--fluid-number-input-stepper-border, var(--fluid-border-default));
      }

      .steppers.chevrons {
        flex-direction: column;
        width: var(--_fluid-number-input-stepper-size);
      }

      .stepper {
        all: unset;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        /*
       * Each stepper stays a real pointer target (SC 2.5.8 AA = 24px,
       * SC 2.5.5 AAA = 44px). The controls sit side by side so both can use the
       * field's full height without making NumberInput taller than other form
       * controls. Width and height both honor the active conformance floor.
       */
        width: var(--_fluid-number-input-stepper-size);
        min-width: max(
          var(--_fluid-number-input-stepper-size),
          var(--fluid-number-input-target-min, var(--fluid-target-min, 0px))
        );
        min-height: var(--fluid-number-input-target-min, var(--fluid-target-min, 0px));
        flex: 0 0 auto;
        cursor: pointer;
        color: var(--fluid-number-input-stepper-fg, var(--fluid-text-secondary));
        background: var(--fluid-number-input-stepper-bg, var(--fluid-surface-base));
        transition:
          background-color var(--fluid-number-input-duration, var(--fluid-duration-fast))
            var(--fluid-number-input-easing, var(--fluid-easing-standard)),
          color var(--fluid-number-input-duration, var(--fluid-duration-fast))
            var(--fluid-number-input-easing, var(--fluid-easing-standard));
      }
      .stepper:hover:not(.disabled) {
        background: var(--fluid-number-input-stepper-hover-bg, var(--fluid-surface-muted));
        color: var(--fluid-number-input-stepper-hover-fg, var(--fluid-text-primary));
      }
      .stepper:focus-visible {
        outline: var(--fluid-number-input-focus-ring-width, var(--fluid-focus-ring-width)) solid
          var(
            --fluid-number-input-focus-ring-color,
            var(--fluid-number-input-focus-ring, var(--fluid-focus-ring-color))
          );
        outline-offset: -2px;
      }
      .stepper:not(:last-child) {
        border-inline-end: var(--fluid-number-input-border-width, var(--fluid-field-border-width))
          solid var(--fluid-number-input-stepper-border, var(--fluid-border-default));
      }
      .steppers.chevrons .stepper {
        width: 100%;
        min-width: 100%;
        min-height: 0;
        flex: 1 1 0;
      }
      .steppers.chevrons .stepper:not(:last-child) {
        border-inline-end: 0;
        border-block-end: var(--fluid-number-input-border-width, var(--fluid-field-border-width))
          solid var(--fluid-number-input-stepper-border, var(--fluid-border-default));
      }
      .stepper.disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .stepper fluid-icon {
        width: var(--fluid-number-input-stepper-icon-size, 0.85em);
        height: var(--fluid-number-input-stepper-icon-size, 0.85em);
      }
    `
  ];

  @query("input") private inputEl!: HTMLInputElement;

  /** Optional visible label. */
  @property() label = "";

  /** Help text rendered below the field and announced by the input. */
  @property({ attribute: "help-text" }) helpText = "";

  /** Field size, aligned with `<fluid-input>`. */
  @property({ reflect: true }) size: FluidNumberInputSize = "md";

  /** Stepper treatment: accessible full-height buttons or compact native-style chevrons. */
  @property({ attribute: "stepper-variant", reflect: true })
  stepperVariant: FluidNumberInputStepperVariant = "plus-minus";

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

  /** Browser autofill hint. Omitted by default. */
  @property() autocomplete = "";

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private focused = false;
  @state() private invalid = false;
  @state() private hasPrefix = false;
  @state() private hasSuffix = false;
  @state() private prefixFlush = false;
  @state() private suffixFlush = false;

  constructor() {
    super();
    this.addEventListener("invalid", this.handleInvalid);
  }

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "";
    this.invalid = false;
  }

  override formDisabledCallback(disabled: boolean): void {
    this.formDisabled.preserve(
      disabled,
      () => this.disabled,
      (value) => (this.disabled = value)
    );
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      const canonical = this.validationControl()?.value ?? "";
      if (this.value !== canonical) this.value = canonical;
      this.syncFormValue();
    }
    if (
      (
        [
          "value",
          "disabled",
          "readonly",
          "required",
          "min",
          "max",
          "step"
        ] as (keyof FluidNumberInput)[]
      ).some((property) => changed.has(property))
    ) {
      this.refreshValidity(this.validationControl());
    }
  }

  protected override firstUpdated(): void {
    this.refreshValidity();
  }

  private validationControl(): HTMLInputElement | undefined {
    const control = this.inputEl ?? this.ownerDocument?.createElement("input");
    if (!control) return;
    control.type = "number";
    control.value = this.value;
    control.disabled = this.disabled;
    control.readOnly = this.readonly;
    control.required = this.required;
    for (const [name, value] of [
      ["min", this.min],
      ["max", this.max],
      ["step", this.effectiveStep()]
    ] as const) {
      if (value === undefined || !Number.isFinite(value)) control.removeAttribute(name);
      else control.setAttribute(name, String(value));
    }
    return control;
  }

  private refreshValidity(control = this.inputEl, showInvalid = this.invalid): void {
    if (!control) return;
    if (!control.validity.valid) {
      this.setValidity(
        flagsFromValidity(control.validity),
        control.validationMessage,
        this.inputEl ?? undefined
      );
      this.invalid = showInvalid;
    } else {
      this.setValidity({});
      this.invalid = false;
    }
  }

  private clampedValue(next: number): number {
    let v = next;
    if (this.min !== undefined && Number.isFinite(this.min)) v = Math.max(this.min, v);
    if (this.max !== undefined && Number.isFinite(this.max)) v = Math.min(this.max, v);
    return v;
  }

  /** Native number inputs treat a missing or non-positive step as their default step of 1. */
  private effectiveStep(): number {
    return Number.isFinite(this.step) && this.step > 0 ? this.step : 1;
  }

  /** Increment by `step`, clamped to min/max. */
  stepUp(): void {
    if (this.disabled || this.readonly) return;
    const current = Number(this.value || 0);
    const next = this.clampedValue(current + this.effectiveStep());
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
    const next = this.clampedValue(current - this.effectiveStep());
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

  private handlePrefixChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasPrefix = slotHasContent(slot);
    this.prefixFlush = slotHasFlush(slot);
  };

  private handleSuffixChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasSuffix = slotHasContent(slot);
    this.suffixFlush = slotHasFlush(slot);
  };

  private handleChange = () => this.emit("fluid-change");
  private handleFocus = () => (this.focused = true);
  private handleBlur = () => {
    this.focused = false;
    this.refreshValidity(this.inputEl, true);
  };
  private handleInvalid = () => this.refreshValidity(this.inputEl, true);

  override render(): TemplateResult {
    const upDisabled =
      this.disabled ||
      this.readonly ||
      (this.max !== undefined && Number(this.value || 0) >= this.max);
    const downDisabled =
      this.disabled ||
      this.readonly ||
      (this.min !== undefined && Number(this.value || 0) <= this.min);
    const downIcon =
      this.stepperVariant === "chevrons" ? "number-input-chevron-down" : "number-input-minus";
    const upIcon =
      this.stepperVariant === "chevrons" ? "number-input-chevron-up" : "number-input-plus";
    const downButton = html`
      <button
        part="stepper-down"
        class="stepper ${downDisabled ? "disabled" : ""}"
        type="button"
        tabindex="-1"
        aria-label=${this.term("decrease")}
        ?disabled=${downDisabled}
        @click=${() => this.stepDown()}
      >
        <fluid-icon name=${downIcon}></fluid-icon>
      </button>
    `;
    const upButton = html`
      <button
        part="stepper-up"
        class="stepper ${upDisabled ? "disabled" : ""}"
        type="button"
        tabindex="-1"
        aria-label=${this.term("increase")}
        ?disabled=${upDisabled}
        @click=${() => this.stepUp()}
      >
        <fluid-icon name=${upIcon}></fluid-icon>
      </button>
    `;

    return renderFieldChrome(
      { label: this.label, helpText: this.helpText, for: "input" },
      html`
        <div
          part="base"
          class=${classMap({
            base: true,
            [`size-${this.size}`]: true,
            focused: this.focused,
            disabled: this.disabled,
            invalid: this.invalid
          })}
        >
          <span
            class=${`affix prefix${this.prefixFlush ? " flush" : ""}`}
            part="prefix"
            ?hidden=${!this.hasPrefix}
          >
            <slot name="prefix" @slotchange=${this.handlePrefixChange}></slot>
          </span>
          <input
            id="input"
            part="input"
            type="number"
            inputmode="numeric"
            name=${ifDefined(this.name || undefined)}
            .value=${live(this.value)}
            placeholder=${this.placeholder}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            min=${ifDefined(this.min)}
            max=${ifDefined(this.max)}
            step=${this.effectiveStep()}
            autocomplete=${ifDefined(this.autocomplete || undefined)}
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            aria-describedby=${ifDefined(this.helpText.trim() ? FIELD_HELP_ID : undefined)}
            aria-invalid=${this.invalid ? "true" : "false"}
            @input=${this.handleInput}
            @change=${this.handleChange}
            @focus=${this.handleFocus}
            @blur=${this.handleBlur}
          />
          <span
            class=${`affix suffix${this.suffixFlush ? " flush" : ""}`}
            part="suffix"
            ?hidden=${!this.hasSuffix}
          >
            <slot name="suffix" @slotchange=${this.handleSuffixChange}></slot>
          </span>
          ${this.noSteppers
            ? ""
            : html`
                <div
                  part="steppers"
                  class=${classMap({
                    steppers: true,
                    chevrons: this.stepperVariant === "chevrons"
                  })}
                >
                  ${this.stepperVariant === "chevrons"
                    ? html`${upButton}${downButton}`
                    : html`${downButton}${upButton}`}
                </div>
              `}
        </div>
      `
    );
  }
}

function slotHasContent(slot: HTMLSlotElement): boolean {
  return slot
    .assignedNodes()
    .some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE ||
        (node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()))
    );
}

function slotHasFlush(slot: HTMLSlotElement): boolean {
  return slot.assignedElements().some((element) => element.hasAttribute("data-flush"));
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
