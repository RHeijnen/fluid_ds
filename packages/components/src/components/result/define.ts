import { FluidResult } from "./fluid-result.js";

if (!customElements.get("fluid-result")) {
  customElements.define("fluid-result", FluidResult);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-result": FluidResult;
  }
}
