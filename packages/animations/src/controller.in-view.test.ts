import { expect, waitUntil } from "@open-wc/testing";

import { registerAnimation } from "./registry.js";
import { startAnimationController, stopElementAnimation } from "./controller.js";

/*
 * The controller creates its single IntersectionObserver lazily and keeps it
 * for the life of the page. These tests need to control that observer (first
 * its absence, then a scripted stand-in), so they live in their own file,
 * which the test runner loads into a fresh page.
 */

const ATTR = "data-fluid-animation";
const TRIGGER = "data-fluid-animation-trigger";
const FADE = "in-view-fade";

/** A scripted IntersectionObserver: records what the controller observes and
 *  lets a test deliver entries on demand, including late or stale ones. */
class ScriptedObserver {
  static current: ScriptedObserver | undefined;
  readonly observed = new Set<Element>();
  constructor(readonly callback: IntersectionObserverCallback) {
    ScriptedObserver.current = this;
  }
  observe(el: Element): void {
    this.observed.add(el);
  }
  unobserve(el: Element): void {
    this.observed.delete(el);
  }
  disconnect(): void {
    this.observed.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function deliver(target: Element): void {
  const observer = ScriptedObserver.current;
  if (!observer) throw new Error("the controller never created its observer");
  observer.callback(
    [{ target, isIntersecting: true } as IntersectionObserverEntry],
    observer as unknown as IntersectionObserver
  );
}

function makeEl(attrs: Record<string, string>): HTMLElement {
  const el = document.createElement("div");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

/** Let the controller's MutationObserver see the latest DOM change. */
function flushMutations(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const RealObserver = window.IntersectionObserver;

before(() => {
  registerAnimation(FADE, {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    defaults: { duration: 5000, easing: "linear", iterations: 1 }
  });
  startAnimationController();
});

after(() => {
  window.IntersectionObserver = RealObserver;
});

describe("controller in-view: without IntersectionObserver", () => {
  it("plays an in-view element straight away, once", async () => {
    Reflect.set(window, "IntersectionObserver", undefined);
    const el = makeEl({ [ATTR]: FADE, [TRIGGER]: "in-view" });
    try {
      await waitUntil(
        () => el.getAnimations().length > 0,
        "with no way to observe visibility the element must still animate"
      );
      stopElementAnimation(el);
      // A same-value echo must not replay a trigger that has already fired.
      el.setAttribute(TRIGGER, "in-view");
      await flushMutations();
      expect(el.getAnimations()).to.have.length(0);
    } finally {
      stopElementAnimation(el);
      el.remove();
      window.IntersectionObserver = RealObserver;
    }
  });
});

describe("controller in-view: observer entries", () => {
  before(() => {
    window.IntersectionObserver = ScriptedObserver as unknown as typeof IntersectionObserver;
  });

  after(() => {
    window.IntersectionObserver = RealObserver;
  });

  async function observedEl(): Promise<HTMLElement> {
    const el = makeEl({ [ATTR]: FADE, [TRIGGER]: "in-view" });
    await waitUntil(
      () => ScriptedObserver.current?.observed.has(el) ?? false,
      "the controller never observed the in-view element"
    );
    return el;
  }

  it("plays on the first intersection and ignores a late duplicate entry", async () => {
    const el = await observedEl();
    try {
      expect(el.getAnimations(), "nothing plays before it intersects").to.have.length(0);
      deliver(el);
      expect(el.getAnimations()).to.have.length(1);
      expect(ScriptedObserver.current!.observed.has(el), "one-shot: stop observing").to.equal(
        false
      );
      stopElementAnimation(el);
      deliver(el);
      expect(el.getAnimations(), "a settled element must not replay").to.have.length(0);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });

  it("drops a stale entry for an element switched to a manual trigger", async () => {
    const el = await observedEl();
    try {
      el.setAttribute(TRIGGER, "manual");
      await flushMutations();
      deliver(el);
      expect(el.getAnimations(), "a manual element only plays on request").to.have.length(0);
    } finally {
      el.remove();
    }
  });

  it("does not restart an element that fell back to the mount trigger", async () => {
    const el = await observedEl();
    try {
      el.removeAttribute(TRIGGER);
      await waitUntil(() => el.getAnimations().length === 1, "mount fallback did not play");
      const mounted = el.getAnimations()[0];
      deliver(el);
      expect(el.getAnimations(), "a stale in-view entry must not restart it").to.deep.equal([
        mounted
      ]);
      expect(ScriptedObserver.current!.observed.has(el)).to.equal(false);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });

  it("waits while the animation name is removed, then plays once it returns", async () => {
    const el = await observedEl();
    try {
      el.removeAttribute(ATTR);
      await flushMutations();
      deliver(el);
      expect(el.getAnimations(), "no name, nothing to play").to.have.length(0);
      el.setAttribute(ATTR, FADE);
      await flushMutations();
      deliver(el);
      expect(el.getAnimations()).to.have.length(1);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });

  it("waits for an unregistered animation, then plays once it is registered", async () => {
    const late = "in-view-late";
    const el = await observedEl();
    try {
      el.setAttribute(ATTR, late);
      await flushMutations();
      deliver(el);
      expect(el.getAnimations(), "an unknown name has nothing to play").to.have.length(0);
      registerAnimation(late, {
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        defaults: { duration: 5000, iterations: 1 }
      });
      deliver(el);
      expect(el.getAnimations()).to.have.length(1);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });
});
