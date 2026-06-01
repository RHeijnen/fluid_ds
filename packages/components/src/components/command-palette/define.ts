import { FluidCommandPalette } from "./fluid-command-palette.js";

if (!customElements.get("fluid-command-palette")) {
  customElements.define("fluid-command-palette", FluidCommandPalette);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-command-palette": FluidCommandPalette;
  }
}
