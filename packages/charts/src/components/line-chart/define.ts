import { FluidLineChart } from "./fluid-line-chart.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-line-chart")) {
  customElements.define("fluid-line-chart", FluidLineChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-line-chart": FluidLineChart;
  }
}
