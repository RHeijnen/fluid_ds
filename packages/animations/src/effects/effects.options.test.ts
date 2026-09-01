import { expect, aTimeout, waitUntil } from "@open-wc/testing";

import {
  EFFECT_ORIGIN_PRESETS,
  activeEmitterCount,
  activeParticleCount,
  balloons,
  bubbles,
  butterflies,
  confetti,
  emojiBurst,
  emojiFountain,
  emojiRain,
  fireworkFinale,
  fog,
  glitter,
  leaves,
  petals,
  pride,
  pulse,
  shockwaveDebris,
  sparkles,
  type EffectHandle
} from "./index.js";

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
    timeout: 3000
  });
}

/** A box parked far past the bottom of the viewport. Particles launched from
 *  here are past the engine's cull line, so they die on their first frame,
 *  which is how these tests observe that an origin was honored. */
function offscreenBox(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "position:absolute;top:100000px;left:0;width:24px;height:24px";
  document.body.appendChild(el);
  return el;
}

/** An on-screen box, as the control case for the same assertions. */
function onscreenBox(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;top:20px;left:20px;width:24px;height:24px";
  document.body.appendChild(el);
  return el;
}

function imageSource(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2D context in this browser");
  context.fillStyle = "#22c55e";
  context.fillRect(0, 0, 8, 8);
  return canvas;
}

describe("effects: option guards", () => {
  afterEach(restoreMatchMedia);

  it("substitutes the per-effect default for a non-finite count", async () => {
    // NaN is not "zero particles", it is "no opinion": the effect's own default
    // has to survive it.
    const handle = confetti({ count: Number.NaN, velocity: 0, gravity: 0 });
    try {
      expect(activeParticleCount()).to.equal(80);
    } finally {
      await settle(handle);
    }
  });

  it("clamps an absurd count to the engine's ceiling", async () => {
    const handle = confetti({ count: 999_999, velocity: 0, gravity: 0 });
    try {
      expect(activeParticleCount(), "a runaway count must be capped").to.equal(2000);
    } finally {
      await settle(handle);
    }
  });

  it("falls back to a square when the shape list is empty", async () => {
    // An empty `shapes` array must not produce shapeless particles that the
    // renderer cannot draw.
    const handle = confetti({ shapes: [], count: 12, velocity: 0, gravity: 0 });
    try {
      expect(activeParticleCount()).to.equal(12);
      await aTimeout(80);
      expect(activeParticleCount(), "the fallback shape must keep drawing").to.equal(12);
    } finally {
      await settle(handle);
    }
  });

  it("draws arbitrary caller-supplied shapes through the full shape renderer", async () => {
    const handle = glitter({ shapes: ["circle", "ring", "coin"], count: 18 });
    try {
      expect(activeParticleCount()).to.equal(18);
      await aTimeout(80);
    } finally {
      await settle(handle);
    }
  });

  it("keeps emitting when the glyph list is empty", async () => {
    const handle = emojiFountain({ emojis: [], rate: 200 });
    try {
      await waitUntil(() => activeParticleCount() > 0, "the fountain never sprayed", {
        timeout: 2000
      });
    } finally {
      await settle(handle);
    }
  });
});

