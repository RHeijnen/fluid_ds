import { FluidProgressBar } from "./fluid-progress-bar.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-progress-bar")) {
  customElements.define("fluid-progress-bar", FluidProgressBar);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-progress-bar": FluidProgressBar;
  }
}
