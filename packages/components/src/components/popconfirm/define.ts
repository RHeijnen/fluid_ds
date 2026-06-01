import { FluidPopconfirm } from "./fluid-popconfirm.js";

if (!customElements.get("fluid-popconfirm")) {
  customElements.define("fluid-popconfirm", FluidPopconfirm);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-popconfirm": FluidPopconfirm;
  }
}