describe("effects: origins", () => {
  afterEach(restoreMatchMedia);

  it("uses an element's box as the launch point", async () => {
    const far = offscreenBox();
    const near = onscreenBox();
    try {
      // Same burst, two anchors: only the off-screen one is culled at once.
      const culled = confetti({ origin: far, count: 12, velocity: 0, gravity: 0 });
      await aTimeout(120);
      expect(activeParticleCount(), "a burst below the fold must cull immediately").to.equal(0);
      await settle(culled);

      const live = confetti({ origin: near, count: 12, velocity: 0, gravity: 0 });
      await aTimeout(120);
      expect(activeParticleCount(), "the same burst on screen must survive").to.equal(12);
      await settle(live);
    } finally {
      far.remove();
      near.remove();
    }
  });

  it("uses an absolute viewport point as the launch point", async () => {
    const culled = confetti({
      origin: { x: 20, y: 100_000 },
      count: 10,
      velocity: 0,
      gravity: 0
    });
    await aTimeout(120);
    expect(activeParticleCount()).to.equal(0);
    await settle(culled);

    const live = confetti({ origin: { x: 20, y: 20 }, count: 10, velocity: 0, gravity: 0 });
    await aTimeout(120);
    expect(activeParticleCount()).to.equal(10);
    await settle(live);
  });

  it("anchors an ambient shimmer to an element's box", async () => {
    const far = offscreenBox();
    const near = onscreenBox();
    try {
      const culled = sparkles({ origin: far, rate: 200 });
      await aTimeout(200);
      expect(activeParticleCount(), "sparkles below the fold must never accumulate").to.equal(0);
      await settle(culled);

      const live = sparkles({ origin: near, rate: 200 });
      await waitUntil(() => activeParticleCount() > 0, "sparkles never reached the element", {
        timeout: 2000
      });
      await settle(live);
    } finally {
      far.remove();
      near.remove();
    }
  });

  it("fills in a launch direction for a source that carries none", async () => {
    // No angle anywhere: the effect's own fallback (straight up) keeps the
    // particles on screen.
    const up = confetti({
      sources: [{ origin: { rx: 0.5, ry: 0.9 } }],
      count: 10,
      spread: 0,
      velocity: 1200,
      gravity: 0
    });
    await aTimeout(300);
    expect(activeParticleCount(), "the default launch is upward").to.equal(10);
    await settle(up);

    // A source with no angle of its own inherits the call-level `angle`, and
    // -90 fires straight down through the bottom cull line.
    const down = confetti({
      sources: [{ origin: { rx: 0.5, ry: 0.9 } }],
      angle: -90,
      count: 10,
      spread: 0,
      velocity: 2400,
      gravity: 0
    });
    await aTimeout(400);
    expect(activeParticleCount(), "an inherited angle must steer the burst").to.equal(0);
    await settle(down);
  });

  it("lets explicit sources win over the legacy cannons alias", async () => {
    const handle = confetti({
      cannons: true,
      sources: EFFECT_ORIGIN_PRESETS["all-corners"],
      count: 16
    });
    try {
      expect(activeEmitterCount(), "four corners, not the two cannon corners").to.equal(4);
    } finally {
      await settle(handle);
    }
  });

  it("spreads an uneven particle count across every source", async () => {
    // 10 particles over 4 corners: the remainder has to be handed out rather
    // than rounded away, or a burst quietly loses particles.
    const handle = confetti({
      sources: EFFECT_ORIGIN_PRESETS["all-corners"],
      count: 10,
      velocity: 0,
      gravity: 0
    });
    try {
      expect(activeEmitterCount()).to.equal(4);
      expect(activeParticleCount(), "no particle may be lost to rounding").to.equal(10);
    } finally {
      await settle(handle);
    }
  });

  it("keeps the six pride stripes when an explicit origin is given", async () => {
    const handle = pride({ origin: { rx: 0.5, ry: 0.5 }, count: 24 });
    try {
      expect(activeEmitterCount()).to.equal(6);
    } finally {
      await settle(handle);
    }
  });

  it("pairs a ring with a debris burst at every shockwave source", async () => {
    const handle = shockwaveDebris({
      sources: EFFECT_ORIGIN_PRESETS["top-corners"],
      count: 12,
      duration: 200
    });
    try {
      expect(activeEmitterCount(), "one ring plus one debris burst per source").to.equal(4);
    } finally {
      await settle(handle);
    }
  });
});

describe("effects: ambient spawners", () => {
  afterEach(restoreMatchMedia);

  const spawners: [string, (rate: number) => EffectHandle][] = [
    ["bubbles", (rate) => bubbles({ rate })],
    ["balloons", (rate) => balloons({ rate })],
    ["leaves", (rate) => leaves({ rate })],
    ["petals", (rate) => petals({ rate })]
  ];

  for (const [name, make] of spawners) {
    it(`${name} emits particles once its rate has room to fire`, async () => {
      const handle = make(200);
      try {
        await waitUntil(() => activeParticleCount() > 0, `${name} never spawned`, {
          timeout: 2000
        });
        const spawned = activeParticleCount();
        expect(spawned).to.be.greaterThan(0);
        await aTimeout(120);
        expect(activeParticleCount(), `${name} stopped spawning too early`).to.be.at.least(spawned);
      } finally {
        await settle(handle);
      }
    });
  }

  it("emoji rain falls as images when image sources are supplied", async () => {
    const handle = emojiRain({ images: [imageSource()], rate: 200 });
    try {
      await waitUntil(() => activeParticleCount() > 0, "the image rain never spawned", {
        timeout: 2000
      });
    } finally {
      await settle(handle);
    }
  });

  it("an emoji burst launches images instead of glyphs when given them", async () => {
    const handle = emojiBurst({ images: [imageSource()], count: 14, velocity: 0, gravity: 0 });
    try {
      expect(activeParticleCount()).to.equal(14);
      await aTimeout(100);
      expect(activeParticleCount(), "image particles must keep drawing").to.equal(14);
    } finally {
      await settle(handle);
    }
  });
});

