import { registerAnimation } from "../registry.js";

registerAnimation("rubber-band", {
  keyframes: [
    { transform: "scale(1, 1)", offset: 0 },
    { transform: "scale(1.25, 0.75)", offset: 0.3 },
    { transform: "scale(0.75, 1.25)", offset: 0.4 },
    { transform: "scale(1.15, 0.85)", offset: 0.5 },
    { transform: "scale(0.95, 1.05)", offset: 0.65 },
    { transform: "scale(1.05, 0.95)", offset: 0.75 },
    { transform: "scale(1, 1)", offset: 1 }
  ],
  defaults: {
    duration: 900,
    easing: "ease-in-out"
  }
});
