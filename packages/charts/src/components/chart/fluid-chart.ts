import { LitElement, html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import {
  Chart,
  registerables,
  type ChartConfiguration,
  type ChartData,
  type ChartDataset,
  type ChartOptions,
  type ChartType,
  type Plugin
} from "chart.js";

Chart.register(...registerables);

/** Cartesian types get x/y grid + tick theming; radial/arc types don't. */
const CARTESIAN = new Set<ChartType>(["line", "bar", "scatter", "bubble"]);

/** #rgb / #rrggbb → rgba() string (passes through anything non-hex). */
function rgba(hex: string, alpha: number): string {
  const m = hex.trim().replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
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
      ov && typeof ov === "object" && !Array.isArray(ov) && bv && typeof bv === "object" && !Array.isArray(bv)
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
 * @csspart base - The canvas element.
 *
 * @cssproperty --fluid-chart-height - Default height of the chart. Falls back to 16rem.
 *
 * @uses-token --fluid-accent-base - Primary series + area-fill gradient.
 * @uses-token --fluid-color-brand-300 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-400 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-500 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-600 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-700 - Categorical series palette (brand ramp).
 * @uses-token --fluid-color-brand-800 - Categorical series palette (brand ramp).
 * @uses-token --fluid-text-primary - Legend text + tooltip foreground.
 * @uses-token --fluid-text-secondary - Axis ticks + default text color.
 * @uses-token --fluid-border-default - Grid lines + axis borders.
 * @uses-token --fluid-surface-base - Arc/segment borders + tooltip text on the inverse bg.
 * @uses-token --fluid-font-family-sans - All chart text.
 */
export class FluidChart extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: var(--fluid-chart-height, 16rem);
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  /** Chart type. */
  @property() type: ChartType = "bar";

  /** Chart.js data object. */
  @property({ attribute: false }) data: ChartData = { labels: [], datasets: [] };

  /** Chart.js options object. Merged over the Fluid theme (these win). */
  @property({ attribute: false }) options: ChartOptions = {};

  @query("canvas") private canvas!: HTMLCanvasElement;

  private chart: Chart | null = null;
  private themeObserver?: MutationObserver;

  override connectedCallback(): void {
    super.connectedCallback();
    // Re-theme when the page scheme or brand flips (attributes on <html>).
    this.themeObserver = new MutationObserver(() => this.retheme());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-fluid-theme", "data-fluid-brand", "data-fluid-conformance"]
    });
  }

  protected override firstUpdated(): void {
    this.render2d();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("type")) {
      this.destroy();
      this.render2d();
    } else if ((changed.has("data") || changed.has("options")) && this.chart) {
      const { data, options } = this.buildConfig();
      this.chart.data = data;
      this.chart.options = options;
      this.chart.update();
    } else if (changed.has("data") || changed.has("options")) {
      this.render2d();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.themeObserver?.disconnect();
    this.destroy();
  }

  /** Underlying Chart.js instance (after first render). */
  get instance(): Chart | null {
    return this.chart;
  }

  /** Full re-theme (re-reads tokens, rebuilds gradients). */
  private retheme(): void {
    if (!this.chart) return;
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
    const label =
      center && typeof center === "object" && "label" in center
        ? String((center as { label: unknown }).label)
        : "Total";
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
        afterDatasetsDraw(chart) {
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
          c.fillText(total.toLocaleString(), cx, cy - 8);
          c.fillStyle = t.muted;
          c.font = `500 13px ${t.font}`;
          c.fillText(label, cx, cy + 15);
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
    return {
      data: this.themedData(t),
      options: mergeDeep(this.themedOptions(t), this.options),
      plugins: this.type === "doughnut" ? this.arcDecor(t) : []
    };
  }

  private render2d(): void {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const { data, options, plugins } = this.buildConfig();
    const config: ChartConfiguration = { type: this.type, data, options, plugins };
    this.chart = new Chart(ctx, config);
  }

  private destroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  override render(): TemplateResult {
    return html`<canvas part="base"></canvas>`;
  }
}
