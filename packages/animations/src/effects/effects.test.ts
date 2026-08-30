import { expect, fixture, html, waitUntil, oneEvent, aTimeout } from "@open-wc/testing";

import {
  confetti,
  pride,
  snow,
  sparkles,
  activeEmitterCount,
  activeParticleCount,
  isCanvasMounted,
  EFFECTS,
  EFFECT_CATALOG,
  EFFECT_NAMES,
  EFFECT_ORIGIN_PRESETS,
  type EffectHandle,
  type EffectName
} from "./index.js";
import "../define/celebrate.js";
import type { FluidCelebrate } from "./fluid-celebrate.js";

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

/** Wait for the engine to go idle and tear down its canvas. */
async function settle(handle: EffectHandle): Promise<void> {
  handle.stop();
  await handle.finished;
  await waitUntil(() => activeEmitterCount() === 0, "emitters did not drain", {
    timeout: 2000
  });
}

describe("effects: API contract", () => {
  afterEach(restoreMatchMedia);

  const cases: [string, () => EffectHandle][] = EFFECT_CATALOG.map((effect) => [
    effect.name,
    () =>
      EFFECTS[effect.name]({
        count: 6,
        duration: 100,
        shells: 1,
        interval: 10,
        particlesPerShell: 6,
        rings: 1
      })
  ]);
  cases.push(["confetti cannons", () => confetti({ cannons: true })]);

  for (const [name, make] of cases) {
    it(`${name} returns a handle with stop() and a finished promise`, async () => {
      const handle = make();
      expect(handle).to.be.an("object");
      expect(handle.stop).to.be.a("function");
      expect(handle.finished).to.be.an.instanceOf(Promise);
      await settle(handle);
    });
  }

  it("exposes every effect by name", () => {
    expect(EFFECT_NAMES).to.have.lengthOf(EFFECT_CATALOG.length);
    expect(EFFECT_NAMES).to.include("emojiFountain");
    expect(EFFECT_NAMES).to.include("bubbles");
  });

  it("supports individual and grouped directed origin presets", async () => {
    const single = confetti({ sources: EFFECT_ORIGIN_PRESETS["top-left"], count: 8 });
    expect(activeEmitterCount()).to.equal(1);
    await settle(single);

    const corners = confetti({ sources: EFFECT_ORIGIN_PRESETS["all-corners"], count: 16 });
    expect(activeEmitterCount()).to.equal(4);
    await settle(corners);
  });

  it("keeps cannons as a bottom-corner compatibility alias", async () => {
    const handle = confetti({ cannons: true, count: 8 });
    expect(activeEmitterCount()).to.equal(2);
    await settle(handle);
  });

  it("renders Pride as six ordered rainbow streams instead of corner confetti", async () => {
    const handle = pride({ count: 24 });
    expect(activeEmitterCount()).to.equal(6);
    await settle(handle);
  });

  // `multiOrigin` is optional, so narrow with `in` before reading it: the
  // catalog is a literal union and some members do not carry the key at all.
  for (const effect of EFFECT_CATALOG.filter((entry) => "multiOrigin" in entry)) {
    it(`${effect.name} honors grouped launch sources`, async () => {
      const handle = EFFECTS[effect.name]({
        sources: EFFECT_ORIGIN_PRESETS["top-corners"],
        count: 12,
        duration: 120
      });
      expect(activeEmitterCount()).to.be.at.least(2);
      await settle(handle);
    });
  }
});

