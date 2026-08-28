import { FluidPieChart } from "./fluid-pie-chart.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-pie-chart")) {
  customElements.define("fluid-pie-chart", FluidPieChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-pie-chart": FluidPieChart;
  }
}
