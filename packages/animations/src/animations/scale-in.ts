import { registerAnimation } from "../registry.js";

registerAnimation("scale-in", {
  keyframes: [
    { opacity: 0, transform: "scale(0.85)" },
    { opacity: 1, transform: "scale(1)" }
  ],
  defaults: {
    duration: 400,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards"
  }
});
