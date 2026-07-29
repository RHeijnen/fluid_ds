import { expect } from "@open-wc/testing";

import {
  registerAnimation,
  getAnimation,
  hasAnimation,
  listAnimations,
  onAnimationRegistered,
  type AnimationDef
} from "./registry.js";

/** A throwaway name unlikely to collide with the curated defaults. */
function uniqueName(prefix = "test-anim"): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

const def = (duration: number): AnimationDef => ({
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
  defaults: { duration }
});

describe("registry", () => {
  it("registers and looks up an animation by name", () => {
    const name = uniqueName();
    expect(hasAnimation(name)).to.equal(false);
    expect(getAnimation(name)).to.equal(undefined);

    const d = def(200);
    registerAnimation(name, d);

    expect(hasAnimation(name)).to.equal(true);
    expect(getAnimation(name)).to.equal(d);
    expect(listAnimations()).to.include(name);
  });

  it("overwrites an existing name (theming a default without forking)", () => {
    const name = uniqueName();
    const first = def(100);
    const second = def(999);
    registerAnimation(name, first);
    expect(getAnimation(name)).to.equal(first);
    registerAnimation(name, second);
    expect(getAnimation(name)).to.equal(second);
  });

  it("notifies onAnimationRegistered listeners with the registered name", () => {
    const seen: string[] = [];
    const off = onAnimationRegistered((n) => seen.push(n));
    try {
      const name = uniqueName();
      registerAnimation(name, def(100));
      expect(seen).to.include(name);
    } finally {
      off();
    }
  });

  it("unsubscribes via the returned disposer", () => {
    let calls = 0;
    const off = onAnimationRegistered(() => {
      calls += 1;
    });
    off();
    registerAnimation(uniqueName(), def(100));
    expect(calls).to.equal(0);
  });
});
