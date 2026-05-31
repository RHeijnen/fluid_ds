import { FluidPopover } from "./fluid-popover.js";

if (!customElements.get("fluid-popover")) {
  customElements.define("fluid-popover", FluidPopover);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-popover": FluidPopover;
  }
}
