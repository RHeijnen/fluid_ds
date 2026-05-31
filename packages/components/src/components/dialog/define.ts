import { FluidDialog } from "./fluid-dialog.js";

if (!customElements.get("fluid-dialog")) {
  customElements.define("fluid-dialog", FluidDialog);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-dialog": FluidDialog;
  }
}
