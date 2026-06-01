import { FluidAudio } from "./fluid-audio.js";

if (!customElements.get("fluid-audio")) {
  customElements.define("fluid-audio", FluidAudio);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-audio": FluidAudio;
  }
}
