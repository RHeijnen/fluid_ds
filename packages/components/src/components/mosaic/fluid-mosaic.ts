import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A dense bento / mosaic grid. Items of mixed sizes pack tightly into a
 * uniform column track with `grid-auto-flow: dense`, so smaller tiles backfill
 * the gaps larger ones leave, the signature "mosaic" look.
 *
 * Two column modes (same as [`<fluid-grid>`](/components/grid/)):
 * **intrinsic** auto-fill by default, or **fixed** `cols` (+ `cols-sm` /
 * `cols-md` / `cols-lg`). Row height is fixed by `--fluid-mosaic-row-height`,
 * and tiles get their height from how many rows they span.
 *
 * Place [`<fluid-mosaic-item>`](/components/mosaic/) children and give them a
 * `size` (or explicit `col-span` / `row-span`).
 *
 * Breakpoints (min-width): **sm 40rem**, **md 48rem**, **lg 64rem**.
 *
 * @summary Dense bento / masonry-style tile layout.
 *
 * @slot - Tiles: `<fluid-mosaic-item>` or any element.
 *
 * Every layout knob reads a component-scoped `--fluid-mosaic-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-mosaic-gap - Gap between tiles. Falls back to --fluid-space-4.
 * @cssproperty --fluid-mosaic-min-col - Minimum column width in intrinsic mode. Falls back to 12rem.
 * @cssproperty --fluid-mosaic-row-height - Base row height; tile heights are multiples of this. Falls back to 10rem.
 *
 * @uses-token --fluid-space-4 - Default gap between tiles.
 */
export class FluidMosaic extends FluidElement {
  static override styles = css`
    :host {
      display: grid;
      gap: var(--fluid-mosaic-gap, var(--fluid-space-4));
      grid-auto-flow: dense;
      grid-auto-rows: var(--fluid-mosaic-row-height, 10rem);
      /* Intrinsic responsive default, see fluid-grid for the min() rationale. */
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(var(--fluid-mosaic-min-col, 12rem), 100%), 1fr)
      );
    }

    :host([hidden]) {
      display: none;
    }

    :host([data-grid-mode="fixed"]) {
      grid-template-columns: repeat(var(--_active-cols, 2), minmax(0, 1fr));
    }

    :host {
      --_active-cols: var(--_cols, 2);
    }
    @media (min-width: 40rem) {
      :host {
        --_active-cols: var(--_cols-sm, var(--_cols, 2));
      }
    }
    @media (min-width: 48rem) {
      :host {
        --_active-cols: var(--_cols-md, var(--_cols-sm, var(--_cols, 2)));
      }
    }
    @media (min-width: 64rem) {
      :host {
        --_active-cols: var(--_cols-lg, var(--_cols-md, var(--_cols-sm, var(--_cols, 2))));
      }
    }
  `;

  /** Column count (fixed mode). Omit for the intrinsic auto-fill layout. */
  @property({ type: Number }) cols?: number;

  /** Column count at the `sm` breakpoint (≥ 40rem). */
  @property({ type: Number, attribute: "cols-sm" }) colsSm?: number;

  /** Column count at the `md` breakpoint (≥ 48rem). */
  @property({ type: Number, attribute: "cols-md" }) colsMd?: number;

  /** Column count at the `lg` breakpoint (≥ 64rem). */
  @property({ type: Number, attribute: "cols-lg" }) colsLg?: number;

  /** Minimum column width for intrinsic mode (any CSS length). */
  @property({ attribute: "min-col-width" }) minColWidth?: string;

  /** Base row height (any CSS length). Tile heights are multiples of this. */
  @property({ attribute: "row-height" }) rowHeight?: string;

  /** Gap between tiles (any CSS length). Overrides --fluid-mosaic-gap per instance. */
  @property() gap?: string;

  private setVar(name: string, value: string | number | undefined | null): void {
    if (value === undefined || value === null || value === "") this.style.removeProperty(name);
    else this.style.setProperty(name, String(value));
  }

  protected override updated(): void {
    const fixed =
      this.cols != null || this.colsSm != null || this.colsMd != null || this.colsLg != null;
    if (fixed) this.setAttribute("data-grid-mode", "fixed");
    else this.removeAttribute("data-grid-mode");

    this.setVar("--_cols", this.cols);
    this.setVar("--_cols-sm", this.colsSm);
    this.setVar("--_cols-md", this.colsMd);
    this.setVar("--_cols-lg", this.colsLg);
    this.setVar("--fluid-mosaic-gap", this.gap);
    this.setVar("--fluid-mosaic-min-col", this.minColWidth);
    this.setVar("--fluid-mosaic-row-height", this.rowHeight);
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
