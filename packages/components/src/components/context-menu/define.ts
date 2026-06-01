import { FluidContextMenu } from "./fluid-context-menu.js";

if (!customElements.get("fluid-context-menu"))
  customElements.define("fluid-context-menu", FluidContextMenu);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-context-menu": FluidContextMenu;
  }
}
