import { registerAnimation } from "../registry.js";

registerAnimation("shake", {
  keyframes: [
    { transform: "translateX(0)", offset: 0 },
    { transform: "translateX(-6px)", offset: 0.1 },
    { transform: "translateX(6px)", offset: 0.3 },
    { transform: "translateX(-4px)", offset: 0.5 },
    { transform: "translateX(4px)", offset: 0.7 },
    { transform: "translateX(-2px)", offset: 0.9 },
    { transform: "translateX(0)", offset: 1 }
  ],
  defaults: {
    duration: 500,
    easing: "ease-in-out"
  }
});
