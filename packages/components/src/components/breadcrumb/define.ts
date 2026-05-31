import { FluidBreadcrumb } from "./fluid-breadcrumb.js";
import { FluidBreadcrumbItem } from "./fluid-breadcrumb-item.js";

if (!customElements.get("fluid-breadcrumb"))
  customElements.define("fluid-breadcrumb", FluidBreadcrumb);
if (!customElements.get("fluid-breadcrumb-item"))
  customElements.define("fluid-breadcrumb-item", FluidBreadcrumbItem);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-breadcrumb": FluidBreadcrumb;
    "fluid-breadcrumb-item": FluidBreadcrumbItem;
  }
}
