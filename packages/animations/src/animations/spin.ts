import { registerAnimation } from "../registry.js";

registerAnimation("spin", {
  keyframes: [
    { transform: "rotate(0deg)" },
    { transform: "rotate(360deg)" }
  ],
  defaults: {
    duration: 1200,
    easing: "linear",
    iterations: Infinity
  }
});
