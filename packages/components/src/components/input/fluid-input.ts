import { html, css, nothing, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { registerIcon } from "@fluid-ds/icons/registry";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import {
  FIELD_HELP_ID,
  fieldChromeStyles,
  renderFieldChrome
} from "../../internal/field-chrome.js";
import "../icon/define.js";

registerIcon(
  "input-password-visible",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`
);
registerIcon(
  "input-password-hidden",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`
);

export type FluidInputType = "text" | "number" | "email" | "password" | "search" | "tel" | "url";
export type FluidInputSize = "sm" | "md" | "lg";

/** Value carried by the input's typing and committed-change events. */
export interface FluidInputValueDetail {
  value: string;
}
export type FluidInputInputEvent = CustomEvent<FluidInputValueDetail>;
export type FluidInputChangeEvent = CustomEvent<FluidInputValueDetail>;

/**
 * A single-line text input.
 *
 * Form-associated via ElementInternals, participates in `<form>` submission
 * and validation just like a native `<input>`.
 *
 * @summary Text-style input with prefix/suffix slots.
 *
 * A visible label and help text can be attached directly with the `label` and
 * `help-text` attributes; the label is a real `<label for>` inside the shadow
 * root and the help text is wired to the input via `aria-describedby`. For rich
 * label content, error messages, or a required indicator, wrap the control in
 * `fluid-field` instead.
 *
 * @slot prefix - Rendered before the input (icons, labels, etc.).
 * @slot suffix - Rendered after the input.
 *
 * @csspart label - The visible label (present only when `label` is set).
 * @csspart help-text - The help text (present only when `help-text` is set).
 * @csspart base - The outer container (the bordered field shell).
 * @csspart input - The internal `<input>` element. Reach it with `::part()`
 *   for any CSS not covered by a token (the escape hatch).
 * @csspart prefix - The prefix affix box (present only when the prefix slot is filled).
 * @csspart suffix - The suffix affix box (present only when the suffix slot is filled).
 * @csspart password-toggle - The reveal/conceal button rendered for password inputs.
 * @csspart password-toggle-icon - The icon inside the password reveal button.
 *
 * Every styled property reads a component-scoped `--fluid-input-*` token that
 * falls back to a main semantic var (the override ladder). The `@cssproperty`
 * list is the complete set of per-input override knobs; `@uses-token` is every
 * main var they fall back to.
 *
 * @cssproperty --fluid-input-bg - Field background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-input-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-input-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-input-border-hover - Border color on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-input-border-focus - Border color when focused. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-input-border-width - Border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-input-radius - Corner radius. Falls back to --fluid-field-border-radius.
 * @cssproperty --fluid-input-focus-ring-color - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-input-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-input-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-input-invalid-border - Border color when invalid. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-input-disabled-bg - Background when disabled. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-input-disabled-fg - Text color when disabled. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-input-affix-bg - Prefix/suffix background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-input-affix-fg - Prefix/suffix text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-input-affix-border - Prefix/suffix divider color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-input-password-toggle-fg - Password toggle color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-input-password-toggle-hover-fg - Password toggle hover color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-input-password-toggle-hover-bg - Password toggle hover background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-input-font-family - Font family. Falls back to --fluid-font-family-sans.
 *
 * @uses-token --fluid-surface-base - Default field background.
 * @uses-token --fluid-surface-subtle - Disabled + affix background.
 * @uses-token --fluid-border-default - Default border + affix divider.
 * @uses-token --fluid-border-strong - Border color on hover.
 * @uses-token --fluid-accent-base - Border color when focused.
 * @uses-token --fluid-danger-base - Border/ring color when invalid (theme-independent).
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum field height floor (24px AA / 44px AAA).
 * @uses-token --fluid-text-primary - Input text color.
 * @uses-token --fluid-text-secondary - Placeholder, affix, disabled text color.
 * @uses-token --fluid-field-border-width - Default border width.
 * @uses-token --fluid-field-border-radius - Default corner radius.
 * @uses-token --fluid-field-height-sm - Field height at size="sm".
 * @uses-token --fluid-field-height-md - Field height at size="md".
 * @uses-token --fluid-field-height-lg - Field height at size="lg".
 * @uses-token --fluid-field-padding-x-sm - Inline padding at size="sm".
 * @uses-token --fluid-field-padding-x-md - Inline padding at size="md".
 * @uses-token --fluid-field-padding-x-lg - Inline padding at size="lg".
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-font-size-sm - Text size at size="sm".
 * @uses-token --fluid-font-size-md - Text size at size="md".
 * @uses-token --fluid-font-size-lg - Text size at size="lg".
 * @uses-token --fluid-font-line-height-normal - Input line-height.
 * @uses-token --fluid-duration-fast - Border/shadow transition duration.
 * @uses-token --fluid-easing-standard - Border/shadow transition easing.
 *
 * @fires {FluidInputInputEvent} fluid-input - Fired on every keystroke. `event.detail.value` is the current value.
 * @fires {FluidInputChangeEvent} fluid-change - Fired when the input loses focus after a value change.
 */
export class FluidInput extends FluidFormAssociated {
  // Native form-validation focus does not call our JavaScript focus() override.
  // Make the host a delegating focus target, including in its server DSD root.
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

      :host([hidden]) {
        display: none;
      }

      /*
     * Override ladder: every styled property reads a --fluid-input-* token
     * that falls back to a main semantic var, so a consumer can retheme one
     * input, all inputs, or the whole system. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
      .base {
        display: inline-flex;
        align-items: stretch;
        width: 100%;
        background: var(--fluid-input-bg, var(--fluid-surface-base));
        border: var(--fluid-input-border-width, var(--fluid-field-border-width)) solid
          var(--fluid-input-border, var(--fluid-border-default));
        border-radius: var(--fluid-input-radius, var(--fluid-field-border-radius));
        /*
       * Two-layer depth: a 1px inset highlight at the top reads as "this
       * surface is pressed into the page", gives fields tactile weight
       * without using full shadows. Inspired by Linear / Vercel inputs.
       */
        box-shadow:
          inset 0 1px 0 0 rgb(0 0 0 / 0.02),
          0 1px 2px 0 rgb(0 0 0 / 0.04);
        transition:
          border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
          box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard),
          background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
        font-family: var(--fluid-input-font-family, var(--fluid-font-family-sans));
        color: var(--fluid-input-fg, var(--fluid-text-primary));
        overflow: hidden;
      }

      .base:hover:not(.disabled):not(:focus-within) {
        border-color: var(--fluid-input-border-hover, var(--fluid-border-strong));
        box-shadow:
          inset 0 1px 0 0 rgb(0 0 0 / 0.02),
          0 1px 3px 0 rgb(0 0 0 / 0.06);
      }

      .base:focus-within {
        border-color: var(--fluid-input-border-focus, var(--fluid-accent-base));
        box-shadow:
          0 0 0 var(--fluid-input-focus-ring-width, var(--fluid-focus-ring-width))
            color-mix(
              in srgb,
              var(--fluid-input-focus-ring-color, var(--fluid-focus-ring-color)) 35%,
              transparent
            ),
          inset 0 1px 0 0 rgb(0 0 0 / 0.02);
      }

      /*
     * Invalid uses the theme-independent danger tone (NOT a hard-coded red),
     * so it stays correct across brands and dark mode. SC 1.4.1 is satisfied
     * because validity is also conveyed via aria-invalid + the message text,
     * not by color alone.
     */
      .base.invalid {
        border-color: var(--fluid-input-invalid-border, var(--fluid-danger-base));
      }
      .base.invalid:focus-within {
        box-shadow:
          0 0 0 var(--fluid-input-focus-ring-width, var(--fluid-focus-ring-width))
            color-mix(
              in srgb,
              var(--fluid-input-invalid-border, var(--fluid-danger-base)) 35%,
              transparent
            ),
          inset 0 1px 0 0 rgb(0 0 0 / 0.02);
      }

      .base.disabled {
        background: var(--fluid-input-disabled-bg, var(--fluid-surface-subtle));
        color: var(--fluid-input-disabled-fg, var(--fluid-text-secondary));
        cursor: not-allowed;
        box-shadow: none;
      }

      /*
     * sizes, font + height scale together. min-height reads --fluid-target-min
     * as a floor (max()), so an ancestor opting into AAA
     * (data-fluid-conformance="aaa") lifts every field to a 44px target
     * (SC 2.5.5) while AA (24px) leaves the design heights untouched.
     */
      .size-sm {
        font-size: var(--fluid-font-size-sm);
        min-height: max(var(--fluid-field-height-sm, 1.75rem), var(--fluid-target-min, 0px));
      }
      .size-md {
        font-size: var(--fluid-font-size-md);
        min-height: max(var(--fluid-field-height-md, 2.25rem), var(--fluid-target-min, 0px));
      }
      .size-lg {
        font-size: var(--fluid-font-size-lg);
        min-height: max(var(--fluid-field-height-lg, 2.75rem), var(--fluid-target-min, 0px));
      }

      input {
        all: unset;
        flex: 1 1 auto;
        min-width: 0;
        box-sizing: border-box;
        font: inherit;
        color: inherit;
        line-height: var(--fluid-font-line-height-normal);
      }
      .size-sm input {
        padding: 0 var(--fluid-field-padding-x-sm);
      }
      .size-md input {
        padding: 0 var(--fluid-field-padding-x-md);
      }
      .size-lg input {
        padding: 0 var(--fluid-field-padding-x-lg);
      }

      input::placeholder {
        color: var(--fluid-input-placeholder-fg, var(--fluid-text-secondary));
      }

      input:disabled {
        cursor: not-allowed;
      }

      /*
     * Prefix / suffix render as flush sibling sections of the field, they
     * share the frame, so consumers can drop in swatches, icons, currency
     * marks, etc. and they look fused with the input.
     *
     * For prefixes that want to render edge-to-edge (e.g. a color swatch),
     * mark them with the data-flush attribute, we drop the inner padding so
     * the slotted element can stretch the full height and a fixed width.
     */
      /*
     * Affixes are component-owned shadow boxes (NOT the slotted element), so
     * they reliably stretch to the field's full height and center their
     * content, even when the slotted thing has a definite height (e.g.
     * <fluid-icon> sets height:1em, which defeated align-self:stretch on the
     * old ::slotted approach and left the prefix a tiny top-aligned box).
     * The slot just holds the content; the .affix span is the frame.
     */
      .affix {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        align-self: stretch;
        flex-shrink: 0;
        color: var(--fluid-input-affix-fg, var(--fluid-text-secondary));
        background: var(--fluid-input-affix-bg, var(--fluid-surface-subtle));
      }
      .affix[hidden] {
        display: none;
      }
      .prefix {
        border-inline-end: var(--fluid-input-border-width, var(--fluid-field-border-width)) solid
          var(--fluid-input-affix-border, var(--fluid-border-default));
      }
      .suffix {
        border-inline-start: var(--fluid-input-border-width, var(--fluid-field-border-width)) solid
          var(--fluid-input-affix-border, var(--fluid-border-default));
      }
      .size-sm .affix:not(.flush) {
        padding: 0 var(--fluid-field-padding-x-sm);
      }
      .size-md .affix:not(.flush) {
        padding: 0 var(--fluid-field-padding-x-md);
      }
      .size-lg .affix:not(.flush) {
        padding: 0 var(--fluid-field-padding-x-lg);
      }
      /*
     * data-flush: a slotted affix marked [data-flush] (e.g. a color swatch)
     * fills the affix edge-to-edge, drop the padding and let it stretch the
     * full height/width instead of centering.
     */
      .affix.flush {
        padding: 0;
        align-items: stretch;
      }
      /* Neutralize stray margins on slotted affix content (slotted-content
       gotcha, a slotted <p> would otherwise carry prose margins). */
      ::slotted([slot="prefix"]),
      ::slotted([slot="suffix"]) {
        margin: 0;
      }

      .password-toggle {
        all: unset;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        align-self: stretch;
        flex: 0 0 auto;
        min-inline-size: max(2rem, var(--fluid-target-min, 0px));
        color: var(--fluid-input-password-toggle-fg, var(--fluid-text-secondary));
        cursor: pointer;
      }
      .password-toggle:hover:not(:disabled) {
        color: var(--fluid-input-password-toggle-hover-fg, var(--fluid-text-primary));
        background: var(--fluid-input-password-toggle-hover-bg, var(--fluid-surface-subtle));
      }
      .password-toggle:focus-visible {
        outline: var(--fluid-input-focus-ring-width, var(--fluid-focus-ring-width)) solid
          var(--fluid-input-focus-ring-color, var(--fluid-focus-ring-color));
        outline-offset: calc(
          -1 * var(--fluid-input-focus-ring-width, var(--fluid-focus-ring-width))
        );
      }
      .password-toggle:disabled {
        color: var(--fluid-input-disabled-fg, var(--fluid-text-secondary));
        cursor: not-allowed;
      }
      .password-toggle fluid-icon {
        --fluid-icon-size: 1rem;
        pointer-events: none;
      }
    `
  ];

  private get inputEl(): HTMLInputElement | null {
    return this.renderRoot?.querySelector("input") ?? null;
  }

  /** Visible label rendered above the field (a real label/for association). */
  @property() label = "";

  /** Help text rendered below the field, announced via aria-describedby. */
  @property({ attribute: "help-text" }) helpText = "";

  /** Input type. */
  @property({ reflect: true }) type: FluidInputType = "text";

  /** Size. */
  @property({ reflect: true }) size: FluidInputSize = "md";

  /** Current value. */
  @property() override value = "";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Placeholder text. */
  @property() placeholder = "";

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Read-only state. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Min value (number/date inputs). */
  @property() min?: string;

  /** Max value (number/date inputs). */
  @property() max?: string;

  /** Step (number inputs). */
  @property() step?: string;

  /** Min length. */
  @property({ type: Number }) minlength?: number;

  /** Max length. */
  @property({ type: Number }) maxlength?: number;

  /** Native validation pattern (regex). */
  @property() pattern?: string;

  /** Autocomplete hint. */
  @property() autocomplete?: string;

  /** Accessible label when no visible label is provided. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @property({ state: true }) private invalid = false;
  @property({ state: true }) private hasPrefix = false;
  @property({ state: true }) private hasSuffix = false;
  @property({ state: true }) private prefixFlush = false;
  @property({ state: true }) private suffixFlush = false;
  @state() private passwordVisible = false;

  constructor() {
    super();
    // ElementInternals dispatches `invalid` on the host when form validation
    // is presented. Keep validity current from first render, but only paint
    // the invalid state after blur or an actual validation attempt.
    this.addEventListener("invalid", this.handleInvalid);
  }

  private handlePrefixChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this.hasPrefix = slotHasContent(slot);
    this.prefixFlush = slotHasFlush(slot);
  }

  private handleSuffixChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this.hasSuffix = slotHasContent(slot);
    this.suffixFlush = slotHasFlush(slot);
  }

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "";
    this.invalid = false;
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(
    state: string | File | FormData | null,
    _mode: "restore" | "autocomplete"
  ): void {
    if (typeof state === "string") this.value = state;
  }

  /** Move focus into the input. */
  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  /** Remove focus from the input. */
  override blur(): void {
    this.inputEl?.blur();
  }

  /** Select the current value. */
  select(): void {
    this.inputEl?.select();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("type") && this.type !== "password") this.passwordVisible = false;
    if (changed.has("value")) this.syncFormValue();
    this.refreshValidity(this.validationControl());
  }

  private validationControl(): HTMLInputElement | undefined {
    const input = this.inputEl ?? this.ownerDocument?.createElement("input");
    if (!input) return;
    input.type = this.type;
    input.value = this.value;
    input.disabled = this.disabled;
    input.required = this.required;
    input.readOnly = this.readonly;
    const attributes: [string, string | number | undefined][] = [
      ["min", this.min],
      ["max", this.max],
      ["step", this.step],
      ["minlength", this.minlength],
      ["maxlength", this.maxlength],
      ["pattern", this.pattern]
    ];
    for (const [name, value] of attributes) {
      if (value === undefined) input.removeAttribute(name);
      else input.setAttribute(name, String(value));
    }
    return input;
  }

  private refreshValidity(input = this.inputEl, showInvalid = this.invalid): void {
    if (!input) return;
    if (!input.validity.valid) {
      this.setValidity(
        flagsFromValidity(input.validity),
        input.validationMessage,
        this.inputEl ?? undefined
      );
      this.invalid = showInvalid;
    } else {
      this.setValidity({});
      this.invalid = false;
    }
  }

  private handleInvalid = (): void => {
    this.refreshValidity(this.inputEl, true);
  };

  private handleBlur = (): void => {
    this.refreshValidity(this.inputEl, true);
  };

  private togglePasswordVisibility = (): void => {
    this.passwordVisible = !this.passwordVisible;
  };

  protected override firstUpdated(): void {
    // Replace the pre-render validation probe with the real focus anchor.
    this.refreshValidity();
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.dispatchEvent(
      new CustomEvent<FluidInputValueDetail>("fluid-input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleChange(): void {
    this.dispatchEvent(
      new CustomEvent<FluidInputValueDetail>("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
    this.refreshValidity(this.inputEl, true);
  }

  override render(): TemplateResult {
    return renderFieldChrome(
      { label: this.label, helpText: this.helpText, for: "input" },
      html`
        <div
          part="base"
          class=${`base size-${this.size}${this.disabled ? " disabled" : ""}${this.invalid ? " invalid" : ""}`}
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
            type=${this.type === "password" && this.passwordVisible ? "text" : this.type}
            name=${this.name || nothing}
            .value=${live(this.value)}
            placeholder=${this.placeholder}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            min=${this.min ?? nothing}
            max=${this.max ?? nothing}
            step=${this.step ?? nothing}
            minlength=${this.minlength ?? nothing}
            maxlength=${this.maxlength ?? nothing}
            pattern=${this.pattern ?? nothing}
            autocomplete=${this.autocomplete ?? nothing}
            aria-label=${this.ariaLabel ?? nothing}
            aria-describedby=${this.helpText.trim() ? FIELD_HELP_ID : nothing}
            aria-invalid=${this.invalid ? "true" : "false"}
            @input=${this.handleInput}
            @change=${this.handleChange}
            @blur=${this.handleBlur}
          />
          <span
            class=${`affix suffix${this.suffixFlush ? " flush" : ""}`}
            part="suffix"
            ?hidden=${!this.hasSuffix}
          >
            <slot name="suffix" @slotchange=${this.handleSuffixChange}></slot>
          </span>
          ${this.type === "password"
            ? html`
                <button
                  part="password-toggle"
                  class="password-toggle"
                  type="button"
                  ?disabled=${this.disabled}
                  aria-controls="input"
                  aria-label=${this.passwordVisible
                    ? this.term("hidePassword")
                    : this.term("showPassword")}
                  aria-pressed=${this.passwordVisible ? "true" : "false"}
                  @click=${this.togglePasswordVisibility}
                >
                  <fluid-icon
                    part="password-toggle-icon"
                    name=${this.passwordVisible
                      ? "input-password-hidden"
                      : "input-password-visible"}
                  ></fluid-icon>
                </button>
              `
            : nothing}
        </div>
      `
    );
  }
}

/** True when a slot has any element or non-whitespace text assigned. */
function slotHasContent(slot: HTMLSlotElement): boolean {
  return slot
    .assignedNodes()
    .some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE ||
        (node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()))
    );
}

/** True when a slotted element opts into edge-to-edge layout via data-flush. */
function slotHasFlush(slot: HTMLSlotElement): boolean {
  return slot.assignedElements().some((el) => el.hasAttribute("data-flush"));
}

function flagsFromValidity(v: ValidityState): ValidityStateFlags {
  const flags: ValidityStateFlags = {};
  for (const key of validityFlagNames) if (v[key]) flags[key] = true;
  return flags;
}

const validityFlagNames = [
  "valueMissing",
  "typeMismatch",
  "patternMismatch",
  "tooLong",
  "tooShort",
  "rangeUnderflow",
  "rangeOverflow",
  "stepMismatch",
  "badInput",
  "customError"
] as const;
