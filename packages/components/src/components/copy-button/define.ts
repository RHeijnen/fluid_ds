import { FluidCopyButton } from "./fluid-copy-button.js";

if (!customElements.get("fluid-copy-button")) {
  customElements.define("fluid-copy-button", FluidCopyButton);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-copy-button": FluidCopyButton;
  }
}
