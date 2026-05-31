import { html, css, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";

registerIcon(
  "copy",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`
);
registerIcon(
  "check",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>`
);

/**
 * One-click clipboard button. Resolves the text to copy from (in order):
 *   1. The `value` property
 *   2. The element referenced by `from` (an ID)
 *   3. Slotted text content
 *
 * Shows a success state (check icon) for a configurable duration after the
 * copy succeeds. Falls back gracefully on browsers without clipboard access.
 *
 * @summary One-click clipboard with built-in success feedback.
 *
 * @slot - The default (idle) label. Defaults to a copy icon.
 * @slot success - The label shown after a successful copy. Defaults to a check icon.
 * @slot error - The label shown after a failed copy. Defaults to the copy icon.
 *
 * @csspart base - The internal button.
 *
 * @cssproperty --fluid-copy-button-success-color - Color used when in the success state.
 * @cssproperty --fluid-copy-button-fg - Foreground (text) color.
 * @cssproperty --fluid-copy-button-hover-bg - Hover background color.
 * @cssproperty --fluid-copy-button-focus-ring - Focus ring color.
 *
 * @uses-token --fluid-accent-base - Default button color.
 * @uses-token --fluid-text-primary - Text color.
 *
 * @fires fluid-copy - Fired after the copy attempt. detail.success indicates outcome,
 *   detail.text holds the actual text written (when successful).
 */
export class FluidCopyButton extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .button {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--fluid-space-1);
      min-width: 1.75rem;
      min-height: 1.75rem;
      padding: var(--fluid-space-1) var(--fluid-space-2);
      border-radius: var(--fluid-radius-md);
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-copy-button-fg, var(--fluid-text-primary));
      cursor: pointer;
      transition:
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        color var(--fluid-duration-fast) var(--fluid-easing-standard),
        transform var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    .button:hover {
      background: var(--fluid-copy-button-hover-bg, var(--fluid-surface-muted));
    }

    .button:focus-visible {
      outline: var(--fluid-focus-ring-width) solid
        var(--fluid-copy-button-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: var(--fluid-focus-ring-offset);
    }

    .button:active {
      transform: translateY(1px);
    }

    .button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Success state, green accent for ~1.5s after a copy. */
    .button.copied {
      color: var(--fluid-copy-button-success-color, #16a34a);
    }
  `;

  /** Text to copy. Highest priority. */
  @property() value = "";

  /** ID of an element to copy text content from. */
  @property() from = "";

  /** Disable the button. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** How long (ms) the success state stays visible after a successful copy. */
  @property({ type: Number, attribute: "feedback-duration" }) feedbackDuration = 1500;

  @state() private state: "idle" | "copied" | "error" = "idle";

  private resetTimer?: ReturnType<typeof setTimeout>;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.resetTimer);
  }

  private resolveText(): string {
    if (this.value) return this.value;
    if (this.from) {
      const target = this.getRootNode() instanceof Document
        ? (this.getRootNode() as Document).getElementById(this.from)
        : document.getElementById(this.from);
      if (target) return target.textContent ?? "";
    }
    return this.textContent ?? "";
  }

  private handleClick = async () => {
    if (this.disabled) return;
    const text = this.resolveText();
    try {
      await navigator.clipboard.writeText(text);
      this.state = "copied";
      this.dispatchEvent(
        new CustomEvent("fluid-copy", {
          detail: { success: true, text },
          bubbles: true,
          composed: true
        })
      );
    } catch {
      this.state = "error";
      this.dispatchEvent(
        new CustomEvent("fluid-copy", {
          detail: { success: false, text },
          bubbles: true,
          composed: true
        })
      );
    }
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => (this.state = "idle"), this.feedbackDuration);
  };

  override render(): TemplateResult {
    return html`
      <button
        part="base"
        class="button ${this.state === "copied" ? "copied" : ""} ${this.disabled ? "disabled" : ""}"
        type="button"
        aria-label=${this.state === "copied" ? "Copied" : "Copy to clipboard"}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
      >
        ${this.state === "copied"
          ? html`<slot name="success"><fluid-icon name="check"></fluid-icon></slot>`
          : this.state === "error"
            ? html`<slot name="error"><fluid-icon name="copy"></fluid-icon></slot>`
            : html`<slot><fluid-icon name="copy"></fluid-icon></slot>`}
      </button>
    `;
  }
}
