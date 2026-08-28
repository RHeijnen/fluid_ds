import { FluidPopconfirm } from "./fluid-popconfirm.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-popconfirm")) {
  customElements.define("fluid-popconfirm", FluidPopconfirm);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-popconfirm": FluidPopconfirm;
  }
}
