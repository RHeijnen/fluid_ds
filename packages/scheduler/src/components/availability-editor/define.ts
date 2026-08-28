import { FluidAvailabilityEditor } from "./fluid-availability-editor.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-availability-editor")) {
  customElements.define("fluid-availability-editor", FluidAvailabilityEditor);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-availability-editor": FluidAvailabilityEditor;
  }
}
