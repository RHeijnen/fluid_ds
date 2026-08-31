import { expect } from "@open-wc/testing";

import type { Particle, ParticleShape } from "./engine.js";
import {
  drawAnyShape,
  drawCircle,
  drawEmoji,
  drawEmojiOrImage,
  drawImage,
  drawMagic,
  drawMagicOrCircle,
  drawRibbon,
  drawRibbonOrSparkle,
  particleWithRenderer
} from "./renderers.js";

const SCRATCH = 80;

function scratchContext(): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = SCRATCH;
  canvas.height = SCRATCH;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2D context in this browser");
  // Renderers draw around the origin; the engine normally supplies the
  // translate, so centre the scratch context to match.
  context.translate(SCRATCH / 2, SCRATCH / 2);
  return context;
}

function painted(context: CanvasRenderingContext2D): number {
  const { data } = context.getImageData(0, 0, SCRATCH, SCRATCH);
  let total = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! > 0) total += 1;
  }
  return total;
}

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

function particle(overrides: Partial<Particle> = {}): Particle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    gravity: 0,
    drag: 1,
    size: 9,
    color: "#ffffff",
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

/**
 * Every shape the engine knows must have a working renderer behind it: this is
 * the guard that a newly added `ParticleShape` cannot ship without one (the
 * lookup is exhaustive, so a missing entry fails to compile, and a broken one
 * fails here by painting nothing).
 */
