import { html, css, type PropertyValues, type TemplateResult } from "lit";
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
 * @cssproperty --fluid-scroller-focus-ring-color - Keyboard focus ring color.
 * @cssproperty --fluid-scroller-focus-ring-width - Keyboard focus ring width.
 *
 * @uses-token --fluid-surface-base - Default fade color (matches background).
 * @uses-token --fluid-focus-ring-color - Default keyboard focus ring color.
 * @uses-token --fluid-focus-ring-width - Default keyboard focus ring width.
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
    .container:focus-visible {
      outline: var(--fluid-scroller-focus-ring-width, var(--fluid-focus-ring-width, 2px)) solid
        var(--fluid-scroller-focus-ring-color, var(--fluid-focus-ring-color));
      outline-offset: calc(
        -1 * var(--fluid-scroller-focus-ring-width, var(--fluid-focus-ring-width, 2px))
      );
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
      transition: opacity calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease;
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

    :host(:dir(rtl):not([orientation="vertical"])) .fade.start {
      left: auto;
      right: 0;
      --_dir: to left;
    }
    :host(:dir(rtl):not([orientation="vertical"])) .fade.end {
      left: 0;
      right: auto;
      --_dir: to right;
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

  private resizeObserver?: ResizeObserver;

  override connectedCallback(): void {
    super.connectedCallback();
    this.listen(window, "resize", this.updateFades);
    if (this.hasUpdated) this.observeContent();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  protected override firstUpdated(): void {
    this.observeContent();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("noScrollbar")) {
      this.container.style.scrollbarWidth = this.noScrollbar ? "none" : "";
    }
    if (changed.has("orientation") || changed.has("noScrollbar")) this.updateFades();
  }

  private observeContent = (): void => {
    if (!this.container || !this.isConnected) return;
    this.resizeObserver ??= new ResizeObserver(this.updateFades);
    this.resizeObserver.disconnect();
    this.resizeObserver.observe(this.container);
    // A slot is display:contents, not the actual content box. Observe its
    // assigned elements so async image/content resizing refreshes the fades.
    const slot = this.shadowRoot!.querySelector<HTMLSlotElement>("slot")!;
    for (const child of slot.assignedElements({ flatten: true })) {
      this.resizeObserver.observe(child);
    }
    this.updateFades();
  };

  private updateFades = () => {
    if (!this.container) return;
    if (this.orientation === "horizontal") {
      const max = Math.max(0, this.container.scrollWidth - this.container.clientWidth);
      const rtl = getComputedStyle(this.container).direction === "rtl";
      const offset = Math.min(
        max,
        Math.max(0, rtl ? -this.container.scrollLeft : this.container.scrollLeft)
      );
      this.showStart = offset > 1;
      this.showEnd = offset < max - 1;
    } else {
      this.showStart = this.container.scrollTop > 1;
      this.showEnd =
        this.container.scrollTop + this.container.clientHeight < this.container.scrollHeight - 1;
    }
  };

  override render(): TemplateResult {
    return html`
      <div part="base" class="container" tabindex="0" @scroll=${this.updateFades}>
        <slot @slotchange=${this.observeContent}></slot>
      </div>
      <div class="fade start" aria-hidden="true" ?data-visible=${this.showStart}></div>
      <div class="fade end" aria-hidden="true" ?data-visible=${this.showEnd}></div>
    `;
  }
}
