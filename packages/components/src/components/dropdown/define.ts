import { FluidDropdown } from "./fluid-dropdown.js";
import { FluidDropdownItem } from "./fluid-dropdown-item.js";

if (!customElements.get("fluid-dropdown")) customElements.define("fluid-dropdown", FluidDropdown);
if (!customElements.get("fluid-dropdown-item"))
  customElements.define("fluid-dropdown-item", FluidDropdownItem);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-dropdown": FluidDropdown;
    "fluid-dropdown-item": FluidDropdownItem;
  }
}
