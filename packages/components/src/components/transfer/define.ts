import { FluidTransfer } from "./fluid-transfer.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-transfer")) {
  customElements.define("fluid-transfer", FluidTransfer);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-transfer": FluidTransfer;
  }
}
