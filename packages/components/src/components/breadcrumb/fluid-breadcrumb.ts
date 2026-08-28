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
  `;

  /**
   * Accessible label for the nav landmark. Defaults to "Breadcrumb".
   * The legacy `arialabel` attribute remains an alias for native `aria-label`.
   */
  @property({ attribute: "arialabel", noAccessor: true })
  override get ariaLabel(): string | null {
    return this.getAttribute("aria-label");
  }
  override set ariaLabel(value: string | null) {
    if (value === null) this.removeAttribute("aria-label");
    else this.setAttribute("aria-label", value);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.updateDefaultAriaLabel(this.term("breadcrumb"));
    this.itemObserver?.disconnect();
    if (typeof MutationObserver !== "undefined") {
      this.itemObserver = new MutationObserver(() => this.reconcileItems());
      this.itemObserver.observe(this, {
        attributeFilter: ["current", "hidden"],
        attributes: true,
        subtree: true
      });
    }
    this.reconcileItems();
  }

  override disconnectedCallback(): void {
    this.itemObserver?.disconnect();
    super.disconnectedCallback();
  }

  protected override updated(): void {
    this.updateDefaultAriaLabel(this.term("breadcrumb"));
  }

  private automaticCurrent?: FluidBreadcrumbItem;
  private itemObserver?: MutationObserver;

  private reconcileItems(): void {
    const items = Array.from(this.children).filter(
      (child): child is FluidBreadcrumbItem => child.localName === "fluid-breadcrumb-item"
    );
    const visibleItems = items.filter((item) => !item.hidden);
    const last = visibleItems.at(-1);
    const explicitCurrent = visibleItems.some(
      (item) => item !== this.automaticCurrent && item.current
    );

    if (explicitCurrent) {
      if (this.automaticCurrent) this.automaticCurrent.current = false;
      this.automaticCurrent = undefined;
    } else if (last !== this.automaticCurrent || !last?.current) {
      if (this.automaticCurrent) this.automaticCurrent.current = false;
      this.automaticCurrent = last;
      if (last) last.current = true;
    }

    // Mark the visually-last item so it can hide its trailing separator.
    // (`::slotted()::part()` cannot reach a part in the nested shadow tree,
    // so the item itself owns the hide rule keyed off this attribute.)
    items.forEach((item) => {
      if (item === last) item.setAttribute("data-fluid-last", "");
      else item.removeAttribute("data-fluid-last");
    });
  }

  private handleSlotChange = () => this.reconcileItems();

  override render(): TemplateResult {
    return html`
      <nav part="base" class="base">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </nav>
    `;
  }
}
