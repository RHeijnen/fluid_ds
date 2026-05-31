import { createTypedChart } from "../../internal/typed-chart.js";

/**
 * Pie chart.
 *
 * @summary Pie chart.
 */
export const FluidPieChart = createTypedChart("pie");
export type FluidPieChart = InstanceType<typeof FluidPieChart>;
