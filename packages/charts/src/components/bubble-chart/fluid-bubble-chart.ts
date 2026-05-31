import { createTypedChart } from "../../internal/typed-chart.js";

/**
 * Bubble chart.
 *
 * @summary Bubble chart.
 */
export const FluidBubbleChart = createTypedChart("bubble");
export type FluidBubbleChart = InstanceType<typeof FluidBubbleChart>;
