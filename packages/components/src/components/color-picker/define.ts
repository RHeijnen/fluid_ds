import { FluidColorPicker } from "./fluid-color-picker.js";

if (!customElements.get("fluid-color-picker")) {
  customElements.define("fluid-color-picker", FluidColorPicker);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-color-picker": FluidColorPicker;
  }
}