describe("effects: canvas lifecycle", () => {
  afterEach(restoreMatchMedia);

  it("mounts a decorative canvas on fire", async () => {
    const handle = confetti();
    expect(isCanvasMounted()).to.equal(true);
    const canvas = document.querySelector("canvas[data-fluid-effects-canvas]");
    expect(canvas).to.exist;
    expect(canvas?.getAttribute("aria-hidden")).to.equal("true");
    expect((canvas as HTMLCanvasElement).tabIndex).to.equal(-1);
    expect(getComputedStyle(canvas as HTMLElement).pointerEvents).to.equal("none");
    await settle(handle);
  });

  it("removes the canvas once every emitter is idle", async () => {
    const a = snow();
    const b = snow();
    expect(activeEmitterCount()).to.equal(2);
    a.stop();
    b.stop();
    await Promise.all([a.finished, b.finished]);
    await waitUntil(() => !isCanvasMounted(), "canvas not removed", { timeout: 2000 });
    expect(activeEmitterCount()).to.equal(0);
  });

  it("stop() halts an ambient effect and resolves its promise", async () => {
    const handle = snow();
    await aTimeout(50);
    expect(activeEmitterCount()).to.equal(1);
    let resolved = false;
    void handle.finished.then(() => {
      resolved = true;
    });
    handle.stop();
    await handle.finished;
    expect(resolved).to.equal(true);
    await waitUntil(() => activeEmitterCount() === 0, "did not drain");
  });

  it("fizzle() stops spawning but lets live particles drain, then resolves", async () => {
    // Contrast with stop(): fizzle must NOT drop particles at once. It stops
    // spawning (like a duration elapsing) and lets the already-live particles
    // play out, so the effect eases away instead of hard-cutting.
    const handle = sparkles({ rate: 60 });
    await aTimeout(80); // let some sparkles spawn
    expect(activeEmitterCount()).to.equal(1);
    let resolved = false;
    void handle.finished.then(() => {
      resolved = true;
    });
    handle.fizzle();
    await aTimeout(0);
    expect(activeEmitterCount(), "fizzle must not drop particles immediately").to.equal(1);
    expect(resolved, "finished must not resolve until the particles drain").to.equal(false);
    // The sparkles fade out on their own; the emitter then drains and resolves.
    await waitUntil(() => activeEmitterCount() === 0, "fizzled effect never drained", {
      timeout: 3000
    });
    await handle.finished;
    expect(resolved).to.equal(true);
  });

  it("an ambient effect with a duration stops spawning and drains on its own", async () => {
    // `duration` must stop SPAWNING (update returns false), then let the
    // already-spawned particles die and the emitter finish, with NO stop().
    // Regression: the engine used to keep calling update every frame, so it
    // kept respawning forever and the effect never wound down. Sparkles fade
    // out in ~1.4s, so a correct engine drains quickly; a regressed one would
    // respawn indefinitely and time out here.
    const handle = sparkles({ duration: 100, rate: 30 });
    try {
      await waitUntil(() => activeEmitterCount() === 0, "ambient effect never drained", {
        timeout: 3000
      });
      expect(activeEmitterCount()).to.equal(0);
      await handle.finished; // already resolved; must not hang
    } finally {
      handle.stop(); // never leak an emitter into the next test
    }
  });

  it("a finite burst resolves on its own", async () => {
    const handle = confetti({ count: 8, gravity: 4000, velocity: 1600 });
    // Give it time to fall off-screen and die.
    await Promise.race([handle.finished, aTimeout(2500)]);
    await settle(handle);
    expect(activeEmitterCount()).to.equal(0);
  });
});

