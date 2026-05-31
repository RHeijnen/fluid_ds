import { FluidSteps } from "./fluid-steps.js";
import { FluidStep } from "./fluid-step.js";

if (!customElements.get("fluid-steps")) customElements.define("fluid-steps", FluidSteps);
if (!customElements.get("fluid-step")) customElements.define("fluid-step", FluidStep);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-steps": FluidSteps;
    "fluid-step": FluidStep;
  }
}
