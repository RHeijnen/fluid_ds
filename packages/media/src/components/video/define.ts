import { FluidVideo } from "./fluid-video.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-video")) {
  customElements.define("fluid-video", FluidVideo);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-video": FluidVideo;
  }
}
