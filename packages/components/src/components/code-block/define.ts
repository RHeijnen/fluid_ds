import { FluidCodeBlock } from "./fluid-code-block.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-code-block"))
  customElements.define("fluid-code-block", FluidCodeBlock);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-code-block": FluidCodeBlock;
  }
}
