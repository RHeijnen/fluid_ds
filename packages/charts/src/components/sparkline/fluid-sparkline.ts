import { LitElement, html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import { Chart, registerables, type ChartDataset } from "chart.js";

Chart.register(...registerables);

/**
 * A compact, label-less line chart suited to embedding inline next to
 * a metric. Pass numeric values via the `values` property, the component
 * handles all the Chart.js setup.
 *
 * @summary Inline mini-line chart.
 *
 * @csspart base - The canvas element.
 *
 * @cssproperty --fluid-sparkline-color - Line/stroke color.
 * @cssproperty --fluid-sparkline-fill - Area fill color.
 * @cssproperty --fluid-sparkline-height - Default height.
 *
 * @uses-token --fluid-color-primary - Default stroke color.
 */
export class FluidSparkline extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      width: 8rem;
      height: var(--fluid-sparkline-height, 2rem);
      vertical-align: middle;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
  `;

  /** Numeric series. */
  @property({ attribute: false }) values: number[] = [];

  /** Show the area fill beneath the line. */
  @property({ type: Boolean, attribute: "no-fill" }) noFill = false;

  @query("canvas") private canvas!: HTMLCanvasElement;

  private chart: Chart | null = null;

  protected override firstUpdated(): void {
    this.draw();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("values") || changed.has("noFill")) {
      if (this.chart) {
        const ds = this.chart.data.datasets[0] as ChartDataset<"line">;
        ds.data = [...this.values];
        this.chart.data.labels = this.values.map((_, i) => i);
        ds.fill = !this.noFill;
        this.chart.update("none");
      } else this.draw();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.chart?.destroy();
    this.chart = null;
  }

  private draw(): void {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const styles = getComputedStyle(this);
    const stroke =
      styles.getPropertyValue("--fluid-sparkline-color").trim() ||
      styles.getPropertyValue("--fluid-color-primary").trim() ||
      "#3b82f6";
    const fill =
      styles.getPropertyValue("--fluid-sparkline-fill").trim() ||
      `${stroke}22`;
    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.values.map((_, i) => i),
        datasets: [
          {
            data: [...this.values],
            borderColor: stroke,
            backgroundColor: fill,
            borderWidth: 1.5,
            tension: 0.25,
            fill: !this.noFill,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { display: false },
          y: { display: false }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: false,
        elements: { point: { radius: 0 } }
      }
    });
  }

  override render(): TemplateResult {
    return html`<canvas part="base" aria-hidden="true"></canvas>`;
  }
}
