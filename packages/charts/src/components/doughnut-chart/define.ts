import { FluidDoughnutChart } from "./fluid-doughnut-chart.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-doughnut-chart")) {
  customElements.define("fluid-doughnut-chart", FluidDoughnutChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-doughnut-chart": FluidDoughnutChart;
  }
}
