import { registerAnimation } from "../registry.js";

registerAnimation("fade-in", {
  keyframes: [
    { opacity: 0, transform: "translateY(8px)" },
    { opacity: 1, transform: "translateY(0)" }
  ],
  defaults: {
    duration: 500,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards"
  }
});
