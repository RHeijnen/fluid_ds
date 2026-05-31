import { FluidQrCode } from "./fluid-qr-code.js";

if (!customElements.get("fluid-qr-code")) {
  customElements.define("fluid-qr-code", FluidQrCode);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-qr-code": FluidQrCode;
  }
}
