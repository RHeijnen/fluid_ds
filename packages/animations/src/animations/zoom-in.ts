import { registerAnimation } from "../registry.js";

registerAnimation("zoom-in", {
  keyframes: [
    { opacity: 0, transform: "scale(0.5)" },
    { opacity: 1, transform: "scale(1)" }
  ],
  defaults: {
    duration: 500,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "forwards"
  }
});
