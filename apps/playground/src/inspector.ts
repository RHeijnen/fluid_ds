import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { selectionStore, type SelectionState } from "./selection-store.js";

/** Padding around the bounding box of a highlighted element. Keeps the
 *  outline from feeling tight against the component's edges. */
const HIGHLIGHT_PADDING = 8;

/**
 * Wraps the preview area. In Design mode it:
 *   - on pointer move: highlights the hovered `fluid-*` element (dashed outline)
 *   - on click: anchors the selection (solid outline + tag label, sidebar filters)
 *   - intercepts clicks so the underlying control doesn't activate
 *
 * In Interaction mode this element is transparent, events pass through.
 */
@customElement("design-inspector")
export class DesignInspector extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      transition: padding 180ms ease, background 180ms ease;
    }

    /* When design mode is armed, give the whole preview an unmistakable
     * tint + dashed outline so it's obvious that clicks are now used for
     * inspection rather than interaction. */
    :host([design-mode]) {
      padding: var(--fluid-space-4);
      background: color-mix(in srgb, var(--fluid-accent-base) 4%, transparent);
      outline: 1px dashed color-mix(in srgb, var(--fluid-accent-base) 40%, transparent);
      outline-offset: -1px;
      border-radius: var(--fluid-radius-md);
    }

    /* A clear "armed" badge anchored to the top of the inspector area. */
    :host([design-mode])::after {
      content: "Click any component to inspect";
      position: absolute;
      top: 0.5rem;
      right: 0.75rem;
      padding: 2px var(--fluid-space-2);
      background: var(--fluid-accent-base);
      color: var(--fluid-accent-text);
      font-size: var(--fluid-font-size-xs);
      font-weight: var(--fluid-font-weight-semibold);
      border-radius: 999px;
      pointer-events: none;
      z-index: 101;
      box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--fluid-accent-base) 40%, transparent);
    }

    .overlay {
      position: absolute;
      pointer-events: none;
      border-radius: var(--fluid-radius-md);
      z-index: 100;
      transition:
        top var(--fluid-duration-fast) var(--fluid-easing-standard),
        left var(--fluid-duration-fast) var(--fluid-easing-standard),
        width var(--fluid-duration-fast) var(--fluid-easing-standard),
        height var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    /* Hover preview, dashed, lower z-index than the anchored selection. */
    .overlay.hover {
      border: 2px dashed var(--fluid-accent-base);
      opacity: 0.65;
      z-index: 99;
    }

    /* Anchored selection, solid border + glow + label. */
    .overlay.anchored {
      border: 2px solid var(--fluid-accent-base);
      box-shadow:
        0 0 0 4px color-mix(in srgb, var(--fluid-accent-base) 20%, transparent),
        0 0 24px -4px color-mix(in srgb, var(--fluid-accent-base) 60%, transparent);
    }

    .label {
      position: absolute;
      top: -1.5rem;
      left: -2px;
      background: var(--fluid-accent-base);
      color: var(--fluid-accent-text);
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
      padding: 2px var(--fluid-space-2);
      border-radius: var(--fluid-radius-sm) var(--fluid-radius-sm) 0 0;
      white-space: nowrap;
      font-weight: var(--fluid-font-weight-semibold);
    }

    :host([design-mode]) ::slotted(*) {
      cursor: crosshair;
    }
  `;

  @state() private state: SelectionState = selectionStore.current;
  @state() private anchoredRect: DOMRect | null = null;
  @state() private hoverRect: DOMRect | null = null;
  @state() private hoveredTag: string | null = null;

  private unsubscribe?: () => void;
  private rafId?: number;
  private resizeObserver?: ResizeObserver;
  private anchoredEl: HTMLElement | null = null;
  private hoveredEl: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = selectionStore.subscribe((s) => {
      const prev = this.state;
      this.state = s;
      this.reflectMode();
      // When the store says "no selection," clear the anchor too.
      if (!s.selectedTag) {
        this.anchoredEl = null;
        this.anchoredRect = null;
      }
      // Exiting design mode wipes any hover state.
      if (prev.mode === "design" && s.mode !== "design") {
        this.hoveredEl = null;
        this.hoveredTag = null;
        this.hoverRect = null;
      }
      this.measureBoth();
    });
    this.addEventListener("click", this.handleClick, { capture: true });
    this.addEventListener("pointerdown", this.handlePointerDown, { capture: true });
    this.addEventListener("pointermove", this.handlePointerMove);
    this.addEventListener("pointerleave", this.handlePointerLeave);
    window.addEventListener("scroll", this.measureBoth, true);
    window.addEventListener("resize", this.measureBoth);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.removeEventListener("click", this.handleClick, { capture: true });
    this.removeEventListener("pointerdown", this.handlePointerDown, { capture: true });
    this.removeEventListener("pointermove", this.handlePointerMove);
    this.removeEventListener("pointerleave", this.handlePointerLeave);
    window.removeEventListener("scroll", this.measureBoth, true);
    window.removeEventListener("resize", this.measureBoth);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
  }

  private reflectMode(): void {
    if (this.state.mode === "design") this.setAttribute("design-mode", "");
    else this.removeAttribute("design-mode");
  }

  /**
   * Find the *deepest user-authored* `fluid-*` element in the composed path.
   * See [project-design-mode] memory for the rule.
   */
  private findFluidAncestor(event: Event): HTMLElement | null {
    const path = event.composedPath();
    for (const node of path) {
      if (node === this) break;
      if (!(node instanceof HTMLElement)) continue;
      if (!node.tagName.toLowerCase().startsWith("fluid-")) continue;
      const root = node.getRootNode();
      const host = root instanceof ShadowRoot ? (root.host as HTMLElement | null) : null;
      if (host && host.tagName.toLowerCase().startsWith("fluid-")) continue;
      return node;
    }
    return null;
  }

  private handlePointerDown = (event: PointerEvent) => {
    if (this.state.mode !== "design") return;
    event.preventDefault();
    event.stopPropagation();
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (this.state.mode !== "design") return;
    const target = this.findFluidAncestor(event);
    if (this.hoveredEl === target) return;
    this.hoveredEl = target;
    this.hoveredTag = target?.tagName.toLowerCase() ?? null;
    this.measureBoth();
  };

  private handlePointerLeave = () => {
    if (this.state.mode !== "design") return;
    this.hoveredEl = null;
    this.hoveredTag = null;
    this.hoverRect = null;
  };

  private handleClick = (event: MouseEvent) => {
    if (this.state.mode !== "design") return;
    event.preventDefault();
    event.stopPropagation();
    const target = this.findFluidAncestor(event);
    if (target) {
      selectionStore.setSelected(target.tagName.toLowerCase(), target);
      this.anchorTo(target);
    } else {
      selectionStore.setSelected(null, null);
    }
  };

  private anchorTo(el: HTMLElement): void {
    this.anchoredEl = el;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.measureBoth());
    this.resizeObserver.observe(el);
    this.measureBoth();
  }

  private measureBoth = (): void => {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      const hostRect = this.getBoundingClientRect();
      this.anchoredRect = this.computeRect(this.anchoredEl, hostRect);
      // Don't double-paint: if the hover IS the anchor, drop the hover layer.
      if (this.hoveredEl && this.hoveredEl !== this.anchoredEl) {
        this.hoverRect = this.computeRect(this.hoveredEl, hostRect);
      } else {
        this.hoverRect = null;
      }
    });
  };

  private computeRect(el: HTMLElement | null, hostRect: DOMRect): DOMRect | null {
    if (!el || !el.isConnected || this.state.mode !== "design") return null;
    const r = el.getBoundingClientRect();
    return new DOMRect(
      r.left - hostRect.left - HIGHLIGHT_PADDING,
      r.top - hostRect.top - HIGHLIGHT_PADDING,
      r.width + HIGHLIGHT_PADDING * 2,
      r.height + HIGHLIGHT_PADDING * 2
    );
  }

  override render(): TemplateResult {
    const inDesign = this.state.mode === "design";
    return html`
      <slot></slot>
      ${inDesign && this.hoverRect
        ? html`
            <div
              class="overlay hover"
              style="
                top: ${this.hoverRect.top}px;
                left: ${this.hoverRect.left}px;
                width: ${this.hoverRect.width}px;
                height: ${this.hoverRect.height}px;
              "
            ></div>
          `
        : ""}
      ${inDesign && this.state.selectedTag && this.anchoredRect
        ? html`
            <div
              class="overlay anchored"
              style="
                top: ${this.anchoredRect.top}px;
                left: ${this.anchoredRect.left}px;
                width: ${this.anchoredRect.width}px;
                height: ${this.anchoredRect.height}px;
              "
            >
              <span class="label">${this.state.selectedTag}</span>
            </div>
          `
        : ""}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "design-inspector": DesignInspector;
  }
}
