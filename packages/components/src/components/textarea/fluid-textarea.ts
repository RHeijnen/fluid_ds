import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";

export type FluidTextareaResize = "none" | "vertical" | "horizontal" | "both" | "auto";

/**
 * Multi-line text input. Form-associated. Auto-resize mode grows the
 * textarea to fit its content (good for chat composers, comment fields).
 *
 * @summary Multi-line text input with optional auto-resize.
 *
 * @csspart base - The outer container.
 * @csspart textarea - The internal <textarea>.
 * @csspart counter - The character counter (when maxlength is set).
 *
 * Every styled property reads a component-scoped `--fluid-textarea-*` token
 * that falls back to a main semantic var (the override ladder). The
 * `@cssproperty` list is the complete set of override knobs; `@uses-token` is
 * every main var they fall back to.
 *
 * @cssproperty --fluid-textarea-bg - Background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-textarea-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-textarea-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-textarea-border-hover - Border on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-textarea-border-focus - Border when focused. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-textarea-border-width - Border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-textarea-radius - Corner radius. Falls back to --fluid-field-border-radius.
 * @cssproperty --fluid-textarea-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-textarea-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-textarea-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-textarea-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-textarea-invalid-border - Border when invalid. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-textarea-counter-fg - Character counter color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-textarea-counter-near-fg - Counter color near the limit. Falls back to --fluid-warning-base.
 * @cssproperty --fluid-textarea-counter-over-fg - Counter color at/over the limit. Falls back to --fluid-danger-base.
 *
 * @uses-token --fluid-surface-base - Default background.
 * @uses-token --fluid-border-default - Default border.
 * @uses-token --fluid-border-strong - Border on hover.
 * @uses-token --fluid-accent-base - Border when focused.
 * @uses-token --fluid-danger-base - Invalid border + counter-over (theme-independent).
 * @uses-token --fluid-warning-base - Counter near the limit (theme-independent).
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-text-primary - Text color.
 * @uses-token --fluid-text-secondary - Placeholder + counter color.
 * @uses-token --fluid-field-border-width - Default border width.
 * @uses-token --fluid-field-border-radius - Default corner radius.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-font-family-mono - Counter font family.
 * @uses-token --fluid-font-size-xs - Counter font size.
 * @uses-token --fluid-font-line-height-normal - Textarea line-height.
 * @uses-token --fluid-space-1 - Counter padding.
 * @uses-token --fluid-space-2 - Textarea + counter padding.
 * @uses-token --fluid-space-3 - Textarea inline padding.
 * @uses-token --fluid-duration-fast - Border/shadow transition duration.
 * @uses-token --fluid-easing-standard - Border/shadow transition easing.
 *
 * @fires fluid-input - Fired on every keystroke.
 * @fires fluid-change - Fired on blur after a value change.
 */
export class FluidTextarea extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    /*
     * Override ladder: every styled property reads a --fluid-textarea-* token
     * that falls back to a main semantic var. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
    .base {
      display: flex;
      flex-direction: column;
      width: 100%;
      background: var(--fluid-textarea-bg, var(--fluid-surface-base));
      border: var(--fluid-textarea-border-width, var(--fluid-field-border-width)) solid
        var(--fluid-textarea-border, var(--fluid-border-default));
      border-radius: var(--fluid-textarea-radius, var(--fluid-field-border-radius));
      transition:
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
      font-family: var(--fluid-textarea-font-family, var(--fluid-font-family-sans));
      color: var(--fluid-textarea-fg, var(--fluid-text-primary));
    }

    .base:hover:not(.disabled):not(.focused) {
      border-color: var(--fluid-textarea-border-hover, var(--fluid-border-strong));
    }

    .base.focused {
      border-color: var(--fluid-textarea-border-focus, var(--fluid-accent-base));
      box-shadow: 0 0 0
        var(--fluid-textarea-focus-ring-width, var(--fluid-focus-ring-width))
        var(--fluid-textarea-focus-ring, var(--fluid-focus-ring-color));
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
      border-color: var(--fluid-textarea-invalid-border, var(--fluid-danger-base));
    }
    .base.invalid.focused {
      box-shadow: 0 0 0
        var(--fluid-textarea-focus-ring-width, var(--fluid-focus-ring-width))
        color-mix(
          in srgb,
          var(--fluid-textarea-invalid-border, var(--fluid-danger-base)) 35%,
          transparent
        );
    }

    textarea {
      all: unset;
      box-sizing: border-box;
      width: 100%;
      min-height: 5rem;
      padding: var(--fluid-space-2) var(--fluid-space-3);
      font: inherit;
      color: inherit;
      line-height: var(--fluid-font-line-height-normal);
      resize: var(--resize, vertical);
    }

    :host([resize="auto"]) textarea {
      resize: none;
      overflow: hidden;
    }

    textarea::placeholder {
      color: var(--fluid-textarea-placeholder-fg, var(--fluid-text-secondary));
    }

    .counter {
      align-self: flex-end;
      padding: 0 var(--fluid-space-2) var(--fluid-space-1);
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-textarea-counter-fg, var(--fluid-text-secondary));
      font-variant-numeric: tabular-nums;
    }
    .counter.near {
      color: var(--fluid-textarea-counter-near-fg, var(--fluid-warning-base));
    }
    .counter.over {
      color: var(--fluid-textarea-counter-over-fg, var(--fluid-danger-base));
    }
  `;

  @query("textarea") private inputEl!: HTMLTextAreaElement;

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

  /** Required for form validation. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Default number of visible rows. */
  @property({ type: Number }) rows = 4;

  /** Resize behavior. "auto" grows the textarea to fit content. */
  @property({ reflect: true }) resize: FluidTextareaResize = "vertical";

  /** Min length. */
  @property({ type: Number }) minlength?: number;

  /** Max length. Activates the character counter when set. */
  @property({ type: Number }) maxlength?: number;

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

  override blur(): void {
    this.inputEl?.blur();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) this.syncFormValue();
  }

  protected override updated(): void {
    this.refreshValidity();
    if (this.resize === "auto") this.autosize();
  }

  private autosize(): void {
    const ta = this.inputEl;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
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

  private handleInput = (e: Event) => {
    this.value = (e.target as HTMLTextAreaElement).value;
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

  private handleFocus = () => (this.focused = true);
  private handleBlur = () => {
    this.focused = false;
    this.refreshValidity();
  };

  override render(): TemplateResult {
    const len = this.value.length;
    const max = this.maxlength;
    const counterState =
      max !== undefined && len >= max ? "over" : max !== undefined && len > max * 0.9 ? "near" : "";
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
        <textarea
          part="textarea"
          .value=${live(this.value)}
          placeholder=${this.placeholder}
          rows=${this.rows}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          minlength=${ifDefined(this.minlength)}
          maxlength=${ifDefined(this.maxlength)}
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          aria-invalid=${this.invalid ? "true" : "false"}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        ></textarea>
        ${max !== undefined
          ? html`<span part="counter" class="counter ${counterState}">${len}/${max}</span>`
          : ""}
      </div>
    `;
  }
}

function flagsFromValidity(v: ValidityState): ValidityStateFlags {
  return {
    valueMissing: v.valueMissing,
    tooLong: v.tooLong,
    tooShort: v.tooShort,
    customError: v.customError
  };
}
