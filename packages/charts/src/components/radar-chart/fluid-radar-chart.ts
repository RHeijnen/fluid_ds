import { createTypedChart } from "../../internal/typed-chart.js";

/**
 * Radar chart.
 *
 * @summary Radar chart.
 */
export const FluidRadarChart = createTypedChart("radar");
export type FluidRadarChart = InstanceType<typeof FluidRadarChart>;