describe("effects: pulse", () => {
  afterEach(restoreMatchMedia);

  it("staggers its rings in rather than firing them together", async () => {
    const handle = pulse({ rings: 3, radius: 60, duration: 2000 });
    try {
      await waitUntil(() => activeParticleCount() >= 1, "the first ring never appeared", {
        interval: 5,
        timeout: 1000
      });
      expect(activeParticleCount(), "the rings must stagger, not fire together").to.be.at.most(2);
      await waitUntil(() => activeParticleCount() === 3, "the later rings never joined", {
        interval: 10,
        timeout: 2000
      });
    } finally {
      await settle(handle);
    }
  });

  it("winds itself down once the last ring has expanded", async () => {
    const handle = pulse({ rings: 1, radius: 40, duration: 200 });
    await waitUntil(() => activeEmitterCount() === 0, "the ripple never ended", { timeout: 3000 });
    await handle.finished;
  });

  it("paints a single static ripple under reduced motion", async () => {
    setReducedMotion(true);
    const handle = pulse({ rings: 3, radius: 80 });
    await handle.finished;
    expect(activeEmitterCount(), "reduced motion must not start the loop").to.equal(0);
  });
});

describe("effects: fog", () => {
  afterEach(restoreMatchMedia);

  function overlayBackground(): string {
    // Read the backgroundImage longhand, not the background shorthand: the
    // engine assigns the shorthand and then overwrites backgroundPosition and
    // backgroundSize, after which Firefox serializes the shorthand as "".
    const canvas = document.querySelector<HTMLCanvasElement>("canvas[data-fluid-effects-canvas]");
    return canvas?.style.backgroundImage ?? "";
  }

  it("blends an alpha-carrying palette straight into the overlay", async () => {
    const handle = fog({ duration: 1500 });
    try {
      await waitUntil(() => overlayBackground().includes("rgba("), "the fog never thickened", {
        timeout: 2000
      });
    } finally {
      await settle(handle);
    }
  });

  it("mixes an opaque palette down to a translucent haze", async () => {
    // Hex colors carry no alpha of their own, so the fog has to derive one
    // instead of painting a solid wall over the page.
    const handle = fog({
      colors: ["#e2e8f0", "#cbd5e1", "#f8fafc"],
      duration: 1500
    });
    try {
      await waitUntil(
        () => overlayBackground().includes("color-mix("),
        "an opaque palette was not mixed down",
        { timeout: 2000 }
      );
    } finally {
      await settle(handle);
    }
  });

  it("fills in the missing bank tones from a single-color palette", async () => {
    // One opaque `rgb()` entry: the fog derives its own alpha from it and
    // supplies its default secondary and highlight tones for the other layers.
    const handle = fog({ colors: ["rgb(226, 232, 240)"], duration: 1500 });
    try {
      await waitUntil(
        () => {
          const background = overlayBackground();
          return background.includes("rgba(226, 232, 240") && background.includes("color-mix(");
        },
        "a single-color palette did not fill out the fog",
        { timeout: 2000 }
      );
    } finally {
      await settle(handle);
    }
  });

  it("clears the overlay when it lifts", async () => {
    const handle = fog({ duration: 400 });
    await waitUntil(() => activeEmitterCount() === 0, "the fog never lifted", { timeout: 3000 });
    await handle.finished;
    expect(overlayBackground(), "the canvas goes with the fog").to.equal("");
  });
});

describe("effects: butterflies", () => {
  afterEach(restoreMatchMedia);

  it("keeps steering the survivors after it stops introducing new ones", async () => {
    // Returning false at the duration would freeze the flock mid-flight, so the
    // emitter has to stay alive until the last butterfly leaves the screen.
    const handle = butterflies({ rate: 60, duration: 150 });
    try {
      await waitUntil(() => activeParticleCount() > 0, "no butterflies entered", { timeout: 2000 });
      await aTimeout(400);
      expect(activeEmitterCount(), "the flock must not be abandoned").to.equal(1);
      expect(activeParticleCount(), "the survivors must still be flying").to.be.greaterThan(0);
    } finally {
      await settle(handle);
    }
  });

  it("caps the flock instead of spawning without bound", async () => {
    const handle = butterflies({ rate: 500 });
    try {
      await waitUntil(() => activeParticleCount() >= 400, "the flock never filled up", {
        timeout: 8000
      });
      await aTimeout(300);
      // The cap is checked per launch; a courtship pair may add one past it.
      expect(activeParticleCount(), "the flock ran away past its cap").to.be.at.most(401);
    } finally {
      await settle(handle);
    }
  });
});

describe("effects: firework finale", () => {
  afterEach(restoreMatchMedia);

  it("opens with a full wave of shells rather than a single rocket", async () => {
    const handle = fireworkFinale({
      shells: 3,
      particlesPerShell: 120,
      interval: 100,
      gravity: 0
    });
    try {
      await waitUntil(() => activeParticleCount() >= 120, "the finale never opened", {
        timeout: 2000
      });
    } finally {
      await settle(handle);
    }
  });
});
