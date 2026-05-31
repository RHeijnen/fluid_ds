import { FluidBarChart } from "./fluid-bar-chart.js";

if (!customElements.get("fluid-bar-chart")) {
  customElements.define("fluid-bar-chart", FluidBarChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-bar-chart": FluidBarChart;
  }
}