describe("effects: termination (no runaway emitters)", () => {
  afterEach(restoreMatchMedia);

  /**
   * Fire every effect so it MUST wind down without a `stop()`: continuous
   * effects get a short `duration`, and point bursts get strong gravity so
   * their particles fall off-screen fast. Keyed by `EffectName`, so a newly
   * added effect fails to COMPILE until it is listed here (the map is no longer
   * exhaustive), and then fails at RUNTIME if it never terminates. Together
   * that is the guard: no effect, existing or future, may run forever, and none
   * may resist a graceful fizzle.
   */
  const selfTerminating = Object.fromEntries(
    EFFECT_NAMES.map((name) => [
      name,
      () =>
        EFFECTS[name]({
          count: 6,
          gravity: 5000,
          velocity: 1800,
          duration: 60,
          shells: 1,
          interval: 10,
          particlesPerShell: 6,
          rings: 1
        })
    ])
  ) as Record<EffectName, () => EffectHandle>;

  for (const name of EFFECT_NAMES) {
    it(`${name} stops spawning and does not run away`, async () => {
      // Watch the particle count instead of waiting for a full drain: some
      // effects (snow's flakes live up to 12s) legitimately take a long time to
      // fall off-screen. Sample past every effect's spawn window (a firework's
      // shell explodes near its apex, ~1.2s; pulse emits for ~0.9s): by then a
      // correct effect has stopped spawning, so its count only holds or falls,
      // while a runaway keeps climbing by the hundreds. This catches a future
      // effect that ignores its duration and respawns forever.
      const handle = selfTerminating[name]();
      try {
        await aTimeout(1700);
        const first = activeParticleCount();
        await aTimeout(600);
        const later = activeParticleCount();
        // Tolerance covers frame-timing jitter at the boundary; a real runaway
        // overshoots it by orders of magnitude.
        expect(later, `${name} kept spawning (runaway emitter)`).to.be.at.most(first + 3);
      } finally {
        handle.stop();
      }
    });
  }

  it("fizzle() winds an ambient effect down without a hard cut", async () => {
    // fizzle must stop spawning but NOT drop the live particles: right after it,
    // the particles are still there (contrast stop(), which clears them at once).
    const handle = snow({ rate: 120 });
    await aTimeout(120);
    const before = activeParticleCount();
    expect(before).to.be.greaterThan(0);
    handle.fizzle();
    await aTimeout(0);
    expect(activeParticleCount(), "fizzle must not drop particles immediately").to.be.greaterThan(
      0
    );
    // And it has stopped spawning: the count does not climb back up.
    const p1 = activeParticleCount();
    await aTimeout(400);
    expect(activeParticleCount(), "fizzle must stop spawning").to.be.at.most(p1);
    handle.stop();
  });

  it("stop() is a hard cut: an ambient effect's particles vanish at once", async () => {
    const handle = snow({ rate: 80 });
    await aTimeout(80);
    expect(activeEmitterCount()).to.equal(1);
    handle.stop();
    expect(activeEmitterCount(), "stop() must drop the emitter synchronously").to.equal(0);
    expect(activeParticleCount(), "stop() must clear the particles").to.equal(0);
    await handle.finished;
  });
});

describe("effects: reduced motion", () => {
  afterEach(restoreMatchMedia);

  it("is a no-op (resolves immediately, no animation loop) under reduce", async () => {
    setReducedMotion(true);
    const handle = snow();
    // snow is ambient: under reduced motion it must NOT keep running.
    await handle.finished;
    expect(activeEmitterCount()).to.equal(0);
  });

  it("does not register an emitter under reduce", async () => {
    setReducedMotion(true);
    const before = activeEmitterCount();
    const handle = confetti();
    await handle.finished;
    expect(activeEmitterCount()).to.equal(before);
  });
});

describe("effects: colors override", () => {
  afterEach(restoreMatchMedia);

  it("accepts an explicit colors array", async () => {
    const handle = confetti({ colors: ["#ff0000", "#00ff00"], count: 6 });
    expect(handle.finished).to.be.an.instanceOf(Promise);
    await settle(handle);
  });
});

