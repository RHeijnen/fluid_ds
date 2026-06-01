import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../spinner/define.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

/**
 * Blocking busy overlay for an async region. Wrap the content you want to gate
 * in the default slot; when `active` is set, a scrim plus a `<fluid-spinner>`
 * and an optional `label` cover the content, pointer events are trapped so the
 * underlying controls cannot be operated, and the host is marked `aria-busy`.
 *
 * The overlay layer is `role="status"` (a polite live region) so assistive
 * technology announces the label when the region enters its busy state and
 * again when it clears. Use this for in-place loading (a panel, a card, a form
 * section), not for full-page blocking, reach for a dialog for that.
 *
 * The fade honors `prefers-reduced-motion` and the global `--fluid-motion`
 * scalar.
 *
 * @summary Scrim plus spinner that gates an async region.
 *
 * @slot - The content the overlay gates while loading.
 *
 * @csspart base - The positioning wrapper around the slotted content.
 * @csspart overlay - The scrim layer shown while active.
 * @csspart spinner - The loading spinner.
 * @csspart label - The optional text shown under the spinner.
 *
 * Every styled property reads a component-scoped `--fluid-loading-overlay-*`
 * token that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-loading-overlay-scrim - Scrim background. Falls back to a translucent surface.
 * @cssproperty --fluid-loading-overlay-blur - Backdrop blur radius applied to the gated content. Falls back to 2px.
 * @cssproperty --fluid-loading-overlay-fg - Spinner + label color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-loading-overlay-spinner-size - Spinner diameter. Falls back to --fluid-font-size-2xl.
 * @cssproperty --fluid-loading-overlay-gap - Gap between spinner and label. Falls back to --fluid-space-3.
 * @cssproperty --fluid-loading-overlay-radius - Corner radius of the scrim. Falls back to --fluid-radius-md.
 *
 * @uses-token --fluid-surface-base - Basis for the default scrim color.
 * @uses-token --fluid-text-primary - Default spinner + label color.
 * @uses-token --fluid-radius-md - Default scrim radius.
 * @uses-token --fluid-font-size-sm - Label font size.
 */
export class FluidLoadingOverlay extends FluidElement {
  static override styles = [
    css`
      :host {
        display: block;
        position: relative;
        font-family: var(--fluid-font-family-sans);
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        position: relative;
      }

      .overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--fluid-loading-overlay-gap, var(--fluid-space-3));
        border-radius: var(--fluid-loading-overlay-radius, var(--fluid-radius-md));
        background: var(
          --fluid-loading-overlay-scrim,
          color-mix(in srgb, var(--fluid-surface-base, #ffffff) 70%, transparent)
        );
        backdrop-filter: blur(var(--fluid-loading-overlay-blur, 2px));
        color: var(--fluid-loading-overlay-fg, var(--fluid-text-primary));
        /* Trap pointer events so the gated content cannot be operated. */
        z-index: 1;
        animation: fluid-loading-overlay-fade-in
          calc(var(--fluid-duration-fast, 150ms) * var(--fluid-motion, 1))
          var(--fluid-easing-standard, ease);
      }

      fluid-spinner {
        font-size: var(
          --fluid-loading-overlay-spinner-size,
          var(--fluid-font-size-2xl)
        );
        --fluid-spinner-color: var(
          --fluid-loading-overlay-fg,
          var(--fluid-text-primary)
        );
      }

      .label {
        font-size: var(--fluid-font-size-sm);
        font-weight: var(--fluid-font-weight-medium);
        line-height: var(--fluid-line-height-tight, 1.25);
        text-align: center;
      }

      @keyframes fluid-loading-overlay-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
    reducedMotion
  ];

  /** Whether the overlay is shown and the region is busy. Reflected. */
  @property({ type: Boolean, reflect: true }) active = false;

  /** Optional text shown under the spinner and announced by assistive tech. */
  @property() label = "";

  override updated(changed: Map<string, unknown>): void {
    if (changed.has("active")) {
      if (this.active) {
        this.setAttribute("aria-busy", "true");
      } else {
        this.removeAttribute("aria-busy");
      }
    }
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <slot></slot>
        ${this.active
          ? html`
              <div
                part="overlay"
                class="overlay"
                role="status"
                aria-live="polite"
                aria-label=${this.label || "Loading"}
              >
                <fluid-spinner
                  part="spinner"
                  aria-hidden="true"
                ></fluid-spinner>
                ${this.label
                  ? html`<span part="label" class="label">${this.label}</span>`
                  : ""}
              </div>
            `
          : ""}
      </div>
    `;
  }
}
