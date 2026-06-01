import { expect, fixture, html, waitUntil, oneEvent, aTimeout } from "@open-wc/testing";

import {
  confetti,
  fireworks,
  emojiBurst,
  emojiRain,
  snow,
  sparkles,
  streamers,
  pulse,
  stars,
  hearts,
  pride,
  activeEmitterCount,
  isCanvasMounted,
  EFFECT_NAMES,
  type EffectHandle
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

  const cases: [string, () => EffectHandle][] = [
    ["confetti", () => confetti()],
    ["confetti cannons", () => confetti({ cannons: true })],
    ["fireworks", () => fireworks({ shells: 2, interval: 10 })],
    ["emojiBurst", () => emojiBurst()],
    ["emojiRain", () => emojiRain()],
    ["snow", () => snow()],
    ["sparkles", () => sparkles()],
    ["streamers", () => streamers()],
    ["pulse", () => pulse()],
    ["stars", () => stars()],
    ["hearts", () => hearts()],
    ["pride", () => pride()]
  ];

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
    expect(EFFECT_NAMES).to.have.lengthOf(13);
    expect(EFFECT_NAMES).to.include("emojiFountain");
    expect(EFFECT_NAMES).to.include("bubbles");
  });
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
  afterEach(restoreMatchMedia);

  it("upgrades and renders nothing visible", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="confetti"></fluid-celebrate>`
    );
    expect(el).to.be.an.instanceOf(customElements.get("fluid-celebrate"));
    expect(getComputedStyle(el).display).to.equal("contents");
  });

  it("fire() dispatches fluid-celebrate-end", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="confetti" count="6"></fluid-celebrate>`
    );
    const ended = oneEvent(el, "fluid-celebrate-end");
    const fired = el.fire();
    // stop quickly so the burst ends fast and deterministically.
    el.stop();
    await fired;
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

  it("auto fires on connect and ends", async () => {
    const el = document.createElement("fluid-celebrate") as FluidCelebrate;
    el.setAttribute("effect", "confetti");
    el.setAttribute("count", "6");
    el.setAttribute("auto", "");
    const ended = new Promise<void>((resolve) => {
      el.addEventListener("fluid-celebrate-end", () => resolve(), { once: true });
    });
    document.body.appendChild(el);
    // Let the deferred auto-fire kick in, then stop to drain fast.
    await aTimeout(50);
    el.stop();
    await ended;
    el.remove();
    await waitUntil(() => activeEmitterCount() === 0, "did not drain");
  });
});
