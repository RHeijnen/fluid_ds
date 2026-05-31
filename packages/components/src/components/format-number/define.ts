import { FluidFormatNumber } from "./fluid-format-number.js";

if (!customElements.get("fluid-format-number")) {
  customElements.define("fluid-format-number", FluidFormatNumber);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-format-number": FluidFormatNumber;
  }
}
