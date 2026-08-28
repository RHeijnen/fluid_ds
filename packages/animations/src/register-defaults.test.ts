import { expect, waitUntil } from "@open-wc/testing";
import { getAnimation, listAnimations, onAnimationRegistered } from "./registry.js";
import { stopElementAnimation } from "./controller.js";

const names = [
  "fade-in",
  "fade-out",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "scale-in",
  "zoom-in",
  "pulse",
  "shake",
  "bounce",
  "flash",
  "spin"
];
const registrations: string[] = [];

before(async () => {
  const off = onAnimationRegistered((name) => registrations.push(name));
  try {
    await import("./register-defaults.js");
  } finally {
    off();
  }
});

describe("curated animation entry points", () => {
  it("registers the exact thirteen defaults once, including repeated module imports", async () => {
    expect(registrations).to.deep.equal(names);
    expect(listAnimations()).to.deep.equal(names);
    await import("./register-defaults.js");
    expect(listAnimations()).to.deep.equal(names);
  });

  for (const name of names) {
    it(`provides executable native keyframes and timing for ${name}`, () => {
      const definition = getAnimation(name)!;
      expect(definition).not.to.equal(undefined);
      expect(typeof definition.defaults.duration).to.equal("number");
      expect(Number(definition.defaults.duration)).to.be.greaterThan(0);
      const element = document.createElement("div");
      document.body.append(element);
      const animation = element.animate(definition.keyframes, definition.defaults);
      try {
        animation.pause();
        const effect = animation.effect as KeyframeEffect;
        expect(effect.getKeyframes().length).to.be.greaterThan(1);
        expect(effect.getTiming().duration).to.equal(definition.defaults.duration);
        expect(effect.getTiming().iterations).to.equal(definition.defaults.iterations ?? 1);
        animation.currentTime = Number(definition.defaults.duration) / 2;
        expect(effect.getComputedTiming().progress).not.to.equal(null);
      } finally {
        animation.cancel();
        expect(animation.playState).to.equal("idle");
        element.remove();
      }
    });
  }

  it("boots the public controller entry and plays a curated mount animation", async () => {
    await import("./define/controller.js");
    const element = document.createElement("div");
    element.setAttribute("data-fluid-animation", "fade-in");
    element.setAttribute("data-fluid-animation-duration", "10000");
    document.body.append(element);
    try {
      await waitUntil(
        () => element.getAnimations().length === 1,
        "The controller starts a native animation"
      );
      const animation = element.getAnimations()[0]!;
      expect((animation.effect as KeyframeEffect).getKeyframes().at(-1)!.opacity).to.equal("1");
      await import("./define/controller.js");
      expect(element.getAnimations()).to.deep.equal([animation]);
    } finally {
      stopElementAnimation(element);
      element.remove();
    }
  });
});
