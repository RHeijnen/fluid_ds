import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";
import {
  Chart,
  registerables,
  type ChartConfiguration,
  type ChartData,
  type ChartDataset,
  type ChartOptions,
  type ChartType,
  type LegendItem,
  type Plugin
} from "chart.js";

Chart.register(...registerables);

/** Cartesian types get x/y grid + tick theming; radial/arc types don't. */
const CARTESIAN = new Set<ChartType>(["line", "bar", "scatter", "bubble"]);

/** #rgb / #rrggbb → rgba() string (passes through anything non-hex). */
function rgba(hex: string, alpha: number): string {
  const m = hex.trim().replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const n = Number.parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Recursive merge where `over` wins. Used so caller `options` beat the theme. */
function mergeDeep<T>(base: T, over: unknown): T {
  if (!over || typeof over !== "object" || Array.isArray(over)) return (over ?? base) as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(over as Record<string, unknown>)) {
    const bv = (base as Record<string, unknown>)?.[key];
    const ov = (over as Record<string, unknown>)[key];
    out[key] =
      ov &&
      typeof ov === "object" &&
      !Array.isArray(ov) &&
      bv &&
      typeof bv === "object" &&
      !Array.isArray(bv)
        ? mergeDeep(bv, ov)
        : ov;
  }
  return out as T;
}

interface FluidTheme {
  palette: string[];
  accent: string;
  text: string;
  muted: string;
  border: string;
  surface: string;
  font: string;
}

/**
 * Generic chart component backed by [Chart.js](https://www.chartjs.org/).
 * Pass `type`, `data`, and `options`; higher-level wrappers (`fluid-bar-chart`,
 * `fluid-line-chart`, …) just lock the type.
 *
 * Charts are themed from Fluid tokens: series colors follow the brand ramp (so
 * they recolor with `data-fluid-brand`), area fills use an accent gradient, bars
 * are rounded, and grid lines, ticks, the legend, tooltip, and fonts all read
 * the surface / text / border / font tokens. Anything you set on a dataset or in
 * `options` overrides the theme. The chart re-themes automatically when the
 * scheme or brand changes.
 *
 * @summary Generic Chart.js wrapper, themed by Fluid tokens.
 *
 * @slot fallback - Accessible data alternative, such as a table or concise summary.
 *
 * @csspart base - The canvas element.
 * @csspart plot - The responsive canvas container.
 * @csspart legend - The HTML legend group.
 * @csspart legend-button - A native visibility toggle for a series or arc.
 * @fires fluid-legend-change - A legend control was activated. Detail includes label, visible, datasetIndex or index.
 *
 * @cssproperty --fluid-chart-height - Default height of the chart. Falls back to 16rem.
 * @cssproperty --fluid-chart-legend-gap - Space between legend controls.
 * @cssproperty --fluid-chart-legend-bg - Legend control background.
 * @cssproperty --fluid-chart-legend-fg - Legend text color.
 * @cssproperty --fluid-chart-legend-border - Legend control border.
 * @cssproperty --fluid-chart-legend-radius - Legend control corner radius.
 * @cssproperty --fluid-chart-legend-padding - Legend control padding.
 * @cssproperty --fluid-chart-legend-target - Minimum legend control size.
 * @cssproperty --fluid-chart-legend-font - Legend control font.
 * @cssproperty --fluid-chart-legend-focus-color - Legend focus ring color.
 * @cssproperty --fluid-chart-legend-focus-width - Legend focus ring width.
 * @cssproperty --fluid-chart-legend-focus-offset - Legend focus ring offset.
 *
 * @uses-token --fluid-accent-base - Primary series + area-fill gradient.
 * @uses-token --fluid-color-brand-200 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-300 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-400 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-500 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-600 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-700 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-800 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-900 - Categorical series palette (brand ramp).
 * @uses-token --fluid-text-primary - Legend text + tooltip foreground.
 * @uses-token --fluid-text-secondary - Axis ticks + default text color.
 * @uses-token --fluid-border-default - Grid lines + axis borders.
 * @uses-token --fluid-surface-base - Arc/segment borders + tooltip text on the inverse bg.
 * @uses-token --fluid-font-family-sans - All chart text.
 * @uses-token --fluid-space-2 - Legend gap and padding.
 * @uses-token --fluid-space-1 - Legend vertical padding.
 * @uses-token --fluid-target-min - Legend minimum target size.
 * @uses-token --fluid-radius-sm - Legend corner radius.
 * @uses-token --fluid-focus-ring-color - Legend focus ring.
 * @uses-token --fluid-focus-ring-width - Legend focus ring thickness.
 * @uses-token --fluid-focus-ring-offset - Legend focus ring offset.
 */
