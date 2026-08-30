import { registerAnimation } from "../registry.js";

registerAnimation("wobble", {
  keyframes: [
    { transform: "translateX(0) rotate(0deg)", offset: 0 },
    { transform: "translateX(-12px) rotate(-4deg)", offset: 0.15 },
    { transform: "translateX(10px) rotate(3deg)", offset: 0.3 },
    { transform: "translateX(-8px) rotate(-2deg)", offset: 0.45 },
    { transform: "translateX(6px) rotate(1.5deg)", offset: 0.6 },
    { transform: "translateX(-4px) rotate(-1deg)", offset: 0.75 },
    { transform: "translateX(0) rotate(0deg)", offset: 1 }
  ],
  defaults: {
    duration: 800,
    easing: "ease-in-out"
  }
});
