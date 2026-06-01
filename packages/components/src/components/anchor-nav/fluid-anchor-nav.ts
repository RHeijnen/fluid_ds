import { html, css, type TemplateResult, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

/** A single entry in the anchor-nav table of contents. */
export interface FluidAnchorNavItem {
  /** The `id` of the target section the link jumps to (must exist in the document). */
  id: string;
  /** The visible label for the link. */
  label: string;
  /**
   * Heading depth used for indentation. `2` for top-level (h2), `3` for nested
   * (h3), and so on. Defaults to `2` when omitted.
   */
  level?: number;
}

/**
 * In-page table of contents that scroll-spies. Renders a navigation landmark of
 * anchor links, one per section, and tracks which section is currently in view
 * with an `IntersectionObserver`, marking its link with `aria-current="true"`
 * and an active style. Clicking a link smooth-scrolls to the section (honoring
 * `prefers-reduced-motion`).
 *
 * Provide the list explicitly through the `items` property, or leave it empty
 * to auto-collect headings: every element matching `headingSelector` (default
 * `h2,h3`) inside `scope` (default the document body) becomes an entry, using
 * the heading's `id` and text. Headings without an `id` are skipped.
 *
 * @summary Scroll-spying in-page table of contents.
 *
 * @csspart base - The `<nav>` landmark.
 * @csspart list - The `<ul>` list of links.
 * @csspart item - Each `<li>` list item.
 * @csspart link - Each anchor link.
 *
 * @cssproperty --fluid-anchor-nav-gap - Vertical gap between links.
 * @cssproperty --fluid-anchor-nav-fg - Idle link text color.
 * @cssproperty --fluid-anchor-nav-fg-hover - Hovered link text color.
 * @cssproperty --fluid-anchor-nav-active-fg - Active (current) link text color.
 * @cssproperty --fluid-anchor-nav-active-marker - Color of the active marker rail.
 * @cssproperty --fluid-anchor-nav-marker - Color of the idle marker rail.
 * @cssproperty --fluid-anchor-nav-indent - Indent step applied per nesting level.
 * @cssproperty --fluid-anchor-nav-radius - Link corner radius.
 * @cssproperty --fluid-anchor-nav-focus-ring - Link focus ring color.
 *
 * @uses-token --fluid-text-secondary - Idle link text.
 * @uses-token --fluid-text-primary - Hovered link text.
 * @uses-token --fluid-accent-base - Active link text + marker.
 * @uses-token --fluid-border-default - Idle marker rail.
 * @uses-token --fluid-focus-ring-color - Link focus ring.
 * @uses-token --fluid-target-min - Minimum interactive target size (conformance).
 * @uses-token --fluid-focus-ring-width - Focus ring width (conformance).
 *
 * @fires fluid-active-change - Dispatched with `{ id }` when the section in view
 *   changes. `id` is the target id of the now-active section, or `null` when no
 *   tracked section is in view.
 */
export class FluidAnchorNav extends FluidElement {
  static override styles = [
    css`
      :host {
        display: block;
        font-family: var(--fluid-font-family-sans);
        line-height: var(--fluid-line-height-normal, 1.5);
      }

      :host([hidden]) {
        display: none;
      }

      nav {
        display: block;
      }

      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--fluid-anchor-nav-gap, var(--fluid-space-1));
        border-inline-start: 1px solid
          var(--fluid-anchor-nav-marker, var(--fluid-border-default));
      }

      li {
        margin: 0;
        padding: 0;
      }

      a {
        position: relative;
        display: block;
        min-height: max(var(--fluid-space-6), var(--fluid-target-min, 0px));
        box-sizing: border-box;
        padding: var(--fluid-space-1) var(--fluid-space-3);
        margin-inline-start: -1px;
        border-inline-start: 2px solid transparent;
        border-radius: var(--fluid-anchor-nav-radius, var(--fluid-radius-sm));
        color: var(--fluid-anchor-nav-fg, var(--fluid-text-secondary));
        font-size: var(--fluid-font-size-sm);
        text-decoration: none;
        transition: color var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      a:hover {
        color: var(--fluid-anchor-nav-fg-hover, var(--fluid-text-primary));
      }

      a:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-anchor-nav-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: var(--fluid-focus-ring-offset, 2px);
      }

      a[aria-current="true"] {
        color: var(--fluid-anchor-nav-active-fg, var(--fluid-accent-base));
        font-weight: var(--fluid-font-weight-medium);
        border-inline-start-color: var(
          --fluid-anchor-nav-active-marker,
          var(--fluid-accent-base)
        );
      }

      .level-2 {
        padding-inline-start: var(--fluid-space-3);
      }
      .level-3 {
        padding-inline-start: calc(
          var(--fluid-space-3) + var(--fluid-anchor-nav-indent, var(--fluid-space-3))
        );
      }
      .level-4 {
        padding-inline-start: calc(
          var(--fluid-space-3) + 2 * var(--fluid-anchor-nav-indent, var(--fluid-space-3))
        );
      }
      .level-5,
      .level-6 {
        padding-inline-start: calc(
          var(--fluid-space-3) + 3 * var(--fluid-anchor-nav-indent, var(--fluid-space-3))
        );
      }
    `,
    reducedMotion,
  ];

  /**
   * Explicit list of entries. When non-empty this takes precedence over heading
   * auto-collection. Accepts an array property or a JSON-string attribute.
   */
  @property({ type: Array }) items: FluidAnchorNavItem[] = [];

  /** Accessible name for the navigation landmark. */
  @property({ attribute: "nav-label" }) navLabel = "On this page";

  /**
   * CSS selector for headings to auto-collect when `items` is empty.
   * Defaults to `h2,h3`.
   */
  @property({ attribute: "heading-selector" }) headingSelector = "h2,h3";

  /**
   * CSS selector for the container to search for headings and observe. When
   * omitted, the document body is used.
   */
  @property() scope = "";

  /**
   * Margin (px) from the top of the viewport at which a section counts as
   * "in view". Useful to offset a sticky header. Defaults to `0`.
   */
  @property({ type: Number, attribute: "offset-top" }) topOffset = 0;

  /** The id of the section currently in view, or `null`. */
  @state() private _activeId: string | null = null;

  /** The resolved entries actually rendered (explicit or auto-collected). */
  @state() private _resolved: FluidAnchorNavItem[] = [];

  private _observer: IntersectionObserver | null = null;
  private _targets: HTMLElement[] = [];
  /** Ids of targets currently intersecting, in document order. */
  private _visible = new Set<string>();

  override connectedCallback(): void {
    super.connectedCallback();
    // Defer so the surrounding document has rendered its headings.
    requestAnimationFrame(() => this._rebuild());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._teardownObserver();
  }

  override updated(changed: PropertyValues<this>): void {
    if (
      changed.has("items") ||
      changed.has("headingSelector") ||
      changed.has("scope") ||
      changed.has("topOffset")
    ) {
      this._rebuild();
    }
  }

  private _scopeRoot(): ParentNode {
    if (this.scope) {
      const found = document.querySelector(this.scope);
      if (found) return found;
    }
    return document.body;
  }

  private _collectFromHeadings(): FluidAnchorNavItem[] {
    const root = this._scopeRoot();
    const headings = Array.from(
      root.querySelectorAll<HTMLElement>(this.headingSelector)
    );
    const out: FluidAnchorNavItem[] = [];
    for (const h of headings) {
      if (!h.id) continue;
      const tag = h.tagName.toLowerCase();
      const level = /^h([1-6])$/.exec(tag);
      out.push({
        id: h.id,
        label: (h.textContent ?? "").trim(),
        level: level && level[1] ? Number(level[1]) : 2,
      });
    }
    return out;
  }

  private _rebuild(): void {
    this._resolved =
      this.items.length > 0 ? this.items : this._collectFromHeadings();
    this._setupObserver();
  }

  private _teardownObserver(): void {
    this._observer?.disconnect();
    this._observer = null;
    this._targets = [];
    this._visible.clear();
  }

  private _setupObserver(): void {
    this._teardownObserver();
    if (typeof IntersectionObserver === "undefined") return;

    const targets: HTMLElement[] = [];
    for (const item of this._resolved) {
      const el = document.getElementById(item.id);
      if (el) targets.push(el);
    }
    this._targets = targets;
    if (targets.length === 0) return;

    this._observer = new IntersectionObserver(
      (entries) => this._onIntersect(entries),
      {
        rootMargin: `-${this.topOffset}px 0px -70% 0px`,
        threshold: 0,
      }
    );
    for (const t of targets) this._observer.observe(t);
  }

  private _onIntersect(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const id = entry.target.id;
      if (!id) continue;
      if (entry.isIntersecting) {
        this._visible.add(id);
      } else {
        this._visible.delete(id);
      }
    }
    // Choose the first visible target in document (target) order.
    let next: string | null = null;
    for (const t of this._targets) {
      if (this._visible.has(t.id)) {
        next = t.id;
        break;
      }
    }
    this._setActive(next);
  }

  private _setActive(id: string | null): void {
    if (id === this._activeId) return;
    this._activeId = id;
    this.dispatchEvent(
      new CustomEvent<{ id: string | null }>("fluid-active-change", {
        detail: { id },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleClick = (e: MouseEvent, id: string): void => {
    const target = document.getElementById(id);
    if (!target) return;
    // Let modified clicks (new tab) behave normally.
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    const prefersReduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
    // Move focus for keyboard / screen-reader users without re-scrolling.
    const hadTabindex = target.hasAttribute("tabindex");
    if (!hadTabindex) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    if (!hadTabindex) target.removeAttribute("tabindex");
    // Update the hash without an extra jump.
    if (typeof history !== "undefined" && history.replaceState) {
      history.replaceState(null, "", `#${id}`);
    }
    this._setActive(id);
  };

  override render(): TemplateResult {
    return html`
      <nav part="base" aria-label=${this.navLabel}>
        <ul part="list">
          ${this._resolved.map((item) => {
            const level = item.level ?? 2;
            const current = item.id === this._activeId;
            return html`
              <li part="item">
                <a
                  part="link"
                  class="level-${level}"
                  href="#${item.id}"
                  aria-current=${current ? "true" : "false"}
                  @click=${(e: MouseEvent) => this._handleClick(e, item.id)}
                  >${item.label}</a
                >
              </li>
            `;
          })}
        </ul>
      </nav>
    `;
  }
}
