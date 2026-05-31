import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";

export type FluidInputType = "text" | "number" | "email" | "password" | "search" | "tel" | "url";
export type FluidInputSize = "sm" | "md" | "lg";

/**
 * A single-line text input.
 *
 * Form-associated via ElementInternals, participates in `<form>` submission
 * and validation just like a native `<input>`.
 *
 * @summary Text-style input with prefix/suffix slots.
 *
 * @slot prefix - Rendered before the input (icons, labels, etc.).
 * @slot suffix - Rendered after the input.
 *
 * @csspart base - The outer container (the bordered field shell).
 * @csspart input - The internal `<input>` element. Reach it with `::part()`
 *   for any CSS not covered by a token (the escape hatch).
 * @csspart prefix - The prefix affix box (present only when the prefix slot is filled).
 * @csspart suffix - The suffix affix box (present only when the suffix slot is filled).
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
 * @fires fluid-input - Fired on every keystroke. `event.detail.value` is the current value.
 * @fires fluid-change - Fired when the input loses focus after a value change.
 */
export class FluidInput extends FluidFormAssociated {
  static override styles = css`
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

    .base:hover:not(.disabled):not(.focused) {
      border-color: var(--fluid-input-border-hover, var(--fluid-border-strong));
      box-shadow:
        inset 0 1px 0 0 rgb(0 0 0 / 0.02),
        0 1px 3px 0 rgb(0 0 0 / 0.06);
    }

    .base.focused {
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
    .base.invalid.focused {
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
      border-right: var(--fluid-input-border-width, var(--fluid-field-border-width)) solid
        var(--fluid-input-affix-border, var(--fluid-border-default));
    }
    .suffix {
      border-left: var(--fluid-input-border-width, var(--fluid-field-border-width)) solid
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
  `;

  @query("input") private inputEl!: HTMLInputElement;

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

  @state() private focused = false;
  @state() private invalid = false;
  @state() private hasPrefix = false;
  @state() private hasSuffix = false;
  @state() private prefixFlush = false;
  @state() private suffixFlush = false;

  private handlePrefixChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    this.hasPrefix = slotHasContent(slot);
    this.prefixFlush = slotHasFlush(slot);
  };
  private handleSuffixChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    this.hasSuffix = slotHasContent(slot);
    this.suffixFlush = slotHasFlush(slot);
  };

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "";
    this.invalid = false;
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(state: string | File | FormData | null, _mode: "restore" | "autocomplete"): void {
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
    if (changed.has("value")) {
      this.syncFormValue();
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (
      changed.has("value") ||
      changed.has("required") ||
      changed.has("minlength") ||
      changed.has("maxlength") ||
      changed.has("pattern") ||
      changed.has("min") ||
      changed.has("max")
    ) {
      this.refreshValidity();
    }
  }

  private refreshValidity(): void {
    // Defer to the inner input's native validity if available.
    if (!this.inputEl) return;
    if (!this.inputEl.validity.valid) {
      this.setValidity(
        flagsFromValidity(this.inputEl.validity),
        this.inputEl.validationMessage,
        this.inputEl
      );
      this.invalid = true;
    } else {
      this.setValidity({});
      this.invalid = false;
    }
  }

  private handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
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

  private handleFocus = () => {
    this.focused = true;
  };

  private handleBlur = () => {
    this.focused = false;
    this.refreshValidity();
  };

  override render(): TemplateResult {
    return html`
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
          class=${classMap({ affix: true, prefix: true, flush: this.prefixFlush })}
          part="prefix"
          ?hidden=${!this.hasPrefix}
        >
          <slot name="prefix" @slotchange=${this.handlePrefixChange}></slot>
        </span>
        <input
          part="input"
          type=${this.type}
          .value=${live(this.value)}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          min=${ifDefined(this.min)}
          max=${ifDefined(this.max)}
          step=${ifDefined(this.step)}
          minlength=${ifDefined(this.minlength)}
          maxlength=${ifDefined(this.maxlength)}
          pattern=${ifDefined(this.pattern)}
          autocomplete=${this.autocomplete ?? "off"}
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          aria-invalid=${this.invalid ? "true" : "false"}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        />
        <span
          class=${classMap({ affix: true, suffix: true, flush: this.suffixFlush })}
          part="suffix"
          ?hidden=${!this.hasSuffix}
        >
          <slot name="suffix" @slotchange=${this.handleSuffixChange}></slot>
        </span>
      </div>
    `;
  }
}

/** True when a slot has any element or non-whitespace text assigned. */
function slotHasContent(slot: HTMLSlotElement): boolean {
  return slot.assignedNodes().some((n) => {
    if (n.nodeType === Node.ELEMENT_NODE) return true;
    return n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0;
  });
}

/** True when a slotted element opts into edge-to-edge layout via data-flush. */
function slotHasFlush(slot: HTMLSlotElement): boolean {
  return slot
    .assignedElements()
    .some((el) => el.hasAttribute("data-flush"));
}

function flagsFromValidity(v: ValidityState): ValidityStateFlags {
  return {
    valueMissing: v.valueMissing,
    typeMismatch: v.typeMismatch,
    patternMismatch: v.patternMismatch,
    tooLong: v.tooLong,
    tooShort: v.tooShort,
    rangeUnderflow: v.rangeUnderflow,
    rangeOverflow: v.rangeOverflow,
    stepMismatch: v.stepMismatch,
    badInput: v.badInput,
    customError: v.customError
  };
}