describe("<fluid-celebrate>", () => {
  it("passes an a11y audit as a non-visual behavior element", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="confetti"></fluid-celebrate>`
    );
    await expect(el).to.be.accessible();
  });

  afterEach(restoreMatchMedia);

  it("upgrades and renders nothing visible", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="confetti"></fluid-celebrate>`
    );
    expect(el).to.be.an.instanceOf(customElements.get("fluid-celebrate"));
    const style = getComputedStyle(el);
    expect(style.display).to.equal("inline-block");
    expect(el.getBoundingClientRect().width).to.equal(0);
    expect(el.getBoundingClientRect().height).to.equal(0);
  });

  it("fire() dispatches fluid-celebrate-end", async () => {
    setReducedMotion(true);
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="confetti" count="6"></fluid-celebrate>`
    );
    const ended = oneEvent(el, "fluid-celebrate-end");
    await el.fire();
    const ev = await ended;
    expect(ev).to.exist;
    expect(ev.bubbles).to.equal(true);
  });

  it("reflects the effect attribute via the property", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="fireworks"></fluid-celebrate>`
    );
    expect(el.effect).to.equal("fireworks");
    el.effect = "snow";
    expect(el.getAttribute("effect")).to.equal("snow");
  });

  it("parses the emojis attribute into an array (space or comma separated)", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="emojiBurst" emojis="🎉 ❤️ 🔥"></fluid-celebrate>`
    );
    expect(el.emojis).to.deep.equal(["🎉", "❤️", "🔥"]);
  });

  it("lets the emojis property override the attribute", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="emojiBurst" emojis="🎉"></fluid-celebrate>`
    );
    el.emojis = ["⭐", "✨"];
    expect(el.emojis).to.deep.equal(["⭐", "✨"]);
  });

  it("observes the config attributes that #readOptions consumes so live changes refire", () => {
    const Ctor = customElements.get("fluid-celebrate") as typeof FluidCelebrate;
    const observed = Ctor.observedAttributes;
    for (const attr of [
      "origin",
      "cannons",
      "shells",
      "rate",
      "duration",
      "spread",
      "velocity",
      "gravity",
      "size",
      "angle",
      "interval",
      "particles-per-shell",
      "rings",
      "radius"
    ]) {
      expect(observed).to.include(attr);
    }
  });

  it("does not dispatch an end event for a canceled run", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="snow" duration="5000"></fluid-celebrate>`
    );
    let ended = false;
    el.addEventListener("fluid-celebrate-end", () => {
      ended = true;
    });
    const fired = el.fire();
    await waitUntil(() => activeEmitterCount() > 0, "snow never started");
    el.stop();
    await fired;
    expect(ended).to.equal(false);
  });

  it("re-fires on connect when an observed config attribute changes under auto", async () => {
    const el = document.createElement("fluid-celebrate") as FluidCelebrate;
    el.setAttribute("effect", "confetti");
    el.setAttribute("count", "6");
    el.setAttribute("auto", "");
    document.body.appendChild(el);
    try {
      // First (deferred) auto-fire.
      await waitUntil(() => activeEmitterCount() > 0, "initial auto fire never ran", {
        timeout: 1000
      });
      el.stop();
      await waitUntil(() => activeEmitterCount() === 0, "did not drain");
      // Changing a config-only attribute must drive attributeChangedCallback -> refire.
      el.setAttribute("duration", "100");
      await waitUntil(() => activeEmitterCount() > 0, "duration change did not refire", {
        timeout: 1000
      });
      el.stop();
    } finally {
      el.remove();
      await waitUntil(() => activeEmitterCount() === 0, "did not drain");
    }
  });

  it("does not dispatch fluid-celebrate-end after the element is removed mid-burst", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="snow"></fluid-celebrate>`
    );
    // Listen on the document so we'd catch a (bubbling) end event from anywhere.
    let endFired = false;
    const onEnd = (): void => {
      endFired = true;
    };
    document.addEventListener("fluid-celebrate-end", onEnd);
    try {
      const fired = el.fire();
      // Remove mid-burst: disconnectedCallback -> stop() resolves finished.
      el.remove();
      await fired;
      expect(el.isConnected).to.equal(false);
      expect(endFired).to.equal(false);
    } finally {
      document.removeEventListener("fluid-celebrate-end", onEnd);
      await waitUntil(() => activeEmitterCount() === 0, "did not drain");
    }
  });

  it("auto fires on connect and ends", async () => {
    setReducedMotion(true);
    const el = document.createElement("fluid-celebrate") as FluidCelebrate;
    el.setAttribute("effect", "confetti");
    el.setAttribute("count", "6");
    el.setAttribute("auto", "");
    const ended = new Promise<void>((resolve) => {
      el.addEventListener("fluid-celebrate-end", () => resolve(), { once: true });
    });
    document.body.appendChild(el);
    await ended;
    el.remove();
    await waitUntil(() => activeEmitterCount() === 0, "did not drain");
  });
});
