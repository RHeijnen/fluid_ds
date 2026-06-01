import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * Maintains a fixed width:height box for slotted media or embeds. The default
 * slot is stretched to fill the box, and replaced media (img, video, iframe)
 * is covered with object-fit so it never letterboxes. Purely presentational:
 * no role, no keyboard contract, it only constrains layout.
 *
 * @summary Constrains slotted content to a fixed aspect ratio.
 *
 * @slot - The media or embed to constrain. Stretched to fill the box.
 *
 * @csspart base - The ratio-constrained wrapper.
 *
 * @cssproperty --fluid-aspect-ratio-radius - Corner radius of the wrapper.
 * @cssproperty --fluid-aspect-ratio-overflow - Overflow behavior of the wrapper.
 *
 * @uses-token --fluid-radius-md - Default corner radius.
 */
export class FluidAspectRatio extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: block;
      width: 100%;
      aspect-ratio: var(--_fluid-aspect-ratio-value, 1 / 1);
      overflow: var(--fluid-aspect-ratio-overflow, hidden);
      border-radius: var(--fluid-aspect-ratio-radius, var(--fluid-radius-md));
    }

    /* Stretch the slotted content to fill the constrained box. */
    ::slotted(*) {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* Cover replaced media so it fills the box without letterboxing. */
    ::slotted(img),
    ::slotted(video),
    ::slotted(picture),
    ::slotted(canvas),
    ::slotted(svg),
    ::slotted(iframe) {
      object-fit: cover;
      border: 0;
    }
  `;

  /**
   * The width:height ratio, e.g. "16/9", "4/3", "1". Accepts the CSS
   * aspect-ratio shorthand (with or without spaces around the slash).
   */
  @property({ reflect: true }) ratio = "1/1";

  override render(): TemplateResult {
    // Pass the ratio straight through as the aspect-ratio value. CSS accepts
    // "16/9", "16 / 9", and "1" alike, so no parsing is needed.
    return html`
      <div part="base" class="base" style="--_fluid-aspect-ratio-value: ${this.ratio};">
        <slot></slot>
      </div>
    `;
  }
}
