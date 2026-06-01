/**
 * @fluid-ds/scheduler public API.
 *
 * The pure availability engine (types + slot generation) is exported here so it
 * can be used on its own, including server-side, without registering any custom
 * elements. Component classes are added as the package grows.
 */
export * from "./internal/availability.js";

export { FluidTimeSlots } from "./components/time-slots/fluid-time-slots.js";
export { FluidScheduler } from "./components/scheduler/fluid-scheduler.js";
export { FluidAvailabilityEditor } from "./components/availability-editor/fluid-availability-editor.js";
