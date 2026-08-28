import { FluidInclude } from "./fluid-include.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-include")) {
  customElements.define("fluid-include", FluidInclude);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-include": FluidInclude;
  }
}
