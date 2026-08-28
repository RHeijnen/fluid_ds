import { FluidDatePicker } from "./fluid-date-picker.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-date-picker")) customElements.define("fluid-date-picker", FluidDatePicker);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-date-picker": FluidDatePicker;
  }
}
