import { FluidDropzone } from "./fluid-dropzone.js";

if (!customElements.get("fluid-dropzone")) {
  customElements.define("fluid-dropzone", FluidDropzone);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-dropzone": FluidDropzone;
  }
}
