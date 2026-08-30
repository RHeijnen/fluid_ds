import { expect, waitUntil, aTimeout } from "@open-wc/testing";

import { registerAnimation } from "./registry.js";
import {
  startAnimationController,
  playElementAnimation,
  stopElementAnimation
} from "./controller.js";

/**
 * Save / restore matchMedia so a reduced-motion stub in one test does not
 * leak into the next.
 */
const realMatchMedia = window.matchMedia.bind(window);

function setReducedMotion(reduced: boolean): void {
  window.matchMedia = ((query: string) => {
    const matches = reduced && query.includes("prefers-reduced-motion");
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}

function restoreMatchMedia(): void {
  window.matchMedia = realMatchMedia;
}

const ATTR = "data-fluid-animation";

// A finite fade and an infinite spin, registered under unique names so they
// don't depend on register-defaults having run.
const FADE = "test-fade";
const SPIN = "test-spin";

before(() => {
  registerAnimation(FADE, {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    defaults: { duration: 200, easing: "ease", iterations: 1 }
  });
  registerAnimation(SPIN, {
    keyframes: [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
    defaults: { duration: 1200, easing: "linear", iterations: Infinity }
  });
  // Boot once; idempotent. Drives the mount/in-view/hover/click triggers below.
  startAnimationController();
});

function makeEl(attrs: Record<string, string>): HTMLElement {
  const el = document.createElement("div");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

describe("controller: imperative play/stop", () => {
  afterEach(restoreMatchMedia);

  it("playElementAnimation runs the configured named animation", () => {
    const el = makeEl({ [ATTR]: FADE, "data-fluid-animation-trigger": "manual" });
    try {
      const anim = playElementAnimation(el);
      expect(anim).to.be.an.instanceOf(Animation);
      const timing = anim!.effect!.getTiming();
      expect(timing.duration).to.equal(200);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });

  it("returns undefined for a missing or unregistered name", () => {
    const none = makeEl({ "data-fluid-animation-trigger": "manual" });
    const unknown = makeEl({
      [ATTR]: "does-not-exist",
      "data-fluid-animation-trigger": "manual"
    });
    try {
      expect(playElementAnimation(none)).to.equal(undefined);
      expect(playElementAnimation(unknown)).to.equal(undefined);
    } finally {
      none.remove();
      unknown.remove();
    }
  });

  it("stopElementAnimation cancels the running animation", () => {
    const el = makeEl({ [ATTR]: SPIN, "data-fluid-animation-trigger": "manual" });
    try {
      const anim = playElementAnimation(el);
      expect(anim!.playState).to.not.equal("idle");
      stopElementAnimation(el);
      expect(anim!.playState).to.equal("idle"); // cancel() -> idle
    } finally {
      el.remove();
    }
  });

  it("applies per-element duration/delay/easing/iterations overrides", () => {
    const el = makeEl({
      [ATTR]: FADE,
      "data-fluid-animation-trigger": "manual",
      "data-fluid-animation-duration": "500",
      "data-fluid-animation-delay": "50",
      "data-fluid-animation-easing": "ease-in-out",
      "data-fluid-animation-iterations": "3"
    });
    try {
      const t = playElementAnimation(el)!.effect!.getTiming();
      expect(t.duration).to.equal(500);
      expect(t.delay).to.equal(50);
      expect(t.easing).to.equal("ease-in-out");
      expect(t.iterations).to.equal(3);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });

  it('parses iterations "infinite" / "Infinity" as Infinity', () => {
    for (const value of ["infinite", "Infinity"]) {
      const el = makeEl({
        [ATTR]: FADE,
        "data-fluid-animation-trigger": "manual",
        "data-fluid-animation-iterations": value
      });
      try {
        expect(playElementAnimation(el)!.effect!.getTiming().iterations).to.equal(Infinity);
      } finally {
        stopElementAnimation(el);
        el.remove();
      }
    }
  });

  it("ignores negative numeric overrides", () => {
    const el = makeEl({
      [ATTR]: FADE,
      "data-fluid-animation-trigger": "manual",
      "data-fluid-animation-duration": "-1",
      "data-fluid-animation-delay": "-20",
      "data-fluid-animation-iterations": "-3"
    });
    try {
      const timing = playElementAnimation(el)!.effect!.getTiming();
      expect(timing.duration).to.equal(200);
      expect(timing.delay).to.equal(0);
      expect(timing.iterations).to.equal(1);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });
});

describe("controller: reduced motion", () => {
  afterEach(restoreMatchMedia);

  it("collapses an infinite spin to a single 0ms final-frame tick", () => {
    setReducedMotion(true);
    const el = makeEl({ [ATTR]: SPIN, "data-fluid-animation-trigger": "manual" });
    try {
      const t = playElementAnimation(el)!.effect!.getTiming();
      // An infinite loader must not animate indefinitely under reduce.
      expect(t.duration).to.equal(0);
      expect(t.iterations).to.equal(1);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });
});

describe("controller: triggers", () => {
  afterEach(restoreMatchMedia);

  it("mount trigger plays once and does not replay on an attribute echo", async () => {
    const el = makeEl({ [ATTR]: FADE }); // default trigger is mount
    try {
      // The MutationObserver picks the element up; wait for the first play.
      await waitUntil(() => el.getAnimations().length > 0, "mount animation never started");
      const first = el.getAnimations()[0];
      // Echo the same attribute value: settled guard must prevent a replay.
      el.setAttribute(ATTR, FADE);
      await aTimeout(0);
      const current = el.getAnimations();
      expect(current.length).to.equal(1);
      expect(current[0]).to.equal(first);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });

  it("hover trigger resolves the CURRENT animation name at fire time", async () => {
    const el = makeEl({ [ATTR]: SPIN, "data-fluid-animation-trigger": "hover" });
    try {
      await aTimeout(0); // let the MutationObserver bind the listener
      // Swap the animation name AFTER the listener was bound once.
      el.setAttribute(ATTR, FADE);
      await aTimeout(0);
      el.dispatchEvent(new PointerEvent("pointerenter"));
      const anims = el.getAnimations();
      expect(anims.length).to.equal(1);
      if (!anims[0]) throw new Error("Expected the pointer-triggered animation");
      // FADE is finite (200ms); the stale SPIN would be Infinity. Asserting the
      // resolved-at-fire-time def means we get FADE's timing, not SPIN's.
      expect(anims[0].effect!.getTiming().duration).to.equal(200);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });

  it("click trigger plays the configured animation", async () => {
    const el = makeEl({ [ATTR]: FADE, "data-fluid-animation-trigger": "click" });
    try {
      await aTimeout(0); // let the MutationObserver bind the listener
      el.dispatchEvent(new MouseEvent("click"));
      expect(el.getAnimations().length).to.equal(1);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });

  it("does not keep a stale hover trigger after switching to manual", async () => {
    const el = makeEl({ [ATTR]: FADE, "data-fluid-animation-trigger": "hover" });
    try {
      await aTimeout(0);
      el.setAttribute("data-fluid-animation-trigger", "manual");
      await aTimeout(0);
      el.dispatchEvent(new PointerEvent("pointerenter"));
      expect(el.getAnimations()).to.have.length(0);
    } finally {
      stopElementAnimation(el);
      el.remove();
    }
  });

  it("cancels an infinite animation when its element is removed", async () => {
    const el = makeEl({ [ATTR]: SPIN });
    await waitUntil(() => el.getAnimations().length > 0, "spin animation never started");
    const animation = el.getAnimations()[0]!;
    el.remove();
    await aTimeout(0);
    expect(animation.playState).to.equal("idle");
  });

  it("can boot an independent shadow root", async () => {
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const el = document.createElement("div");
    el.setAttribute(ATTR, FADE);
    shadow.append(el);
    document.body.append(host);
    try {
      startAnimationController(shadow);
      await waitUntil(() => el.getAnimations().length > 0, "shadow animation never started");
    } finally {
      stopElementAnimation(el);
      host.remove();
    }
  });
});
