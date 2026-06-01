import { FluidHotkey } from "./fluid-hotkey.js";

if (!customElements.get("fluid-hotkey")) {
  customElements.define("fluid-hotkey", FluidHotkey);
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-hotkey": FluidHotkey;
  }
}
