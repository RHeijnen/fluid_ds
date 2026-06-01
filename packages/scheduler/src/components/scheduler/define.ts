import { FluidScheduler } from "./fluid-scheduler.js";

if (!customElements.get("fluid-scheduler")) {
  customElements.define("fluid-scheduler", FluidScheduler);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-scheduler": FluidScheduler;
  }
}
