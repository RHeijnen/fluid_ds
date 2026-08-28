import { FluidTable } from "./fluid-table.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-table")) {
  customElements.define("fluid-table", FluidTable);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-table": FluidTable;
  }
}
