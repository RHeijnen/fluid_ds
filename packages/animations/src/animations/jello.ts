import { registerAnimation } from "../registry.js";

registerAnimation("jello", {
  keyframes: [
    { transform: "skew(0deg, 0deg)", offset: 0 },
    { transform: "skew(-10deg, -6deg)", offset: 0.2 },
    { transform: "skew(7deg, 4deg)", offset: 0.35 },
    { transform: "skew(-5deg, -3deg)", offset: 0.5 },
    { transform: "skew(3deg, 2deg)", offset: 0.65 },
    { transform: "skew(-1.5deg, -1deg)", offset: 0.8 },
    { transform: "skew(0deg, 0deg)", offset: 1 }
  ],
  defaults: {
    duration: 900,
    easing: "ease-in-out"
  }
});
