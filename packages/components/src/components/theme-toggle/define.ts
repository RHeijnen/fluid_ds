import { FluidThemeToggle } from "./fluid-theme-toggle.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-theme-toggle")) {
  customElements.define("fluid-theme-toggle", FluidThemeToggle);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-theme-toggle": FluidThemeToggle;
  }
}
