import { FluidScatterChart } from "./fluid-scatter-chart.js";

if (!customElements.get("fluid-scatter-chart")) {
  customElements.define("fluid-scatter-chart", FluidScatterChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-scatter-chart": FluidScatterChart;
  }
}
