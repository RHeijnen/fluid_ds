/**
 * Analytics demo: a chart-heavy overview page. Every chart is a
 * @fluid-ds/charts element reading the live brand tokens, so the whole
 * board recolors from the theme picker with zero chart configuration.
 */
import "./shared/register-fluid.js";
import "@fluid-ds/charts/define/radar-chart";
import "@fluid-ds/charts/define/polar-area-chart";
import { mountShell } from "./shared/shell.js";
import { mountDesignOverlay } from "./shared/design-overlay.js";

const main = mountShell({ title: "Analytics", currentRoute: "analytics" });
mountDesignOverlay();

main.innerHTML = `
  <section class="demo-page demo-page-wide fluid-glass-panel">
    <header class="demo-page-head">
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="../">Demos</fluid-breadcrumb-item>
        <fluid-breadcrumb-item current>Analytics</fluid-breadcrumb-item>
      </fluid-breadcrumb>
      <h1>Q3 at a glance</h1>
      <p class="muted-lead">
        Four chart types and a sparkline row from <code>@fluid-ds/charts</code>. Flip the brand or
        scheme in the top bar: every canvas repaints from the same tokens.
      </p>
    </header>

    <div class="analytics-kpis">
      <fluid-card><span class="kpi-label">Revenue</span><span class="kpi-num">€1.24M</span><fluid-sparkline id="spark-rev"></fluid-sparkline></fluid-card>
      <fluid-card><span class="kpi-label">New customers</span><span class="kpi-num">318</span><fluid-sparkline id="spark-cust"></fluid-sparkline></fluid-card>
      <fluid-card><span class="kpi-label">Churn</span><span class="kpi-num">1.9%</span><fluid-sparkline id="spark-churn"></fluid-sparkline></fluid-card>
      <fluid-card><span class="kpi-label">NPS</span><span class="kpi-num">61</span><fluid-sparkline id="spark-nps"></fluid-sparkline></fluid-card>
    </div>

    <div class="analytics-grid">
      <fluid-card>
        <h3 slot="header">Revenue by region</h3>
        <fluid-bar-chart id="chart-regions" style="--fluid-chart-height: 260px;"></fluid-bar-chart>
      </fluid-card>
      <fluid-card>
        <h3 slot="header">Team capabilities</h3>
        <fluid-radar-chart id="chart-radar" style="--fluid-chart-height: 260px;"></fluid-radar-chart>
      </fluid-card>
      <fluid-card>
        <h3 slot="header">Traffic mix</h3>
        <fluid-polar-area-chart id="chart-polar" style="--fluid-chart-height: 260px;"></fluid-polar-area-chart>
      </fluid-card>
      <fluid-card>
        <h3 slot="header">Weekly signups</h3>
        <fluid-line-chart id="chart-signups" style="--fluid-chart-height: 260px;"></fluid-line-chart>
      </fluid-card>
    </div>
  </section>
`;

type ChartHost = HTMLElement & { data?: unknown; options?: unknown };
const feed = (id: string, data: unknown, options?: unknown): void => {
  const el = document.getElementById(id) as ChartHost | null;
  if (!el) return;
  el.data = data;
  if (options) el.options = options;
};

const noLegend = { plugins: { legend: { display: false } } };

/** Sparklines take a plain numeric `values` property, not a chart config. */
const spark = (id: string, values: number[]): void => {
  const el = document.getElementById(id) as (HTMLElement & { values?: number[] }) | null;
  if (el) el.values = values;
};
spark("spark-rev", [72, 78, 74, 86, 92, 88, 104]);
spark("spark-cust", [22, 25, 31, 28, 36, 41, 44]);
spark("spark-churn", [3.1, 2.8, 2.9, 2.4, 2.2, 2.0, 1.9]);
spark("spark-nps", [48, 52, 50, 55, 58, 60, 61]);

feed(
  "chart-regions",
  {
    labels: ["EMEA", "Americas", "APAC", "LATAM"],
    datasets: [
      { label: "Q2", data: [280, 340, 190, 90] },
      { label: "Q3", data: [340, 385, 260, 125] }
    ]
  },
  undefined
);

feed("chart-radar", {
  labels: ["Frontend", "Backend", "Infra", "Design", "Data", "QA"],
  datasets: [
    { label: "Today", data: [8, 7, 6, 7, 5, 6] },
    { label: "Target", data: [9, 8, 8, 8, 7, 8] }
  ]
});

feed(
  "chart-polar",
  {
    labels: ["Direct", "Search", "Referral", "Social", "Email"],
    datasets: [{ data: [34, 28, 17, 12, 9] }]
  },
  noLegend
);

feed(
  "chart-signups",
  {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    datasets: [
      { label: "Signups", data: [140, 152, 148, 171, 165, 189, 197, 214], tension: 0.4, fill: true }
    ]
  },
  noLegend
);
