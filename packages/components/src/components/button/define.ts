import { FluidButton } from "./fluid-button.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-button")) {
  customElements.define("fluid-button", FluidButton);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-button": FluidButton;
  }
}
