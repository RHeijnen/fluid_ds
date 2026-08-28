import { FluidDropzone } from "./fluid-dropzone.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-dropzone")) {
  customElements.define("fluid-dropzone", FluidDropzone);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-dropzone": FluidDropzone;
  }
}
