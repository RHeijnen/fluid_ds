import { registerAnimation } from "../registry.js";

registerAnimation("bounce", {
  keyframes: [
    { transform: "translateY(0)", offset: 0 },
    { transform: "translateY(-16px)", offset: 0.3 },
    { transform: "translateY(0)", offset: 0.55 },
    { transform: "translateY(-8px)", offset: 0.75 },
    { transform: "translateY(0)", offset: 0.9 }
  ],
  defaults: {
    duration: 900,
    easing: "ease-out"
  }
});
