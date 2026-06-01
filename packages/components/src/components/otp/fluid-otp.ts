import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state, queryAll } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";

export type FluidOtpType = "number" | "text";

/**
 * A one-time-code / PIN input: a row of single-character boxes that together
 * capture a short code (an OTP, 2FA token, or PIN).
 *
 * Form-associated via ElementInternals, so the concatenated `value` is
 * submitted with the enclosing `<form>` under `name`, exactly like a native
 * control.
 *
 * Semantics follow no single WAI-ARIA APG widget pattern (there is no "OTP"
 * pattern), so it is derived from the closest analog: a labelled group
 * (`role="group"` with an `aria-label`) of plain text boxes. Each box is a
 * native single-character `<input>` carrying its own `aria-label` ("Digit 1 of
 * 6"), which keeps the screen-reader experience to ordinary text-field
 * navigation. Keyboard:
 *   - typing a character fills the box and auto-advances to the next;
 *   - Backspace clears the current box, or when already empty steps back and
 *     clears the previous box;
 *   - Left / Right arrows move between boxes;
 *   - Home / End jump to the first / last box;
 *   - pasting a code distributes its characters across the boxes from the
 *     focused box onward.
 *
 * @summary One-time-code / PIN input made of single-character boxes.
 *
 * @csspart base - The group container that lays out the boxes.
 * @csspart input - Every single-character `<input>` box. Reach it with
 *   `::part(input)` for any CSS not covered by a token (the escape hatch).
 *
 * Every styled property reads a component-scoped `--fluid-otp-*` token that
 * falls back to a main semantic var (the override ladder). The `@cssproperty`
 * list is the complete set of per-OTP override knobs; `@uses-token` is every
 * main var they fall back to.
 *
 * @cssproperty --fluid-otp-gap - Space between boxes. Falls back to --fluid-space-2.
 * @cssproperty --fluid-otp-size - Width + height of each box. Falls back to --fluid-field-height-lg.
 * @cssproperty --fluid-otp-bg - Box background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-otp-fg - Character color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-otp-border - Box border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-otp-border-hover - Border color on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-otp-border-focus - Border color when focused. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-otp-border-width - Border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-otp-radius - Corner radius. Falls back to --fluid-field-border-radius.
 * @cssproperty --fluid-otp-focus-ring-color - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-otp-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-otp-invalid-border - Border color when invalid. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-otp-disabled-bg - Background when disabled. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-otp-disabled-fg - Character color when disabled. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-otp-font-family - Font family for characters. Falls back to --fluid-font-family-mono.
 * @cssproperty --fluid-otp-font-size - Character size. Falls back to --fluid-font-size-lg.
 *
 * @uses-token --fluid-surface-base - Default box background.
 * @uses-token --fluid-surface-subtle - Disabled background.
 * @uses-token --fluid-border-default - Default border.
 * @uses-token --fluid-border-strong - Border color on hover.
 * @uses-token --fluid-accent-base - Border color when focused.
 * @uses-token --fluid-danger-base - Border color when invalid (theme-independent).
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum box size floor (24px AA / 44px AAA).
 * @uses-token --fluid-text-primary - Character color.
 * @uses-token --fluid-text-secondary - Disabled character color.
 * @uses-token --fluid-field-border-width - Default border width.
 * @uses-token --fluid-field-border-radius - Default corner radius.
 * @uses-token --fluid-field-height-lg - Default box size.
 * @uses-token --fluid-font-family-mono - Default font family.
 * @uses-token --fluid-font-size-lg - Default character size.
 * @uses-token --fluid-space-2 - Default gap between boxes.
 * @uses-token --fluid-duration-fast - Border/shadow transition duration.
 * @uses-token --fluid-easing-standard - Border/shadow transition easing.
 *
 * @fires fluid-input - Fired whenever the concatenated value changes. `event.detail.value` is the current value.
 * @fires fluid-complete - Fired once every box is filled. `event.detail.value` is the complete code.
 */
