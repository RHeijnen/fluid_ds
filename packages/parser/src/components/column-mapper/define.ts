import { FluidColumnMapper } from "./fluid-column-mapper.js";

if (!customElements.get("fluid-column-mapper")) {
  customElements.define("fluid-column-mapper", FluidColumnMapper);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-column-mapper": FluidColumnMapper;
  }
}
