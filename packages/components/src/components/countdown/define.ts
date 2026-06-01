import { FluidCountdown } from "./fluid-countdown.js";

if (!customElements.get("fluid-countdown")) {
  customElements.define("fluid-countdown", FluidCountdown);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-countdown": FluidCountdown;
  }
}