export class FluidOtp extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: inline-block;
      font-family: var(--fluid-otp-font-family, var(--fluid-font-family-mono));
    }

    :host([hidden]) {
      display: none;
    }

    /*
     * Override ladder: every styled property reads a --fluid-otp-* token that
     * falls back to a main semantic var, so a consumer can retheme one OTP, all
     * OTP inputs, or the whole system. See the @cssproperty / @uses-token lists
     * in the JSDoc for the complete set.
     */
    .base {
      display: inline-flex;
      gap: var(--fluid-otp-gap, var(--fluid-space-2));
    }

    .box {
      /* Forms appearance + box reset (we keep our own border + ring). */
      all: unset;
      box-sizing: border-box;
      /*
       * Box size reads --fluid-target-min as a floor (max()), so an ancestor
       * opting into AAA (data-fluid-conformance="aaa") lifts every box to a
       * 44px target (SC 2.5.5) while AA (24px) leaves the design size untouched.
       */
      width: max(var(--fluid-otp-size, var(--fluid-field-height-lg, 2.75rem)), var(--fluid-target-min, 0px));
      height: max(var(--fluid-otp-size, var(--fluid-field-height-lg, 2.75rem)), var(--fluid-target-min, 0px));
      text-align: center;
      font-family: inherit;
      font-size: var(--fluid-otp-font-size, var(--fluid-font-size-lg));
      color: var(--fluid-otp-fg, var(--fluid-text-primary));
      background: var(--fluid-otp-bg, var(--fluid-surface-base));
      border: var(--fluid-otp-border-width, var(--fluid-field-border-width)) solid
        var(--fluid-otp-border, var(--fluid-border-default));
      border-radius: var(--fluid-otp-radius, var(--fluid-field-border-radius));
      box-shadow:
        inset 0 1px 0 0 rgb(0 0 0 / 0.02),
        0 1px 2px 0 rgb(0 0 0 / 0.04);
      transition:
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard),
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
      cursor: text;
    }

    .box:hover:not(:disabled):not(:focus) {
      border-color: var(--fluid-otp-border-hover, var(--fluid-border-strong));
    }

    /*
     * :focus-visible would be ideal but the boxes are programmatically focused
     * during auto-advance (not always via keyboard), so we show the ring on
     * plain :focus to keep the active box obvious. Never bare outline:none.
     */
    .box:focus {
      border-color: var(--fluid-otp-border-focus, var(--fluid-accent-base));
      box-shadow:
        0 0 0 var(--fluid-otp-focus-ring-width, var(--fluid-focus-ring-width))
          color-mix(
            in srgb,
            var(--fluid-otp-focus-ring-color, var(--fluid-focus-ring-color)) 35%,
            transparent
          ),
        inset 0 1px 0 0 rgb(0 0 0 / 0.02);
    }

    /*
     * Invalid uses the theme-independent danger tone (NOT a hard-coded red), so
     * it stays correct across brands and dark mode. SC 1.4.1 is satisfied
     * because validity is also conveyed via aria-invalid, not by color alone.
     */
    .base.invalid .box {
      border-color: var(--fluid-otp-invalid-border, var(--fluid-danger-base));
    }
    .base.invalid .box:focus {
      box-shadow:
        0 0 0 var(--fluid-otp-focus-ring-width, var(--fluid-focus-ring-width))
          color-mix(
            in srgb,
            var(--fluid-otp-invalid-border, var(--fluid-danger-base)) 35%,
            transparent
          ),
        inset 0 1px 0 0 rgb(0 0 0 / 0.02);
    }

    .box:disabled {
      background: var(--fluid-otp-disabled-bg, var(--fluid-surface-subtle));
      color: var(--fluid-otp-disabled-fg, var(--fluid-text-secondary));
      cursor: not-allowed;
      box-shadow: none;
    }
  `;

  @queryAll(".box") private boxes!: NodeListOf<HTMLInputElement>;

  /** Number of character boxes. */
  @property({ type: Number, reflect: true }) length = 6;

  /** The concatenated code. Submitted with the form under `name`. */
  @property() override value = "";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /**
   * Input mode for the boxes. "number" restricts entry to digits and shows the
   * numeric keypad on mobile; "text" allows any single character.
   */
  @property({ reflect: true }) type: FluidOtpType = "number";

  /** Render the entered characters as dots (password-style), for secret PINs. */
  @property({ type: Boolean, reflect: true }) mask = false;

  /** Accessible name for the group. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private invalid = false;

  /** The per-box characters, length-normalized from `value`. */
  private get chars(): string[] {
    const out: string[] = [];
    for (let i = 0; i < this.length; i += 1) {
      out.push(this.value[i] ?? "");
    }
    return out;
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

  /** Move focus into the first empty box (or the first box if all are filled). */
  override focus(options?: FocusOptions): void {
    const list = Array.from(this.boxes ?? []);
    if (list.length === 0) return;
    const firstEmpty = list.find((b) => b.value === "");
    (firstEmpty ?? list[0])?.focus(options);
  }

  /** Remove focus from whichever box currently has it. */
  override blur(): void {
    const active = this.shadowRoot?.activeElement as HTMLElement | null;
    active?.blur();
  }

  /** Clear the value and return focus to the first box. */
  clear(): void {
    this.setValue("");
    this.updateComplete.then(() => {
      Array.from(this.boxes ?? [])[0]?.focus();
    });
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.syncFormValue();
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("value") || changed.has("required")) {
      this.refreshValidity();
    }
  }

  private refreshValidity(): void {
    const list = Array.from(this.boxes ?? []);
    if (this.required && this.value.length < this.length) {
      this.setValidity(
        { valueMissing: true },
        "Please complete the code.",
        list[0]
      );
      this.invalid = true;
    } else {
      this.setValidity({});
      this.invalid = false;
    }
  }

  /** Sanitize a candidate character for the current `type`. */
  private sanitize(input: string): string {
    if (this.type === "number") return input.replace(/[^0-9]/g, "");
    return input.replace(/\s/g, "");
  }

  /** Apply a new value, fire the right events, keep validity in sync. */
  private setValue(next: string): void {
    const clamped = next.slice(0, this.length);
    if (clamped === this.value) return;
    this.value = clamped;
    this.dispatchEvent(
      new CustomEvent("fluid-input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
    if (this.value.length === this.length) {
      this.dispatchEvent(
        new CustomEvent("fluid-complete", {
          detail: { value: this.value },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  private focusBox(index: number): void {
    const list = Array.from(this.boxes ?? []);
    const clamped = Math.max(0, Math.min(index, list.length - 1));
    const box = list[clamped];
    if (box) {
      box.focus();
      box.select();
    }
  }

  private handleInput = (index: number) => (event: Event) => {
    const target = event.target as HTMLInputElement;
    const raw = this.sanitize(target.value);
    const chars = this.chars;

    if (raw.length === 0) {
      // Deletion handled in keydown; here it means the box was emptied.
      chars[index] = "";
      // Reset the visible field to match state.
      target.value = "";
      this.setValue(chars.join("").replace(/\s+$/g, ""));
      return;
    }

    // Take the last typed character so retyping over a filled box works.
    const ch = raw[raw.length - 1] ?? "";
    chars[index] = ch;
    target.value = ch;
    this.setValue(chars.join(""));

    // Auto-advance to the next box.
    if (index < this.length - 1) {
      this.focusBox(index + 1);
    }
  };

  private handleKeydown = (index: number) => (event: KeyboardEvent) => {
    const target = event.target as HTMLInputElement;
    switch (event.key) {
      case "Backspace": {
        if (target.value === "") {
          // Already empty: step back and clear the previous box.
          event.preventDefault();
          if (index > 0) {
            const chars = this.chars;
            chars[index - 1] = "";
            this.setValue(chars.join(""));
            this.focusBox(index - 1);
          }
        }
        // If the box has a character, let the native delete clear it; the
        // input handler then rewrites the value.
        break;
      }
      case "Delete": {
        event.preventDefault();
        const chars = this.chars;
        chars[index] = "";
        target.value = "";
        this.setValue(chars.join(""));
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        this.focusBox(index - 1);
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        this.focusBox(index + 1);
        break;
      }
      case "Home": {
        event.preventDefault();
        this.focusBox(0);
        break;
      }
      case "End": {
        event.preventDefault();
        this.focusBox(this.length - 1);
        break;
      }
      default:
        break;
    }
  };

  private handlePaste = (index: number) => (event: ClipboardEvent) => {
    event.preventDefault();
    const text = this.sanitize(event.clipboardData?.getData("text") ?? "");
    if (text === "") return;
    const chars = this.chars;
    for (let i = 0; i < text.length && index + i < this.length; i += 1) {
      chars[index + i] = text[i] ?? "";
    }
    this.setValue(chars.join(""));
    // Move focus to the last filled box (or the next empty one).
    const filled = chars.filter((c) => c !== "").length;
    this.updateComplete.then(() => this.focusBox(Math.min(filled, this.length - 1)));
  };

  private handleFocus = (event: FocusEvent) => {
    (event.target as HTMLInputElement).select();
  };

  override render(): TemplateResult {
    const chars = this.chars;
    const label = this.ariaLabel ?? "One-time code";
    return html`
      <div
        part="base"
        class=${classMap({ base: true, invalid: this.invalid })}
        role="group"
        aria-label=${label}
      >
        ${chars.map(
          (ch, i) => html`
            <input
              part="input"
              class="box"
              .value=${ch}
              type=${this.mask ? "password" : "text"}
              inputmode=${this.type === "number" ? "numeric" : "text"}
              autocomplete=${i === 0 ? "one-time-code" : "off"}
              maxlength="1"
              ?disabled=${this.disabled}
              aria-label=${`Digit ${i + 1} of ${this.length}`}
              aria-invalid=${this.invalid ? "true" : "false"}
              @input=${this.handleInput(i)}
              @keydown=${this.handleKeydown(i)}
              @paste=${this.handlePaste(i)}
              @focus=${this.handleFocus}
            />
          `
        )}
      </div>
    `;
  }
}
