import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
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
 * A fold line: a horizontal rule with a disclosure control at its centre.
 *
 * Where `<fluid-details>` is a section that announces itself with a heading,
 * the fold is the opposite gesture: a page that reads complete on its own,
 * with more available underneath for whoever asks. The line reads as a
 * natural end of the page, and the label in the middle of it says there is
 * more to unfold.
 *
 * Follows the WAI-ARIA disclosure pattern: a native button carrying
 * `aria-expanded` and `aria-controls`, in front of a labelled region.
 *
 * @summary Divider with a click-to-unfold region at its centre.
 *
 * @slot - The content shown when unfolded.
 *
 * @csspart base - The outer container.
 * @csspart toggle - The full-width disclosure button, lines included.
 * @csspart body - The unfolded region.
 *
 * Every styled property reads a component-scoped `--fluid-fold-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-fold-line-color - Rule color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-fold-line-width - Rule thickness. Falls back to 1px.
 * @cssproperty --fluid-fold-fg - Label and chevron color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-fold-fg-hover - Label and chevron color under the pointer. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-fold-font-family - Label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-fold-font-size - Label font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-fold-gap - Space between the lines and the label. Falls back to --fluid-space-3.
 * @cssproperty --fluid-fold-radius - Focus-ring corner radius on the label. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-fold-focus-ring - Keyboard focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-fold-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty [--fluid-fold-enter-animation=fluid-slide-in-down] - Body reveal animation. Another preset or `none`.
 * @cssproperty [--fluid-fold-enter-duration=var(--fluid-duration-fast)] - Body reveal duration (scaled by --fluid-motion).
 *
 * @uses-token --fluid-border-default - Rule color.
 * @uses-token --fluid-text-secondary - Resting label color.
 * @uses-token --fluid-text-primary - Hovered label color.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 * @uses-token --fluid-target-min - Minimum toggle hit-target height (24px AA / 44px AAA).
 * @uses-token --fluid-font-family-sans - Label font family.
 * @uses-token --fluid-font-size-sm - Label font size.
 * @uses-token --fluid-radius-sm - Focus-ring corner radius.
 * @uses-token --fluid-space-3 - Space between the lines and the label.
 *
 * @fires fluid-toggle - Fired when the open state changes. `event.detail.open`.
 */
export class FluidFold extends FluidElement {
  static override styles = [
    motionStyles,
    reducedMotion,
    css`
      :host {
        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      .toggle {
        all: unset;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: var(--fluid-fold-gap, var(--fluid-space-3));
        width: 100%;
        /* SC 2.5.8 Target Size, floor the toggle to --fluid-target-min. */
        min-height: var(--fluid-target-min, 0px);
        padding: var(--fluid-space-2) 0;
        cursor: pointer;
        color: var(--fluid-fold-fg, var(--fluid-text-secondary));
        font-family: var(--fluid-fold-font-family, var(--fluid-font-family-sans));
        font-size: var(--fluid-fold-font-size, var(--fluid-font-size-sm));
        font-weight: var(--fluid-font-weight-medium);
      }

      /* The rule, split around the label. Both halves are part of the button,
         so the whole line is the target rather than only the words. */
      .toggle::before,
      .toggle::after {
        content: "";
        flex: 1 1 0;
        height: var(--fluid-fold-line-width, 1px);
        background: var(--fluid-fold-line-color, var(--fluid-border-default));
      }

      .toggle:hover {
        color: var(--fluid-fold-fg-hover, var(--fluid-text-primary));
      }

      .toggle:focus-visible {
        outline: var(--fluid-fold-focus-ring-width, var(--fluid-focus-ring-width)) solid
          var(--fluid-fold-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: var(--fluid-focus-ring-offset);
        border-radius: var(--fluid-fold-radius, var(--fluid-radius-sm));
      }

      :host([disabled]) .toggle {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .label-group {
        display: inline-flex;
        align-items: center;
        gap: var(--fluid-space-2);
        white-space: nowrap;
      }

      .chevron {
        transition: transform var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      :host([open]) .chevron {
        transform: rotate(180deg);
      }

      /* Folded content keeps the hidden attribute (display:none) so it stays
         out of the a11y tree and is not focusable, the animation only plays
         on unfold. */
      .body:not([hidden]) {
        animation: var(--fluid-fold-enter-animation, fluid-slide-in-down)
          calc(var(--fluid-fold-enter-duration, var(--fluid-duration-fast)) * var(--fluid-motion, 1))
          var(--fluid-easing-decelerate) both;
      }

      .body[hidden] {
        display: none;
      }
    `
  ];

  /** Whether the folded content is shown. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Disabled state, clicks and keyboard are ignored. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** What the toggle says while folded. */
  @property() label = "Show more";

  /** What the toggle says while unfolded. Falls back to `label`. */
  @property({ attribute: "open-label" }) openLabel = "";

  private toggleId = `fluid-fold-toggle-${++counter}`;
  private bodyId = `fluid-fold-body-${counter}`;

  protected override updated(changed: PropertyValues<this>): void {
    if (this.changedAfterFirstRender(changed, "open")) {
      this.dispatchEvent(
        new CustomEvent("fluid-toggle", {
          detail: { open: this.open },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  /** Unfold the content. */
  show(): void {
    if (this.disabled) return;
    this.open = true;
  }

  /** Fold the content away. */
  hide(): void {
    if (this.disabled) return;
    this.open = false;
  }

  /** Toggle folded/unfolded. */
  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
  }

  private handleToggleClick = () => this.toggle();

  override render(): TemplateResult {
    return html`
      <div part="base">
        <button
          part="toggle"
          class="toggle"
          id=${this.toggleId}
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${this.bodyId}
          ?disabled=${this.disabled}
          @click=${this.handleToggleClick}
        >
          <span class="label-group">
            <fluid-icon class="chevron" name="chevron-down"></fluid-icon>
            <span>${this.open && this.openLabel ? this.openLabel : this.label}</span>
          </span>
        </button>
        <div
          part="body"
          class="body"
          id=${this.bodyId}
          role="region"
          aria-labelledby=${this.toggleId}
          ?hidden=${!this.open}
        >
          <slot></slot>
        </div>
      </div>
    `;
  }
}
