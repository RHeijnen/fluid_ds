import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidSkeletonEffect = "pulse" | "sheen" | "none";

/**
 * Placeholder shape rendered while real content is loading. Reduces perceived
 * wait time and prevents layout shift by reserving the same space.
 *
 * Sizes via standard CSS (`width`, `height`), the host fills whatever box
 * you give it. Use multiple instances stacked to build skeleton layouts.
 *
 * Effects:
 *   - `pulse` (default): subtle opacity fade
 *   - `sheen`: angled gradient sweeps across: feels more "loading"
 *   - `none`: static (also the fallback under prefers-reduced-motion)
 *
 * @summary Pulsing / shimmering placeholder shape.
 *
 * @csspart base - The skeleton element.
 *
 * Every styled property reads a component-scoped `--fluid-skeleton-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-skeleton-color - Base color. Falls back to --fluid-color-neutral-200.
 * @cssproperty --fluid-skeleton-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-skeleton-sheen-color - Sheen color (used by the sheen effect). Falls back to rgb(255 255 255 / 0.5).
 *
 * @uses-token --fluid-color-neutral-200 - Default base color.
 * @uses-token --fluid-radius-md - Default corner radius.
 */
export class FluidSkeleton extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 1em;
    }

    .base {
      width: 100%;
      height: 100%;
      background: var(--fluid-skeleton-color, var(--fluid-color-neutral-200));
      border-radius: var(--fluid-skeleton-radius, var(--fluid-radius-md));
      position: relative;
      overflow: hidden;
    }

    /* Pulse, eases between 100% and 60% opacity. */
    :host([effect="pulse"]) .base {
      animation: pulse 1.6s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.55;
      }
    }

    /* Sheen, angled highlight that slides across. */
    :host([effect="sheen"]) .base::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        110deg,
        transparent 30%,
        var(--fluid-skeleton-sheen-color, rgb(255 255 255 / 0.5)) 50%,
        transparent 70%
      );
      transform: translateX(-100%);
      animation: sheen 1.6s ease-in-out infinite;
    }

    @keyframes sheen {
      to {
        transform: translateX(100%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host([effect="pulse"]) .base,
      :host([effect="sheen"]) .base::after {
        animation: none;
      }
    }
  `;

  /** Animation effect. */
  @property({ reflect: true }) effect: FluidSkeletonEffect = "pulse";

  override connectedCallback(): void {
    super.connectedCallback();
    // Skeletons advertise themselves as a status region so AT users get a
    // "loading" hint. Role + aria-busy + aria-live together satisfy ARIA's
    // requirement that aria-busy and aria-live appear on an element with a
    // permitting role.
    if (!this.hasAttribute("role")) this.setAttribute("role", "status");
    if (!this.hasAttribute("aria-busy")) this.setAttribute("aria-busy", "true");
    if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
  }

  override render(): TemplateResult {
    return html`<div part="base" class="base"></div>`;
  }
}
