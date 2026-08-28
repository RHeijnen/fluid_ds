import { FluidVideoPlaylist } from "./fluid-video-playlist.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-video-playlist")) {
  customElements.define("fluid-video-playlist", FluidVideoPlaylist);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-video-playlist": FluidVideoPlaylist;
  }
}
