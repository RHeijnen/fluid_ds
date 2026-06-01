import { FluidTimePicker } from "./fluid-time-picker.js";

if (!customElements.get("fluid-time-picker")) customElements.define("fluid-time-picker", FluidTimePicker);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-time-picker": FluidTimePicker;
  }
}
