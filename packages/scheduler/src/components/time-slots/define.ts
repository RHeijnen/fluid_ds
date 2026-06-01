import { FluidTimeSlots } from "./fluid-time-slots.js";

if (!customElements.get("fluid-time-slots")) {
  customElements.define("fluid-time-slots", FluidTimeSlots);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-time-slots": FluidTimeSlots;
  }
}
