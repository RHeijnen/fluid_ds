import { LitElement } from "lit";

/**
 * Base class for every Fluid component.
 * Lets us add cross-cutting behavior (focus, theming, telemetry) in one place
 * without touching every component later.
 */
export class FluidElement extends LitElement {}
