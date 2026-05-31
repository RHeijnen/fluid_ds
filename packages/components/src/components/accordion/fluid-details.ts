import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";
import { motionStyles, reducedMotion } from "../../internal/motion.js";

registerIcon(
  "chevron-down",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>`
);

let counter = 0;

/**
 * A single collapsible disclosure.
 *
 * Use standalone, or stack them inside `<fluid-accordion>` for grouped behavior.
 *
 * @summary Click-to-expand region.
 *
 * @slot summary - The clickable header.
 * @slot - The body shown when expanded.
 *
 * @csspart base - The outer container.
 * @csspart summary - The clickable header button.
 * @csspart body - The collapsible body.
 *
 * Every styled property reads a component-scoped `--fluid-details-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-details-border - Bottom border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-details-border-width - Bottom border width. Falls back to 1px.
 * @cssproperty --fluid-details-summary-fg - Summary text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-details-body-fg - Body text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-details-font-family - Summary font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-details-font-size - Summary font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-details-radius - Summary focus-ring corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-details-focus-ring - Keyboard focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-details-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty [--fluid-details-enter-animation=fluid-slide-in-down] - Body reveal animation. Another preset or `none`.
 * @cssproperty [--fluid-details-enter-duration=var(--fluid-duration-fast)] - Body reveal duration (scaled by --fluid-motion).
 *
 * @uses-token --fluid-border-default - Bottom border separator.
 * @uses-token --fluid-text-primary - Summary text color.
 * @uses-token --fluid-text-secondary - Body text color.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum summary hit-target height (24px AA / 44px AAA).
 * @uses-token --fluid-font-family-sans - Summary font family.
 * @uses-token --fluid-font-size-md - Summary font size.
 * @uses-token --fluid-radius-sm - Summary focus-ring corner radius.
 *
 * @fires fluid-toggle - Fired when the open state changes. `event.detail.open`.
 */
export class FluidDetails extends FluidElement {
  static override styles = [
    motionStyles,
    reducedMotion,
    css`
    :host {
      display: block;
      border-bottom: var(--fluid-details-border-width, 1px) solid
        var(--fluid-details-border, var(--fluid-border-default));
    }

    :host([hidden]) {
      display: none;
    }

    .summary {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-3);
      width: 100%;
      /* SC 2.5.8 Target Size, floor the disclosure button to --fluid-target-min. */
      min-height: var(--fluid-target-min, 0px);
      padding: var(--fluid-space-3) 0;
      cursor: pointer;
      font-family: var(--fluid-details-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-details-font-size, var(--fluid-font-size-md));
      font-weight: var(--fluid-font-weight-medium);
      color: var(--fluid-details-summary-fg, var(--fluid-text-primary));
    }

    .summary:focus-visible {
      outline: var(--fluid-details-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-details-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: var(--fluid-focus-ring-offset);
      border-radius: var(--fluid-details-radius, var(--fluid-radius-sm));
    }

    :host([disabled]) .summary {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .chevron {
      transition: transform var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    :host([open]) .chevron {
      transform: rotate(180deg);
    }

    .body {
      padding-bottom: var(--fluid-space-4);
      color: var(--fluid-details-body-fg, var(--fluid-text-secondary));
    }

    /* Reveal animation when the body is shown. Collapsed content keeps the
       hidden attribute (display:none) so it stays out of the a11y tree and
       isn't focusable, the animation only plays on expand. */
    .body:not([hidden]) {
      animation: var(--fluid-details-enter-animation, fluid-slide-in-down)
        calc(var(--fluid-details-enter-duration, var(--fluid-duration-fast)) * var(--fluid-motion, 1))
        var(--fluid-easing-decelerate) both;
    }

    .body[hidden] {
      display: none;
    }
  `
  ];

  @query(".body") private bodyEl!: HTMLElement;

  /** Whether the details are expanded. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Disabled state, clicks and keyboard are ignored. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  private summaryId = `fluid-details-summary-${++counter}`;
  private bodyId = `fluid-details-body-${counter}`;

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.bodyEl) {
        if (this.open) this.bodyEl.removeAttribute("hidden");
        else this.bodyEl.setAttribute("hidden", "");
      }
      this.dispatchEvent(
        new CustomEvent("fluid-toggle", {
          detail: { open: this.open },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  /** Open the details. */
  show(): void {
    if (this.disabled) return;
    this.open = true;
  }

  /** Close the details. */
  hide(): void {
    if (this.disabled) return;
    this.open = false;
  }

  /** Toggle open/closed. */
  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
  }

  private handleSummaryClick = () => this.toggle();

  private handleSummaryKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.toggle();
    }
  };

  override render(): TemplateResult {
    return html`
      <div part="base">
        <button
          part="summary"
          class="summary"
          id=${this.summaryId}
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${this.bodyId}
          ?disabled=${this.disabled}
          @click=${this.handleSummaryClick}
          @keydown=${this.handleSummaryKeyDown}
        >
          <span><slot name="summary"></slot></span>
          <fluid-icon class="chevron" name="chevron-down"></fluid-icon>
        </button>
        <div
          part="body"
          class="body"
          id=${this.bodyId}
          role="region"
          aria-labelledby=${this.summaryId}
          ?hidden=${!this.open}
        >
          <slot></slot>
        </div>
      </div>
    `;
  }
}
