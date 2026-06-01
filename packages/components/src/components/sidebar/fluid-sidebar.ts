import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

/**
 * Collapsible side-navigation region. Renders a labelled `<aside>` landmark
 * (complementary role) that holds primary navigation. It can collapse to a
 * narrow icon rail, and on narrow viewports it can overlay the page with a
 * dismissible backdrop.
 *
 * Two modes:
 *  - Inline (default): the sidebar sits in the page flow. Toggling `open`
 *    collapses it to `mini` width (when `collapsible`) or away entirely.
 *  - Overlay (`overlay`): the sidebar floats above the page over a backdrop,
 *    behaves like a non-modal dialog: Escape closes it, focus is trapped
 *    inside while open, and focus returns to the previously focused element
 *    on close.
 *
 * Semantics follow the WAI-ARIA Landmarks pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/): a native `<aside>`
 * with an accessible name. Give every sidebar an `aria-label` (or
 * `aria-labelledby`) so multiple landmarks of the same role stay distinct.
 *
 * @summary Collapsible side-navigation region.
 *
 * @slot header - Top region: brand, logo, or a collapse toggle.
 * @slot - Default slot: navigation content (typically a nav with links).
 * @slot footer - Bottom region: account, settings, or secondary actions.
 *
 * @csspart base - The aside landmark (the override ladder root).
 * @csspart header - The header region wrapper.
 * @csspart content - The scrollable navigation region.
 * @csspart footer - The footer region wrapper.
 * @csspart backdrop - The overlay backdrop (overlay mode only).
 *
 * Every styled property reads a component-scoped `--fluid-sidebar-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-sidebar-bg - Surface background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-sidebar-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-sidebar-width - Expanded width. Falls back to 16rem.
 * @cssproperty --fluid-sidebar-mini-width - Collapsed rail width. Falls back to 4rem.
 * @cssproperty --fluid-sidebar-border - Edge separator color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-sidebar-border-width - Edge separator width. Falls back to 1px.
 * @cssproperty --fluid-sidebar-backdrop - Overlay backdrop fill. Falls back to rgb(0 0 0 / 0.4).
 * @cssproperty --fluid-sidebar-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty [--fluid-sidebar-duration=var(--fluid-duration-normal)] - Collapse duration (scaled by --fluid-motion).
 * @cssproperty [--fluid-sidebar-easing=var(--fluid-easing-emphasized)] - Collapse easing.
 *
 * @uses-token --fluid-surface-base - Default background.
 * @uses-token --fluid-text-primary - Default text color.
 * @uses-token --fluid-border-default - Edge separator color.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-duration-normal - Default collapse duration.
 * @uses-token --fluid-easing-emphasized - Default collapse easing.
 *
 * @fires fluid-toggle - Fired when the open state changes. `detail.open` is the new state.
 */
