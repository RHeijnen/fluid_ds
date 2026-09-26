import { html, css, nothing, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";

/**
 * An illustrated landscape tile: sky, a drifting cloud, rolling hills and two
 * trees, drawn with the Rainbow ink outline. It is a frame for content: slot a
 * `<fluid-rainbow-clock>`, a heading or a stat into the top corner.
 *
 * The artwork is decorative and hidden from assistive technology. Slotted
 * content stays fully accessible. Give the element a `label` only when the
 * picture itself carries meaning, which exposes it as an image with that name.
 *
 * The cloud and the tile's gentle float are the only motion. Both stop under
 * `prefers-reduced-motion`, when the global `--fluid-motion` scalar is 0, or
 * when the `still` attribute is set.
 *
 * Colors read the Rainbow palette (`--rainbow-blue`, `--rainbow-green`, …) when
 * the Rainbow brand is active and fall back to Fluid's brand and status ramps,
 * so the tile fits any preset.
 *
 * @summary Decorative animated landscape that frames slotted content.
 *
 * @slot - Content overlaid on the sky, top-start aligned.
 *
 * @csspart base - The outlined tile.
 * @csspart scene - The illustration SVG.
 * @csspart content - The wrapper around slotted content.
 *
 * @cssproperty --fluid-rainbow-landscape-sky - Sky color. Falls back to --rainbow-blue, then --fluid-color-brand-200.
 * @cssproperty --fluid-rainbow-landscape-hill - Far hill color. Falls back to --rainbow-paper, then white (the scene stays in daylight in every scheme).
 * @cssproperty --fluid-rainbow-landscape-meadow - Near meadow color. Falls back to --rainbow-green, then --fluid-color-emerald-300.
 * @cssproperty --fluid-rainbow-landscape-tree - Tree crown color. Falls back to --rainbow-green-deep, then --fluid-color-emerald-600.
 * @cssproperty --fluid-rainbow-landscape-cloud - Cloud color. Falls back to --rainbow-paper, then white.
 * @cssproperty --fluid-rainbow-landscape-ink - Outline color for the tile and every shape. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-rainbow-landscape-border-width - Tile outline width. Falls back to --fluid-border-width-default.
 * @cssproperty --fluid-rainbow-landscape-radius - Tile corner radius. Falls back to --fluid-radius-xl.
 * @cssproperty --fluid-rainbow-landscape-aspect-ratio - Tile aspect ratio. Falls back to 2 / 1.
 * @cssproperty --fluid-rainbow-landscape-padding - Inset of the slotted content. Falls back to --fluid-space-5.
 * @cssproperty --fluid-rainbow-landscape-fg - Text color of slotted content. Falls back to --rainbow-ink, then a fixed dark ink, because the sky is light in every scheme.
 *
 * @uses-token --fluid-color-brand-200 - Default sky outside the Rainbow brand.
 * @uses-token --fluid-color-emerald-300 - Default meadow outside the Rainbow brand.
 * @uses-token --fluid-color-emerald-600 - Default tree crowns outside the Rainbow brand.
 * @uses-token --fluid-border-strong - Outline color.
 * @uses-token --fluid-border-width-default - Outline width.
 * @uses-token --fluid-radius-xl - Tile corner radius.
 * @uses-token --fluid-space-5 - Content inset.
 * @uses-token --fluid-motion - Global motion scalar; 0 stops the drift.
 */
export class FluidRainbowLandscape extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      position: relative;
      aspect-ratio: var(--fluid-rainbow-landscape-aspect-ratio, 2 / 1);
      border: var(--fluid-rainbow-landscape-border-width, var(--fluid-border-width-default, 1px))
        solid var(--fluid-rainbow-landscape-ink, var(--fluid-border-strong, currentColor));
      border-radius: var(--fluid-rainbow-landscape-radius, var(--fluid-radius-xl, 1rem));
      overflow: hidden;
      /* The sky is always a light daylight tint, so text on it is always dark ink,
         whatever the page scheme. */
      color: var(--fluid-rainbow-landscape-fg, var(--rainbow-ink, #3b3634));
      animation: float calc(7s / max(var(--fluid-motion, 1), 0.001)) ease-in-out infinite;
    }

    .scene {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    .content {
      position: relative;
      padding: var(--fluid-rainbow-landscape-padding, var(--fluid-space-5, 1.25rem));
    }

    ::slotted(*) {
      margin: 0 !important;
    }

    .cloud {
      animation: drift calc(9s / max(var(--fluid-motion, 1), 0.001)) ease-in-out infinite alternate;
    }

    :host([still]) .base,
    :host([still]) .cloud {
      animation: none;
    }

    @keyframes float {
      50% {
        transform: translateY(-6px);
      }
    }
    @keyframes drift {
      from {
        transform: translateX(-24px);
      }
      to {
        transform: translateX(24px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .base,
      .cloud {
        animation: none;
      }
    }
  `;

  /** Stop the float and the drifting cloud regardless of motion settings. */
  @property({ type: Boolean, reflect: true }) still = false;

  /** Accessible name for the picture. Leave unset when it is decoration. */
  @property() label?: string;

  override render(): TemplateResult {
    const ink = "var(--fluid-rainbow-landscape-ink, var(--fluid-border-strong, currentColor))";
    const labelled = Boolean(this.label);
    return html`
      <div part="base" class="base">
        <svg
          part="scene"
          class="scene"
          viewBox="0 0 400 200"
          preserveAspectRatio="xMidYMax slice"
          role=${labelled ? "img" : nothing}
          aria-label=${labelled ? this.label! : nothing}
          aria-hidden=${labelled ? nothing : "true"}
          focusable="false"
        >
          <rect
            width="400"
            height="200"
            style="fill: var(--fluid-rainbow-landscape-sky, var(--rainbow-blue, var(--fluid-color-brand-200, #bfdbfe)))"
          />
          <path
            class="cloud"
            d="M300 48a10 10 0 0 1 18-8 12 12 0 0 1 22 4 8 8 0 0 1 0 16h-38a6 6 0 0 1-2-12z"
            stroke-width="3"
            style="fill: var(--fluid-rainbow-landscape-cloud, var(--rainbow-paper, #fff)); stroke: ${ink}"
          />
          <g transform="translate(0 16)">
            <path
              d="M-10 120C60 80 140 150 230 110S360 70 410 95V210H-10Z"
              stroke-width="5"
              style="fill: var(--fluid-rainbow-landscape-hill, var(--rainbow-paper, #fff)); stroke: ${ink}"
            />
            <path
              d="M-10 160C70 130 150 180 250 150S360 130 410 150V210H-10Z"
              stroke-width="5"
              style="fill: var(--fluid-rainbow-landscape-meadow, var(--rainbow-green, var(--fluid-color-emerald-300, #6ee7b7))); stroke: ${ink}"
            />
            <g
              stroke-width="4"
              stroke-linecap="round"
              style="stroke: ${ink}; fill: var(--fluid-rainbow-landscape-tree, var(--rainbow-green-deep, var(--fluid-color-emerald-600, #059669)))"
            >
              <path d="M300 150v-26" />
              <path d="M300 92c10 0 16 14 14 24s-7 12-14 12-12-2-14-12 4-24 14-24z" />
              <path d="M350 146v-18" />
              <path d="M350 108c7 0 11 10 10 17s-5 8-10 8-9-1-10-8 3-17 10-17z" />
            </g>
          </g>
        </svg>
        <div part="content" class="content"><slot></slot></div>
      </div>
    `;
  }
}
