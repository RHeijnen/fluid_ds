import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { FormDisabledController } from "../../internal/form-disabled.js";
import {
  fieldChromeStyles,
  fieldHelpDescribedBy,
  renderFieldChrome
} from "../../internal/field-chrome.js";

export type FluidTextareaResize = "none" | "vertical" | "horizontal" | "both" | "auto";
export type FluidTextareaSize = "sm" | "md" | "lg";

export interface FluidTextareaValueDetail {
  value: string;
}
export type FluidTextareaInputEvent = CustomEvent<FluidTextareaValueDetail>;
export type FluidTextareaChangeEvent = CustomEvent<FluidTextareaValueDetail>;

/**
 * Multi-line text input. Form-associated. Auto-resize mode grows the
 * textarea to fit its content (good for chat composers, comment fields).
 *
 * @summary Multi-line text input with optional auto-resize.
 *
 * A visible label and help text can be attached directly with the `label` and
 * `help-text` attributes; the label is a real `<label for>` inside the shadow
 * root and the help text is wired to the textarea via `aria-describedby`. For
 * rich label content or error messages, wrap the control in `fluid-field`.
 *
 * @csspart label - The visible label (present only when `label` is set).
 * @csspart help-text - The help text (present only when `help-text` is set).
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
 * @cssproperty --fluid-textarea-font-size-sm - Small text size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-textarea-font-size-md - Medium text size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-textarea-font-size-lg - Large text size. Falls back to --fluid-font-size-lg.
 * @cssproperty --fluid-textarea-line-height - Text line height. Falls back to --fluid-font-line-height-normal.
 * @cssproperty --fluid-textarea-min-height - Minimum control height. Defaults to 5rem.
 * @cssproperty --fluid-textarea-padding-x-sm - Small inline padding. Falls back to --fluid-field-padding-x-sm.
 * @cssproperty --fluid-textarea-padding-x-md - Medium inline padding. Falls back to --fluid-field-padding-x-md.
 * @cssproperty --fluid-textarea-padding-x-lg - Large inline padding. Falls back to --fluid-field-padding-x-lg.
 * @cssproperty --fluid-textarea-padding-y-sm - Small block padding. Falls back to --fluid-space-1.
 * @cssproperty --fluid-textarea-padding-y-md - Medium block padding. Falls back to --fluid-space-2.
 * @cssproperty --fluid-textarea-padding-y-lg - Large block padding. Falls back to --fluid-space-3.
 * @cssproperty --fluid-textarea-duration - Transition duration. Falls back to --fluid-duration-fast.
 * @cssproperty --fluid-textarea-easing - Transition easing. Falls back to --fluid-easing-standard.
 * @cssproperty --fluid-textarea-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-textarea-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-textarea-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-textarea-invalid-border - Border when invalid. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-textarea-disabled-bg - Disabled background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-textarea-disabled-fg - Disabled foreground. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-textarea-disabled-opacity - Disabled opacity. Defaults to 0.5.
 * @cssproperty --fluid-textarea-counter-fg - Character counter color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-textarea-counter-font-family - Counter font. Falls back to --fluid-font-family-mono.
 * @cssproperty --fluid-textarea-counter-font-size - Counter text size. Falls back to --fluid-font-size-xs.
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
 * @fires {FluidTextareaInputEvent} fluid-input - Fired on every keystroke.
 * @fires {FluidTextareaChangeEvent} fluid-change - Fired on blur after a value change.
 */
