import { html, css, nothing, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { reducedMotion } from "../../internal/motion.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A single navigation link inside a `<fluid-nav-list>`.
 *
 * Renders a real `<a href>` so keyboard, focus, and "open in new tab" all work
 * natively, with no JS keyboard handling. Set `current` on the link for the page
 * the user is on: it applies `aria-current="page"` and the active style so the
 * location is conveyed both visually and to assistive tech.
 *
 * The host sits in the parent list's `role="list"` as a `role="listitem"`, so
 * the list semantics stay correct even though the item is a custom element.
 *
 * @summary One link in a vertical navigation list.
 *
 * @slot - The visible label text.
 * @slot icon - A leading icon (e.g. `<fluid-icon>`), rendered before the label.
 * @slot badge - Trailing content such as a count badge, rendered after the label.
 *
 * @csspart base - The list item wrapper.
 * @csspart link - The `<a>` element.
 * @csspart icon - The leading icon wrapper.
 * @csspart label - The label text wrapper.
 * @csspart badge - The trailing badge wrapper.
 *
 * Every styled property reads a component-scoped `--fluid-nav-item-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-nav-item-fg - Link text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-nav-item-hover-bg - Hover/focus background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-nav-item-hover-fg - Hover/focus text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-nav-item-active-bg - Active (current page) background. Falls back to a tint of --fluid-accent-base.
 * @cssproperty --fluid-nav-item-active-fg - Active (current page) text color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-nav-item-radius - Row corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-nav-item-padding - Row padding (shorthand). Falls back to --fluid-space-2 --fluid-space-3.
 * @cssproperty --fluid-nav-item-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 *
 * @uses-token --fluid-text-secondary - Resting link text color.
 * @uses-token --fluid-text-primary - Hover text color.
 * @uses-token --fluid-surface-muted - Hover background.
 * @uses-token --fluid-accent-base - Active tint + active text.
 * @uses-token --fluid-radius-sm - Row corner radius.
 * @uses-token --fluid-space-2 - Row vertical padding + gap.
 * @uses-token --fluid-space-3 - Row horizontal padding.
 * @uses-token --fluid-font-size-md - Font size.
 * @uses-token --fluid-font-weight-regular - Resting font weight.
 * @uses-token --fluid-font-weight-medium - Active font weight.
 * @uses-token --fluid-target-min - Minimum row height floor (24px AA / 44px AAA).
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width.
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 * @uses-token --fluid-duration-fast - Transition duration.
 * @uses-token --fluid-easing-standard - Transition easing.
 */
export class FluidNavItem extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
        outline: none;
      }

      :host([hidden]) {
        display: none;
      }

      .link {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: var(--fluid-space-2);
        text-decoration: none;
        /* min-height reads --fluid-target-min as a floor so AAA lifts the row
           to a 44px target (SC 2.5.5) while AA keeps the design height. */
        min-height: max(2rem, var(--fluid-target-min, 0px));
        padding: var(--fluid-nav-item-padding, var(--fluid-space-2) var(--fluid-space-3));
        font-size: var(--fluid-font-size-md);
        font-weight: var(--fluid-font-weight-regular);
        line-height: 1.25;
        color: var(--fluid-nav-item-fg, var(--fluid-text-secondary));
        border-radius: var(--fluid-nav-item-radius, var(--fluid-radius-sm));
        cursor: pointer;
        transition:
          background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
          color var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      .link:hover {
        background: var(--fluid-nav-item-hover-bg, var(--fluid-surface-muted));
        color: var(--fluid-nav-item-hover-fg, var(--fluid-text-primary));
      }

      .link:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-nav-item-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: var(--fluid-focus-ring-offset, 2px);
      }

      /* Current page: accent-tinted background, accent text, heavier weight. */
      :host([current]) .link {
        background: var(
          --fluid-nav-item-active-bg,
          color-mix(in srgb, var(--fluid-accent-base) 12%, transparent)
        );
        color: var(--fluid-nav-item-active-fg, var(--fluid-accent-base));
        font-weight: var(--fluid-font-weight-medium);
      }

      .icon {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
      }

      .label {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .badge {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
      }

      slot[name="icon"]::slotted(*) {
        width: 1em;
        height: 1em;
      }

      ::slotted(*) {
        margin: 0 !important;
      }
    `
  ];

  /** Destination URL. Rendered as the `<a href>`. */
  @property() href = "";

  /** Link target, e.g. `_blank`. Forwarded to the `<a>`. */
  @property() target = "";

  /** `rel` attribute, forwarded to the `<a>` (pair with `target="_blank"`). */
  @property() rel = "";

  /**
   * Marks this item as the current page: applies `aria-current="page"` and the
   * active style. At most one item in a list should set this.
   */
  @property({ type: Boolean, reflect: true }) current = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <a
          part="link"
          class="link"
          href=${this.href || nothing}
          target=${this.target || nothing}
          rel=${this.rel || nothing}
          aria-current=${this.current ? "page" : nothing}
        >
          <span part="icon" class="icon"><slot name="icon"></slot></span>
          <span part="label" class="label"><slot></slot></span>
          <span part="badge" class="badge"><slot name="badge"></slot></span>
        </a>
      </div>
    `;
  }
}
