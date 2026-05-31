import { registerAnimation } from "../registry.js";

registerAnimation("fade-out", {
  keyframes: [
    { opacity: 1, transform: "translateY(0)" },
    { opacity: 0, transform: "translateY(8px)" }
  ],
  defaults: {
    duration: 400,
    easing: "cubic-bezier(0.5, 0, 0.75, 0)",
    fill: "forwards"
  }
});
