import { createTypedChart } from "../../internal/typed-chart.js";

/**
 * Doughnut chart.
 *
 * @summary Doughnut chart.
 */
export const FluidDoughnutChart = createTypedChart("doughnut");
export type FluidDoughnutChart = InstanceType<typeof FluidDoughnutChart>;
