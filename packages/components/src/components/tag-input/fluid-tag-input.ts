import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { live } from "lit/directives/live.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { reducedMotion } from "../../internal/motion.js";
import "../tag/define.js";

/**
 * A token / chip input. The user types a label and commits it (Enter or comma)
 * to add a chip; chips render as removable `<fluid-tag>` elements ahead of the
 * text field. Backspace on an empty field removes the last chip, and clicking a
 * chip's remove button removes it.
 *
 * Form-associated via ElementInternals: the control participates in `<form>`
 * submission. Its submitted value is the comma-joined string of tokens (so a
 * server receives `react,lit`), while the `value` property is the array of
 * strings.
 *
 * There is no single WAI-ARIA APG pattern for a tag / token input. The closest
 * analog is a labelled group of removable elements that precedes a plain text
 * field: the wrapper carries `role="group"` with an accessible name, each chip
 * is a `<fluid-tag removable>` (a real `<button>` for removal), and the text
 * `<input>` is the labelable control that owns keyboard entry.
 *
 * @summary Token / chip input that commits typed labels to removable tags.
 *
 * @csspart base - The bordered field shell (the group container).
 * @csspart tags - The wrapper holding the committed chips.
 * @csspart tag - Each committed `<fluid-tag>` chip.
 * @csspart input - The internal `<input>` element. Reach it with `::part()`
 *   for any CSS not covered by a token (the escape hatch).
 *
 * Every styled property reads a component-scoped `--fluid-tag-input-*` token
 * that falls back to a main semantic var (the override ladder). The
 * `@cssproperty` list is the complete set of per-control override knobs;
 * `@uses-token` is every main var they fall back to.
 *
 * @cssproperty --fluid-tag-input-bg - Field background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-tag-input-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-tag-input-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-tag-input-border-hover - Border color on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-tag-input-border-focus - Border color when focused. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-tag-input-border-width - Border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-tag-input-radius - Corner radius. Falls back to --fluid-field-border-radius.
 * @cssproperty --fluid-tag-input-focus-ring-color - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-tag-input-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-tag-input-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-tag-input-disabled-bg - Background when disabled. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-tag-input-disabled-fg - Text color when disabled. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-tag-input-gap - Gap between chips and the field. Falls back to --fluid-space-1.
 * @cssproperty --fluid-tag-input-padding - Inner padding of the field shell. Falls back to --fluid-space-1.
 * @cssproperty --fluid-tag-input-font-family - Font family. Falls back to --fluid-font-family-sans.
 *
 * @uses-token --fluid-surface-base - Default field background.
 * @uses-token --fluid-surface-subtle - Disabled background.
 * @uses-token --fluid-border-default - Default border color.
 * @uses-token --fluid-border-strong - Border color on hover.
 * @uses-token --fluid-accent-base - Border color when focused.
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum field height floor (24px AA / 44px AAA).
 * @uses-token --fluid-text-primary - Input text color.
 * @uses-token --fluid-text-secondary - Placeholder + disabled text color.
 * @uses-token --fluid-field-border-width - Default border width.
 * @uses-token --fluid-field-border-radius - Default corner radius.
 * @uses-token --fluid-field-height-md - Minimum field height.
 * @uses-token --fluid-space-1 - Default gap + padding.
 * @uses-token --fluid-space-2 - Inline padding for the text field.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-font-size-md - Text size.
 * @uses-token --fluid-font-line-height-normal - Input line-height.
 * @uses-token --fluid-duration-fast - Border / shadow transition duration.
 * @uses-token --fluid-easing-standard - Border / shadow transition easing.
 *
 * @fires fluid-change - Fired whenever the set of tokens changes (add or
 *   remove). `event.detail.value` is the current array of tokens.
 */
export class FluidTagInput extends FluidFormAssociated {
  static override formAssociated = true;

