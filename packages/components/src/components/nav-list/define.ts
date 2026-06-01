import { FluidNavList } from "./fluid-nav-list.js";
import { FluidNavItem } from "./fluid-nav-item.js";

if (!customElements.get("fluid-nav-list"))
  customElements.define("fluid-nav-list", FluidNavList);
if (!customElements.get("fluid-nav-item"))
  customElements.define("fluid-nav-item", FluidNavItem);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-nav-list": FluidNavList;
    "fluid-nav-item": FluidNavItem;
  }
}
