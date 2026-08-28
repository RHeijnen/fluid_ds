import { FluidDateRangePicker } from "./fluid-date-range-picker.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-date-range-picker"))
  customElements.define("fluid-date-range-picker", FluidDateRangePicker);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-date-range-picker": FluidDateRangePicker;
  }
}
