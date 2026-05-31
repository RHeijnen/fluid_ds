import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidStackDirection = "vertical" | "horizontal";

/** Friendly alias → CSS value maps for align / justify. */
const ALIGN: Record<string, string> = {
  start: "flex-start",
  end: "flex-end",
  center: "center",
  stretch: "stretch",
  baseline: "baseline"
};
const JUSTIFY: Record<string, string> = {
  start: "flex-start",
  end: "flex-end",
  center: "center",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly"
};

/**
 * A one-dimensional flow layout (flexbox). Stacks its children along one axis
 * with a consistent gap, the 1D complement to [`<fluid-grid>`](/components/grid/).
 *
 * - `direction="vertical"` (default) is a classic **stack**: a column with
 *   even vertical rhythm.
 * - `direction="horizontal"` + `wrap` is a **cluster**: a row of items (chips,
 *   tags, buttons) that wraps onto new lines while keeping the gap uniform.
 *
 * @summary One-dimensional flow (stack / cluster) layout.
 *
 * @slot - The items to lay out.
 *
 * Every layout knob reads a component-scoped `--fluid-stack-*` token that falls
 * back to a main semantic var (the override ladder); the `gap` / `align` /
 * `justify` attributes set the matching token per instance.
 *
 * @cssproperty --fluid-stack-gap - Gap between items. Falls back to --fluid-space-4.
 * @cssproperty --fluid-stack-align - Cross-axis alignment (align-items). Falls back to stretch.
 * @cssproperty --fluid-stack-justify - Main-axis distribution (justify-content). Falls back to flex-start.
 *
 * @uses-token --fluid-space-4 - Default gap between items.
 */
export class FluidStack extends FluidElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-stack-gap, var(--fluid-space-4));
      align-items: var(--fluid-stack-align, stretch);
      justify-content: var(--fluid-stack-justify, flex-start);
      min-width: 0;
    }

    :host([hidden]) {
      display: none;
    }

    :host([inline]) {
      display: inline-flex;
    }

    :host([direction="horizontal"]) {
      flex-direction: row;
    }

    :host([wrap]) {
      flex-wrap: wrap;
    }
  `;

  /** Flow axis. */
  @property({ reflect: true }) direction: FluidStackDirection = "vertical";

  /** Gap between items (any CSS length). Overrides --fluid-stack-gap per instance. */
  @property() gap?: string;

  /**
   * Cross-axis alignment. Accepts the friendly aliases
   * `start` · `center` · `end` · `stretch` · `baseline`, or any raw
   * `align-items` value.
   */
  @property() align?: string;

  /**
   * Main-axis distribution. Accepts the friendly aliases
   * `start` · `center` · `end` · `between` · `around` · `evenly`, or any raw
   * `justify-content` value.
   */
  @property() justify?: string;

  /** Wrap items onto new lines (the cluster behavior). */
  @property({ type: Boolean, reflect: true }) wrap = false;

  /** Shrink to content width with `display: inline-flex`. */
  @property({ type: Boolean, reflect: true }) inline = false;

  private setVar(name: string, value: string | undefined): void {
    if (value === undefined || value === null || value === "") this.style.removeProperty(name);
    else this.style.setProperty(name, value);
  }

  protected override updated(): void {
    this.setVar("--fluid-stack-gap", this.gap);
    this.setVar("--fluid-stack-align", this.align ? (ALIGN[this.align] ?? this.align) : undefined);
    this.setVar(
      "--fluid-stack-justify",
      this.justify ? (JUSTIFY[this.justify] ?? this.justify) : undefined
    );
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
