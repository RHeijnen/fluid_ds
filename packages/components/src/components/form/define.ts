import { FluidForm } from "./fluid-form.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-form")) {
  customElements.define("fluid-form", FluidForm);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-form": FluidForm;
  }
}
