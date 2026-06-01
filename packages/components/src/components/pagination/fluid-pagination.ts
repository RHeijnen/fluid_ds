import { html, css, nothing, type TemplateResult, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

/**
 * A single rendered slot in the page list: either a real page number or an
 * ellipsis gap that stands in for a run of truncated pages.
 */
type PageItem = number | "ellipsis";

/**
 * APG-style page navigation. Renders a `<nav aria-label="Pagination">` with a
 * Previous control, a run of numbered page buttons (with ellipsis truncation
 * around the current page), and a Next control.
 *
 * Drive it with `total` (item count) plus `page-size`, or pass `total-pages`
 * directly. The current page button carries `aria-current="page"` and is not
 * itself a navigation target. Previous is disabled on the first page, Next on
 * the last. Activating any page (or Previous / Next) fires `fluid-page-change`
 * with `{ page }`; the component also updates its own reflected `page` so it
 * can run uncontrolled, or you can treat the event as the source of truth.
 *
 * @summary Page navigation with ellipsis truncation and prev/next controls.
 *
 * @csspart base - The `<nav>` container.
 * @csspart list - The `<ul>` holding every control.
 * @csspart item - Every `<li>` wrapper.
 * @csspart button - Every interactive control (page numbers + prev/next).
 * @csspart page - A numbered page button.
 * @csspart current - The current page button (also carries `aria-current`).
 * @csspart prev - The Previous control.
 * @csspart next - The Next control.
 * @csspart ellipsis - A truncation gap.
 *
 * @cssproperty --fluid-pagination-gap - Gap between controls. Falls back to --fluid-space-1.
 * @cssproperty --fluid-pagination-radius - Control corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-pagination-bg - Resting control background. Falls back to transparent.
 * @cssproperty --fluid-pagination-fg - Resting control text. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-pagination-border - Control outline color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-pagination-hover-bg - Hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-pagination-current-bg - Current page background. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-pagination-current-fg - Current page text. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-pagination-ellipsis-fg - Ellipsis color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-pagination-focus-ring-color - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-pagination-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-pagination-focus-ring-offset - Focus ring offset. Falls back to --fluid-focus-ring-offset.
 *
 * @uses-token --fluid-text-primary - Resting control text.
 * @uses-token --fluid-text-secondary - Ellipsis color.
 * @uses-token --fluid-border-default - Control outline.
 * @uses-token --fluid-surface-muted - Hover background.
 * @uses-token --fluid-accent-base - Current page background.
 * @uses-token --fluid-accent-text - Current page text.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 * @uses-token --fluid-target-min - Minimum hit-target size (24px AA / 44px AAA).
 * @uses-token --fluid-radius-md - Default corner radius.
 * @uses-token --fluid-space-1 - Default gap between controls.
 * @uses-token --fluid-font-family-sans - Control font family.
 * @uses-token --fluid-font-weight-medium - Control font weight.
 * @uses-token --fluid-duration-fast - Hover transition duration.
 * @uses-token --fluid-easing-standard - Hover transition easing.
 *
 * @fires fluid-page-change - Dispatched when the user navigates to a different
 *   page (prev, next, or a numbered button). `detail` is `{ page: number }`,
 *   the 1-based page the user moved to.
 */
export class FluidPagination extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-pagination-font-family, var(--fluid-font-family-sans, sans-serif));
      font-weight: var(--fluid-pagination-font-weight, var(--fluid-font-weight-medium, 500));
    }

    :host([hidden]) {
      display: none;
    }

    nav {
      display: block;
    }

    .list {
      display: flex;
      align-items: center;
      gap: var(--fluid-pagination-gap, var(--fluid-space-1));
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .button {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      /*
       * SC 2.5.8 Target Size (Minimum). The 24px AA floor is enforced on
       * every control; reading --fluid-target-min lets an ancestor opting
       * into AAA (data-fluid-conformance="aaa") lift every target to 44x44
       * (SC 2.5.5) with no per-component branching.
       */
      min-block-size: var(--fluid-target-min, 24px);
      min-inline-size: var(--fluid-target-min, 24px);
      padding: 0 var(--fluid-space-2);
      border-radius: var(--fluid-pagination-radius, var(--fluid-radius-md));
      font: inherit;
      cursor: pointer;
      user-select: none;
      background-color: var(--fluid-pagination-bg, transparent);
      color: var(--fluid-pagination-fg, var(--fluid-text-primary));
      box-shadow: inset 0 0 0 1px
        var(--fluid-pagination-border, var(--fluid-border-default));
      transition:
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    .button:hover:not([disabled]):not([aria-current="page"]) {
      background-color: var(--fluid-pagination-hover-bg, var(--fluid-surface-muted));
    }

    .button:focus-visible {
      outline: var(--fluid-pagination-focus-ring-width, var(--fluid-focus-ring-width, 2px))
        solid var(--fluid-pagination-focus-ring-color, var(--fluid-focus-ring-color));
      outline-offset: var(--fluid-pagination-focus-ring-offset, var(--fluid-focus-ring-offset));
    }

    .button[disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .button[aria-current="page"] {
      background-color: var(--fluid-pagination-current-bg, var(--fluid-accent-base));
      color: var(--fluid-pagination-current-fg, var(--fluid-accent-text));
      cursor: default;
    }

    .edge svg {
      width: 1em;
      height: 1em;
      flex-shrink: 0;
    }

    .ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: var(--fluid-target-min, 24px);
      min-block-size: var(--fluid-target-min, 24px);
      color: var(--fluid-pagination-ellipsis-fg, var(--fluid-text-secondary));
      user-select: none;
    }

    ${reducedMotion}
  `;

  /**
   * Total number of items being paginated. Combined with `page-size`, this
   * derives the page count. Ignored when `total-pages` is set explicitly.
   */
  @property({ type: Number }) total?: number;

  /**
   * Explicit total page count. Use this when you already know the number of
   * pages; otherwise set `total` + `page-size` and let the component compute
   * it. Takes precedence over `total` when both are present.
   */
  @property({ type: Number, attribute: "total-pages" }) totalPages?: number;

  /** Items per page, used with `total` to derive the page count. */
  @property({ type: Number, attribute: "page-size" }) pageSize = 10;

  /** Current page, 1-based. Reflected so it stays in sync with the attribute. */
  @property({ type: Number, reflect: true }) page = 1;

  /**
   * How many page numbers to keep on each side of the current page before
   * collapsing the rest into an ellipsis. The first and last page are always
   * shown. Default 1, e.g. `1 ... 4 5 6 ... 20`.
   */
  @property({ type: Number }) siblings = 1;

  /**
   * Accessible name for the navigation landmark. Override when a page has more
   * than one pager so each is distinguishable (SC 2.4.1, SC 1.3.1).
   */
  @property({ attribute: "label" }) label = "Pagination";

  /**
   * Resolve the effective page count from whichever inputs are provided.
   * Always at least 1 so the control still renders a single page.
   */
  private get pageCount(): number {
    if (this.totalPages != null && this.totalPages > 0) {
      return Math.floor(this.totalPages);
    }
    if (this.total != null && this.total > 0 && this.pageSize > 0) {
      return Math.max(1, Math.ceil(this.total / this.pageSize));
    }
    return 1;
  }

  /** Clamp the current page into the valid 1..pageCount range. */
  private get current(): number {
    const count = this.pageCount;
    if (!Number.isFinite(this.page)) return 1;
    return Math.min(Math.max(1, Math.floor(this.page)), count);
  }

  /**
   * Build the visible list of page items with ellipsis truncation. The first
   * page, the last page, and a window of `siblings` pages on either side of
   * the current page are always shown; everything else collapses to an
   * "ellipsis" marker. Runs that would hide only a single page render that
   * page instead of an ellipsis (no `... 5 ...` around a lone gap).
   */
  private buildItems(): PageItem[] {
    const count = this.pageCount;
    const current = this.current;
    const siblings = Math.max(0, Math.floor(this.siblings));

    // Small lists: just show every page, no truncation needed.
    const windowSize = siblings * 2 + 5; // first + last + current + 2*siblings + 2 gaps
    if (count <= windowSize) {
      return Array.from({ length: count }, (_, i) => i + 1);
    }

    const left = Math.max(2, current - siblings);
    const right = Math.min(count - 1, current + siblings);
    const items: PageItem[] = [1];

    // Left gap: collapse only when more than one page is hidden.
    if (left > 2) {
      items.push("ellipsis");
    } else if (left === 3) {
      items.push(2);
    }

    for (let p = left; p <= right; p++) {
      items.push(p);
    }

    // Right gap: same single-page-fill rule on the trailing side.
    if (right < count - 1) {
      items.push("ellipsis");
    } else if (right === count - 2) {
      items.push(count - 1);
    }

    items.push(count);
    return items;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // Keep the reflected page within range if inputs shrink the page count.
    if (
      changed.has("page") ||
      changed.has("total") ||
      changed.has("totalPages") ||
      changed.has("pageSize")
    ) {
      const clamped = this.current;
      if (clamped !== this.page) {
        this.page = clamped;
      }
    }
  }

  /**
   * Move to a page. No-ops when the target is out of range or already current,
   * so prev/next at the edges and a click on the active page are silent.
   */
  private goTo(target: number): void {
    const count = this.pageCount;
    if (target < 1 || target > count || target === this.current) return;
    this.page = target;
    this.dispatchEvent(
      new CustomEvent("fluid-page-change", {
        detail: { page: target },
        bubbles: true,
        composed: true
      })
    );
  }

  private renderEdge(
    direction: "prev" | "next",
    targetPage: number,
    disabled: boolean
  ): TemplateResult {
    const isPrev = direction === "prev";
    const path = isPrev ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";
    const aria = isPrev ? "Previous page" : "Next page";
    return html`
      <li part="item">
        <button
          part="button ${direction}"
          class="button edge"
          type="button"
          aria-label=${aria}
          ?disabled=${disabled}
          @click=${() => this.goTo(targetPage)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d=${path} />
          </svg>
        </button>
      </li>
    `;
  }

  override render(): TemplateResult {
    const count = this.pageCount;
    const current = this.current;
    const items = this.buildItems();

    return html`
      <nav part="base" aria-label=${this.label}>
        <ul part="list" class="list">
          ${this.renderEdge("prev", current - 1, current <= 1)}
          ${items.map((item) => {
            if (item === "ellipsis") {
              return html`<li part="item">
                <span part="ellipsis" class="ellipsis" aria-hidden="true">…</span>
              </li>`;
            }
            const isCurrent = item === current;
            return html`<li part="item">
              <button
                part="button page${isCurrent ? " current" : ""}"
                class="button page"
                type="button"
                aria-current=${isCurrent ? "page" : nothing}
                aria-label="Page ${item}"
                @click=${() => this.goTo(item)}
              >
                ${item}
              </button>
            </li>`;
          })}
          ${this.renderEdge("next", current + 1, current >= count)}
        </ul>
      </nav>
    `;
  }
}
