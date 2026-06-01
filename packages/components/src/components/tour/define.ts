import { FluidTour } from "./fluid-tour.js";

if (!customElements.get("fluid-tour")) {
  customElements.define("fluid-tour", FluidTour);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-tour": FluidTour;
  }
}
