import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";

export type FluidMaskedInputSize = "sm" | "md" | "lg";

/**
 * A text field that formats input against a fixed-width mask.
 *
 * The mask is a template string where placeholder tokens accept input and any
 * other character is a literal that the field inserts automatically:
 *
 *   - `#` accepts a digit (0-9)
 *   - `A` accepts a letter (a-z, A-Z)
 *   - `*` accepts an alphanumeric character (letter or digit)
 *
 * For example, the mask `(###) ###-####` turns the keystrokes `5551234567`
 * into `(555) 123-4567`. As the user types, literals are inserted for them,
 * Backspace skips back over literals, and characters that do not match the
 * next placeholder are rejected.
 *
 * Form-associated via ElementInternals: the submitted form value is the
 * formatted string. The raw characters the user actually typed (no literals)
 * are exposed separately as the read-only `unmaskedValue` property.
 *
 * Mirrors `<fluid-input>` for its field tokens so a masked field sits visually
 * flush alongside ordinary inputs.
 *
 * @summary Text input that formats as you type against a mask.
 *
 * @csspart base - The outer container (the bordered field shell).
 * @csspart input - The internal `<input>` element. Reach it with `::part()`
 *   for any CSS not covered by a token (the escape hatch).
 *
 * Every styled property reads a component-scoped `--fluid-masked-input-*` token
 * that falls back to a main semantic var (the override ladder). The
 * `@cssproperty` list is the complete set of per-field override knobs;
 * `@uses-token` is every main var they fall back to.
 *
 * @cssproperty --fluid-masked-input-bg - Field background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-masked-input-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-masked-input-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-masked-input-border-hover - Border color on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-masked-input-border-focus - Border color when focused. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-masked-input-border-width - Border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-masked-input-radius - Corner radius. Falls back to --fluid-field-border-radius.
 * @cssproperty --fluid-masked-input-focus-ring-color - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-masked-input-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-masked-input-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-masked-input-invalid-border - Border color when invalid. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-masked-input-disabled-bg - Background when disabled. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-masked-input-disabled-fg - Text color when disabled. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-masked-input-font-family - Font family. Falls back to --fluid-font-family-mono.
 *
 * @uses-token --fluid-surface-base - Default field background.
 * @uses-token --fluid-surface-subtle - Disabled background.
 * @uses-token --fluid-border-default - Default border color.
 * @uses-token --fluid-border-strong - Border color on hover.
 * @uses-token --fluid-accent-base - Border color when focused.
 * @uses-token --fluid-danger-base - Border/ring color when invalid (theme-independent).
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum field height floor (24px AA / 44px AAA).
 * @uses-token --fluid-text-primary - Input text color.
 * @uses-token --fluid-text-secondary - Placeholder + disabled text color.
 * @uses-token --fluid-field-border-width - Default border width.
 * @uses-token --fluid-field-border-radius - Default corner radius.
 * @uses-token --fluid-field-height-sm - Field height at size="sm".
 * @uses-token --fluid-field-height-md - Field height at size="md".
 * @uses-token --fluid-field-height-lg - Field height at size="lg".
 * @uses-token --fluid-field-padding-x-sm - Inline padding at size="sm".
 * @uses-token --fluid-field-padding-x-md - Inline padding at size="md".
 * @uses-token --fluid-field-padding-x-lg - Inline padding at size="lg".
 * @uses-token --fluid-font-family-mono - Default font family (monospace keeps masked columns aligned).
 * @uses-token --fluid-font-size-sm - Text size at size="sm".
 * @uses-token --fluid-font-size-md - Text size at size="md".
 * @uses-token --fluid-font-size-lg - Text size at size="lg".
 * @uses-token --fluid-font-line-height-normal - Input line-height.
 * @uses-token --fluid-duration-fast - Border/shadow transition duration.
 * @uses-token --fluid-easing-standard - Border/shadow transition easing.
 *
 * @fires fluid-input - Fired on every keystroke that changes the value.
 *   `event.detail.value` is the formatted string, `event.detail.unmaskedValue`
 *   is the raw characters.
 * @fires fluid-change - Fired when the field loses focus after a value change.
 */