  static override styles = [
    reducedMotion,
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
       * Override ladder: every styled property reads a --fluid-tag-input-*
       * token that falls back to a main semantic var, so a consumer can
       * retheme one control, all of them, or the whole system. See the
       * @cssproperty / @uses-token lists in the JSDoc for the complete set.
       */
      .base {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--fluid-tag-input-gap, var(--fluid-space-1));
        width: 100%;
        box-sizing: border-box;
        padding: var(--fluid-tag-input-padding, var(--fluid-space-1));
        min-height: max(
          var(--fluid-field-height-md, 2.25rem),
          var(--fluid-target-min, 0px)
        );
        background: var(--fluid-tag-input-bg, var(--fluid-surface-base));
        color: var(--fluid-tag-input-fg, var(--fluid-text-primary));
        border: var(--fluid-tag-input-border-width, var(--fluid-field-border-width))
          solid var(--fluid-tag-input-border, var(--fluid-border-default));
        border-radius: var(--fluid-tag-input-radius, var(--fluid-field-border-radius));
        box-shadow:
          inset 0 1px 0 0 rgb(0 0 0 / 0.02),
          0 1px 2px 0 rgb(0 0 0 / 0.04);
        font-family: var(--fluid-tag-input-font-family, var(--fluid-font-family-sans));
        font-size: var(--fluid-font-size-md);
        transition:
          border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
          box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard),
          background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
        cursor: text;
      }

      .base:hover:not(.disabled):not(.focused) {
        border-color: var(--fluid-tag-input-border-hover, var(--fluid-border-strong));
        box-shadow:
          inset 0 1px 0 0 rgb(0 0 0 / 0.02),
          0 1px 3px 0 rgb(0 0 0 / 0.06);
      }

      .base.focused {
        border-color: var(--fluid-tag-input-border-focus, var(--fluid-accent-base));
        box-shadow:
          0 0 0
            var(--fluid-tag-input-focus-ring-width, var(--fluid-focus-ring-width))
            color-mix(
              in srgb,
              var(--fluid-tag-input-focus-ring-color, var(--fluid-focus-ring-color))
                35%,
              transparent
            ),
          inset 0 1px 0 0 rgb(0 0 0 / 0.02);
      }

      .base.disabled {
        background: var(--fluid-tag-input-disabled-bg, var(--fluid-surface-subtle));
        color: var(--fluid-tag-input-disabled-fg, var(--fluid-text-secondary));
        cursor: not-allowed;
        box-shadow: none;
      }

      .tags {
        display: contents;
      }

      input {
        all: unset;
        flex: 1 1 4ch;
        min-width: 4ch;
        box-sizing: border-box;
        font: inherit;
        color: inherit;
        padding: 0 var(--fluid-space-1);
        line-height: var(--fluid-font-line-height-normal);
      }

      input::placeholder {
        color: var(--fluid-tag-input-placeholder-fg, var(--fluid-text-secondary));
      }

      input:disabled {
        cursor: not-allowed;
      }
    `
  ];

  @query("input") private inputEl!: HTMLInputElement;

  /**
   * The committed tokens. Also accepts a comma-separated string attribute
   * (`value="react,lit"`), which is split into the array.
   */
  @property({
    converter: {
      fromAttribute: (v: string | null): string[] =>
        v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [],
      toAttribute: (v: string[]): string => v.join(",")
    }
  })
  override value: string[] = [];

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Placeholder text shown in the text field. */
  @property() placeholder = "";

  /** Disabled state. No tokens can be added or removed. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Optional cap on the number of tokens. */
  @property({ type: Number }) max?: number;

  /** Allow the same token to be added more than once. */
  @property({ type: Boolean, attribute: "allow-duplicates" }) allowDuplicates = false;

  /** Accessible label for the group + inner field when no visible label is provided. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private focused = false;

  /** True when the token cap has been reached. */
  private get atMax(): boolean {
    return typeof this.max === "number" && this.value.length >= this.max;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.syncFormValue();
    }
  }

  protected override syncFormValue(): void {
    this.internals.setFormValue(this.value.join(","));
  }

  override formResetCallback(): void {
    const attr = this.getAttribute("value");
    this.value = attr
      ? attr.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(
    state: string | File | FormData | null,
    _mode: "restore" | "autocomplete"
  ): void {
    if (typeof state === "string") {
      this.value = state.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  /** Move focus into the text field. */
  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  /** Remove focus from the text field. */
  override blur(): void {
    this.inputEl?.blur();
  }

  /** Commit a typed token, applying the duplicate + max guards. Returns true if added. */
  private addToken(raw: string): boolean {
    if (this.disabled) return false;
    const token = raw.trim();
    if (!token) return false;
    if (this.atMax) return false;
    if (!this.allowDuplicates && this.value.includes(token)) return false;
    this.value = [...this.value, token];
    this.emitChange();
    return true;
  }

  /** Remove the token at an index. */
  private removeAt(index: number): void {
    if (this.disabled) return;
    if (index < 0 || index >= this.value.length) return;
    this.value = this.value.filter((_, i) => i !== index);
    this.emitChange();
  }

  private emitChange(): void {
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleKeydown = (event: KeyboardEvent) => {
    const input = event.target as HTMLInputElement;
    if (event.key === "Enter" || event.key === ",") {
      // Enter / comma commit the typed token.
      if (input.value.trim()) {
        event.preventDefault();
        if (this.addToken(input.value)) {
          input.value = "";
        }
      } else if (event.key === ",") {
        // Swallow a lone comma so it never lands in the field.
        event.preventDefault();
      }
    } else if (event.key === "Backspace" && input.value === "" && this.value.length > 0) {
      // Backspace on an empty field removes the last committed token.
      event.preventDefault();
      this.removeAt(this.value.length - 1);
    }
  };

  private handleRemove = (index: number) => (event: Event) => {
    event.stopPropagation();
    this.removeAt(index);
    // Keep keyboard users anchored in the control after a removal.
    this.inputEl?.focus();
  };

  private handleFocusIn = () => {
    this.focused = true;
  };

  private handleFocusOut = (event: FocusEvent) => {
    // Only blur when focus leaves the whole control, not when it moves
    // between a chip's remove button and the text field.
    const next = event.relatedTarget as Node | null;
    if (next && this.shadowRoot?.contains(next)) return;
    this.focused = false;
  };

  private handleHostClick = (event: MouseEvent) => {
    // Clicking the field shell (not a chip) focuses the text field.
    if (this.disabled) return;
    const path = event.composedPath();
    if (path.some((n) => n instanceof HTMLElement && n.localName === "fluid-tag")) {
      return;
    }
    this.inputEl?.focus();
  };

  override render(): TemplateResult {
    return html`
      <div
        part="base"
        role="group"
        aria-label=${ifDefined(this.ariaLabel ?? undefined)}
        class=${classMap({
          base: true,
          focused: this.focused,
          disabled: this.disabled
        })}
        @focusin=${this.handleFocusIn}
        @focusout=${this.handleFocusOut}
        @mousedown=${this.handleHostClick}
      >
        <span part="tags" class="tags">
          ${this.value.map(
            (token, index) => html`
              <fluid-tag
                part="tag"
                exportparts="base, remove"
                size="sm"
                removable
                ?disabled=${this.disabled}
                @fluid-remove=${this.handleRemove(index)}
              >
                ${token}
              </fluid-tag>
            `
          )}
        </span>
        <input
          part="input"
          type="text"
          .value=${live("")}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled || this.atMax}
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          autocomplete="off"
          @keydown=${this.handleKeydown}
        />
      </div>
    `;
  }
}