export class FluidSidebar extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      block-size: 100%;
      inline-size: var(--fluid-sidebar-width, 16rem);
      overflow: hidden;
      background: var(--fluid-sidebar-bg, var(--fluid-surface-base));
      color: var(--fluid-sidebar-fg, var(--fluid-text-primary));
      border-inline-end: var(--fluid-sidebar-border-width, 1px) solid
        var(--fluid-sidebar-border, var(--fluid-border-default));
      font-family: var(--fluid-sidebar-font-family, var(--fluid-font-family-sans));
      transition: inline-size
        calc(var(--fluid-sidebar-duration, var(--fluid-duration-normal)) * var(--fluid-motion, 1))
        var(--fluid-sidebar-easing, var(--fluid-easing-emphasized));
    }

    /* Collapsible: closed collapses to the mini rail. */
    :host([collapsible]:not([open])) .base {
      inline-size: var(--fluid-sidebar-mini-width, 4rem);
    }

    /* Not collapsible: closed hides the sidebar entirely (inline mode). */
    :host(:not([collapsible]):not([open]):not([overlay])) .base {
      inline-size: 0;
      border-inline-end-width: 0;
    }

    .header {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
      padding: var(--fluid-space-3);
      min-block-size: 0;
    }
    .header.empty {
      display: none;
    }

    .content {
      flex: 1 1 auto;
      min-block-size: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--fluid-space-2);
    }

    .footer {
      flex: 0 0 auto;
      padding: var(--fluid-space-3);
      border-block-start: var(--fluid-sidebar-border-width, 1px) solid
        var(--fluid-sidebar-border, var(--fluid-border-default));
    }
    .footer.empty {
      display: none;
    }

    /* Overlay mode: float the aside above the page over a backdrop. */
    :host([overlay]) {
      position: fixed;
      inset: 0;
      z-index: 1000;
      pointer-events: none;
    }
    :host([overlay]:not([open])) {
      visibility: hidden;
    }

    .backdrop {
      position: absolute;
      inset: 0;
      background: var(--fluid-sidebar-backdrop, rgb(0 0 0 / 0.4));
      opacity: 0;
      pointer-events: none;
      transition: opacity
        calc(var(--fluid-sidebar-duration, var(--fluid-duration-normal)) * var(--fluid-motion, 1))
        var(--fluid-easing-standard);
    }

    :host([overlay]) .base {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      block-size: 100%;
      box-shadow: var(--fluid-shadow-lg);
      pointer-events: auto;
      transform: translateX(-100%);
      transition:
        transform
          calc(var(--fluid-sidebar-duration, var(--fluid-duration-normal)) * var(--fluid-motion, 1))
          var(--fluid-sidebar-easing, var(--fluid-easing-emphasized)),
        visibility 0s
          calc(var(--fluid-sidebar-duration, var(--fluid-duration-normal)) * var(--fluid-motion, 1));
    }

    :host([overlay][open]) {
      pointer-events: auto;
    }
    :host([overlay][open]) .backdrop {
      opacity: 1;
      pointer-events: auto;
    }
    :host([overlay][open]) .base {
      transform: none;
      transition-delay: 0s;
    }
  `
  ];

  @query(".base") private baseEl!: HTMLElement;

  /** Whether the sidebar is expanded. Reflected. */
  @property({ type: Boolean, reflect: true }) open = true;

  /** When set, closing collapses to the `mini` rail instead of hiding. */
  @property({ type: Boolean, reflect: true }) collapsible = false;

  /** When set, the sidebar floats over a dismissible backdrop. */
  @property({ type: Boolean, reflect: true }) overlay = false;

  /** Expanded width (any CSS length). Sets `--fluid-sidebar-width` on the host. */
  @property() width?: string;

  /** Collapsed rail width (any CSS length). Sets `--fluid-sidebar-mini-width`. */
  @property() mini?: string;

  /** Accessible label for the landmark. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  private previouslyFocused: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  /** Expand the sidebar. */
  show(): void {
    if (this.open) return;
    this.open = true;
  }

  /** Collapse / close the sidebar. */
  hide(): void {
    if (!this.open) return;
    this.open = false;
  }

  /** Toggle the open state. */
  toggle(): void {
    this.open = !this.open;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("width")) {
      if (this.width) this.style.setProperty("--fluid-sidebar-width", this.width);
      else this.style.removeProperty("--fluid-sidebar-width");
    }
    if (changed.has("mini")) {
      if (this.mini) this.style.setProperty("--fluid-sidebar-mini-width", this.mini);
      else this.style.removeProperty("--fluid-sidebar-mini-width");
    }
  }

  protected override firstUpdated(): void {
    for (const slotName of ["header", "footer"]) {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>(
        `slot[name="${slotName}"]`
      );
      const parent = slot?.parentElement;
      if (!slot || !parent) continue;
      const update = () => {
        const hasContent = slot.assignedNodes({ flatten: true }).length > 0;
        parent.classList.toggle("empty", !hasContent);
      };
      slot.addEventListener("slotchange", update);
      update();
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      this.dispatchEvent(
        new CustomEvent("fluid-toggle", {
          detail: { open: this.open },
          bubbles: true,
          composed: true
        })
      );
      if (this.overlay) {
        if (this.open) this.captureFocus();
        else this.restoreFocus();
      }
    }
  }

  private captureFocus(): void {
    this.previouslyFocused =
      (this.getRootNode() as Document).activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      const first = this.firstFocusable();
      if (first) first.focus();
      else this.baseEl?.focus();
    });
  }

  private restoreFocus(): void {
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
  }

  private focusable(): HTMLElement[] {
    if (!this.baseEl) return [];
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const inShadow = Array.from(this.baseEl.querySelectorAll<HTMLElement>(selector));
    const slotted: HTMLElement[] = [];
    for (const slot of this.baseEl.querySelectorAll<HTMLSlotElement>("slot")) {
      for (const node of slot.assignedElements({ flatten: true })) {
        if (node instanceof HTMLElement) {
          if (node.matches(selector)) slotted.push(node);
          slotted.push(...Array.from(node.querySelectorAll<HTMLElement>(selector)));
        }
      }
    }
    return [...inShadow, ...slotted].filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
  }

  private firstFocusable(): HTMLElement | undefined {
    return this.focusable()[0];
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.overlay || !this.open) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      this.hide();
      return;
    }
    if (e.key === "Tab") {
      const items = this.focusable();
      if (items.length === 0) {
        e.preventDefault();
        this.baseEl?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const root = this.getRootNode() as Document;
      const active = root.activeElement as HTMLElement | null;
      const path = e.composedPath();
      const inside = path.includes(this.baseEl);
      if (e.shiftKey) {
        if (active === first || !inside) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !inside) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  private handleBackdropClick = () => {
    this.hide();
  };

  override render(): TemplateResult {
    return html`
      ${this.overlay
        ? html`<div
            part="backdrop"
            class="backdrop"
            @click=${this.handleBackdropClick}
          ></div>`
        : ""}
      <aside
        part="base"
        class="base"
        tabindex="-1"
        aria-label=${this.ariaLabel ?? "Sidebar"}
      >
        <div part="header" class="header"><slot name="header"></slot></div>
        <div part="content" class="content"><slot></slot></div>
        <div part="footer" class="footer"><slot name="footer"></slot></div>
      </aside>
    `;
  }
}
