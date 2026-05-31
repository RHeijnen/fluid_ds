/**
 * @fluid-ds/animations, attribute-driven animation system.
 *
 * Public API:
 *   - `registerAnimation(name, def)`: add or replace a named animation
 *   - `getAnimation(name)`: look one up
 *   - `hasAnimation(name)` / `listAnimations()`: introspection
 *   - `onAnimationRegistered(fn)`: subscribe to new registrations
 *   - `startAnimationController()`: boot the global controller
 *   - `playElementAnimation(el)` / `stopElementAnimation(el)`: imperative
 *
 * Side-effect entries (not re-exported here, but available):
 *   - `@fluid-ds/animations/define/controller`: boots the controller
 *   - `@fluid-ds/animations/register-defaults`: registers the 12 defaults
 *   - `@fluid-ds/animations/animations/<name>`: register one at a time
 */

export {
  registerAnimation,
  getAnimation,
  hasAnimation,
  listAnimations,
  onAnimationRegistered,
  type AnimationDef,
  type FluidKeyframes
} from "./registry.js";

export {
  startAnimationController,
  playElementAnimation,
  stopElementAnimation
} from "./controller.js";
