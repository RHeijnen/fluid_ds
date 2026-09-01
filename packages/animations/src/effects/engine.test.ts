import { expect, aTimeout, waitUntil } from "@open-wc/testing";

import {
  addEmitter,
  stopEmitter,
  windDownEmitter,
  drawLegacyParticle,
  prefersReducedMotion,
  viewport,
  activeEmitterCount,
  activeParticleCount,
  isCanvasMounted,
  type Emitter,
  type Particle,
  type ParticleShape
} from "./engine.js";
import { snow } from "./index.js";

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

/** A live particle with sane defaults; override only what a test cares about. */
function particle(overrides: Partial<Particle> = {}): Particle {
  return {
    x: 40,
    y: 40,
    vx: 0,
    vy: 0,
    gravity: 0,
    drag: 1,
    size: 9,
    color: "#ff00ff",
    shape: "square",
    renderer: () => undefined,
    rotation: 0,
    spin: 0,
    opacity: 1,
    fade: 0,
    life: 0.4,
    fadeAfter: 99,
    maxLife: 99,
    ...overrides
  };
}

const SCRATCH = 80;

function scratchContext(): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = SCRATCH;
  canvas.height = SCRATCH;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2D context in this browser");
  return context;
}

/** How many pixels the renderer actually put ink on. */
function painted(context: CanvasRenderingContext2D): number {
  const { data } = context.getImageData(0, 0, SCRATCH, SCRATCH);
  let total = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! > 0) total += 1;
  }
  return total;
}

/** A one-pixel-red source usable wherever a `CanvasImageSource` is wanted. */
function imageSource(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2D context in this browser");
  context.fillStyle = "#ff0000";
  context.fillRect(0, 0, 8, 8);
  return canvas;
}

/** Drain whatever the engine is still running so the next test starts clean. */
async function drain(): Promise<void> {
  await waitUntil(() => activeEmitterCount() === 0, "emitters did not drain", { timeout: 3000 });
}

describe("engine: environment probes", () => {
  afterEach(restoreMatchMedia);

  it("reports the live viewport in CSS pixels", () => {
    expect(viewport()).to.deep.equal({
      width: window.innerWidth,
      height: window.innerHeight
    });
  });

  it("reports full document bounds on explicit document space", () => {
    const marker = document.createElement("div");
    marker.style.cssText =
      "position:absolute;left:0;top:0;width:1px;height:2400px;pointer-events:none";
    document.body.append(marker);
    try {
      const bounds = viewport("document");
      expect(bounds.width).to.be.at.least(window.innerWidth);
      expect(bounds.height).to.be.at.least(2400);
    } finally {
      marker.remove();
    }
  });

  it("follows the prefers-reduced-motion media query", () => {
    setReducedMotion(false);
    expect(prefersReducedMotion()).to.equal(false);
    setReducedMotion(true);
    expect(prefersReducedMotion()).to.equal(true);
  });
});

describe("engine: emitter lifecycle", () => {
  afterEach(restoreMatchMedia);

  it("ticks a registered emitter and mounts the shared canvas", async () => {
    let ticks = 0;
    const emitter: Emitter = {
      particles: [],
      done: false,
      resolve: () => undefined,
      update: (_dt, em) => {
        ticks += 1;
        em.particles.push(particle({ life: 0, maxLife: 5 }));
        return true;
      }
    };
    addEmitter(emitter);
    try {
      expect(isCanvasMounted()).to.equal(true);
      await waitUntil(() => ticks >= 2, "the shared loop never ticked the emitter");
      expect(activeParticleCount()).to.be.greaterThan(0);
    } finally {
      stopEmitter(emitter);
    }
    expect(activeParticleCount(), "stop must drop the particles").to.equal(0);
    await waitUntil(() => !isCanvasMounted(), "canvas outlived the last emitter");
  });

  it("windDownEmitter stops calling update but lets the live particles play out", async () => {
    let updates = 0;
    let resolved = false;
    const emitter: Emitter = {
      particles: [],
      done: false,
      resolve: () => {
        resolved = true;
      },
      update: (_dt, em) => {
        updates += 1;
        // Short-lived so the wound-down emitter drains quickly.
        em.particles.push(particle({ life: 0, maxLife: 0.3 }));
        return true;
      }
    };
    addEmitter(emitter);
    try {
      await waitUntil(() => updates >= 2, "the emitter never spawned");
      windDownEmitter(emitter);
      // Nothing can tick between the synchronous wind-down and this read.
      const spawns = updates;
      expect(emitter.particles.length, "wind-down must not drop live particles").to.be.greaterThan(
        0
      );
      await aTimeout(120);
      expect(updates, "update must never run again after a wind-down").to.equal(spawns);
      await waitUntil(() => resolved, "wound-down emitter never resolved", { timeout: 3000 });
      expect(activeEmitterCount()).to.equal(0);
    } finally {
      stopEmitter(emitter);
    }
  });

  it("keeps ticking after a window resize", async () => {
    let ticks = 0;
    const emitter: Emitter = {
      particles: [],
      done: false,
      resolve: () => undefined,
      update: () => {
        ticks += 1;
        return true;
      }
    };
    addEmitter(emitter);
    try {
      await waitUntil(() => ticks >= 1, "emitter never ticked");
      window.dispatchEvent(new Event("resize"));
      const canvas = document.querySelector<HTMLCanvasElement>("canvas[data-fluid-effects-canvas]");
      expect(canvas, "the resize handler must keep the canvas mounted").to.exist;
      expect(canvas!.style.width).to.equal(`${window.innerWidth}px`);
      expect(canvas!.style.height).to.equal(`${window.innerHeight}px`);
      const seen = ticks;
      await waitUntil(() => ticks > seen, "the loop stopped after a resize");
    } finally {
      stopEmitter(emitter);
      await drain();
    }
  });
});

