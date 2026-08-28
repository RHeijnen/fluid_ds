import { FluidTruncate } from "./fluid-truncate.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-truncate")) {
  customElements.define("fluid-truncate", FluidTruncate);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-truncate": FluidTruncate;
  }
}
