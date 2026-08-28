import { FluidSignaturePad } from "./fluid-signature-pad.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-signature-pad")) {
  customElements.define("fluid-signature-pad", FluidSignaturePad);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-signature-pad": FluidSignaturePad;
  }
}
