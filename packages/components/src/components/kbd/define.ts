import { FluidKbd } from "./fluid-kbd.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-kbd")) {
  customElements.define("fluid-kbd", FluidKbd);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-kbd": FluidKbd;
  }
}
