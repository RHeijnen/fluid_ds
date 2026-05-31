import { createTypedChart } from "../../internal/typed-chart.js";

/**
 * Line chart.
 *
 * @summary Line chart.
 */
export const FluidLineChart = createTypedChart("line");
export type FluidLineChart = InstanceType<typeof FluidLineChart>;
