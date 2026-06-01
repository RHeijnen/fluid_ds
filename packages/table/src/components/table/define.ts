import { FluidTable } from "./fluid-table.js";

if (!customElements.get("fluid-table")) {
  customElements.define("fluid-table", FluidTable);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-table": FluidTable;
  }
}
