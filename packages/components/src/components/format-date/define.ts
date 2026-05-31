import { FluidFormatDate } from "./fluid-format-date.js";

if (!customElements.get("fluid-format-date")) {
  customElements.define("fluid-format-date", FluidFormatDate);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-format-date": FluidFormatDate;
  }
}
