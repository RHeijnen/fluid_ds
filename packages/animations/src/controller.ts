/**
 * Global animation controller.
 *
 * A singleton observer that watches the document for elements carrying
 * `data-fluid-animation` and runs the matching registered animation via
 * the Web Animations API. One controller handles arbitrarily many
 * animated elements, there's no per-element listener cost.
 *
 * Triggers:
 *   - `mount`: play as soon as the element shows up (default)
 *   - `in-view`: play when the element first intersects the viewport
 *   - `hover`: play on pointerenter
 *   - `click`: play on click
 *   - `manual`: never play automatically; call `playElementAnimation(el)`
 *
 * Per-element option overrides:
 *   - `data-fluid-animation-duration`   in milliseconds
 *   - `data-fluid-animation-delay`      in milliseconds
 *   - `data-fluid-animation-easing`     any CSS easing function
 *   - `data-fluid-animation-iterations` integer, or "infinite"
 *
 * Reduced-motion: respects the user's `prefers-reduced-motion: reduce`
 * setting by collapsing every animation to a single 0ms tick that lands
 * on the final frame. Authors get the static end state without motion.
 */

import { getAnimation, onAnimationRegistered, type AnimationDef } from "./registry.js";

const ATTR = "data-fluid-animation";
const ATTR_TRIGGER = "data-fluid-animation-trigger";
const ATTR_DURATION = "data-fluid-animation-duration";
const ATTR_DELAY = "data-fluid-animation-delay";
const ATTR_EASING = "data-fluid-animation-easing";
const ATTR_ITERATIONS = "data-fluid-animation-iterations";

type Trigger = "mount" | "in-view" | "hover" | "click" | "manual";
const TRIGGERS = new Set<Trigger>(["mount", "in-view", "hover", "click", "manual"]);

/** Tracks the currently-running animation per element (so we can cancel/restart). */
const running = new WeakMap<Element, Animation>();
/** Lazily created so importing the package in an SSR process needs no DOM. */
let inViewObserver: IntersectionObserver | undefined;
/** Elements that already played a one-shot trigger; don't re-play on attribute echo. */
const settled = new WeakSet<Element>();

const bootstrappedRoots = new WeakSet<Document | ShadowRoot>();

/**
 * Boot the controller. Idempotent, calling it multiple times is fine
 * (the second call is a no-op). Typically driven by the side-effect
 * import of `@fluid-ds/animations/define/controller`.
 */
export function startAnimationController(root?: Document | ShadowRoot): void {
  if (!root) {
    if (typeof document === "undefined") return;
    root = document;
  }
  if (bootstrappedRoots.has(root)) return;
  bootstrappedRoots.add(root);

  // Initial pass over whatever's already in the DOM.
  for (const el of root.querySelectorAll<HTMLElement>(`[${ATTR}]`)) {
    handleElement(el);
  }

  // Watch for future additions + attribute flips so toggling the
  // animation name (or trigger) live just works.
  const mo = new MutationObserver((records) => {
    for (const rec of records) {
      if (rec.type === "attributes" && rec.target instanceof HTMLElement) {
        if (rec.attributeName?.startsWith("data-fluid-animation")) {
          // Only a real value CHANGE allows a re-play; a same-value echo
          // (setAttribute with the existing value) still fires a mutation but
          // must not retrigger a settled one-shot animation.
          const newValue = rec.attributeName ? rec.target.getAttribute(rec.attributeName) : null;
          if (rec.oldValue !== newValue) settled.delete(rec.target);
          handleElement(rec.target);
        }
      } else if (rec.type === "childList") {
        for (const node of rec.removedNodes) {
          if (node instanceof HTMLElement) {
            cleanupElement(node);
            for (const child of node.querySelectorAll<HTMLElement>(`[${ATTR}]`)) {
              cleanupElement(child);
            }
          }
        }
        for (const node of rec.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.hasAttribute(ATTR)) handleElement(node);
            for (const child of node.querySelectorAll<HTMLElement>(`[${ATTR}]`)) {
              handleElement(child);
            }
          }
        }
      }
    }
  });
  mo.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [ATTR, ATTR_TRIGGER, ATTR_DURATION, ATTR_DELAY, ATTR_EASING, ATTR_ITERATIONS]
  });

  // Re-scan when a new animation gets registered, elements that asked
  // for it before it existed can now run.
  onAnimationRegistered(() => {
    for (const el of root.querySelectorAll<HTMLElement>(`[${ATTR}]`)) {
      if (!running.has(el)) handleElement(el);
    }
  });
}

/** Imperative trigger, runs the configured animation on this element right now. */
export function playElementAnimation(el: HTMLElement): Animation | undefined {
  const name = el.getAttribute(ATTR);
  if (!name) return undefined;
  const def = getAnimation(name);
  if (!def) return undefined;
  return play(el, def);
}

/** Cancel the running animation (if any) on this element. */
export function stopElementAnimation(el: HTMLElement): void {
  const a = running.get(el);
  if (a) {
    a.cancel();
    running.delete(el);
  }
}

