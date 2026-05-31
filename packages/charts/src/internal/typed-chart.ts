import type { ChartType } from "chart.js";
import { FluidChart } from "../components/chart/fluid-chart.js";

/**
 * Factory that produces a subclass of `FluidChart` locked to a specific
 * chart type. Used to define `fluid-bar-chart`, `fluid-line-chart`, etc.
 */
export function createTypedChart(chartType: ChartType): typeof FluidChart {
  return class extends FluidChart {
    constructor() {
      super();
      this.type = chartType;
    }
  };
}
