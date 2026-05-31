import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

let counter = 0;

/**
 * A single option inside a `<fluid-select>`.
 *
 * Authored as a light-DOM child of select:
 *
 * ```html
 * <fluid-select>
 *   <fluid-option value="us">United States</fluid-option>
 * </fluid-select>
 * ```
 *
 * @summary One choice in a select listbox.
 *
 * @slot - The visible label.
 *
 * @csspart base - The option element.
 *
 * @cssproperty --fluid-option-fg - Option text color.
 * @cssproperty --fluid-option-accent - Accent color used for the active rail and tint.
 * @cssproperty --fluid-option-selected-bg - Selected option background.
 * @cssproperty --fluid-option-selected-fg - Selected option text color.
 */
export class FluidOption extends FluidElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      /* box-sizing: padding is included in the option's outer width so
         options always fit cleanly inside the listbox's content box. */
      box-sizing: border-box;
      /* When the listbox grows to fit the longest label, every option
         spans the full listbox width. min-width: 0 lets a label that's
         still longer than the listbox truncate with text-overflow
         instead of pushing the listbox wider and triggering overflow. */
      min-width: 0;
      padding: var(--fluid-space-2) var(--fluid-space-3);
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-font-size-md);
      color: var(--fluid-option-fg, var(--fluid-text-primary));
      cursor: pointer;
      user-select: none;
      border-radius: var(--fluid-radius-sm);
      position: relative;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition:
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    :host([hidden]) {
      display: none;
    }

    /* Active = keyboard-focused. Brand-tinted background + a 2px accent rail
       on the left. Same pattern as typeahead options for visual consistency. */
    :host([active]) {
      background: color-mix(
        in srgb,
        var(--fluid-option-accent, var(--fluid-accent-base)) 8%,
        transparent
      );
    }
    :host([active])::before {
      content: "";
      position: absolute;
      left: 0;
      top: 4px;
      bottom: 4px;
      width: 2px;
      background: var(--fluid-option-accent, var(--fluid-accent-base));
      border-radius: var(--fluid-radius-full);
    }

    :host([selected]) {
      background: var(--fluid-option-selected-bg, var(--fluid-color-brand-50));
      color: var(--fluid-option-selected-fg, var(--fluid-color-brand-800));
      font-weight: var(--fluid-font-weight-medium);
    }

    :host([disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  /** Value submitted when this option is chosen. */
  @property() value = "";

  /** Whether this option is the currently highlighted (keyboard-active) option. */
  @property({ type: Boolean, reflect: true }) active = false;

  /** Whether this option is the currently selected option. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Whether this option is disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "option");
    if (!this.id) this.id = `fluid-option-${++counter}`;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("selected")) {
      this.setAttribute("aria-selected", this.selected ? "true" : "false");
    }
    if (changed.has("disabled")) {
      this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
    }
  }

  /** The visible text label (used for type-ahead). */
  get label(): string {
    return this.textContent?.trim() ?? "";
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
