import { FluidMenu } from "./fluid-menu.js";
import { FluidMenuItem } from "./fluid-menu-item.js";
import { FluidMenuLabel } from "./fluid-menu-label.js";

if (!customElements.get("fluid-menu")) customElements.define("fluid-menu", FluidMenu);
if (!customElements.get("fluid-menu-item"))
  customElements.define("fluid-menu-item", FluidMenuItem);
if (!customElements.get("fluid-menu-label"))
  customElements.define("fluid-menu-label", FluidMenuLabel);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-menu": FluidMenu;
    "fluid-menu-item": FluidMenuItem;
    "fluid-menu-label": FluidMenuLabel;
  }
}
