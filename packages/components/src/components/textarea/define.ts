import { FluidTextarea } from "./fluid-textarea.js";

if (!customElements.get("fluid-textarea")) {
  customElements.define("fluid-textarea", FluidTextarea);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-textarea": FluidTextarea;
  }
}
