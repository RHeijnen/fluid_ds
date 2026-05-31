import { registerAnimation } from "../registry.js";

registerAnimation("slide-left", {
  keyframes: [
    { opacity: 0, transform: "translateX(24px)" },
    { opacity: 1, transform: "translateX(0)" }
  ],
  defaults: {
    duration: 600,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards"
  }
});
