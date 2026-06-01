import { html, css, type TemplateResult, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

export type FluidImageFit = "cover" | "contain";
export type FluidImageLoading = "eager" | "lazy";

/**
 * Responsive image wrapper that reserves layout space and fades in on load.
 *
 * Wraps a native `<img>`. It reserves space ahead of the network via
 * `aspect-ratio` (or explicit width/height) so the page does not shift when the
 * pixels arrive, shows a solid `placeholder` color in the meantime, then fades
 * the image in once it decodes (the fade honors reduced-motion). If the image
 * fails to load and a `fallback` src is set, it swaps to the fallback before
 * giving up.
 *
 * There is no ARIA role, the inner `<img>` carries the accessible name through
 * `alt`. `alt` is required for meaningful images; pass `alt=""` (the default)
 * to mark a purely decorative image, which removes it from the accessibility
 * tree.
 *
 * @summary Responsive image with reserved space, placeholder, and load fade-in.
 *
 * @slot fallback - Optional custom content rendered in place of the image when
 *   it fails to load and no `fallback` src resolves (e.g. an icon or initials).
 *
 * @csspart base - The wrapper element that reserves space.
 * @csspart img - The inner native `<img>`.
 *
 * @cssproperty --fluid-image-radius - Corner radius of the wrapper and image.
 * @cssproperty --fluid-image-placeholder-bg - Solid color shown until the image
 *   loads (and behind a transparent image).
 *
 * @uses-token --fluid-radius-md - Default corner radius.
 * @uses-token --fluid-surface-muted - Default placeholder background.
 * @uses-token --fluid-motion - Global motion scalar (set to 0 to disable the fade).
 * @uses-token --fluid-duration-slow - Fade-in duration.
 * @uses-token --fluid-easing-standard - Fade-in easing.
 *
 * @fires fluid-load - Dispatched when the image finishes loading successfully.
 * @fires fluid-error - Dispatched when the image fails to load (after the
 *   fallback src, if any, also fails).
 */
export class FluidImage extends FluidElement {
  static override styles = [
    css`
      :host {
        display: inline-block;
        line-height: 0;
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        display: block;
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        border-radius: var(--fluid-image-radius, var(--fluid-radius-md));
        background-color: var(--fluid-image-placeholder-bg, var(--fluid-surface-muted));
      }

      img {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: inherit;
        object-fit: var(--fluid-image-fit, cover);
        opacity: 0;
        transition: opacity calc(var(--fluid-duration-slow, 300ms) * var(--fluid-motion, 1))
          var(--fluid-easing-standard, ease);
      }

      img.is-loaded {
        opacity: 1;
      }

      .fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--fluid-text-secondary, #3f3f46);
        font-family: var(--fluid-font-family-sans);
        font-size: var(--fluid-font-size-sm);
      }
    `,
    reducedMotion
  ];

  /** Image source URL. */
  @property() src = "";

  /**
   * Alternative text. Required for meaningful images. Leave empty (`""`) to
   * mark the image as decorative, which removes it from the accessibility tree.
   */
  @property() alt = "";

  /** Intrinsic width in CSS pixels. Helps reserve space and avoid layout shift. */
  @property() width?: string;

  /** Intrinsic height in CSS pixels. Helps reserve space and avoid layout shift. */
  @property() height?: string;

  /** CSS aspect-ratio used to reserve space, e.g. "16/9". */
  @property({ attribute: "aspect-ratio" }) aspectRatio?: string;

  /** Native loading strategy. Defaults to "lazy". */
  @property({ reflect: true }) loading: FluidImageLoading = "lazy";

  /** How the image fills the box. */
  @property({ reflect: true }) fit: FluidImageFit = "cover";

  /** Solid color shown until the image loads (maps to --fluid-image-placeholder-bg). */
  @property() placeholder?: string;

  /** Source used if the primary `src` fails to load. */
  @property() fallback?: string;

  @state() private loaded = false;
  @state() private errored = false;
  @state() private usingFallback = false;

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("src")) {
      // Reset load state when the source changes.
      this.loaded = false;
      this.errored = false;
      this.usingFallback = false;
    }
  }

  private handleLoad = (): void => {
    this.loaded = true;
    this.errored = false;
    this.dispatchEvent(
      new CustomEvent("fluid-load", { bubbles: true, composed: true })
    );
  };

  private handleError = (): void => {
    if (this.fallback && !this.usingFallback) {
      // Try the fallback source once before declaring failure.
      this.usingFallback = true;
      return;
    }
    this.errored = true;
    this.dispatchEvent(
      new CustomEvent("fluid-error", { bubbles: true, composed: true })
    );
  };

  override render(): TemplateResult {
    const currentSrc =
      this.usingFallback && this.fallback ? this.fallback : this.src;

    const hostStyle = styleMap({
      width: this.width ? `${this.width}px` : undefined,
      height: this.height ? `${this.height}px` : undefined,
      "aspect-ratio": this.aspectRatio ?? undefined,
      "--fluid-image-fit": this.fit,
      "--fluid-image-placeholder-bg": this.placeholder ?? undefined
    });

    return html`
      <div part="base" class="base" style=${hostStyle}>
        ${this.errored
          ? html`<div class="fallback" part="img"><slot name="fallback"></slot></div>`
          : html`
              <img
                part="img"
                class=${classMap({ "is-loaded": this.loaded })}
                src=${ifDefined(currentSrc || undefined)}
                alt=${this.alt}
                loading=${this.loading}
                @load=${this.handleLoad}
                @error=${this.handleError}
              />
            `}
      </div>
    `;
  }
}
