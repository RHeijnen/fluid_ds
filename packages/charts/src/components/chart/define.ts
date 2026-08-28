import { FluidChart } from "./fluid-chart.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-chart")) {
  customElements.define("fluid-chart", FluidChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-chart": FluidChart;
  }
}
