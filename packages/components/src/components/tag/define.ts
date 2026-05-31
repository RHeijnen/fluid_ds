import { FluidTag } from "./fluid-tag.js";

if (!customElements.get("fluid-tag")) {
  customElements.define("fluid-tag", FluidTag);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-tag": FluidTag;
  }
}
