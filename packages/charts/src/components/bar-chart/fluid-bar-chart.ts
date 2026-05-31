import { createTypedChart } from "../../internal/typed-chart.js";

/**
 * Bar chart. Convenience wrapper around `<fluid-chart type="bar">`.
 *
 * @summary Bar chart.
 */
export const FluidBarChart = createTypedChart("bar");
export type FluidBarChart = InstanceType<typeof FluidBarChart>;
