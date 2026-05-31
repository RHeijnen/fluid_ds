import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * App shell, a CSS-grid layout with named slots for the common app regions:
 * banner, header, subheader, navigation, aside, main, footer. Hide a region
 * by leaving its slot empty (the row/column collapses).
 *
 * Use this as the outermost element on a page to get a consistent layout
 * without re-implementing the grid every time.
 *
 * @summary App-shell layout.
 *
 * @slot banner - Top banner row (announcements, system messages).
 * @slot header - Primary header row.
 * @slot subheader - Optional subheader row beneath the header.
 * @slot navigation - Left navigation column.
 * @slot - Main content.
 * @slot aside - Right aside column.
 * @slot footer - Footer row.
 *
 * @csspart base - The root grid container.
 *
 * @cssproperty --fluid-page-nav-width - Width of the navigation column.
 * @cssproperty --fluid-page-aside-width - Width of the aside column.
 * @cssproperty --fluid-page-header-height - Header row min height.
 * @cssproperty --fluid-page-bg - Page background.
 * @cssproperty --fluid-page-fg - Default text color.
 *
 * @uses-token --fluid-surface-base - Default page background.
 * @uses-token --fluid-text-primary - Default text color.
 */
export class FluidPage extends FluidElement {
  static override styles = css`
    :host {
      display: grid;
      min-height: 100vh;
      background: var(--fluid-page-bg, var(--fluid-surface-base));
      color: var(--fluid-page-fg, var(--fluid-text-primary));
      font-family: var(--fluid-font-family-sans);
      grid-template-columns:
        var(--fluid-page-nav-width, 16rem)
        1fr
        var(--fluid-page-aside-width, 16rem);
      grid-template-rows: auto auto auto 1fr auto;
      grid-template-areas:
        "banner banner banner"
        "header header header"
        "subheader subheader subheader"
        "navigation main aside"
        "footer footer footer";
    }

    .banner {
      grid-area: banner;
    }
    .header {
      grid-area: header;
      min-height: var(--fluid-page-header-height, 3.5rem);
    }
    .subheader {
      grid-area: subheader;
    }
    .navigation {
      grid-area: navigation;
      overflow: auto;
    }
    .main {
      grid-area: main;
      overflow: auto;
    }
    .aside {
      grid-area: aside;
      overflow: auto;
    }
    .footer {
      grid-area: footer;
    }

    /* Empty regions collapse so they don't reserve grid space. */
    .empty {
      display: none;
    }

    /* When navigation slot is empty, collapse its column. */
    :host(:not([data-has-nav])) {
      grid-template-columns: 0 1fr var(--fluid-page-aside-width, 16rem);
    }
    :host(:not([data-has-aside])) {
      grid-template-columns: var(--fluid-page-nav-width, 16rem) 1fr 0;
    }
    :host(:not([data-has-nav]):not([data-has-aside])) {
      grid-template-columns: 0 1fr 0;
    }

    @media (max-width: 768px) {
      :host {
        grid-template-columns: 1fr;
        grid-template-areas:
          "banner"
          "header"
          "subheader"
          "navigation"
          "main"
          "aside"
          "footer";
      }
    }
  `;

  /** Visually treat the page as fixed-height (sticky shells, app-like). */
  @property({ type: Boolean, reflect: true }) fixed = false;

  override render(): TemplateResult {
    return html`
      <div part="banner" class="banner">
        <slot name="banner" @slotchange=${this.handleSlot("banner")}></slot>
      </div>
      <div part="header" class="header">
        <slot name="header" @slotchange=${this.handleSlot("header")}></slot>
      </div>
      <div part="subheader" class="subheader">
        <slot name="subheader" @slotchange=${this.handleSlot("subheader")}></slot>
      </div>
      <div part="navigation" class="navigation">
        <slot name="navigation" @slotchange=${this.handleSlot("navigation")}></slot>
      </div>
      <div part="main" class="main">
        <slot @slotchange=${this.handleSlot("main")}></slot>
      </div>
      <div part="aside" class="aside">
        <slot name="aside" @slotchange=${this.handleSlot("aside")}></slot>
      </div>
      <div part="footer" class="footer">
        <slot name="footer" @slotchange=${this.handleSlot("footer")}></slot>
      </div>
    `;
  }

  private handleSlot(region: string) {
    return (e: Event) => {
      const slot = e.target as HTMLSlotElement;
      const has = slot.assignedNodes({ flatten: true }).length > 0;
      const parent = slot.parentElement;
      if (parent) parent.classList.toggle("empty", !has);
      if (region === "navigation") this.toggleAttribute("data-has-nav", has);
      if (region === "aside") this.toggleAttribute("data-has-aside", has);
    };
  }
}
