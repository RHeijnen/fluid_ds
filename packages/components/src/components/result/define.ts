import { FluidResult } from "./fluid-result.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-result")) {
  customElements.define("fluid-result", FluidResult);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-result": FluidResult;
  }
}
