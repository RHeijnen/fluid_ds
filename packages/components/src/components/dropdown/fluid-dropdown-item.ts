import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

let counter = 0;

/**
 * One item inside a `<fluid-dropdown>`. Acts as a menu item, selecting it
 * fires `fluid-select` on the dropdown and closes the menu.
 *
 * Set `type="checkbox"` for toggleable items, `type="separator"` for
 * non-interactive dividers.
 *
 * @summary Selectable item inside a dropdown menu.
 *
 * @slot - The item label.
 * @slot prefix - Optional leading icon.
 * @slot suffix - Optional trailing icon or shortcut hint.
 *
 * Every styled property reads a component-scoped `--fluid-dropdown-item-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-dropdown-item-fg - Item text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-dropdown-item-active-accent - Accent for the active highlight + rail. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-dropdown-item-rail-width - Active left-rail width. Falls back to 2px.
 * @cssproperty --fluid-dropdown-item-separator-color - Separator line color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-dropdown-item-separator-width - Separator line thickness. Falls back to 1px.
 * @cssproperty --fluid-dropdown-item-check-color - Checkmark color for checkbox items. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-dropdown-item-suffix-fg - Suffix text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-dropdown-item-radius - Corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-dropdown-item-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-dropdown-item-font-size - Font size. Falls back to --fluid-font-size-md.
 *
 * @uses-token --fluid-text-primary - Default text.
 * @uses-token --fluid-text-secondary - Suffix text.
 * @uses-token --fluid-surface-muted - Highlight background.
 * @uses-token --fluid-accent-base - Active accent + checkmark color.
 * @uses-token --fluid-border-default - Separator line color.
 * @uses-token --fluid-target-min - Minimum item hit-target height (24px AA / 44px AAA).
 * @uses-token --fluid-radius-sm - Corner radius.
 * @uses-token --fluid-radius-full - Active-rail radius.
 * @uses-token --fluid-font-family-sans - Font family.
 * @uses-token --fluid-font-size-md - Font size.
 */
export class FluidDropdownItem extends FluidElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
      padding: var(--fluid-space-2) var(--fluid-space-3);
      font-family: var(--fluid-dropdown-item-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-dropdown-item-font-size, var(--fluid-font-size-md));
      color: var(--fluid-dropdown-item-fg, var(--fluid-text-primary));
      cursor: pointer;
      user-select: none;
      border-radius: var(--fluid-dropdown-item-radius, var(--fluid-radius-sm));
      /* Anchor the active rail (::before) to the item box. */
      position: relative;
      transition: background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    /* SC 2.5.8 Target Size, interactive items floor to --fluid-target-min
       (separators are exempt: they're non-interactive thin rules). */
    :host(:not([type="separator"])) {
      min-height: var(--fluid-target-min, 0px);
    }

    /* Active = keyboard-highlighted. Brand-tinted background + a 2px accent
       rail on the left, identical to fluid-option so menus and listboxes
       share one highlight language. */
    :host([active]) {
      background: color-mix(
        in srgb,
        var(--fluid-dropdown-item-active-accent, var(--fluid-accent-base)) 8%,
        transparent
      );
    }
    :host([active])::before {
      content: "";
      position: absolute;
      left: 0;
      top: 4px;
      bottom: 4px;
      width: var(--fluid-dropdown-item-rail-width, 2px);
      background: var(--fluid-dropdown-item-active-accent, var(--fluid-accent-base));
      border-radius: var(--fluid-radius-full);
    }

    :host([disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host([type="separator"]) {
      padding: 0;
      cursor: default;
      pointer-events: none;
    }

    :host([type="separator"])::before {
      content: "";
      flex: 1 1 auto;
      height: 1px;
      background: var(--fluid-dropdown-item-separator-color, var(--fluid-border-default));
      margin: var(--fluid-space-1) 0;
    }

    .check {
      width: 1rem;
      height: 1rem;
      color: var(--fluid-dropdown-item-check-color, var(--fluid-accent-base));
      visibility: hidden;
    }
    :host([type="checkbox"][checked]) .check {
      visibility: visible;
    }

    .label {
      flex: 1 1 auto;
    }

    ::slotted([slot="suffix"]) {
      color: var(--fluid-dropdown-item-suffix-fg, var(--fluid-text-secondary));
      font-size: var(--fluid-font-size-sm);
    }
  `;

  /** Value reported when this item is selected. */
  @property() value = "";

  /** Item type. */
  @property({ reflect: true }) type: "item" | "checkbox" | "separator" = "item";

  /** Checked state (for `type="checkbox"`). */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Active (keyboard-highlighted) state. Managed by parent. */
  @property({ type: Boolean, reflect: true }) active = false;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", this.type === "separator" ? "separator" : "menuitem");
    if (!this.id) this.id = `fluid-dropdown-item-${++counter}`;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("type")) {
      this.setAttribute("role", this.type === "separator" ? "separator" : "menuitem");
    }
    if (changed.has("disabled")) {
      this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
    }
    if (changed.has("checked") && this.type === "checkbox") {
      this.setAttribute("aria-checked", this.checked ? "true" : "false");
    }
  }

  override render(): TemplateResult {
    if (this.type === "separator") return html``;
    return html`
      ${this.type === "checkbox"
        ? html`<svg class="check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8 L7 12 L13 4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>`
        : html`<slot name="prefix"></slot>`}
      <span class="label"><slot></slot></span>
      <slot name="suffix"></slot>
    `;
  }
}
