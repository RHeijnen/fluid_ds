import { FluidTour } from "./fluid-tour.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-tour")) {
  customElements.define("fluid-tour", FluidTour);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-tour": FluidTour;
  }
}
