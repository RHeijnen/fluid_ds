import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import type { FluidBreadcrumbItem } from "./fluid-breadcrumb-item.js";

/**
 * Hierarchical navigation trail. Children are `<fluid-breadcrumb-item>`
 * elements. The breadcrumb auto-marks the last visible item as `current`
 * and hides its trailing separator.
 *
 * @summary Trail of links showing position in a site hierarchy.
 *
 * @slot - One or more `<fluid-breadcrumb-item>` elements.
 *
 * @csspart base - The outer container.
 *
 * @cssproperty --fluid-breadcrumb-gap - Gap between segments. Falls back to --fluid-space-2.
 *
 * @uses-token --fluid-space-2 - Default gap between segments.
 * @uses-token --fluid-text-secondary - Default separator color.
 */
export class FluidBreadcrumb extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

    .base {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--fluid-space-1) var(--fluid-breadcrumb-gap, var(--fluid-space-2));
    }

    /* Hide the separator on the visually-last item. */
    ::slotted(fluid-breadcrumb-item:last-of-type)::part(separator) {
      display: none;
    }
  `;

  /**
   * Accessible label for the nav landmark. Defaults to "Breadcrumb".
   */
  @property() override ariaLabel: string | null = "Breadcrumb";

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Breadcrumb");
  }

  private handleSlotChange = () => {
    // Mark the last item as current if no item is explicitly current.
    const items = Array.from(
      this.querySelectorAll<HTMLElement>("fluid-breadcrumb-item")
    ) as FluidBreadcrumbItem[];
    if (!items.length) return;
    const anyExplicit = items.some((i) => i.hasAttribute("current"));
    if (!anyExplicit) {
      items[items.length - 1]!.current = true;
    }
  };

  override render(): TemplateResult {
    return html`
      <nav part="base" class="base">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </nav>
    `;
  }
}
