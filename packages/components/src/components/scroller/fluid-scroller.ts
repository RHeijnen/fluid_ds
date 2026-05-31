import { html, css, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A scrollable container that shows fade-out shadow indicators on the
 * edges where more content exists. Useful for horizontally scrolling
 * tables, tab strips, or vertically scrolling lists where you want
 * an affordance that "there's more below/right".
 *
 * @summary Scroll container with edge fade indicators.
 *
 * @slot - The scrollable content.
 *
 * @csspart base - The scroll container.
 *
 * @cssproperty --fluid-scroller-fade-color - Gradient stop color used for the edge fades.
 * @cssproperty --fluid-scroller-fade-size - Length of the edge fade.
 *
 * @uses-token --fluid-surface-base - Default fade color (matches background).
 */
export class FluidScroller extends FluidElement {
  static override styles = css`
    :host {
      position: relative;
      display: block;
      overflow: hidden;
      min-height: 0;
    }

    .container {
      width: 100%;
      height: 100%;
      overflow: auto;
      scrollbar-width: thin;
    }

    :host([orientation="horizontal"]) .container {
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
    }
    :host([orientation="vertical"]) .container {
      overflow-x: hidden;
      overflow-y: auto;
    }

    /* Fade overlays. */
    .fade {
      position: absolute;
      pointer-events: none;
      opacity: 0;
      transition: opacity 150ms ease;
      background: linear-gradient(
        var(--_dir),
        var(--fluid-scroller-fade-color, var(--fluid-surface-base)),
        transparent
      );
    }
    .fade[data-visible] {
      opacity: 1;
    }

    .fade.start {
      top: 0;
      left: 0;
      width: var(--fluid-scroller-fade-size, 1.5rem);
      height: 100%;
      --_dir: to right;
    }
    .fade.end {
      top: 0;
      right: 0;
      width: var(--fluid-scroller-fade-size, 1.5rem);
      height: 100%;
      --_dir: to left;
    }

    :host([orientation="vertical"]) .fade.start {
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: var(--fluid-scroller-fade-size, 1.5rem);
      --_dir: to bottom;
    }
    :host([orientation="vertical"]) .fade.end {
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: var(--fluid-scroller-fade-size, 1.5rem);
      --_dir: to top;
    }
  `;

  /** Scroll orientation. */
  @property({ reflect: true }) orientation: "horizontal" | "vertical" = "horizontal";

  /** Hide the native scrollbar (still scrollable via wheel/drag). */
  @property({ type: Boolean, attribute: "no-scrollbar" }) noScrollbar = false;

  @query(".container") private container!: HTMLDivElement;

  @state() private showStart = false;
  @state() private showEnd = false;

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("resize", this.updateFades);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("resize", this.updateFades);
  }

  protected override firstUpdated(): void {
    if (this.noScrollbar) {
      this.container.style.scrollbarWidth = "none";
      (this.container.style as unknown as Record<string, string>)["msOverflowStyle"] = "none";
    }
    this.updateFades();
    // Re-check after content loads (images, async children).
    const observer = new ResizeObserver(() => this.updateFades());
    observer.observe(this.container);
    for (const child of Array.from(this.container.children)) {
      observer.observe(child);
    }
  }

  private updateFades = () => {
    if (!this.container) return;
    if (this.orientation === "horizontal") {
      this.showStart = this.container.scrollLeft > 1;
      this.showEnd =
        this.container.scrollLeft + this.container.clientWidth < this.container.scrollWidth - 1;
    } else {
      this.showStart = this.container.scrollTop > 1;
      this.showEnd =
        this.container.scrollTop + this.container.clientHeight < this.container.scrollHeight - 1;
    }
  };

  override render(): TemplateResult {
    return html`
      <div part="base" class="container" @scroll=${this.updateFades}>
        <slot @slotchange=${this.updateFades}></slot>
      </div>
      <div class="fade start" ?data-visible=${this.showStart}></div>
      <div class="fade end" ?data-visible=${this.showEnd}></div>
    `;
  }
}