function handleElement(el: HTMLElement): void {
  const name = el.getAttribute(ATTR);
  if (!name) {
    stopElementAnimation(el);
    return;
  }
  const def = getAnimation(name);
  if (!def) return; // animation not registered yet, wait for onAnimationRegistered
  const requestedTrigger = el.getAttribute(ATTR_TRIGGER) ?? "mount";
  const trigger: Trigger = TRIGGERS.has(requestedTrigger as Trigger)
    ? (requestedTrigger as Trigger)
    : "mount";

  if (trigger !== "in-view") inViewObserver?.unobserve(el);

  switch (trigger) {
    case "manual":
      return;
    case "mount":
      if (!settled.has(el)) {
        settled.add(el);
        play(el, def);
      }
      return;
    case "in-view":
      if (!settled.has(el)) {
        const observer = getInViewObserver();
        if (observer) observer.observe(el);
        else {
          settled.add(el);
          play(el, def);
        }
      }
      return;
    case "hover":
      // Resolve the current def at fire time: the listener is bound once, but
      // the animation name can change live, so we must not capture `def` here.
      attachOnce(el, "pointerenter", "hover", () => {
        const d = getAnimation(el.getAttribute(ATTR) ?? "");
        if (d) play(el, d);
      });
      return;
    case "click":
      attachOnce(el, "click", "click", () => {
        const d = getAnimation(el.getAttribute(ATTR) ?? "");
        if (d) play(el, d);
      });
      return;
    default:
      return;
  }
}

function play(el: HTMLElement, def: AnimationDef): Animation {
  // Cancel any in-flight run on this element so restarting is clean.
  running.get(el)?.cancel();

  const opts = mergeOptions(el, def.defaults);
  // Reduced-motion accessibility, collapse to an instant fill so the
  // element lands at the end state without motion.
  if (prefersReducedMotion()) {
    opts.duration = 0;
    opts.delay = 0;
    opts.endDelay = 0;
    opts.iterations = 1;
  }

  const animation = el.animate(def.keyframes, opts);
  running.set(el, animation);
  animation.finished
    .catch(() => undefined) // canceled animations reject; that's not an error
    .finally(() => {
      // Only clear if we're still the active one, a restart could have
      // replaced us before this resolved.
      if (running.get(el) === animation) running.delete(el);
    });
  return animation;
}

function mergeOptions(
  el: HTMLElement,
  defaults: KeyframeAnimationOptions
): KeyframeAnimationOptions {
  const out: KeyframeAnimationOptions = { ...defaults };
  const duration = readNumber(el, ATTR_DURATION);
  if (duration !== undefined) out.duration = duration;
  const delay = readNumber(el, ATTR_DELAY);
  if (delay !== undefined) out.delay = delay;
  const easing = el.getAttribute(ATTR_EASING);
  if (easing) out.easing = easing;
  const iterations = el.getAttribute(ATTR_ITERATIONS);
  if (iterations) {
    const parsed =
      iterations === "infinite" || iterations === "Infinity" ? Infinity : Number(iterations);
    if (parsed === Infinity || (Number.isFinite(parsed) && parsed >= 0)) out.iterations = parsed;
  }
  return out;
}

function readNumber(el: HTMLElement, attr: string): number | undefined {
  const raw = el.getAttribute(attr);
  if (raw === null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

// Tracks which (element, event-type) pairs already have a listener wired, so
// the MutationObserver re-invoking handleElement on attribute changes does not
// re-bind. A WeakMap keyed by element keeps this off the DOM (a dataset key
// can't hold the event type verbatim: "pointerenter-bound" is not a valid
// DOMStringMap property name).
const boundEvents = new WeakMap<HTMLElement, Set<string>>();

function attachOnce(
  el: HTMLElement,
  type: string,
  expectedTrigger: Trigger,
  handler: () => void
): void {
  let bound = boundEvents.get(el);
  if (!bound) {
    bound = new Set<string>();
    boundEvents.set(el, bound);
  }
  if (bound.has(type)) return;
  bound.add(type);
  el.addEventListener(
    type,
    () => {
      if ((el.getAttribute(ATTR_TRIGGER) ?? "mount") === expectedTrigger) handler();
    },
    { passive: true }
  );
}

function cleanupElement(el: HTMLElement): void {
  stopElementAnimation(el);
  inViewObserver?.unobserve(el);
  settled.delete(el);
}

function getInViewObserver(): IntersectionObserver | undefined {
  if (inViewObserver) return inViewObserver;
  if (typeof IntersectionObserver === "undefined") return undefined;
  inViewObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        if ((el.getAttribute(ATTR_TRIGGER) ?? "mount") !== "in-view") {
          inViewObserver?.unobserve(el);
          continue;
        }
        if (settled.has(el)) continue;
        const name = el.getAttribute(ATTR);
        if (!name) continue;
        const def = getAnimation(name);
        if (!def) continue;
        settled.add(el);
        play(el, def);
        inViewObserver?.unobserve(el);
      }
    },
    { threshold: 0.15 }
  );
  return inViewObserver;
}
