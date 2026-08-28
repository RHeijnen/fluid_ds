import { FluidAvatarGroup } from "./fluid-avatar-group.js";

if (typeof customElements !== "undefined" && !customElements.get("fluid-avatar-group")) {
  customElements.define("fluid-avatar-group", FluidAvatarGroup);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-avatar-group": FluidAvatarGroup;
  }
}
