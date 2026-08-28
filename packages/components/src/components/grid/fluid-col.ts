import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A grid item for [`<fluid-grid>`](/components/grid/). Controls how many
 * columns the cell spans (responsively), where it starts, and how many rows it
 * spans.
 *
 * Breakpoints (min-width): **sm 40rem**, **md 48rem**, **lg 64rem**, each
 * `span-*` falls back to the next-smaller value, then to `span`.
 *
 * @summary A spanning cell inside `<fluid-grid>`.
 *
 * @slot - The cell content.
 */
export class FluidCol extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      grid-column: span var(--_active-span, 1);
      grid-row: var(--_row, auto);
      min-width: 0;
      overflow-wrap: anywhere;
    }

    :host([hidden]) {
      display: none;
    }

    /* When the start prop is set, pin the start line and keep the span. */
    :host([data-has-start]) {
      grid-column: var(--_start) / span var(--_active-span, 1);
    }

    :host {
      --_active-span: var(--_span, 1);
    }
    @media (min-width: 40rem) {
      :host {
        --_active-span: var(--_span-sm, var(--_span, 1));
      }
    }
    @media (min-width: 48rem) {
      :host {
        --_active-span: var(--_span-md, var(--_span-sm, var(--_span, 1)));
      }
    }
    @media (min-width: 64rem) {
      :host {
        --_active-span: var(--_span-lg, var(--_span-md, var(--_span-sm, var(--_span, 1))));
      }
    }
  `;

  /** Columns to span (base). */
  @property({ type: Number }) span = 1;

  /** Columns to span at the `sm` breakpoint (≥ 40rem). */
  @property({ type: Number, attribute: "span-sm" }) spanSm?: number;

  /** Columns to span at the `md` breakpoint (≥ 48rem). */
  @property({ type: Number, attribute: "span-md" }) spanMd?: number;

  /** Columns to span at the `lg` breakpoint (≥ 64rem). */
  @property({ type: Number, attribute: "span-lg" }) spanLg?: number;

  /** 1-based column line to start at (offset). */
  @property({ type: Number }) start?: number;

  /** Rows to span. */
  @property({ type: Number, attribute: "row-span" }) rowSpan?: number;

  private validLine(value: number | undefined): number | undefined {
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
  }

  private setVar(name: string, value: string | number | undefined | null): void {
    if (value === undefined || value === null || value === "") this.style.removeProperty(name);
    else this.style.setProperty(name, String(value));
  }

  protected override updated(): void {
    this.setVar("--_span", this.validLine(this.span) ?? 1);
    this.setVar("--_span-sm", this.validLine(this.spanSm));
    this.setVar("--_span-md", this.validLine(this.spanMd));
    this.setVar("--_span-lg", this.validLine(this.spanLg));

    const start = this.validLine(this.start);
    if (start != null) {
      this.setAttribute("data-has-start", "");
      this.setVar("--_start", start);
    } else {
      this.removeAttribute("data-has-start");
      this.setVar("--_start", undefined);
    }

    const rowSpan = this.validLine(this.rowSpan);
    this.setVar("--_row", rowSpan != null ? `span ${rowSpan}` : undefined);
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
