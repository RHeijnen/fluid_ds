import { FluidMaskedInput } from "./fluid-masked-input.js";

if (!customElements.get("fluid-masked-input")) {
  customElements.define("fluid-masked-input", FluidMaskedInput);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-masked-input": FluidMaskedInput;
  }
}
