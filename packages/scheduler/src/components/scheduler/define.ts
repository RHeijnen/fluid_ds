import { FluidScheduler } from "./fluid-scheduler.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-scheduler")) {
  customElements.define("fluid-scheduler", FluidScheduler);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-scheduler": FluidScheduler;
  }
}
