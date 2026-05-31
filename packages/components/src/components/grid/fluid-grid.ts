import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A responsive CSS-Grid container. Two modes:
 *
 * 1. **Intrinsic (default)**: omit `cols` and the grid auto-fills as many
 *    equal columns as fit, each at least `--fluid-grid-min-col` wide. Naturally
 *    responsive, no breakpoints needed.
 * 2. **Fixed columns**: set `cols` (and optional `cols-sm` / `cols-md` /
 *    `cols-lg`) for an explicit, breakpoint-aware column count.
 *
 * Place [`<fluid-col>`](/components/grid/) children to span multiple columns;
 * plain elements drop into one cell each.
 *
 * Breakpoints (min-width): **sm 40rem**, **md 48rem**, **lg 64rem**.
 *
 * @summary Responsive column / grid layout container.
 *
 * @slot - Grid items: `<fluid-col>` or any element.
 *
 * Every layout knob reads a component-scoped `--fluid-grid-*` token that falls
 * back to a main semantic var (the override ladder); the `gap` / `min-col-width`
 * / `align` / `justify` attributes set the matching token per instance.
 *
 * @cssproperty --fluid-grid-gap - Gap between cells. Falls back to --fluid-space-4.
 * @cssproperty --fluid-grid-min-col - Minimum column width in intrinsic mode. Falls back to 16rem.
 * @cssproperty --fluid-grid-align - Block-axis item alignment (align-items). Falls back to stretch.
 * @cssproperty --fluid-grid-justify - Inline-axis item alignment (justify-items). Falls back to stretch.
 *
 * @uses-token --fluid-space-4 - Default gap between cells.
 */
export class FluidGrid extends FluidElement {
  static override styles = css`
    :host {
      display: grid;
      gap: var(--fluid-grid-gap, var(--fluid-space-4));
      align-items: var(--fluid-grid-align, stretch);
      justify-items: var(--fluid-grid-justify, stretch);
      /*
       * Intrinsic responsive default: as many equal columns as fit, each at
       * least --fluid-grid-min-col wide. min(…, 100%) keeps a single column
       * from overflowing a container narrower than the minimum.
       */
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(var(--fluid-grid-min-col, 16rem), 100%), 1fr)
      );
    }

    :host([hidden]) {
      display: none;
    }

    /*
     * Fixed-column mode. JS stamps data-grid-mode="fixed" whenever a
     * cols / cols-sm / cols-md / cols-lg attribute is present; the
     * --_active-cols cascade below resolves the count for the current
     * breakpoint (each step falls back to the next-smaller value, then to the
     * base, then to 1).
     */
    :host([data-grid-mode="fixed"]) {
      grid-template-columns: repeat(var(--_active-cols, 1), minmax(0, 1fr));
    }

    :host {
      --_active-cols: var(--_cols, 1);
    }
    @media (min-width: 40rem) {
      :host {
        --_active-cols: var(--_cols-sm, var(--_cols, 1));
      }
    }
    @media (min-width: 48rem) {
      :host {
        --_active-cols: var(--_cols-md, var(--_cols-sm, var(--_cols, 1)));
      }
    }
    @media (min-width: 64rem) {
      :host {
        --_active-cols: var(--_cols-lg, var(--_cols-md, var(--_cols-sm, var(--_cols, 1))));
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

  /** Gap between cells (any CSS length). Overrides --fluid-grid-gap per instance. */
  @property() gap?: string;

  /** Block-axis item alignment: start | center | end | stretch. */
  @property() align?: string;

  /** Inline-axis item alignment: start | center | end | stretch. */
  @property() justify?: string;

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
    this.setVar("--fluid-grid-gap", this.gap);
    this.setVar("--fluid-grid-min-col", this.minColWidth);
    this.setVar("--fluid-grid-align", this.align);
    this.setVar("--fluid-grid-justify", this.justify);
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
