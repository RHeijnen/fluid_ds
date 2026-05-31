/**
 * Named animation registry.
 *
 * Components don't import keyframes directly, they ask the registry by
 * name. This lets consumers register their own animations under any name,
 * override defaults, or load on demand (mirrors `@fluid-ds/icons`).
 *
 * An animation is a pair: the keyframes (Web Animations API format) plus
 * a default options object. Per-element attributes can override any of
 * the defaults at play time.
 */

/**
 * Web Animations API keyframe input. A flat array of style frames is the
 * most common form; an object map keyed by property is also accepted by
 * Element.animate so we allow it too.
 */
export type FluidKeyframes = Keyframe[] | PropertyIndexedKeyframes;

export interface AnimationDef {
  /** Keyframes in Web Animations API format. */
  keyframes: FluidKeyframes;
  /** Default options applied unless the element attributes say otherwise. */
  defaults: KeyframeAnimationOptions;
}

const animations = new Map<string, AnimationDef>();
const listeners = new Set<(name: string) => void>();

/**
 * Register an animation under a name. Overwrites if the name is already
 * taken, useful for theming a default animation without forking the
 * package.
 */
export function registerAnimation(name: string, def: AnimationDef): void {
  animations.set(name, def);
  for (const listener of listeners) listener(name);
}

/** Look up a registered animation. */
export function getAnimation(name: string): AnimationDef | undefined {
  return animations.get(name);
}

/** True when an animation under this name has been registered. */
export function hasAnimation(name: string): boolean {
  return animations.has(name);
}

/** Every registered animation name in registration order. */
export function listAnimations(): string[] {
  return Array.from(animations.keys());
}

/**
 * Subscribe to registration events. Returns an unsubscribe function.
 * The controller uses this to (re-)play animations on elements whose
 * named animation arrived after the attribute was already set.
 */
export function onAnimationRegistered(listener: (name: string) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
