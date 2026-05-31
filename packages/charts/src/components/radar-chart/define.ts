import { FluidRadarChart } from "./fluid-radar-chart.js";

if (!customElements.get("fluid-radar-chart")) {
  customElements.define("fluid-radar-chart", FluidRadarChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-radar-chart": FluidRadarChart;
  }
}
