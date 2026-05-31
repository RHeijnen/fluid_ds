import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";
import type { FluidCarouselItem } from "./fluid-carousel-item.js";

registerIcon(
  "chevron-left",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6"/></svg>`
);
registerIcon(
  "chevron-right",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg>`
);

/**
 * Slide rotator. Children are `<fluid-carousel-item>` elements. Provides
 * prev/next buttons, optional pagination dots, autoplay, and keyboard
 * navigation. Built on a snap-scroller so swipe works for free.
 *
 * @summary Slide rotator with autoplay and pagination.
 *
 * @slot - Carousel items (`<fluid-carousel-item>`).
 *
 * @csspart base - The carousel wrapper.
 * @csspart scroller - The internal scroll track.
 * @csspart navigation - The prev/next button row.
 * @csspart button - A prev or next button.
 * @csspart pagination - The dot pagination row.
 *
 * @cssproperty --fluid-carousel-aspect-ratio - Aspect ratio of the viewport.
 * @cssproperty --fluid-carousel-gap - Gap between slides.
 * @cssproperty --fluid-carousel-bg - Scroller background.
 * @cssproperty --fluid-carousel-nav-bg - Nav button background.
 * @cssproperty --fluid-carousel-nav-fg - Nav button foreground.
 * @cssproperty --fluid-carousel-nav-hover-bg - Nav button hover background.
 * @cssproperty --fluid-carousel-nav-focus-ring - Nav button focus ring color.
 * @cssproperty --fluid-carousel-dot-bg - Inactive pagination dot color.
 * @cssproperty --fluid-carousel-dot-active-bg - Active pagination dot color.
 * @cssproperty --fluid-carousel-dot-focus-ring - Pagination dot focus ring color.
 *
 * @uses-token --fluid-surface-base - Default scroller background.
 * @uses-token --fluid-color-primary - Active pagination dot.
 * @uses-token --fluid-border-default - Inactive pagination dot color.
 *
 * @fires fluid-slide-change - Fired when the active slide changes; detail = { index }.
 */
export class FluidCarousel extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
    }

    .scroller {
      display: flex;
      gap: var(--fluid-carousel-gap, 0);
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      scrollbar-width: none;
      aspect-ratio: var(--fluid-carousel-aspect-ratio, 16 / 9);
      background: var(--fluid-carousel-bg, var(--fluid-surface-base));
    }
    .scroller::-webkit-scrollbar {
      display: none;
    }

    .navigation {
      position: absolute;
      inset: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--fluid-space-2);
    }

    .nav-button {
      all: unset;
      pointer-events: auto;
      cursor: pointer;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: var(--fluid-carousel-nav-bg, var(--fluid-surface-base));
      color: var(--fluid-carousel-nav-fg, var(--fluid-text-primary));
      box-shadow: var(--fluid-shadow-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .nav-button:hover {
      background: var(--fluid-carousel-nav-hover-bg, var(--fluid-surface-muted));
    }
    .nav-button:focus-visible {
      outline: 2px solid var(--fluid-carousel-nav-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 2px;
    }
    .nav-button[disabled] {
      opacity: 0.4;
      cursor: default;
    }

    .pagination {
      display: flex;
      justify-content: center;
      gap: var(--fluid-space-2);
      margin-top: var(--fluid-space-2);
    }

    .dot {
      all: unset;
      cursor: pointer;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--fluid-carousel-dot-bg, var(--fluid-border-default));
      transition: background 120ms ease, transform 120ms ease;
    }
    .dot[aria-current="true"] {
      background: var(--fluid-carousel-dot-active-bg, var(--fluid-color-primary));
      transform: scale(1.3);
    }
    .dot:focus-visible {
      outline: 2px solid var(--fluid-carousel-dot-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 2px;
    }

    :host([no-navigation]) .navigation {
      display: none;
    }
    :host([no-pagination]) .pagination {
      display: none;
    }
  `;

  /** Hide prev/next buttons. */
  @property({ type: Boolean, attribute: "no-navigation", reflect: true }) noNavigation = false;

  /** Hide pagination dots. */
  @property({ type: Boolean, attribute: "no-pagination", reflect: true }) noPagination = false;

  /** Wrap around when reaching the ends. */
  @property({ type: Boolean }) loop = false;

  /** Autoplay interval in ms. 0 = off. */
  @property({ type: Number }) autoplay = 0;

  /** Pause autoplay on hover. */
  @property({ type: Boolean, attribute: "pause-on-hover" }) pauseOnHover = true;

  @query(".scroller") private scroller!: HTMLDivElement;

  @state() private activeIndex = 0;
  @state() private slideCount = 0;

  private autoplayTimer: number | null = null;
  private paused = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (!this.hasAttribute("aria-roledescription"))
      this.setAttribute("aria-roledescription", "carousel");
    this.addEventListener("mouseenter", this.onMouseEnter);
    this.addEventListener("mouseleave", this.onMouseLeave);
    this.addEventListener("keydown", this.onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopAutoplay();
    this.removeEventListener("mouseenter", this.onMouseEnter);
    this.removeEventListener("mouseleave", this.onMouseLeave);
    this.removeEventListener("keydown", this.onKeyDown);
  }

  protected override firstUpdated(): void {
    this.tabIndex = 0;
    this.refreshSlides();
    this.startAutoplay();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("autoplay")) {
      this.stopAutoplay();
      this.startAutoplay();
    }
  }

  private refreshSlides() {
    const items = Array.from(this.querySelectorAll("fluid-carousel-item")) as FluidCarouselItem[];
    this.slideCount = items.length;
    items.forEach((it, i) => {
      it.setAttribute("aria-label", `Slide ${i + 1} of ${this.slideCount}`);
    });
  }

  private onScroll = () => {
    if (!this.scroller) return;
    const slideWidth = this.scroller.clientWidth;
    const idx = Math.round(this.scroller.scrollLeft / slideWidth);
    if (idx !== this.activeIndex && idx >= 0 && idx < this.slideCount) {
      this.activeIndex = idx;
      this.dispatchEvent(
        new CustomEvent("fluid-slide-change", {
          detail: { index: idx },
          bubbles: true,
          composed: true
        })
      );
    }
  };

  /** Go to a specific slide index. */
  goTo(index: number): void {
    if (!this.scroller) return;
    let target = index;
    if (this.loop) {
      target = ((index % this.slideCount) + this.slideCount) % this.slideCount;
    } else {
      target = Math.max(0, Math.min(this.slideCount - 1, index));
    }
    const slideWidth = this.scroller.clientWidth;
    this.scroller.scrollTo({ left: slideWidth * target, behavior: "smooth" });
  }

  /** Go to the next slide. */
  next(): void {
    this.goTo(this.activeIndex + 1);
  }
  /** Go to the previous slide. */
  previous(): void {
    this.goTo(this.activeIndex - 1);
  }

  private startAutoplay() {
    if (!this.autoplay) return;
    // SC 2.2.2 / 2.3.3, never auto-advance when the user asked the OS to
    // reduce motion. They can still navigate manually.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    this.autoplayTimer = window.setInterval(() => {
      if (this.paused) return;
      if (!this.loop && this.activeIndex >= this.slideCount - 1) this.goTo(0);
      else this.next();
    }, this.autoplay);
  }

  private stopAutoplay() {
    if (this.autoplayTimer !== null) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  private onMouseEnter = () => {
    if (this.pauseOnHover) this.paused = true;
  };
  private onMouseLeave = () => {
    if (this.pauseOnHover) this.paused = false;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      this.previous();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      this.next();
    } else if (e.key === "Home") {
      e.preventDefault();
      this.goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      this.goTo(this.slideCount - 1);
    }
  };

  override render(): TemplateResult {
    const atStart = !this.loop && this.activeIndex <= 0;
    const atEnd = !this.loop && this.activeIndex >= this.slideCount - 1;
    return html`
      <div
        part="scroller"
        class="scroller"
        @scroll=${this.onScroll}
        @slotchange=${this.refreshSlides}
      >
        <slot @slotchange=${this.refreshSlides}></slot>
      </div>
      <div part="navigation" class="navigation">
        <button
          part="button"
          class="nav-button"
          type="button"
          aria-label="Previous slide"
          ?disabled=${atStart}
          @click=${() => this.previous()}
        >
          <fluid-icon name="chevron-left"></fluid-icon>
        </button>
        <button
          part="button"
          class="nav-button"
          type="button"
          aria-label="Next slide"
          ?disabled=${atEnd}
          @click=${() => this.next()}
        >
          <fluid-icon name="chevron-right"></fluid-icon>
        </button>
      </div>
      <div part="pagination" class="pagination" role="tablist" aria-label="Slides">
        ${Array.from(
          { length: this.slideCount },
          (_, i) => html`
            <button
              part="dot"
              class="dot"
              type="button"
              role="tab"
              aria-current=${i === this.activeIndex ? "true" : "false"}
              aria-label=${`Go to slide ${i + 1}`}
              @click=${() => this.goTo(i)}
            ></button>
          `
        )}
      </div>
    `;
  }
}
