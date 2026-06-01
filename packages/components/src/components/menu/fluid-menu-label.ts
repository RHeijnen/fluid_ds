import { html, css, type TemplateResult } from "lit";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A non-interactive group heading inside a `<fluid-menu>`.
 *
 * Use it to label a run of related `<fluid-menu-item>`s. It is presentational,
 * the menu skips it during keyboard navigation (only `fluid-menu-item`s are
 * navigable), and it carries `role="presentation"` so it is not announced as a
 * menu item.
 *
 * ```html
 * <fluid-menu>
 *   <fluid-menu-label>Account</fluid-menu-label>
 *   <fluid-menu-item value="profile">Profile</fluid-menu-item>
 * </fluid-menu>
 * ```
 *
 * @summary A group heading / divider inside a menu surface.
 *
 * @slot - The heading text. Leave empty for a plain divider line.
 *
 * @csspart base - The label row.
 *
 * Every styled property reads a component-scoped `--fluid-menu-label-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-menu-label-fg - Heading text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-menu-label-padding - Row padding (shorthand). Falls back to --fluid-space-1 --fluid-space-3.
 * @cssproperty --fluid-menu-label-font-size - Heading font size. Falls back to --fluid-font-size-xs.
 * @cssproperty --fluid-menu-label-divider - Top divider color. Falls back to --fluid-border-default.
 *
 * @uses-token --fluid-text-secondary - Heading text color.
 * @uses-token --fluid-border-default - Top divider color.
 * @uses-token --fluid-font-size-xs - Heading font size.
 * @uses-token --fluid-font-weight-medium - Heading weight.
 * @uses-token --fluid-font-family-sans - Font family.
 * @uses-token --fluid-space-1 - Row vertical padding.
 * @uses-token --fluid-space-3 - Row horizontal padding.
 */
export class FluidMenuLabel extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      box-sizing: border-box;
      padding: var(--fluid-menu-label-padding, var(--fluid-space-1) var(--fluid-space-3));
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-menu-label-font-size, var(--fluid-font-size-xs));
      font-weight: var(--fluid-font-weight-medium);
      line-height: 1.5;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--fluid-menu-label-fg, var(--fluid-text-secondary));
      user-select: none;
    }

    /* A label that follows other content gets a hairline divider above it so it
       visually separates groups. The first label in a menu omits it. */
    :host(:not(:first-child)) .base {
      margin-top: var(--fluid-space-1);
      border-top: 1px solid var(--fluid-menu-label-divider, var(--fluid-border-default));
      padding-top: var(--fluid-space-2);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    // Presentational: not a menuitem, so AT doesn't count it in the set and the
    // menu's roving navigation skips it (it only walks fluid-menu-item).
    this.setAttribute("role", "presentation");
  }

  override render(): TemplateResult {
    return html`<div part="base" class="base"><slot></slot></div>`;
  }
}
