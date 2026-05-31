import { FluidRelativeTime } from "./fluid-relative-time.js";

if (!customElements.get("fluid-relative-time")) {
  customElements.define("fluid-relative-time", FluidRelativeTime);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-relative-time": FluidRelativeTime;
  }
}
