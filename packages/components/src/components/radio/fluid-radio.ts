import { html, css, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Single option in a `<fluid-radio-group>`. Visual-only, selection state
 * lives on the parent group, which manages roving tabindex + keyboard nav.
 *
 * @summary One radio option (use inside `<fluid-radio-group>`).
 *
 * @slot - The label.
 *
 * @csspart base - The outer label wrapper.
 * @csspart control - The circular indicator.
 *
 * Every styled property reads a component-scoped `--fluid-radio-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-radio-bg - Circle background when unchecked. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-radio-border - Circle border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-radio-border-hover - Circle border on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-radio-border-width - Circle border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-radio-radius - Circle corner radius. Falls back to --fluid-radius-full.
 * @cssproperty --fluid-radio-accent - Checked color (border + dot). Falls back to --fluid-accent-base.
 * @cssproperty --fluid-radio-fg - Label text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-radio-gap - Gap between circle and label. Falls back to --fluid-space-2.
 * @cssproperty --fluid-radio-font-family - Label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-radio-font-size - Label font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-radio-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-radio-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-surface-base - Default background.
 * @uses-token --fluid-border-default - Default border.
 * @uses-token --fluid-border-strong - Border on hover.
 * @uses-token --fluid-accent-base - Checked color (border + dot).
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum hit-target height (24px AA / 44px AAA).
 * @uses-token --fluid-text-primary - Label text color.
 * @uses-token --fluid-field-border-width - Default circle border width.
 * @uses-token --fluid-radius-full - Circle radius.
 * @uses-token --fluid-space-2 - Gap between circle and label.
 * @uses-token --fluid-font-family-sans - Label font family.
 * @uses-token --fluid-font-size-md - Label font size.
 * @uses-token --fluid-gradient-glossy - Selected-dot sheen.
 * @uses-token --fluid-duration-fast - State transition duration.
 * @uses-token --fluid-easing-standard - State transition easing.
 */
export class FluidRadio extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
    }

    :host([hidden]) {
      display: none;
    }

    /*
     * Override ladder: every styled property reads a --fluid-radio-* token
     * that falls back to a main semantic var. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
    .base {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-radio-gap, var(--fluid-space-2));
      cursor: pointer;
      user-select: none;
      color: var(--fluid-radio-fg, var(--fluid-text-primary));
      font-family: var(--fluid-radio-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-radio-font-size, var(--fluid-font-size-md));
      /*
       * SC 2.5.8 Target Size. The circle is only ~18px, so the clickable label
       * reads --fluid-target-min as a floor, >=24px (AA) / 44px (AAA) hit
       * target without enlarging the graphic.
       */
      min-height: var(--fluid-target-min, 0px);
    }

    .base.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .control {
      position: relative;
      flex-shrink: 0;
      width: 1.125rem;
      height: 1.125rem;
      background: var(--fluid-radio-bg, var(--fluid-surface-base));
      border: var(--fluid-radio-border-width, var(--fluid-field-border-width, 1px)) solid
        var(--fluid-radio-border, var(--fluid-border-default));
      border-radius: var(--fluid-radio-radius, var(--fluid-radius-full));
      transition:
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    .base:hover:not(.disabled) .control {
      border-color: var(--fluid-radio-border-hover, var(--fluid-border-strong));
    }

    :host([checked]) .control {
      border-color: var(--fluid-radio-accent, var(--fluid-accent-base));
      border-width: 2px;
    }

    .dot {
      position: absolute;
      inset: 0;
      margin: auto;
      width: 0.5em;
      height: 0.5em;
      border-radius: var(--fluid-radius-full);
      background: var(--fluid-radio-accent, var(--fluid-accent-base));
      background-image: var(--fluid-gradient-glossy);
      transform: scale(0);
      transition: transform var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    :host([checked]) .dot {
      transform: scale(1);
    }

    :host([focused]) .control {
      box-shadow: 0 0 0
        var(--fluid-radio-focus-ring-width, var(--fluid-focus-ring-width))
        var(--fluid-radio-focus-ring, var(--fluid-focus-ring-color));
    }

    @media (prefers-reduced-motion: reduce) {
      .control,
      .dot {
        transition-duration: 0s;
      }
    }
  `;

  /** Value submitted when this radio is the selected one. */
  @property() value = "";

  /** Whether this radio is selected. Managed by the parent group. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private focused = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "radio");
    this.tabIndex = -1;
    this.addEventListener("focus", this.handleFocus);
    this.addEventListener("blur", this.handleBlur);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("focus", this.handleFocus);
    this.removeEventListener("blur", this.handleBlur);
  }

  protected override updated(): void {
    // Sync ARIA + focus attribute every update. Cheap enough that gating on
    // PropertyValues<this> isn't worth the type juggling (focused is a
    // private @state that doesn't appear in changed).
    this.setAttribute("aria-checked", this.checked ? "true" : "false");
    this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
    if (this.focused) this.setAttribute("focused", "");
    else this.removeAttribute("focused");
  }

  private handleFocus = () => (this.focused = true);
  private handleBlur = () => (this.focused = false);

  override render(): TemplateResult {
    return html`
      <span part="base" class="base ${this.disabled ? "disabled" : ""}">
        <span part="control" class="control">
          <span class="dot"></span>
        </span>
        <slot></slot>
      </span>
    `;
  }
}
