import { FluidVideo } from "./fluid-video.js";

if (!customElements.get("fluid-video")) {
  customElements.define("fluid-video", FluidVideo);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-video": FluidVideo;
  }
}
