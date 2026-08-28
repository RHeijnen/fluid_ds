import { FluidDialog } from "./fluid-dialog.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-dialog")) {
  customElements.define("fluid-dialog", FluidDialog);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-dialog": FluidDialog;
  }
}