export class FluidChart extends FluidElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      position: relative;
      width: 100%;
      height: var(--fluid-chart-height, 16rem);
    }
    .plot {
      position: relative;
      flex: 1;
      min-height: 0;
      min-width: 0;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      flex-shrink: 0;
      gap: var(--fluid-chart-legend-gap, var(--fluid-space-2, 0.5rem));
    }
    .legend button {
      cursor: pointer;
      min-height: var(--fluid-chart-legend-target, var(--fluid-target-min, 24px));
      min-width: var(--fluid-chart-legend-target, var(--fluid-target-min, 24px));
      padding: var(
        --fluid-chart-legend-padding,
        var(--fluid-space-1, 0.25rem) var(--fluid-space-2, 0.5rem)
      );
      color: var(--fluid-chart-legend-fg, var(--fluid-text-primary, #111827));
      background: var(--fluid-chart-legend-bg, var(--fluid-surface-base, #fff));
      border: 1px solid var(--fluid-chart-legend-border, var(--fluid-border-default, #e5e7eb));
      border-radius: var(--fluid-chart-legend-radius, var(--fluid-radius-sm, 0.25rem));
      font: var(--fluid-chart-legend-font, inherit);
    }
    .legend button[aria-pressed="false"] {
      text-decoration: line-through;
    }
    .legend button:focus-visible {
      outline: var(--fluid-chart-legend-focus-width, var(--fluid-focus-ring-width, 2px)) solid
        var(--fluid-chart-legend-focus-color, var(--fluid-focus-ring-color, #2563eb));
      outline-offset: var(--fluid-chart-legend-focus-offset, var(--fluid-focus-ring-offset, 2px));
    }
  `;

  /** Chart type. */
  @property() type: ChartType = "bar";

  /** Chart.js data object. */
  @property({ attribute: false }) data: ChartData = { labels: [], datasets: [] };

  /** Accessible canvas name. Describe the chart's subject, not only its visual type. */
  @property()
  get label(): string {
    return this.labelOverride ?? this.term("chart");
  }
  set label(value: string | null) {
    this.labelOverride = value;
  }
  private labelOverride: string | null = null;

  /** Chart.js options object. Merged over the Fluid theme (these win). */
  @property({ attribute: false }) options: ChartOptions = {};

  @query("canvas") private canvas!: HTMLCanvasElement;

  private chart: Chart | null = null;
  private themeObserver?: MutationObserver;
  @state() private legendItems: LegendItem[] = [];
  private pendingLegendItems?: LegendItem[];
  private legendUpdateQueued = false;
  private renderingChartUpdate = false;
  private savedDatasetVisibility?: boolean[];
  private savedDataVisibility?: boolean[];
  private savedType?: ChartType;
  private motionQuery?: MediaQueryList;
  private handleMotionChange = () => this.retheme();

  override connectedCallback(): void {
    super.connectedCallback();
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.motionQuery.addEventListener("change", this.handleMotionChange);
    // Re-theme when the page scheme or brand flips (attributes on <html>).
    this.themeObserver = new MutationObserver(() => this.retheme());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-fluid-theme", "data-fluid-brand", "data-fluid-conformance"]
    });
    if (this.hasUpdated) this.requestUpdate();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (!this.isConnected) return;
    this.renderingChartUpdate = true;
    try {
      if (changed.has("type") && this.chart) {
        this.destroy();
        this.savedDatasetVisibility = undefined;
        this.savedDataVisibility = undefined;
        this.render2d();
      } else if ((changed.has("data") || changed.has("options")) && this.chart) {
        const { data, options } = this.buildConfig();
        this.chart.data = data;
        this.chart.options = options;
        this.chart.update();
      } else if (!this.chart) {
        this.render2d();
      }
      if (this.chart && (changed.size === 0 || changed.has("label"))) {
        this.syncLegend(this.chart);
        // The doughnut total is painted into the third-party canvas. A locale
        // change therefore needs one in-place draw, but never a new Chart,
        // update, dataset mutation, or visibility reset.
        if (changed.size === 0 && this.type === "doughnut") this.chart.draw();
      }
    } finally {
      this.renderingChartUpdate = false;
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.themeObserver?.disconnect();
    this.motionQuery?.removeEventListener("change", this.handleMotionChange);
    this.motionQuery = undefined;
    this.saveVisibility();
    this.destroy();
  }

  /** Underlying Chart.js instance (after first render). */
  get instance(): Chart | null {
    return this.chart;
  }

  /** Full re-theme (re-reads tokens, rebuilds gradients). */
  private retheme(): void {
    if (!this.chart) return;
    this.saveVisibility();
    this.destroy();
    this.render2d();
  }

  private readTheme(): FluidTheme {
    const cs = getComputedStyle(this);
    const read = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
    const accent = read("--fluid-accent-base", "#3b82f6");
    const brand = ["600", "400", "800", "300", "700", "500", "200", "900"]
      .map((s) => cs.getPropertyValue(`--fluid-color-brand-${s}`).trim())
      .filter(Boolean);
    const palette =
      brand.length >= 3 ? brand : [accent, "#22d3ee", "#8b5cf6", "#f59e0b", "#ec4899", "#10b981"];
    return {
      palette,
      accent,
      text: read("--fluid-text-primary", "#111827"),
      muted: read("--fluid-text-secondary", "#6b7280"),
      border: read("--fluid-border-default", "#e5e7eb"),
      surface: read("--fluid-surface-base", "#ffffff"),
      font: read("--fluid-font-family-sans", "system-ui, -apple-system, sans-serif")
    };
  }

  /** Themed Chart.js options (caller `options` are merged on top). */
  private themedOptions(t: FluidTheme): ChartOptions {
    const base: Record<string, unknown> = {
      responsive: true,
      maintainAspectRatio: false,
      color: t.muted,
      font: { family: t.font },
      plugins: {
        legend: {
          // A native HTML legend replaces the pointer-only canvas legend.
          // Callers can opt the canvas legend back in with display:true.
          display: false,
          labels: {
            color: t.text,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            padding: 16,
            font: { family: t.font }
          }
        },
        tooltip: {
          backgroundColor: t.text,
          titleColor: t.surface,
          bodyColor: t.surface,
          padding: 10,
          cornerRadius: 8,
          boxPadding: 4,
          usePointStyle: true,
          titleFont: { family: t.font },
          bodyFont: { family: t.font }
        }
      },
      elements: {
        line: { tension: 0.35, borderWidth: 2.5 },
        point: { radius: 0, hoverRadius: 5, hitRadius: 12, borderWidth: 2 },
        bar: { borderRadius: 6, borderSkipped: false },
        arc: { borderWidth: 2, borderColor: t.surface }
      }
    };
    if (CARTESIAN.has(this.type)) {
      base.scales = {
        x: {
          grid: { display: false },
          border: { color: t.border },
          ticks: { color: t.muted, font: { family: t.font }, padding: 6 }
        },
        y: {
          beginAtZero: true,
          grid: { color: rgba(t.border, 0.6), drawTicks: false },
          border: { display: false },
          ticks: { color: t.muted, font: { family: t.font }, padding: 8 }
        }
      };
    }
    if (this.type === "doughnut") base.cutout = "70%";
    return base as ChartOptions;
  }

  /**
   * Doughnut flourish: a soft drop shadow under the ring and a total in the
   * hole. Opt out with `options.plugins.fluidCenterText = false`, or relabel
   * with `{ label: "…" }`.
   */
  private arcDecor(t: FluidTheme): Plugin[] {
    const cfg = (this.options as Record<string, unknown>)?.plugins as
      | Record<string, unknown>
      | undefined;
    const center = cfg?.fluidCenterText;
    if (center === false) return [];
    const labelOverride =
      center && typeof center === "object" && "label" in center
        ? String((center as { label: unknown }).label)
        : null;
    return [
      {
        id: "fluidArcDecor",
        beforeDatasetsDraw(chart) {
          const c = chart.ctx;
          c.save();
          c.shadowColor = "rgba(2, 6, 23, 0.16)";
          c.shadowBlur = 16;
          c.shadowOffsetY = 6;
        },
        afterDatasetsDraw: (chart) => {
          const c = chart.ctx;
          c.restore(); // drop the shadow before drawing text
          const ds = chart.data.datasets?.[0];
          const area = chart.chartArea;
          if (!ds || !area) return;
          const total = (ds.data as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
          const cx = (area.left + area.right) / 2;
          const cy = (area.top + area.bottom) / 2;
          c.save();
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillStyle = t.text;
          c.font = `700 26px ${t.font}`;
          c.fillText(this.formatNumber(total), cx, cy - 8);
          c.fillStyle = t.muted;
          c.font = `500 13px ${t.font}`;
          c.fillText(labelOverride ?? this.term("chartTotal"), cx, cy + 15);
          c.restore();
        }
      } as Plugin
    ];
  }

  /** Apply the palette / gradients to datasets that don't already set colors. */
  private themedData(t: FluidTheme): ChartData {
    const pick = (i: number) => t.palette[i % t.palette.length]!;
    const datasets = (this.data.datasets ?? []).map((raw, i) => {
      const ds: Record<string, unknown> = { ...(raw as ChartDataset) };
      const color = pick(i);
      if (this.type === "doughnut" || this.type === "pie" || this.type === "polarArea") {
        // Each arc gets a radial gradient (lighter toward the hole, saturated at
        // the rim) so the ring reads as glossy rather than flat.
        if (ds.backgroundColor == null) {
          ds.backgroundColor = (ctx: { chart: Chart; dataIndex: number }) => {
            const c = pick(ctx.dataIndex ?? 0);
            const area = ctx.chart.chartArea;
            if (!area) return c;
            const cx = (area.left + area.right) / 2;
            const cy = (area.top + area.bottom) / 2;
            const r = Math.min(area.right - area.left, area.bottom - area.top) / 2;
            const g = ctx.chart.ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
            g.addColorStop(0, rgba(c, 0.72));
            g.addColorStop(1, c);
            return g;
          };
        }
        if (this.type === "polarArea") {
          if (ds.borderColor == null) ds.borderColor = t.surface;
          if (ds.borderWidth == null) ds.borderWidth = 2;
        } else {
          // Floating, rounded segments: no border, a small gap, rounded caps.
          if (ds.borderWidth == null) ds.borderWidth = 0;
          if (ds.borderRadius == null) ds.borderRadius = 10;
          if (ds.spacing == null) ds.spacing = 3;
        }
        if (ds.hoverOffset == null) ds.hoverOffset = 8;
      } else if (this.type === "bar") {
        if (ds.backgroundColor == null) ds.backgroundColor = color;
        if (ds.borderRadius == null) ds.borderRadius = 6;
      } else if (this.type === "line") {
        if (ds.borderColor == null) ds.borderColor = color;
        if (ds.pointBackgroundColor == null) ds.pointBackgroundColor = color;
        if (ds.pointBorderColor == null) ds.pointBorderColor = t.surface;
        // Area fill: a soft vertical gradient from the series color to transparent.
        if (ds.fill && ds.backgroundColor == null) {
          ds.backgroundColor = (ctx: { chart: Chart }) => {
            const area = ctx.chart.chartArea;
            if (!area) return rgba(color, 0.15);
            const g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            g.addColorStop(0, rgba(color, 0.35));
            g.addColorStop(1, rgba(color, 0.02));
            return g;
          };
        }
      } else {
        if (ds.backgroundColor == null) ds.backgroundColor = rgba(color, 0.65);
        if (ds.borderColor == null) ds.borderColor = color;
      }
      return ds as unknown as ChartDataset;
    });
    return { labels: this.data.labels, datasets } as ChartData;
  }

  private buildConfig(): { data: ChartData; options: ChartOptions; plugins: Plugin[] } {
    const t = this.readTheme();
    const options = mergeDeep(this.themedOptions(t), this.options);
    if (this.motionQuery?.matches) options.animation = false;
    return {
      data: this.themedData(t),
      options,
      plugins: [
        ...(this.type === "doughnut" ? this.arcDecor(t) : []),
        { id: "fluidHtmlLegend", afterUpdate: (chart) => this.syncLegend(chart) }
      ]
    };
  }

  private render2d(): void {
    if (!this.canvas || !this.isConnected || this.chart) return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const { data, options, plugins } = this.buildConfig();
    const config: ChartConfiguration = { type: this.type, data, options, plugins };
    this.chart = new Chart(ctx, config);
    if (this.savedType === this.type && (this.savedDatasetVisibility || this.savedDataVisibility)) {
      this.savedDatasetVisibility?.forEach((visible, index) => {
        if (index < this.chart!.data.datasets.length)
          this.chart!.setDatasetVisibility(index, visible);
      });
      this.savedDataVisibility?.forEach((visible, index) => {
        if (
          index < (this.chart!.data.labels?.length ?? 0) &&
          visible !== this.chart!.getDataVisibility(index)
        ) {
          this.chart!.toggleDataVisibility(index);
        }
      });
      this.chart.update("none");
    }
    this.savedDatasetVisibility = undefined;
    this.savedDataVisibility = undefined;
    this.savedType = undefined;
  }

  private saveVisibility(): void {
    if (!this.chart) return;
    this.savedType = this.type;
    this.savedDatasetVisibility = this.chart.data.datasets.map((_, index) =>
      this.chart!.isDatasetVisible(index)
    );
    this.savedDataVisibility = (this.chart.data.labels ?? []).map((_, index) =>
      this.chart!.getDataVisibility(index)
    );
  }

  private syncLegend(chart: Chart): void {
    const legend = this.options.plugins?.legend;
    const next =
      legend?.display === false
        ? []
        : (chart.legend?.legendItems ?? []).map((item, index) => ({
            ...item,
            text:
              item.text || this.term("chartLegendItem", this.label, this.formatNumber(index + 1))
          }));
    if (!this.renderingChartUpdate) {
      this.legendItems = next;
      return;
    }
    this.pendingLegendItems = next;
    if (this.legendUpdateQueued) return;
    this.legendUpdateQueued = true;
    queueMicrotask(() => {
      this.legendUpdateQueued = false;
      const next = this.pendingLegendItems;
      this.pendingLegendItems = undefined;
      if (next && this.isConnected) this.legendItems = next;
    });
  }

  private activateLegend(event: MouseEvent, item: LegendItem): void {
    const chart = this.chart;
    const legend = chart?.legend;
    if (!chart || !legend || typeof legend.options.onClick !== "function") return;
    // Reuse the resolved callback, including pie/polar overrides and consumer
    // onClick. This is the same action as a real canvas legend click, not a
    // synthetic canvas event. Native buttons supply Enter and Space behavior.
    legend.options.onClick.call(
      legend,
      { type: "click", native: event, x: null, y: null },
      item,
      legend
    );
    this.syncLegend(chart);
    this.dispatchEvent(
      new CustomEvent("fluid-legend-change", {
        detail: {
          label: item.text,
          datasetIndex: item.datasetIndex,
          index: item.index,
          visible:
            item.index === undefined
              ? chart.isDatasetVisible(item.datasetIndex ?? 0)
              : chart.getDataVisibility(item.index)
        },
        bubbles: true,
        composed: true
      })
    );
  }

  private destroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat(this.localize.locale).format(value);
  }

  override render(): TemplateResult {
    return html`
      <div class="plot" part="plot" dir=${this.localize.dir}>
        <canvas part="base" role="img" aria-label=${this.label}>${this.label}</canvas>
      </div>
      ${this.legendItems.length
        ? html`
            <div
              class="legend"
              part="legend"
              role="group"
              aria-label=${this.label}
              dir=${this.localize.dir}
            >
              ${this.legendItems.map(
                (item) => html`
                  <button
                    part="legend-button"
                    type="button"
                    aria-pressed=${String(!item.hidden)}
                    @click=${(event: MouseEvent) => this.activateLegend(event, item)}
                  >
                    ${item.text}
                  </button>
                `
              )}
            </div>
          `
        : null}
      <slot name="fallback"></slot>
    `;
  }
}
