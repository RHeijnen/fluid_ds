import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Indeterminate loading indicator. Use when an operation's duration is
 * unknown, for known progress, use `<fluid-progress-bar>` or
 * `<fluid-progress-ring>`.
 *
 * Sizes inherit from `font-size`, so a spinner inline with text reads
 * proportional to the surrounding line. Respects `prefers-reduced-motion`.
 *
 * @summary Indeterminate circular loader.
 *
 * @csspart base - The SVG element.
 *
 * Every styled property reads a component-scoped `--fluid-spinner-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-spinner-color - Spinner stroke color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-spinner-track-color - Background track color. Falls back to --fluid-color-neutral-200.
 * @cssproperty --fluid-spinner-speed - Rotation duration. Falls back to 1s.
 *
 * @uses-token --fluid-accent-base - Default stroke color.
 * @uses-token --fluid-color-neutral-200 - Default track color.
 */
export class FluidSpinner extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      width: 1em;
      height: 1em;
      vertical-align: -0.125em;
    }

    .base {
      width: 100%;
      height: 100%;
      animation: spin var(--fluid-spinner-speed, 1s) linear infinite;
    }

    .track {
      stroke: var(--fluid-spinner-track-color, var(--fluid-color-neutral-200));
    }

    .indicator {
      stroke: var(--fluid-spinner-color, var(--fluid-accent-base));
      stroke-linecap: round;
      stroke-dasharray: 60 100;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .base {
        /* Show progress without spinning for users who opt out of motion. */
        animation-duration: 6s;
      }
    }
  `;

  /**
   * Accessible label announced by screen readers. Defaults to "Loading".
   */
  @property() override ariaLabel: string | null = "Loading";

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "progressbar");
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
  }

  override render(): TemplateResult {
    return html`
      <svg
        part="base"
        class="base"
        viewBox="0 0 32 32"
        fill="none"
        stroke-width="3"
        aria-hidden="true"
      >
        <circle class="track" cx="16" cy="16" r="13" />
        <circle class="indicator" cx="16" cy="16" r="13" />
      </svg>
    `;
  }
}
