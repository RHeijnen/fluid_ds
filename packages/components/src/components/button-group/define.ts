import { FluidButtonGroup } from "./fluid-button-group.js";

if (!customElements.get("fluid-button-group")) {
  customElements.define("fluid-button-group", FluidButtonGroup);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-button-group": FluidButtonGroup;
  }
}
