import { FluidAudio } from "./fluid-audio.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-audio")) {
  customElements.define("fluid-audio", FluidAudio);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-audio": FluidAudio;
  }
}
