import { FluidOtp } from "./fluid-otp.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-otp")) {
  customElements.define("fluid-otp", FluidOtp);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-otp": FluidOtp;
  }
}
