import { FluidDescriptionList } from "./fluid-description-list.js";
import { FluidDescriptionItem } from "./fluid-description-item.js";

if (!customElements.get("fluid-description-list"))
  customElements.define("fluid-description-list", FluidDescriptionList);
if (!customElements.get("fluid-description-item"))
  customElements.define("fluid-description-item", FluidDescriptionItem);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-description-list": FluidDescriptionList;
    "fluid-description-item": FluidDescriptionItem;
  }
}
