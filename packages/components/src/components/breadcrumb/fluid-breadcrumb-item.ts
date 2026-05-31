import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A single segment within a `<fluid-breadcrumb>`. Renders as a link when
 * `href` is set; otherwise renders as plain text (used for the current page).
 *
 * @summary Breadcrumb segment, link or current-page marker.
 *
 * @slot - The segment label.
 * @slot prefix - Optional leading icon/marker.
 * @slot suffix - Optional trailing icon/marker.
 * @slot separator - Custom separator (overrides the parent's default).
 *
 * @csspart base - The segment wrapper.
 * @csspart label - The clickable / textual label.
 * @csspart separator - The trailing separator element.
 *
 * Every styled property reads a component-scoped `--fluid-breadcrumb-item-*`
 * token that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-breadcrumb-item-fg - Default segment text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-breadcrumb-item-current-fg - Current segment text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-breadcrumb-item-accent - Hover/focus accent color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-breadcrumb-item-separator-fg - Separator color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-breadcrumb-item-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-breadcrumb-item-font-size - Font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-breadcrumb-item-radius - Link corner radius (focus ring). Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-breadcrumb-item-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-breadcrumb-item-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-text-secondary - Default segment text + separator.
 * @uses-token --fluid-text-primary - Current segment (no link).
 * @uses-token --fluid-accent-base - Hover/focus accent.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-font-family-sans - Font family.
 * @uses-token --fluid-font-size-sm - Font size.
 * @uses-token --fluid-radius-sm - Link corner radius.
 */
export class FluidBreadcrumbItem extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-2);
      color: var(--fluid-breadcrumb-item-fg, var(--fluid-text-secondary));
      font-family: var(--fluid-breadcrumb-item-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-breadcrumb-item-font-size, var(--fluid-font-size-sm));
    }

    .label {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-1);
      color: inherit;
      text-decoration: none;
      border-radius: var(--fluid-breadcrumb-item-radius, var(--fluid-radius-sm));
      padding: 2px 4px;
      transition: color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    a.label:hover,
    a.label:focus-visible {
      color: var(--fluid-breadcrumb-item-accent, var(--fluid-accent-base));
    }

    a.label:focus-visible {
      outline: var(--fluid-breadcrumb-item-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-breadcrumb-item-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: var(--fluid-focus-ring-offset);
    }

    .current {
      color: var(--fluid-breadcrumb-item-current-fg, var(--fluid-text-primary));
      font-weight: var(--fluid-font-weight-medium);
      cursor: default;
    }

    .separator {
      display: inline-flex;
      color: var(--fluid-breadcrumb-item-separator-fg, var(--fluid-text-secondary));
      opacity: 0.6;
      user-select: none;
    }

    /* Hide separator on the last child, owned by the parent breadcrumb's
       :last-child selector via slot assignment. Implementation simplification:
       the parent removes the separator slot on the last item. */
  `;

  /** Link target. Omit for the current/non-clickable segment. */
  @property() href = "";

  /** Whether this is the current page (last segment). Sets aria-current. */
  @property({ type: Boolean, reflect: true }) current = false;

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("current")) {
      if (this.current) this.setAttribute("aria-current", "page");
      else this.removeAttribute("aria-current");
    }
  }

  override render(): TemplateResult {
    const isLink = !!this.href && !this.current;
    const inner = html`
      <slot name="prefix"></slot>
      <slot></slot>
      <slot name="suffix"></slot>
    `;
    return html`
      ${isLink
        ? html`<a part="label" class="label" href=${this.href}>${inner}</a>`
        : html`<span part="label" class="label ${this.current ? "current" : ""}">${inner}</span>`}
      <span part="separator" class="separator" aria-hidden="true">
        <slot name="separator">/</slot>
      </span>
    `;
  }
}
