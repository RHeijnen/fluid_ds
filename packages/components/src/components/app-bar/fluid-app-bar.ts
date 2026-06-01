import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";

registerIcon(
  "menu",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>`
);

/**
 * Top application header bar. Renders a native `header` landmark
 * (role="banner") laid out as a single flex row with three regions:
 * a leading `start` slot (brand/logo plus an optional menu toggle), the
 * default slot for primary navigation, and a trailing `end` slot for
 * actions. Layout opinion is intentionally minimal: start, nav, and end,
 * separated by flexible space. The bar can be `sticky` (pinned to the top of
 * its scroll container) and `elevated` (drop shadow).
 *
 * An optional built-in hamburger button (shown with `menu-button`) fires
 * `fluid-menu-toggle` when pressed, so a consumer can open a navigation
 * drawer without wiring their own control. The button is a real `button`
 * with an accessible name (`menu-label`, default "Open menu") and an
 * `aria-expanded` state mirrored from the `expanded` property.
 *
 * @summary Top application header bar with brand, nav, and actions regions.
 *
 * @slot start - Leading region: brand/logo. Rendered after the built-in
 *   menu button when `menu-button` is set.
 * @slot - Default (unnamed) region: primary navigation.
 * @slot end - Trailing region: actions (buttons, avatar, search).
 *
 * @csspart base - The `header` banner element.
 * @csspart start - The leading region wrapper.
 * @csspart nav - The default navigation region wrapper.
 * @csspart end - The trailing region wrapper.
 * @csspart menu-button - The built-in hamburger button (when `menu-button`).
 *
 * Every styled property reads a component-scoped `--fluid-app-bar-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-app-bar-bg - Bar background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-app-bar-fg - Bar text/icon color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-app-bar-height - Bar height. Falls back to 3.5rem.
 * @cssproperty --fluid-app-bar-padding - Inline padding. Falls back to --fluid-space-4.
 * @cssproperty --fluid-app-bar-gap - Gap between regions. Falls back to --fluid-space-4.
 * @cssproperty --fluid-app-bar-border - Bottom border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-app-bar-border-width - Bottom border width. Falls back to 1px.
 * @cssproperty --fluid-app-bar-shadow - Elevation shadow (when `elevated`). Falls back to --fluid-shadow-sm.
 * @cssproperty --fluid-app-bar-z-index - Stacking order (when `sticky`). Falls back to 10.
 * @cssproperty --fluid-app-bar-focus-ring - Menu button focus ring color. Falls back to --fluid-focus-ring-color.
 *
 * @uses-token --fluid-surface-base - Bar background.
 * @uses-token --fluid-text-primary - Bar text/icon color.
 * @uses-token --fluid-border-default - Bottom border.
 * @uses-token --fluid-shadow-sm - Elevation shadow.
 * @uses-token --fluid-space-4 - Inline padding and region gap.
 * @uses-token --fluid-radius-md - Menu button corner radius.
 * @uses-token --fluid-surface-muted - Menu button hover background.
 * @uses-token --fluid-focus-ring-color - Menu button focus ring.
 * @uses-token --fluid-target-min - Menu button minimum target size.
 * @uses-token --fluid-focus-ring-width - Focus ring thickness.
 *
 * @fires fluid-menu-toggle - Dispatched when the built-in hamburger button is
 *   pressed. `event.detail.expanded` carries the new intended expanded state
 *   (the negation of the current `expanded` value). Bubbles and is composed.
 */
export class FluidAppBar extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans);
      color: var(--fluid-app-bar-fg, var(--fluid-text-primary));
    }

    :host([hidden]) {
      display: none;
    }

    :host([sticky]) {
      position: sticky;
      top: 0;
      z-index: var(--fluid-app-bar-z-index, 10);
    }

    .base {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: var(--fluid-app-bar-gap, var(--fluid-space-4));
      width: 100%;
      min-height: var(--fluid-app-bar-height, 3.5rem);
      padding-inline: var(--fluid-app-bar-padding, var(--fluid-space-4));
      background-color: var(--fluid-app-bar-bg, var(--fluid-surface-base));
      color: var(--fluid-app-bar-fg, var(--fluid-text-primary));
      border-bottom: var(--fluid-app-bar-border-width, 1px) solid
        var(--fluid-app-bar-border, var(--fluid-border-default));
    }

    :host([elevated]) .base {
      box-shadow: var(--fluid-app-bar-shadow, var(--fluid-shadow-sm));
    }

    .start {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
      flex: 0 0 auto;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
      flex: 1 1 auto;
      min-width: 0;
    }

    .end {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
      flex: 0 0 auto;
      margin-inline-start: auto;
    }

    ::slotted(*) {
      margin: 0;
    }

    .menu-button {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: max(2rem, var(--fluid-target-min, 0px));
      min-height: max(2rem, var(--fluid-target-min, 0px));
      padding: var(--fluid-space-1);
      border-radius: var(--fluid-app-bar-radius, var(--fluid-radius-md));
      color: inherit;
      cursor: pointer;
      transition: background-color var(--fluid-duration-fast, 120ms)
        var(--fluid-easing-standard, ease);
    }

    .menu-button:hover {
      background-color: var(
        --fluid-app-bar-button-hover-bg,
        var(--fluid-surface-muted)
      );
    }

    .menu-button:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-app-bar-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: var(--fluid-focus-ring-offset, 2px);
    }

    .menu-button fluid-icon {
      width: 1.25rem;
      height: 1.25rem;
    }

    @media (prefers-reduced-motion: reduce) {
      .menu-button {
        transition-duration: 0.01ms;
      }
    }
  `;

  /** Pin the bar to the top of its scroll container (position: sticky). */
  @property({ type: Boolean, reflect: true }) sticky = false;

  /** Cast a drop shadow under the bar. */
  @property({ type: Boolean, reflect: true }) elevated = false;

  /** Show the built-in hamburger button in the start region. */
  @property({ type: Boolean, reflect: true, attribute: "menu-button" })
  menuButton = false;

  /**
   * Reflected expanded state for the built-in menu button's `aria-expanded`.
   * The consumer owns the actual navigation surface, set this to mirror its
   * open/closed state.
   */
  @property({ type: Boolean, reflect: true }) expanded = false;

  /** Accessible name for the built-in menu button. */
  @property({ attribute: "menu-label" }) menuLabel = "Open menu";

  private handleMenuToggle = (): void => {
    const next = !this.expanded;
    this.dispatchEvent(
      new CustomEvent("fluid-menu-toggle", {
        detail: { expanded: next },
        bubbles: true,
        composed: true
      })
    );
  };

  override render(): TemplateResult {
    return html`
      <header part="base" class="base" role="banner">
        <div part="start" class="start">
          ${this.menuButton
            ? html`
                <button
                  part="menu-button"
                  class="menu-button"
                  type="button"
                  aria-label=${this.menuLabel}
                  aria-expanded=${this.expanded ? "true" : "false"}
                  @click=${this.handleMenuToggle}
                >
                  <fluid-icon name="menu"></fluid-icon>
                </button>
              `
            : ""}
          <slot name="start"></slot>
        </div>
        <nav part="nav" class="nav">
          <slot></slot>
        </nav>
        <div part="end" class="end">
          <slot name="end"></slot>
        </div>
      </header>
    `;
  }
}
