import { FluidColumnMapper } from "./fluid-column-mapper.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-column-mapper")) {
  customElements.define("fluid-column-mapper", FluidColumnMapper);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-column-mapper": FluidColumnMapper;
  }
}