export class FluidTextarea extends FluidFormAssociated {
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
        display: block;
        width: 100%;
      }

      /*
     * Override ladder: every styled property reads a --fluid-textarea-* token
     * that falls back to a main semantic var. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
      .base {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        background: var(--fluid-textarea-bg, var(--fluid-surface-base));
        border: var(--fluid-textarea-border-width, var(--fluid-field-border-width)) solid
          var(--fluid-textarea-border, var(--fluid-border-default));
        border-radius: var(--fluid-textarea-radius, var(--fluid-field-border-radius));
        transition:
          border-color var(--fluid-textarea-duration, var(--fluid-duration-fast))
            var(--fluid-textarea-easing, var(--fluid-easing-standard)),
          box-shadow var(--fluid-textarea-duration, var(--fluid-duration-fast))
            var(--fluid-textarea-easing, var(--fluid-easing-standard));
        font-family: var(--fluid-textarea-font-family, var(--fluid-font-family-sans));
        font-size: var(--_fluid-textarea-font-size);
        color: var(--fluid-textarea-fg, var(--fluid-text-primary));
      }

      .size-sm {
        --_fluid-textarea-font-size: var(--fluid-textarea-font-size-sm, var(--fluid-font-size-sm));
        --_fluid-textarea-padding-x: var(
          --fluid-textarea-padding-x-sm,
          var(--fluid-field-padding-x-sm)
        );
        --_fluid-textarea-padding-y: var(--fluid-textarea-padding-y-sm, var(--fluid-space-1));
      }
      .size-md {
        --_fluid-textarea-font-size: var(--fluid-textarea-font-size-md, var(--fluid-font-size-md));
        --_fluid-textarea-padding-x: var(
          --fluid-textarea-padding-x-md,
          var(--fluid-field-padding-x-md)
        );
        --_fluid-textarea-padding-y: var(--fluid-textarea-padding-y-md, var(--fluid-space-2));
      }
      .size-lg {
        --_fluid-textarea-font-size: var(--fluid-textarea-font-size-lg, var(--fluid-font-size-lg));
        --_fluid-textarea-padding-x: var(
          --fluid-textarea-padding-x-lg,
          var(--fluid-field-padding-x-lg)
        );
        --_fluid-textarea-padding-y: var(--fluid-textarea-padding-y-lg, var(--fluid-space-3));
      }

      .base:hover:not(.disabled):not(.focused) {
        border-color: var(--fluid-textarea-border-hover, var(--fluid-border-strong));
      }

      .base.focused {
        border-color: var(--fluid-textarea-border-focus, var(--fluid-accent-base));
        box-shadow: 0 0 0 var(--fluid-textarea-focus-ring-width, var(--fluid-focus-ring-width))
          var(--fluid-textarea-focus-ring, var(--fluid-focus-ring-color));
      }

      .base.disabled {
        background: var(--fluid-textarea-disabled-bg, var(--fluid-surface-subtle));
        color: var(--fluid-textarea-disabled-fg, var(--fluid-text-secondary));
        opacity: var(--fluid-textarea-disabled-opacity, 0.5);
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
        box-shadow: 0 0 0 var(--fluid-textarea-focus-ring-width, var(--fluid-focus-ring-width))
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
        min-height: var(--fluid-textarea-min-height, 5rem);
        padding: var(--_fluid-textarea-padding-y) var(--_fluid-textarea-padding-x);
        font: inherit;
        color: inherit;
        line-height: var(--fluid-textarea-line-height, var(--fluid-font-line-height-normal));
        resize: var(--resize, vertical);
      }

      :host([resize="auto"]) textarea {
        resize: none;
        overflow: hidden;
      }

      .autosize-mirror {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        box-sizing: border-box;
        width: 100%;
        min-height: var(--fluid-textarea-min-height, 5rem);
        padding: var(--_fluid-textarea-padding-y) var(--_fluid-textarea-padding-x);
        font: inherit;
        line-height: var(--fluid-textarea-line-height, var(--fluid-font-line-height-normal));
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }

      textarea::placeholder {
        color: var(--fluid-textarea-placeholder-fg, var(--fluid-text-secondary));
      }

      .counter {
        flex: 0 0 auto;
        margin-inline-start: auto;
        pointer-events: none;
        font-family: var(--fluid-textarea-counter-font-family, var(--fluid-font-family-mono));
        font-size: var(--fluid-textarea-counter-font-size, var(--fluid-font-size-xs));
        color: var(--fluid-textarea-counter-fg, var(--fluid-text-secondary));
        font-variant-numeric: tabular-nums;
      }
      .counter.near {
        color: var(--fluid-textarea-counter-near-fg, var(--fluid-warning-base));
      }
      .counter.over {
        color: var(--fluid-textarea-counter-over-fg, var(--fluid-danger-base));
      }
    `
  ];

  @query("textarea") private inputEl!: HTMLTextAreaElement;
  @query(".autosize-mirror") private autosizeMirror?: HTMLElement;

  /** Visible label rendered above the field (a real label/for association). */
  @property() label = "";

  /** Help text rendered below the field, announced via aria-describedby. */
  @property({ attribute: "help-text" }) helpText = "";

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

  /** Text and spacing size, aligned with the other form controls. */
  @property({ reflect: true }) size: FluidTextareaSize = "md";

  /** Browser autofill hint. Omitted by default. */
  @property() autocomplete = "";

  /** Min length. */
  @property({ type: Number }) minlength?: number;

  /** Max length. Activates the character counter when set. */
  @property({ type: Number }) maxlength?: number;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private focused = false;
  @state() private invalid = false;
  private autosizeFrame?: number;

  constructor() {
    super();
    this.addEventListener("invalid", this.handleInvalid);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.autosizeFrame !== undefined) cancelAnimationFrame(this.autosizeFrame);
    this.autosizeFrame = undefined;
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

  override blur(): void {
    this.inputEl?.blur();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) this.syncFormValue();
    if (
      (
        [
          "value",
          "disabled",
          "readonly",
          "required",
          "minlength",
          "maxlength"
        ] as (keyof FluidTextarea)[]
      ).some((property) => changed.has(property))
    ) {
      this.refreshValidity(this.validationControl());
    }
  }

  protected override updated(): void {
    if (this.resize === "auto") this.autosize();
  }

  protected override firstUpdated(): void {
    this.refreshValidity();
  }

  private autosize(): void {
    const ta = this.inputEl;
    if (!ta) return;
    // WebKit can retain the previous scrollHeight when an auto-resizing
    // textarea is reset to `auto`. A zero measurement height forces every
    // engine to recompute the content box before reading scrollHeight.
    ta.style.height = "0px";
    ta.style.height = `${Math.max(ta.scrollHeight, this.autosizeMirror?.scrollHeight ?? 0)}px`;
  }

  private validationControl(): HTMLTextAreaElement | undefined {
    const control = this.inputEl ?? this.ownerDocument?.createElement("textarea");
    if (!control) return;
    control.value = this.value;
    control.disabled = this.disabled;
    control.readOnly = this.readonly;
    control.required = this.required;
    for (const [name, value] of [
      ["minlength", this.minlength],
      ["maxlength", this.maxlength]
    ] as const) {
      if (value === undefined) control.removeAttribute(name);
      else control.setAttribute(name, String(value));
    }
    return control;
  }

  private refreshValidity(control = this.inputEl, showInvalid = this.invalid): void {
    if (!control) return;
    const checksLength = control.willValidate && !this.readonly;
    const tooShort =
      checksLength &&
      this.minlength !== undefined &&
      this.value.length > 0 &&
      this.value.length < this.minlength;
    const tooLong =
      checksLength && this.maxlength !== undefined && this.value.length > this.maxlength;
    const flags = {
      ...flagsFromValidity(control.validity),
      tooShort,
      tooLong
    };
    if (Object.values(flags).some(Boolean)) {
      const fieldName = this.label || this.ariaLabel || this.name || "textarea";
      const lengthMessage = tooShort
        ? this.term("parserStringTooShort", fieldName, String(this.minlength))
        : tooLong
          ? this.term("parserStringTooLong", fieldName, String(this.maxlength))
          : "";
      this.setValidity(
        flags,
        lengthMessage || control.validationMessage,
        this.inputEl ?? undefined
      );
      this.invalid = showInvalid;
    } else {
      this.setValidity({});
      this.invalid = false;
    }
  }

  private handleInput = (e: Event) => {
    this.value = (e.target as HTMLTextAreaElement).value;
    if (this.resize === "auto") {
      this.autosize();
      if (this.autosizeFrame !== undefined) cancelAnimationFrame(this.autosizeFrame);
      this.autosizeFrame = requestAnimationFrame(() => {
        this.autosizeFrame = undefined;
        if (this.resize === "auto") this.autosize();
      });
    }
    this.dispatchEvent(
      new CustomEvent<FluidTextareaValueDetail>("fluid-input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  };

  private handleChange = () => {
    this.dispatchEvent(
      new CustomEvent<FluidTextareaValueDetail>("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
    this.refreshValidity(this.inputEl, true);
  };

  private handleFocus = () => (this.focused = true);
  private handleBlur = () => {
    this.focused = false;
    this.refreshValidity(this.inputEl, true);
  };
  private handleInvalid = () => this.refreshValidity(this.inputEl, true);

  override render(): TemplateResult {
    const len = this.value.length;
    const max = this.maxlength;
    const counterState =
      max !== undefined && len >= max ? "over" : max !== undefined && len > max * 0.9 ? "near" : "";
    return renderFieldChrome(
      {
        label: this.label,
        helpText: this.helpText,
        for: "textarea",
        supportingTrailing:
          max !== undefined
            ? html`<span id="textarea-counter" part="counter" class="counter ${counterState}"
                >${len}/${max}</span
              >`
            : undefined
      },
      this.renderControl()
    );
  }

  private renderControl(): TemplateResult {
    const describedBy = [
      fieldHelpDescribedBy(this.helpText),
      this.maxlength !== undefined ? "textarea-counter" : undefined
    ]
      .filter(Boolean)
      .join(" ");
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
        ${this.resize === "auto"
          ? html`<div class="autosize-mirror" aria-hidden="true">${this.value}</div>`
          : ""}
        <textarea
          id="textarea"
          part="textarea"
          style="--resize: ${this.resize === "auto" ? "none" : this.resize}"
          name=${ifDefined(this.name || undefined)}
          .value=${live(this.value)}
          placeholder=${this.placeholder}
          rows=${this.rows}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          minlength=${ifDefined(this.minlength)}
          maxlength=${ifDefined(this.maxlength)}
          autocomplete=${ifDefined(this.autocomplete || undefined)}
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          aria-describedby=${ifDefined(describedBy || undefined)}
          aria-invalid=${this.invalid ? "true" : "false"}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        ></textarea>
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