const SHAPES: ParticleShape[] = [
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

describe("renderers: drawAnyShape", () => {
  for (const shape of SHAPES) {
    it(`paints a ${shape}`, () => {
      const context = scratchContext();
      drawAnyShape(context, particle({ shape }));
      expect(painted(context), `${shape} drew nothing`).to.be.greaterThan(0);
    });
  }

  it("paints an image particle through the shape lookup", () => {
    const context = scratchContext();
    drawAnyShape(context, particle({ shape: "image", image: imageSource() }));
    expect(painted(context)).to.be.greaterThan(0);
  });

  it("paints a glyph particle through the shape lookup", () => {
    const context = scratchContext();
    // A plain letter keeps the assertion independent of a color-emoji font.
    drawAnyShape(context, particle({ shape: "emoji", glyph: "A", size: 16 }));
    expect(painted(context)).to.be.greaterThan(0);
  });
});

describe("renderers: fog", () => {
  it("reuses one rasterized bank per color", () => {
    const first = scratchContext();
    drawAnyShape(first, particle({ shape: "fog", color: "rgba(226,232,240,0.62)", size: 20 }));
    const second = scratchContext();
    drawAnyShape(second, particle({ shape: "fog", color: "rgba(226,232,240,0.62)", size: 20 }));
    expect(painted(first)).to.be.greaterThan(0);
    expect(
      Array.from(second.getImageData(0, 0, SCRATCH, SCRATCH).data),
      "the cached fog sprite must render identically"
    ).to.deep.equal(Array.from(first.getImageData(0, 0, SCRATCH, SCRATCH).data));
  });

  it("keys the cached bank on the color, so a retint is not served a stale sprite", () => {
    const pale = scratchContext();
    drawAnyShape(pale, particle({ shape: "fog", color: "rgba(226,232,240,0.62)", size: 14 }));
    const dark = scratchContext();
    drawAnyShape(dark, particle({ shape: "fog", color: "rgba(15,23,42,0.62)", size: 14 }));
    expect(painted(dark)).to.be.greaterThan(0);
    expect(
      Array.from(dark.getImageData(0, 0, SCRATCH, SCRATCH).data),
      "a second color must get its own bank"
    ).to.not.deep.equal(Array.from(pale.getImageData(0, 0, SCRATCH, SCRATCH).data));
  });
});

describe("renderers: glyph and image guards", () => {
  it("drawEmoji is a no-op without a glyph", () => {
    const context = scratchContext();
    drawEmoji(context, particle({ shape: "emoji" }));
    expect(painted(context)).to.equal(0);
  });

  it("drawImage is a no-op without an image", () => {
    const context = scratchContext();
    drawImage(context, particle({ shape: "image" }));
    expect(painted(context)).to.equal(0);
  });
});

describe("renderers: shape-pair dispatch", () => {
  it("drawEmojiOrImage picks the image renderer only for image particles", () => {
    const asImage = scratchContext();
    drawEmojiOrImage(asImage, particle({ shape: "image", image: imageSource() }));
    expect(painted(asImage), "an image particle must paint its bitmap").to.be.greaterThan(0);

    // Same particle data, but declared as a glyph with no glyph set: the emoji
    // renderer bails out, proving the branch actually switched.
    const asGlyph = scratchContext();
    drawEmojiOrImage(asGlyph, particle({ shape: "emoji", image: imageSource() }));
    expect(painted(asGlyph)).to.equal(0);
  });

  it("drawMagicOrCircle picks the magic renderer only for magic particles", () => {
    const magic = scratchContext();
    drawMagicOrCircle(magic, particle({ shape: "magic", size: 12 }));
    const asMagic = scratchContext();
    drawMagic(asMagic, particle({ shape: "magic", size: 12 }));
    expect(Array.from(magic.getImageData(0, 0, SCRATCH, SCRATCH).data)).to.deep.equal(
      Array.from(asMagic.getImageData(0, 0, SCRATCH, SCRATCH).data)
    );

    const circle = scratchContext();
    drawMagicOrCircle(circle, particle({ shape: "circle", size: 12 }));
    const asCircle = scratchContext();
    drawCircle(asCircle, particle({ shape: "circle", size: 12 }));
    expect(Array.from(circle.getImageData(0, 0, SCRATCH, SCRATCH).data)).to.deep.equal(
      Array.from(asCircle.getImageData(0, 0, SCRATCH, SCRATCH).data)
    );
  });

  it("drawRibbonOrSparkle picks the ribbon renderer only for ribbon particles", () => {
    const ribbon = scratchContext();
    drawRibbonOrSparkle(ribbon, particle({ shape: "ribbon", size: 6, wobbleSpeed: 4 }));
    const direct = scratchContext();
    drawRibbon(direct, particle({ shape: "ribbon", size: 6, wobbleSpeed: 4 }));
    expect(painted(ribbon)).to.equal(painted(direct));

    const sparkle = scratchContext();
    drawRibbonOrSparkle(sparkle, particle({ shape: "sparkle", size: 6 }));
    expect(painted(sparkle)).to.be.greaterThan(0);
    expect(painted(sparkle)).to.not.equal(painted(ribbon));
  });
});

describe("renderers: motion defaults", () => {
  it("a ribbon flutters on its own clock and falls back to a default speed", () => {
    const wide = scratchContext();
    drawRibbon(wide, particle({ shape: "ribbon", size: 8, life: 0, wobbleSpeed: 4 }));
    const narrow = scratchContext();
    // Half a flutter cycle later the strip shows its edge, so it paints less.
    drawRibbon(narrow, particle({ shape: "ribbon", size: 8, life: Math.PI / 8, wobbleSpeed: 4 }));
    expect(painted(wide)).to.be.greaterThan(painted(narrow));

    // With no wobbleSpeed the renderer still flutters, using its own default.
    const defaulted = scratchContext();
    drawRibbon(defaulted, particle({ shape: "ribbon", size: 8, life: 0 }));
    expect(painted(defaulted)).to.equal(painted(wide));
  });

  it("a butterfly beats its wings without a supplied wingbeat speed", () => {
    const supplied = scratchContext();
    drawAnyShape(supplied, particle({ shape: "butterfly", size: 14, wobbleSpeed: 12, life: 0 }));
    const defaulted = scratchContext();
    drawAnyShape(defaulted, particle({ shape: "butterfly", size: 14, life: 0 }));
    expect(painted(supplied)).to.be.greaterThan(0);
    // 12 is the renderer's own fallback, so both must land on the same frame.
    expect(painted(defaulted)).to.equal(painted(supplied));
  });
});

describe("renderers: particleWithRenderer", () => {
  it("attaches a renderer without mutating the source particle", () => {
    const bare: Omit<Particle, "renderer"> = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      gravity: 0,
      drag: 1,
      size: 10,
      color: "#ffffff",
      shape: "circle",
      rotation: 0,
      spin: 0,
      opacity: 1,
      fade: 0,
      life: 0,
      fadeAfter: 99,
      maxLife: 99
    };
    const attached = particleWithRenderer(bare, drawMagic);
    expect(attached.renderer).to.equal(drawMagic);
    expect(attached.shape).to.equal("circle");
    expect(Object.prototype.hasOwnProperty.call(bare, "renderer")).to.equal(false);

    const context = scratchContext();
    attached.renderer(context, attached);
    expect(painted(context), "the attached renderer must be the one that paints").to.be.greaterThan(
      0
    );
  });
});
