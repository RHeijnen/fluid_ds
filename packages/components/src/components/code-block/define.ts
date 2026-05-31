import { FluidCodeBlock } from "./fluid-code-block.js";

if (!customElements.get("fluid-code-block"))
  customElements.define("fluid-code-block", FluidCodeBlock);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-code-block": FluidCodeBlock;
  }
}
