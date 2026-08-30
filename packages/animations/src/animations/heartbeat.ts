import { registerAnimation } from "../registry.js";

registerAnimation("heartbeat", {
  keyframes: [
    { transform: "scale(1)", offset: 0 },
    { transform: "scale(1.08)", offset: 0.14 },
    { transform: "scale(1)", offset: 0.28 },
    { transform: "scale(1.08)", offset: 0.42 },
    { transform: "scale(1)", offset: 0.56 },
    { transform: "scale(1)", offset: 1 }
  ],
  defaults: {
    duration: 1400,
    easing: "ease-in-out",
    iterations: Infinity
  }
});
