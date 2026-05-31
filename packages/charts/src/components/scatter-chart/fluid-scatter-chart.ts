import { createTypedChart } from "../../internal/typed-chart.js";

/**
 * Scatter chart.
 *
 * @summary Scatter chart.
 */
export const FluidScatterChart = createTypedChart("scatter");
export type FluidScatterChart = InstanceType<typeof FluidScatterChart>;
