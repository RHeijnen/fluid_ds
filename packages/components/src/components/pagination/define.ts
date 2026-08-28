import { FluidPagination } from "./fluid-pagination.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-pagination")) {
  customElements.define("fluid-pagination", FluidPagination);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-pagination": FluidPagination;
  }
}
