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
 * @cssproperty --fluid-option-active-bg - Keyboard-active option background.
 * @cssproperty --fluid-option-padding-block - Option block padding. Falls back to --fluid-space-2.
 * @cssproperty --fluid-option-padding-inline - Option inline padding. Falls back to --fluid-space-3.
 * @cssproperty --fluid-option-font-family - Option font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-option-font-size - Option font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-option-radius - Option corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-option-selected-font-weight - Selected label weight. Falls back to --fluid-font-weight-medium.
 * @cssproperty --fluid-option-disabled-opacity - Disabled opacity. Defaults to 0.5.
 * @cssproperty --fluid-option-duration - State transition duration. Falls back to --fluid-duration-fast.
 * @cssproperty --fluid-option-easing - State transition easing. Falls back to --fluid-easing-standard.
 * @cssproperty --fluid-option-active-rail-width - Active rail width. Defaults to 2px.
 * @cssproperty --fluid-option-active-rail-inset - Active rail block inset. Defaults to 4px.
 * @cssproperty --fluid-option-active-rail-radius - Active rail radius. Falls back to --fluid-radius-full.
 *
 * @uses-token --fluid-text-primary - Default option/selected text color.
 * @uses-token --fluid-accent-base - Active rail and active/selected tint base.
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
      padding: var(--fluid-option-padding-block, var(--fluid-space-2))
        var(--fluid-option-padding-inline, var(--fluid-space-3));
      font-family: var(--fluid-option-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-option-font-size, var(--fluid-font-size-md));
      color: var(--fluid-option-fg, var(--fluid-text-primary));
      cursor: pointer;
      user-select: none;
      border-radius: var(--fluid-option-radius, var(--fluid-radius-sm));
      position: relative;
      overflow: hidden;
      transition:
        background-color var(--fluid-option-duration, var(--fluid-duration-fast))
          var(--fluid-option-easing, var(--fluid-easing-standard)),
        color var(--fluid-option-duration, var(--fluid-duration-fast))
          var(--fluid-option-easing, var(--fluid-easing-standard));
    }

    /*
     * The label truncates, not the host. text-overflow wants a block container
     * and the host is a flex one, so a label longer than the listbox was cut
     * mid-glyph with no ellipsis to say it had been.
     */
    .label {
      flex: 1 1 auto;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host([hidden]) {
      display: none;
    }

    /* Active = keyboard-focused. Brand-tinted background + a 2px accent rail
       on the left. Same pattern as typeahead options for visual consistency. */
    :host([active]) {
      background: var(
        --fluid-option-active-bg,
        color-mix(in srgb, var(--fluid-option-accent, var(--fluid-accent-base)) 8%, transparent)
      );
    }
    :host([active])::before {
      content: "";
      position: absolute;
      inset-inline-start: 0;
      top: var(--fluid-option-active-rail-inset, 4px);
      bottom: var(--fluid-option-active-rail-inset, 4px);
      width: var(--fluid-option-active-rail-width, 2px);
      background: var(--fluid-option-accent, var(--fluid-accent-base));
      border-radius: var(--fluid-option-active-rail-radius, var(--fluid-radius-full));
    }

    :host([selected]) {
      /* Theme-aware accent tint (resolves per light/dark) instead of raw
         brand primitives. text-primary keeps contrast against the tint in
         both themes. Same accent ladder as the active state above. */
      background: var(
        --fluid-option-selected-bg,
        color-mix(in srgb, var(--fluid-accent-base) 16%, transparent)
      );
      color: var(--fluid-option-selected-fg, var(--fluid-text-primary));
      font-weight: var(--fluid-option-selected-font-weight, var(--fluid-font-weight-medium));
    }

    :host([disabled]) {
      opacity: var(--fluid-option-disabled-opacity, 0.5);
      cursor: not-allowed;
    }
  `;

  /** Value submitted when this option is chosen. */
  @property({ reflect: true }) value = "";

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
    return html`<span part="label" class="label"
      ><slot @slotchange=${this.carryFullLabel}></slot
    ></span>`;
  }

  /**
   * Keeps the whole label reachable once it is too long to show.
   *
   * Whether it is truncated depends on the listbox's width, which is not known
   * until it opens, so the title is set from the label unconditionally rather
   * than measured. An author who wants something else on hover keeps it.
   */
  private authoredTitle: string | null = null;
  private carryFullLabel = (): void => {
    this.authoredTitle ??= this.getAttribute("title") ?? "";
    if (!this.authoredTitle) this.title = this.label;
  };
}
