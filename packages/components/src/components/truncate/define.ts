import { FluidTruncate } from "./fluid-truncate.js";

if (!customElements.get("fluid-truncate")) {
  customElements.define("fluid-truncate", FluidTruncate);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-truncate": FluidTruncate;
  }
}
