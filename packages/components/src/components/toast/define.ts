import { FluidToast } from "./fluid-toast.js";
import { FluidToastItem } from "./fluid-toast-item.js";

if (!customElements.get("fluid-toast")) customElements.define("fluid-toast", FluidToast);
if (!customElements.get("fluid-toast-item"))
  customElements.define("fluid-toast-item", FluidToastItem);

declare global {
  interface HTMLElementTagNameMap {
    "fluid-toast": FluidToast;
    "fluid-toast-item": FluidToastItem;
  }
}
