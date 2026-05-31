import { FluidAvatar } from "./fluid-avatar.js";

if (!customElements.get("fluid-avatar")) {
  customElements.define("fluid-avatar", FluidAvatar);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-avatar": FluidAvatar;
  }
}
