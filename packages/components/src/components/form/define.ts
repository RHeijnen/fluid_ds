import { FluidForm } from "./fluid-form.js";

if (!customElements.get("fluid-form")) {
  customElements.define("fluid-form", FluidForm);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-form": FluidForm;
  }
}
