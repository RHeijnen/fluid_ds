import { FluidVideoPlaylist } from "./fluid-video-playlist.js";

if (!customElements.get("fluid-video-playlist")) {
  customElements.define("fluid-video-playlist", FluidVideoPlaylist);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-video-playlist": FluidVideoPlaylist;
  }
}
