import { registerAnimation } from "../registry.js";

registerAnimation("flash", {
  keyframes: [
    { opacity: 1, offset: 0 },
    { opacity: 0, offset: 0.25 },
    { opacity: 1, offset: 0.5 },
    { opacity: 0, offset: 0.75 },
    { opacity: 1, offset: 1 }
  ],
  defaults: {
    duration: 1000,
    easing: "ease-in-out"
  }
});
