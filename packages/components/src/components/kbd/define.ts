import { FluidKbd } from "./fluid-kbd.js";

if (!customElements.get("fluid-kbd")) {
  customElements.define("fluid-kbd", FluidKbd);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-kbd": FluidKbd;
  }
}
