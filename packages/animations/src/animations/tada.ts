import { registerAnimation } from "../registry.js";

registerAnimation("tada", {
  keyframes: [
    { transform: "scale(1) rotate(0deg)", offset: 0 },
    { transform: "scale(0.92) rotate(-3deg)", offset: 0.15 },
    { transform: "scale(1.08) rotate(3deg)", offset: 0.35 },
    { transform: "scale(1.08) rotate(-3deg)", offset: 0.5 },
    { transform: "scale(1.08) rotate(3deg)", offset: 0.65 },
    { transform: "scale(1.08) rotate(-2deg)", offset: 0.8 },
    { transform: "scale(1) rotate(0deg)", offset: 1 }
  ],
  defaults: {
    duration: 900,
    easing: "ease-in-out"
  }
});
