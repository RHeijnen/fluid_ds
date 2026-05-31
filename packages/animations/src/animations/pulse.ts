import { registerAnimation } from "../registry.js";

registerAnimation("pulse", {
  keyframes: [
    { transform: "scale(1)", offset: 0 },
    { transform: "scale(1.05)", offset: 0.5 },
    { transform: "scale(1)", offset: 1 }
  ],
  defaults: {
    duration: 1400,
    easing: "ease-in-out",
    iterations: Infinity
  }
});
