import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A vertical site-navigation menu: a landmark `<nav>` wrapping a
 * `role="list"` of `<fluid-nav-item>` links.
 *
 * This is page navigation, not a menu of actions. The APG distinction matters:
 * a `role="menu"` widget (see `<fluid-menu>`) is for application commands with a
 * roving tabindex; a `<nav>` of links is static navigation where every item is a
 * real `<a>` in the natural Tab order. Use this for sidebars and section nav;
 * reach for `<fluid-menu>` when the items run actions, and `<fluid-tree>` when
 * the items express a parent/child hierarchy.
 *
 * Keyboard is native: each item is a real link, so Tab / Shift+Tab move between
 * items and Enter follows the link. There is no special key handling to learn.
 *
 * @summary Vertical navigation landmark wrapping a list of links.
 *
 * @slot - One or more `<fluid-nav-item>` elements.
 *
 * @csspart base - The `<nav>` landmark element.
 * @csspart list - The `role="list"` container.
 *
 * Every styled property reads a component-scoped `--fluid-nav-list-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-nav-list-gap - Vertical gap between items. Falls back to --fluid-space-1.
 * @cssproperty --fluid-nav-list-padding - Inner padding of the list. Falls back to 0.
 *
 * @uses-token --fluid-space-1 - Gap between items.
 * @uses-token --fluid-font-family-sans - Navigation font family.
 */
export class FluidNavList extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans);
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: block;
    }

    .list {
      list-style: none;
      margin: 0;
      padding: var(--fluid-nav-list-padding, 0);
      display: flex;
      flex-direction: column;
      gap: var(--fluid-nav-list-gap, var(--fluid-space-1));
    }

    ::slotted(*) {
      margin: 0 !important;
    }
  `;

  /**
   * Accessible name for the navigation landmark. A page can have more than one
   * `<nav>`, so a unique label keeps them distinguishable to assistive tech.
   */
  @property() label = "";

  override render(): TemplateResult {
    return html`
      <nav part="base" class="base" aria-label=${this.label || "Navigation"}>
        <div part="list" class="list" role="list">
          <slot></slot>
        </div>
      </nav>
    `;
  }
}
