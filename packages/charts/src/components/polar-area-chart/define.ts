import { FluidPolarAreaChart } from "./fluid-polar-area-chart.js";

if (!customElements.get("fluid-polar-area-chart")) {
  customElements.define("fluid-polar-area-chart", FluidPolarAreaChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-polar-area-chart": FluidPolarAreaChart;
  }
}
