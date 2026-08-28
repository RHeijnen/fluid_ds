import { FluidFormatDate } from "./fluid-format-date.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-format-date")) {
  customElements.define("fluid-format-date", FluidFormatDate);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-format-date": FluidFormatDate;
  }
}