describe("engine: reduced motion", () => {
  afterEach(restoreMatchMedia);

  it("resolves an emitter with no static frame without mounting a canvas", () => {
    setReducedMotion(true);
    let resolved = false;
    addEmitter({
      particles: [],
      done: false,
      resolve: () => {
        resolved = true;
      },
      update: () => true
    });
    expect(resolved, "a reduced-motion emitter must resolve at once").to.equal(true);
    expect(activeEmitterCount(), "and must never join the animation loop").to.equal(0);
    expect(isCanvasMounted(), "nothing to paint means no canvas").to.equal(false);
  });

  it("paints a single static frame, then clears it away", async () => {
    setReducedMotion(true);
    let width = 0;
    let height = 0;
    let resolved = false;
    addEmitter({
      particles: [],
      done: false,
      resolve: () => {
        resolved = true;
      },
      reducedMotionStill: (context, w, h) => {
        width = w;
        height = h;
        context.fillStyle = "#123456";
        context.fillRect(0, 0, w, h);
      }
    });
    expect(resolved).to.equal(true);
    expect(isCanvasMounted(), "the still frame needs a canvas to land on").to.equal(true);
    // The engine hands the still frame CSS pixels, not device pixels.
    expect(width).to.be.closeTo(window.innerWidth, 2);
    expect(height).to.be.closeTo(window.innerHeight, 2);
    await waitUntil(() => !isCanvasMounted(), "the static flash never cleared", { timeout: 2000 });
  });

  it("does not rip the canvas away from an effect that started during the flash", async () => {
    setReducedMotion(true);
    addEmitter({
      particles: [],
      done: false,
      resolve: () => undefined,
      reducedMotionStill: (context, w, h) => {
        context.fillStyle = "#654321";
        context.fillRect(0, 0, w, h);
      }
    });
    expect(isCanvasMounted()).to.equal(true);
    // Motion is allowed again and a real effect claims the shared canvas before
    // the flash's cleanup timer runs.
    restoreMatchMedia();
    const handle = snow({ rate: 60 });
    try {
      expect(activeEmitterCount()).to.equal(1);
      await aTimeout(600);
      expect(isCanvasMounted(), "the flash cleanup must spare a live effect").to.equal(true);
    } finally {
      handle.stop();
      await handle.finished;
      await drain();
    }
  });
});

describe("engine: drawLegacyParticle", () => {
  // The deprecated all-shapes renderer is still a published entry point
  // (`@fluid-ds/animations/effects/engine`), so every branch of its shape
  // switch has to keep painting something.
  const shapes: ParticleShape[] = [
    "square",
    "circle",
    "ring",
    "bubble",
    "balloon",
    "leaf",
    "coin",
    "comet",
    "raindrop",
    "firefly",
    "ember",
    "magic",
    "fog",
    "butterfly",
    "hail",
    "shard",
    "ribbon",
    "sparkle"
  ];

  for (const shape of shapes) {
    it(`paints a ${shape} particle`, () => {
      const context = scratchContext();
      drawLegacyParticle(context, particle({ shape, color: "#ffffff" }));
      expect(painted(context), `${shape} drew nothing`).to.be.greaterThan(0);
    });
  }

  it("paints an image particle from its CanvasImageSource", () => {
    const context = scratchContext();
    drawLegacyParticle(context, particle({ shape: "image", image: imageSource() }));
    expect(painted(context)).to.be.greaterThan(0);
  });

  it("draws nothing for an image particle with no image", () => {
    const context = scratchContext();
    drawLegacyParticle(context, particle({ shape: "image" }));
    expect(painted(context)).to.equal(0);
  });

  it("draws nothing for a glyph particle with no glyph", () => {
    const context = scratchContext();
    drawLegacyParticle(context, particle({ shape: "emoji" }));
    expect(painted(context)).to.equal(0);
  });

  it("rasterizes a glyph once and reuses the identical sprite", () => {
    // Any text glyph exercises the sprite cache; a plain letter is used here so
    // the assertion does not depend on a color-emoji font being installed.
    const first = scratchContext();
    drawLegacyParticle(first, particle({ shape: "emoji", glyph: "A", size: 16 }));
    expect(painted(first), "the glyph sprite drew nothing").to.be.greaterThan(0);

    const second = scratchContext();
    drawLegacyParticle(second, particle({ shape: "emoji", glyph: "A", size: 16 }));
    expect(
      Array.from(second.getImageData(0, 0, SCRATCH, SCRATCH).data),
      "the cached sprite must render identically"
    ).to.deep.equal(Array.from(first.getImageData(0, 0, SCRATCH, SCRATCH).data));
  });

  it("clamps opacity and leaves the context state untouched", () => {
    const context = scratchContext();
    context.globalAlpha = 0.5;
    // Out-of-range opacity must not throw or leak: canvas rejects an alpha
    // outside [0, 1] outright, so the engine has to clamp before assigning.
    drawLegacyParticle(context, particle({ shape: "circle", opacity: 4 }));
    drawLegacyParticle(context, particle({ shape: "circle", opacity: -3 }));
    expect(context.globalAlpha, "save/restore must balance").to.equal(0.5);
    expect(painted(context), "an opaque particle still paints").to.be.greaterThan(0);
  });
});