export class FluidMaskedInput extends FluidFormAssociated {
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
     * Override ladder: every styled property reads a --fluid-masked-input-*
     * token that falls back to a main semantic var, so a consumer can retheme
     * one field, all masked fields, or the whole system. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
    .base {
      display: inline-flex;
      align-items: stretch;
      width: 100%;
      background: var(--fluid-masked-input-bg, var(--fluid-surface-base));
      border: var(--fluid-masked-input-border-width, var(--fluid-field-border-width)) solid
        var(--fluid-masked-input-border, var(--fluid-border-default));
      border-radius: var(--fluid-masked-input-radius, var(--fluid-field-border-radius));
      box-shadow:
        inset 0 1px 0 0 rgb(0 0 0 / 0.02),
        0 1px 2px 0 rgb(0 0 0 / 0.04);
      transition:
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard),
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
      font-family: var(--fluid-masked-input-font-family, var(--fluid-font-family-mono));
      color: var(--fluid-masked-input-fg, var(--fluid-text-primary));
      overflow: hidden;
    }

    .base:hover:not(.disabled):not(.focused) {
      border-color: var(--fluid-masked-input-border-hover, var(--fluid-border-strong));
      box-shadow:
        inset 0 1px 0 0 rgb(0 0 0 / 0.02),
        0 1px 3px 0 rgb(0 0 0 / 0.06);
    }

    .base.focused {
      border-color: var(--fluid-masked-input-border-focus, var(--fluid-accent-base));
      box-shadow:
        0 0 0 var(--fluid-masked-input-focus-ring-width, var(--fluid-focus-ring-width))
          color-mix(
            in srgb,
            var(--fluid-masked-input-focus-ring-color, var(--fluid-focus-ring-color)) 35%,
            transparent
          ),
        inset 0 1px 0 0 rgb(0 0 0 / 0.02);
    }

    /*
     * Invalid uses the theme-independent danger tone (NOT a hard-coded red),
     * so it stays correct across brands and dark mode. SC 1.4.1 is satisfied
     * because validity is also conveyed via aria-invalid, not by color alone.
     */
    .base.invalid {
      border-color: var(--fluid-masked-input-invalid-border, var(--fluid-danger-base));
    }
    .base.invalid.focused {
      box-shadow:
        0 0 0 var(--fluid-masked-input-focus-ring-width, var(--fluid-focus-ring-width))
          color-mix(
            in srgb,
            var(--fluid-masked-input-invalid-border, var(--fluid-danger-base)) 35%,
            transparent
          ),
        inset 0 1px 0 0 rgb(0 0 0 / 0.02);
    }

    .base.disabled {
      background: var(--fluid-masked-input-disabled-bg, var(--fluid-surface-subtle));
      color: var(--fluid-masked-input-disabled-fg, var(--fluid-text-secondary));
      cursor: not-allowed;
      box-shadow: none;
    }

    /*
     * sizes: font + height scale together. min-height reads --fluid-target-min
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
      color: var(--fluid-masked-input-placeholder-fg, var(--fluid-text-secondary));
    }

    input:disabled {
      cursor: not-allowed;
    }
  `;

  @query("input") private inputEl!: HTMLInputElement;

  /**
   * The mask template. `#` = digit, `A` = letter, `*` = alphanumeric; any
   * other character is a literal that the field inserts automatically.
   */
  @property({ reflect: true }) mask = "";

  /** Size. */
  @property({ reflect: true }) size: FluidMaskedInputSize = "md";

  /** Current value (the formatted string). */
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

  /** Accessible label when no visible label is provided. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private focused = false;
  @state() private invalid = false;

  /**
   * The raw characters the user typed, with mask literals stripped out.
   * Read-only: set `value` to change the field. Defaults to deriving from
   * the current `value` and `mask`.
   */
  get unmaskedValue(): string {
    return unmask(this.value, this.mask);
  }

  override formResetCallback(): void {
    this.value = formatWithMask(this.getAttribute("value") ?? "", this.mask).formatted;
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

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value") || changed.has("mask")) {
      // Re-run the formatter so a value assigned programmatically (or a mask
      // change) is normalized against the current mask before it reaches the
      // form. Setting `this.value` here (when it differs) is idempotent on the
      // next pass because the formatter is stable, so it cannot loop. Always
      // push the normalized value into the form: the early-return path used to
      // skip the sync, leaving the form value unset.
      const next = formatWithMask(this.value, this.mask).formatted;
      if (next !== this.value) {
        this.value = next;
      }
      this.syncFormValue();
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("value") || changed.has("required") || changed.has("mask")) {
      this.refreshValidity();
    }
  }

  /**
   * The field is considered complete when every placeholder slot in the mask
   * is filled. Required validation reports an incomplete (or empty) field.
   */
  private get complete(): boolean {
    const slots = countPlaceholders(this.mask);
    if (slots === 0) return this.value.length > 0;
    return this.unmaskedValue.length >= slots;
  }

  private refreshValidity(): void {
    if (!this.inputEl) return;
    if (this.required && !this.complete) {
      this.setValidity(
        { valueMissing: true },
        this.value.length === 0 ? "Please fill out this field." : "Please complete the field.",
        this.inputEl
      );
      this.invalid = true;
    } else {
      this.setValidity({});
      this.invalid = false;
    }
  }

  private handleInput = (event: InputEvent) => {
    const target = event.target as HTMLInputElement;
    const { formatted, caret } = formatWithMask(target.value, this.mask, target.selectionStart);
    this.value = formatted;
    // Re-assert the formatted value + caret on the native input. The value
    // setter alone may not flush before the browser repaints, and inserting
    // literals shifts the caret, so we restore it explicitly.
    target.value = formatted;
    if (caret !== null) {
      target.setSelectionRange(caret, caret);
    }
    this.dispatchEvent(
      new CustomEvent("fluid-input", {
        detail: { value: this.value, unmaskedValue: this.unmaskedValue },
        bubbles: true,
        composed: true
      })
    );
  };

  private handleChange = () => {
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: this.value, unmaskedValue: this.unmaskedValue },
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
        <input
          part="input"
          type="text"
          inputmode=${ifDefined(inputModeForMask(this.mask))}
          .value=${live(this.value)}
          placeholder=${this.placeholder || maskPlaceholder(this.mask)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          aria-invalid=${this.invalid ? "true" : "false"}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        />
      </div>
    `;
  }
}

/** Placeholder tokens and the predicate that decides if a char is accepted. */
const TOKENS: Record<string, (ch: string) => boolean> = {
  "#": (ch) => ch >= "0" && ch <= "9",
  A: (ch) => (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z"),
  "*": (ch) =>
    (ch >= "0" && ch <= "9") || (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z")
};

function isToken(ch: string): boolean {
  return Object.prototype.hasOwnProperty.call(TOKENS, ch);
}

/** Number of placeholder slots in the mask. */
function countPlaceholders(mask: string): number {
  let n = 0;
  for (const ch of mask) {
    if (isToken(ch)) n += 1;
  }
  return n;
}

/** Strip mask literals from a formatted value, leaving only typed characters. */
function unmask(formatted: string, mask: string): string {
  if (!mask) return formatted;
  let raw = "";
  let mi = 0;
  for (const ch of formatted) {
    // Advance the mask cursor past any literals up to the next placeholder.
    while (mi < mask.length && !isToken(mask[mi] ?? "")) {
      if (mask[mi] === ch) {
        mi += 1;
        break;
      }
      mi += 1;
    }
    const token = mask[mi];
    if (token !== undefined && isToken(token) && TOKENS[token]?.(ch)) {
      raw += ch;
      mi += 1;
    }
  }
  return raw;
}

/**
 * Format a typed string against the mask. Walks the raw characters of the
 * input, inserts literals automatically, and only consumes characters that
 * match the next placeholder. Returns the formatted string and a caret
 * position when one was supplied.
 */
function formatWithMask(
  input: string,
  mask: string,
  caretInput?: number | null
): { formatted: string; caret: number | null } {
  if (!mask) {
    return { formatted: input, caret: caretInput ?? null };
  }

  // Extract the characters the user actually typed (drop anything that was a
  // literal in the previous render so re-formatting is idempotent).
  const raw = unmask(input, mask);

  let formatted = "";
  let ri = 0;
  // How many raw chars fall before the caret in the incoming value.
  const rawBeforeCaret =
    caretInput == null ? raw.length : unmask(input.slice(0, caretInput), mask).length;

  for (let mi = 0; mi < mask.length; ) {
    const m = mask[mi] ?? "";
    if (isToken(m)) {
      // Stop once the raw input is exhausted: an unfilled placeholder marks the
      // boundary of what the user has actually entered.
      if (ri >= raw.length) break;
      const ch = raw[ri] ?? "";
      if (TOKENS[m]?.(ch)) {
        formatted += ch;
        ri += 1;
        mi += 1;
      } else {
        // Char does not match this placeholder: reject it, keep scanning.
        ri += 1;
      }
    } else {
      // Literal: insert it automatically. Trailing literals that immediately
      // follow a filled placeholder are inserted too (e.g. "12" -> "12/" for
      // mask "##/##"), so the next group reads as ready for input.
      formatted += m;
      mi += 1;
    }
  }

  // Compute caret: place it after the formatted output corresponding to the
  // raw chars before the original caret.
  let caret: number | null = null;
  if (caretInput != null) {
    caret = caretPosition(formatted, mask, rawBeforeCaret);
  }
  return { formatted, caret };
}

/** Position of the caret after `n` placeholder slots have been filled. */
function caretPosition(formatted: string, mask: string, n: number): number {
  if (n <= 0) return 0;
  let seen = 0;
  let mi = 0;
  let pos = 0;
  while (pos < formatted.length && mi < mask.length) {
    const m = mask[mi] ?? "";
    if (isToken(m)) {
      seen += 1;
      pos += 1;
      mi += 1;
      if (seen >= n) {
        // Skip trailing literals so the caret sits after them, ready for the
        // next placeholder.
        while (pos < formatted.length && mi < mask.length && !isToken(mask[mi] ?? "")) {
          pos += 1;
          mi += 1;
        }
        return pos;
      }
    } else {
      pos += 1;
      mi += 1;
    }
  }
  return formatted.length;
}

/** A visual placeholder derived from the mask, e.g. "(___) ___-____". */
function maskPlaceholder(mask: string): string {
  let out = "";
  for (const ch of mask) {
    out += isToken(ch) ? "_" : ch;
  }
  return out;
}

/** Pick an inputmode hint from the mask's placeholder tokens. */
function inputModeForMask(mask: string): string | undefined {
  if (!mask) return undefined;
  let hasDigit = false;
  let hasLetter = false;
  for (const ch of mask) {
    if (ch === "#") hasDigit = true;
    if (ch === "A") hasLetter = true;
    if (ch === "*") {
      hasDigit = true;
      hasLetter = true;
    }
  }
  if (hasDigit && !hasLetter) return "numeric";
  return undefined;
}
