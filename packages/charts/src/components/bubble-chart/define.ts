import { FluidBubbleChart } from "./fluid-bubble-chart.js";

if (!customElements.get("fluid-bubble-chart")) {
  customElements.define("fluid-bubble-chart", FluidBubbleChart);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-bubble-chart": FluidBubbleChart;
  }
}
