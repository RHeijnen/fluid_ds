import { FluidFormatBytes } from "./fluid-format-bytes.js";

if (!customElements.get("fluid-format-bytes")) {
  customElements.define("fluid-format-bytes", FluidFormatBytes);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-format-bytes": FluidFormatBytes;
  }
}
