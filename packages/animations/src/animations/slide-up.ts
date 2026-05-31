import { registerAnimation } from "../registry.js";

registerAnimation("slide-up", {
  keyframes: [
    { opacity: 0, transform: "translateY(24px)" },
    { opacity: 1, transform: "translateY(0)" }
  ],
  defaults: {
    duration: 600,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards"
  }
});
