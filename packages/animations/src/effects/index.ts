/**
 * @fluid-ds/animations effects: imperative celebration bursts.
 *
 * A small set of canvas-driven "event" effects (confetti, fireworks,
 * emoji rain, snow, sparkles, streamers, pulse, plus a few creative
 * presets) that draw on a single shared overlay canvas. Zero third-party
 * dependencies; reuses the package's particle {@link engine}.
 *
 * Every effect returns a {@link EffectHandle}: an object with a `stop()`
 * method and a `finished` promise that resolves when the burst ends (for
 * ambient effects like {@link snow} that is when you call `stop()`).
 *
 * Each effect has a purpose-tuned default palette. Tinting to the active brand
 * is opt-in: pass `colors: brandColors()` (or any array) per call.
 * `brandColors()` reads the live brand ramp, so an opted-in effect follows a
 * brand / theme.
 *
 * Accessibility: all effects honor `prefers-reduced-motion: reduce`. In
 * that mode nothing animates; an effect either no-ops or paints a single
 * brief static flash, then resolves immediately.
 */

import {
  addEmitter,
  stopEmitter,
  windDownEmitter,
  effectSpace,
  viewport,
  withEffectSpace,
  type Emitter,
  type EffectSpace,
  type Particle,
  type ParticleRenderer,
  type ParticleShape
} from "./engine.js";
import { resolvePalette, pick, RAINBOW } from "./colors.js";
import {
  drawAnyShape,
  drawBalloon,
  drawBubble,
  drawButterfly,
  drawCircle,
  drawCoin,
  drawComet,
  drawEmber,
  drawEmoji,
  drawEmojiOrImage,
  drawFirefly,
  drawHail,
  drawLeaf,
  drawMagic,
  drawMagicOrCircle,
  drawRaindrop,
  drawRibbon,
  drawRibbonOrSparkle,
  drawRing,
  drawShard,
  drawSparkle
} from "./renderers.js";

export {
  prefersReducedMotion,
  activeEmitterCount,
  activeParticleCount,
  isCanvasMounted
} from "./engine.js";
export { defaultColors, brandColors, RAINBOW } from "./colors.js";
export type { EffectSpace, ParticleShape } from "./engine.js";

/** Options shared by every canvas effect. */
export interface EffectOptions {
  /** Coordinate system for particles. Defaults to `viewport`. */
  space?: EffectSpace;
}

/** The handle every effect returns. */
export interface EffectHandle {
  /** Stop the effect now, dropping any remaining particles. Idempotent.
   *  Resolves {@link EffectHandle.finished}. */
  stop(): void;
  /**
   * Wind the effect down gracefully: stop spawning new particles but let the
   * ones already on screen finish their motion, then resolve
   * {@link EffectHandle.finished}. The polite way to end an ambient effect,
   * with no hard cut. Idempotent.
   */
  fizzle(): void;
  /** Resolves when the burst is fully done (or when `stop()` is called). */
  finished: Promise<void>;
}

/**
 * Where an effect originates. Accepts an element (uses its center), an
 * absolute point in the selected effect space, or a relative point in [0, 1]
 * on each axis.
 */
export type Origin = Element | { x: number; y: number } | { rx: number; ry: number };

/** A launch point with an optional direction chosen for that point. */
export interface EffectSource {
  origin: Origin;
  /** Launch direction in degrees (0 = right, 90 = up). */
  angle?: number;
}

export type EffectOriginPreset =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-corners"
  | "bottom-corners"
  | "all-corners";

const TOP_LEFT: EffectSource = { origin: { rx: 0, ry: 0 }, angle: -45 };
const TOP_RIGHT: EffectSource = { origin: { rx: 1, ry: 0 }, angle: -135 };
const BOTTOM_LEFT: EffectSource = { origin: { rx: 0, ry: 1 }, angle: 45 };
const BOTTOM_RIGHT: EffectSource = { origin: { rx: 1, ry: 1 }, angle: 135 };

/** Reusable launch presets with inward-facing directions at the selected
 * effect-space edges. */
export const EFFECT_ORIGIN_PRESETS: Readonly<Record<EffectOriginPreset, readonly EffectSource[]>> =
  {
    center: [{ origin: { rx: 0.5, ry: 0.5 }, angle: 90 }],
    top: [{ origin: { rx: 0.5, ry: 0 }, angle: -90 }],
    bottom: [{ origin: { rx: 0.5, ry: 1 }, angle: 90 }],
    left: [{ origin: { rx: 0, ry: 0.5 }, angle: 0 }],
    right: [{ origin: { rx: 1, ry: 0.5 }, angle: 180 }],
    "top-left": [TOP_LEFT],
    "top-right": [TOP_RIGHT],
    "bottom-left": [BOTTOM_LEFT],
    "bottom-right": [BOTTOM_RIGHT],
    "top-corners": [TOP_LEFT, TOP_RIGHT],
    "bottom-corners": [BOTTOM_LEFT, BOTTOM_RIGHT],
    "all-corners": [TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT]
  };

/** Options shared by most point-burst effects. */
export interface BurstOptions extends EffectOptions {
  /** Origin of the burst. Defaults to the horizontal center, near the top. */
  origin?: Origin;
  /** One or more launch points. Overrides `origin` when non-empty. */
  sources?: readonly EffectSource[];
  /** Working palette. Defaults to the live Fluid brand + status tones. */
  colors?: readonly string[];
  /** Particle count. Sensible per-effect default. */
  count?: number;
  /** Spread half-angle in degrees around the launch direction. */
  spread?: number;
  /** Launch direction in degrees (0 = right, 90 = up). */
  angle?: number;
  /** Initial speed in px per second. */
  velocity?: number;
  /** Gravity in px per second squared. */
  gravity?: number;
  /** Base particle half-size in px. */
  size?: number;
  /** Shapes to choose from per particle. */
  shapes?: ParticleShape[];
}

function effectSources(
  opts: BurstOptions,
  fallbackAngle = 90
): { x: number; y: number; angle: number }[] {
  if (opts.sources?.length) {
    return opts.sources.map((source) => ({
      ...toPoint(source.origin),
      angle: source.angle ?? opts.angle ?? fallbackAngle
    }));
  }
  return [{ ...toPoint(opts.origin), angle: opts.angle ?? fallbackAngle }];
}

function splitCount(total: number, index: number, length: number): number {
  const base = Math.floor(total / length);
  return base + (index < total % length ? 1 : 0);
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function bounded(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function toPoint(origin: Origin | undefined): { x: number; y: number } {
  const { width, height } = viewport();
  if (!origin) return { x: width / 2, y: height * 0.35 };
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    const documentSpace = effectSpace() === "document";
    return {
      x: r.left + r.width / 2 + (documentSpace ? window.scrollX : 0),
      y: r.top + r.height / 2 + (documentSpace ? window.scrollY : 0)
    };
  }
  if ("rx" in origin) {
    return { x: origin.rx * width, y: origin.ry * height };
  }
  return { x: origin.x, y: origin.y };
}

/**
 * Build a handle around one or more emitters and register them with the
 * engine. `make` receives a per-emitter `onDone` callback it must wire to
 * each emitter's `resolve`; the handle's `finished` resolves once every
 * emitter has finished (or `stop()` is called).
 */
function run(
  make: (onDone: () => void) => Emitter[],
  space: EffectSpace = "viewport"
): EffectHandle {
  let settle: () => void = () => undefined;
  const finished = new Promise<void>((res) => {
    settle = res;
  });
  let outstanding = 0;
  let settled = false;
  const done = (): void => {
    if (settled) return;
    settled = true;
    settle();
  };
  const one = (): void => {
    outstanding -= 1;
    if (outstanding <= 0) done();
  };

  const made = withEffectSpace(space, () => make(one));
  for (const emitter of made) {
    emitter.space = space;
    if (emitter.update) {
      const update = emitter.update;
      emitter.update = (dt, current) => withEffectSpace(space, () => update(dt, current));
    }
  }
  outstanding = made.length;
  if (outstanding === 0) {
    done();
  } else {
    for (const e of made) addEmitter(e);
  }

  return {
    finished,
    stop(): void {
      for (const e of made) stopEmitter(e);
      done();
    },
    fizzle(): void {
      // Stop spawning; the already-live particles drain and each emitter
      // resolves itself, which settles `finished`. No hard cut.
      for (const e of made) windDownEmitter(e);
    }
  };
}

function runInSpace(opts: EffectOptions, make: (onDone: () => void) => Emitter[]): EffectHandle {
  return run(make, opts.space);
}

/** A brief static center flash used as the reduced-motion fallback. */
function flashStill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: readonly string[]
): void {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = palette[0] ?? "#6366f1";
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.35, Math.min(w, h) * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

interface ParticleSeed {
  x: number;
  y: number;
  palette: string[];
  angleDeg: number;
  spreadDeg: number;
  velocity: number;
  gravity: number;
  size: number;
  shapes: ParticleShape[];
  renderer: ParticleRenderer;
  drag?: number;
  glyphs?: string[];
  images?: CanvasImageSource[];
}

function spawnParticle(seed: ParticleSeed): Particle {
  const angleDeg = bounded(seed.angleDeg, 90, -36_000, 36_000);
  const spreadDeg = bounded(seed.spreadDeg, 0, 0, 360);
  const velocity = bounded(seed.velocity, 0, 0, 5000);
  const angle = (angleDeg + rand(-spreadDeg, spreadDeg)) * (Math.PI / 180);
  const speed = velocity * rand(0.6, 1);
  const shape = seed.shapes[Math.floor(Math.random() * seed.shapes.length)] ?? "square";
  const glyph =
    shape === "emoji" && seed.glyphs && seed.glyphs.length
      ? seed.glyphs[Math.floor(Math.random() * seed.glyphs.length)]
      : undefined;
  const image =
    shape === "image" && seed.images && seed.images.length
      ? seed.images[Math.floor(Math.random() * seed.images.length)]
      : undefined;
  return {
    x: seed.x,
    y: seed.y,
    // Screen Y grows downward, so an upward launch is negative.
    vx: Math.cos(angle) * speed,
    vy: -Math.sin(angle) * speed,
    gravity: bounded(seed.gravity, 0, -2000, 5000),
    drag: bounded(seed.drag, 0.86, 0, 1),
    size: bounded(seed.size, 6, 0.5, 128) * rand(0.7, 1.3),
    color: pick(seed.palette),
    shape,
    renderer: seed.renderer,
    rotation: rand(0, Math.PI * 2),
    spin: rand(-8, 8),
    opacity: 1,
    fade: 1,
    life: 0,
    fadeAfter: 1.2,
    maxLife: rand(1.8, 3),
    glyph,
    image
  };
}

interface BurstEmitterArgs extends ParticleSeed {
  count: number;
}

/** A one-shot emitter: spawn `count` particles, end when they die. */
function burstEmitter(args: BurstEmitterArgs, onDone: () => void): Emitter {
  const emitter: Emitter = {
    particles: [],
    done: false,
    resolve: onDone,
    update: () => false,
    reducedMotionStill: (ctx, w, h) => flashStill(ctx, w, h, args.palette)
  };
  const count = Math.floor(bounded(args.count, 0, 0, 2000));
  for (let i = 0; i < count; i += 1) {
    emitter.particles.push(spawnParticle(args));
  }
  return emitter;
}

/** A continuous-spawn emitter that runs until its `update` returns false. */
function ambientEmitter(
  palette: readonly string[],
  update: (dt: number, em: Emitter) => boolean,
  onDone: () => void
): Emitter {
  return {
    particles: [],
    done: false,
    update,
    resolve: onDone,
    reducedMotionStill: (ctx, w, h) => flashStill(ctx, w, h, palette)
  };
}

/* ------------------------------------------------------------------ */
/* Confetti                                                            */
/* ------------------------------------------------------------------ */

/**
 * Confetti point burst. Optionally fire two angled "cannons" from the
 * bottom corners instead of a single origin.
 */
export interface ConfettiOptions extends BurstOptions {
  /**
   * Compatibility alias for `sources: EFFECT_ORIGIN_PRESETS["bottom-corners"]`.
   */
  cannons?: boolean;
}

export function confetti(opts: ConfettiOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const shapes = opts.shapes ?? (["square", "circle"] as ParticleShape[]);
  const count = bounded(opts.count, 80, 0, 2000);
  const gravity = bounded(opts.gravity, 900, -2000, 5000);
  const size = bounded(opts.size, 6, 0.5, 128);
  const velocity = bounded(opts.velocity, 900, 0, 5000);

  return runInSpace(opts, (onDone) => {
    const configured =
      opts.cannons && !opts.sources?.length
        ? { ...opts, sources: EFFECT_ORIGIN_PRESETS["bottom-corners"] }
        : opts;
    const sources = effectSources(configured);
    return sources.map((source, index) =>
      burstEmitter(
        {
          x: source.x,
          y: source.y,
          palette,
          angleDeg: source.angle,
          spreadDeg: opts.spread ?? 55,
          velocity,
          gravity,
          size,
          shapes,
          renderer: drawAnyShape,
          count: splitCount(count, index, sources.length)
        },
        onDone
      )
    );
  });
}

/** Six ordered rainbow ribbon streams opening into a celebratory fan. */
export type PrideOptions = BurstOptions;

export function pride(opts: PrideOptions = {}): EffectHandle {
  const count = Math.floor(bounded(opts.count, 120, 0, 2000));
  const configured =
    !opts.sources?.length && opts.origin === undefined
      ? { ...opts, sources: EFFECT_ORIGIN_PRESETS.bottom }
      : opts;
  const sources = withEffectSpace(opts.space ?? "viewport", () => effectSources(configured));
  return runInSpace(opts, (onDone) => {
    const emitters: Emitter[] = [];
    for (const [sourceIndex, source] of sources.entries()) {
      for (let stripe = 0; stripe < RAINBOW.length; stripe += 1) {
        const centered = stripe - (RAINBOW.length - 1) / 2;
        const emitter = burstEmitter(
          {
            x: source.x,
            y: source.y,
            palette: [RAINBOW[stripe] ?? "#e40303"],
            angleDeg: source.angle + centered * 7,
            spreadDeg: opts.spread ?? 8,
            velocity: opts.velocity ?? 760,
            gravity: opts.gravity ?? 520,
            size: opts.size ?? 5,
            shapes: ["ribbon", "sparkle"],
            renderer: drawRibbonOrSparkle,
            drag: 0.82,
            count: splitCount(
              count,
              sourceIndex * RAINBOW.length + stripe,
              RAINBOW.length * sources.length
            )
          },
          onDone
        );
        for (const particle of emitter.particles) {
          particle.wobble = rand(24, 60);
          particle.wobbleSpeed = rand(2.5, 5);
          particle.fadeAfter = rand(1.2, 2);
          particle.maxLife = rand(2.2, 3.6);
        }
        emitters.push(emitter);
      }
    }
    return emitters;
  });
}

/* ------------------------------------------------------------------ */
/* Fireworks                                                           */
/* ------------------------------------------------------------------ */

/**
 * Fireworks: rockets launch upward from the bottom, then explode into a
 * radial spray at their apex.
 */
export interface FireworksOptions extends BurstOptions {
  /** Number of rockets to launch. */
  shells?: number;
  /** Milliseconds between successive launches. */
  interval?: number;
  /** Particles per explosion. */
  particlesPerShell?: number;
}

export function fireworks(opts: FireworksOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const shells = Math.floor(bounded(opts.shells, 5, 0, 50));
  const interval = bounded(opts.interval, 450, 16, 10_000);
  const perShell = Math.floor(bounded(opts.particlesPerShell, 70, 0, 1000));
  const gravity = bounded(opts.gravity, 500, -2000, 5000);
  const size = bounded(opts.size, 3, 0.5, 128);

  return runInSpace(opts, (onDone) => {
    const { width, height } = viewport();
    let launched = 0;
    let sinceLast = interval / 1000;
    const rockets = new Set<Particle>();
    const apexY = new WeakMap<Particle, number>();

    const update = (dt: number, em: Emitter): boolean => {
      sinceLast += dt;
      if (launched < shells && sinceLast >= interval / 1000) {
        sinceLast = 0;
        launched += 1;
        const target = rand(height * 0.15, height * 0.4);
        const rocket: Particle = {
          x: rand(width * 0.2, width * 0.8),
          y: height,
          vx: rand(-40, 40),
          vy: -rand(620, 760),
          gravity: 0,
          drag: 1,
          size: Math.max(1, size * 0.65),
          color: pick(palette),
          shape: "circle",
          renderer: drawCircle,
          rotation: 0,
          spin: 0,
          opacity: 1,
          fade: 0,
          life: 0,
          fadeAfter: 99,
          maxLife: 99
        };
        rockets.add(rocket);
        apexY.set(rocket, target);
        em.particles.push(rocket);
      }

      for (const rocket of [...rockets]) {
        const target = apexY.get(rocket);
        if (target !== undefined && (rocket.y <= target || rocket.vy >= 0)) {
          rockets.delete(rocket);
          const idx = em.particles.indexOf(rocket);
          if (idx >= 0) em.particles.splice(idx, 1);
          explode(em.particles, rocket.x, rocket.y, palette, perShell, gravity, size);
        }
      }

      return launched < shells || rockets.size > 0;
    };

    return [ambientEmitter(palette, update, onDone)];
  });
}

function explode(
  into: Particle[],
  x: number,
  y: number,
  palette: string[],
  count: number,
  gravity: number,
  size: number
): void {
  const hue = pick(palette);
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(120, 360);
    into.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity,
      drag: 0.7,
      size: size * rand(0.5, 1),
      color: Math.random() < 0.85 ? hue : pick(palette),
      shape: "circle",
      renderer: drawCircle,
      rotation: 0,
      spin: 0,
      opacity: 1,
      fade: 0.9,
      life: 0,
      fadeAfter: 0.3,
      maxLife: rand(1.2, 2)
    });
  }
}

/* ------------------------------------------------------------------ */
/* Emoji / image bursts and rain                                       */
/* ------------------------------------------------------------------ */

/** Options for emoji / image bursts. */
export interface EmojiBurstOptions extends BurstOptions {
  /** Emoji glyphs to use as particles. */
  emojis?: string[];
  /** Image sources (e.g. logo PNG / rasterized SVG) to use as particles. */
  images?: CanvasImageSource[];
}

function emojiPointBurst(opts: EmojiBurstOptions): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const emojis = opts.emojis ?? ["🎉", "🎊", "✨"];
  const images = opts.images;
  const useImages = !!images && images.length > 0;
  const count = bounded(opts.count, 40, 0, 2000);
  return runInSpace(opts, (onDone) => {
    const sources = effectSources(opts);
    return sources.map((source, index) =>
      burstEmitter(
        {
          x: source.x,
          y: source.y,
          palette,
          angleDeg: source.angle,
          spreadDeg: opts.spread ?? 60,
          velocity: opts.velocity ?? 700,
          gravity: opts.gravity ?? 700,
          size: opts.size ?? 14,
          shapes: useImages ? ["image"] : ["emoji"],
          renderer: drawEmojiOrImage,
          glyphs: emojis,
          images,
          count: splitCount(count, index, sources.length)
        },
        onDone
      )
    );
  });
}

/** A point burst of emoji (or image) particles. */
export function emojiBurst(opts: EmojiBurstOptions = {}): EffectHandle {
  return emojiPointBurst(opts);
}

/** Ambient emoji (or image) rain falling from above. Runs until stopped. */
export interface EmojiRainOptions extends EffectOptions {
  emojis?: string[];
  images?: CanvasImageSource[];
  colors?: readonly string[];
  /** Particles spawned per second. */
  rate?: number;
  /** Base glyph half-size in px. */
  size?: number;
  /** Auto-stop after this many ms (omit to run until `stop()`). */
  duration?: number;
}

export function emojiRain(opts: EmojiRainOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const emojis = opts.emojis ?? ["🎉", "🎊", "⭐", "✨"];
  const images = opts.images;
  const useImages = !!images && images.length > 0;
  const rate = bounded(opts.rate, 24, 0, 500);
  const size = bounded(opts.size, 14, 0.5, 128);

  return runInSpace(opts, (onDone) => {
    const { width } = viewport();
    let acc = 0;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(0, width),
          y: -20,
          vx: rand(-20, 20),
          vy: rand(80, 180),
          gravity: 60,
          drag: 1,
          size: size * rand(0.7, 1.2),
          color: pick(palette),
          shape: useImages ? "image" : "emoji",
          renderer: drawEmojiOrImage,
          rotation: rand(0, Math.PI * 2),
          spin: rand(-2, 2),
          opacity: 1,
          fade: 0.6,
          life: 0,
          fadeAfter: 6,
          maxLife: 12,
          glyph: useImages ? undefined : emojis[Math.floor(Math.random() * emojis.length)],
          image: useImages ? images[Math.floor(Math.random() * images.length)] : undefined
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) {
        return false;
      }
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Rain                                                                */
/* ------------------------------------------------------------------ */

/** Natural cool-blue rain streaks falling across the viewport. */
export interface RainOptions extends EffectOptions {
  colors?: readonly string[];
  /** Drops spawned per second. */
  rate?: number;
  /** Base streak length in px. */
  size?: number;
  /** Auto-stop after this many ms (omit to run until stopped). */
  duration?: number;
}

export function rain(opts: RainOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#7dd3fc", "#38bdf8", "#60a5fa", "#bfdbfe"]);
  const rate = bounded(opts.rate, 72, 0, 500);
  const size = bounded(opts.size, 10, 1, 128);
  return runInSpace(opts, (onDone) => {
    const { width } = viewport();
    let acc = 1;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        const vx = rand(-55, -20);
        const vy = rand(620, 940);
        em.particles.push({
          x: rand(0, width + 80),
          y: -35,
          vx,
          vy,
          gravity: 80,
          drag: 1,
          size: size * rand(0.65, 1.25),
          color: pick(palette),
          shape: "raindrop",
          renderer: drawRaindrop,
          rotation: Math.atan2(vy, vx) - Math.PI / 2,
          spin: 0,
          opacity: rand(0.45, 0.85),
          fade: 0,
          life: 0,
          fadeAfter: 99,
          maxLife: 4
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) return false;
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Snow                                                                */
/* ------------------------------------------------------------------ */

/** Ambient snow falling gently. Runs until stopped. */
export interface SnowOptions extends EffectOptions {
  colors?: readonly string[];
  /** Flakes per second. */
  rate?: number;
  /** Base flake radius in px. */
  size?: number;
  duration?: number;
}

export function snow(opts: SnowOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#ffffff", "#e0f2fe", "#dbeafe"]);
  const rate = bounded(opts.rate, 18, 0, 500);
  const size = bounded(opts.size, 4, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    const { width } = viewport();
    let acc = 0;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(0, width),
          y: -10,
          vx: rand(-15, 15),
          vy: rand(40, 90),
          gravity: 8,
          drag: 1,
          size: size * rand(0.5, 1.3),
          color: pick(palette),
          shape: "circle",
          renderer: drawCircle,
          rotation: 0,
          spin: 0,
          opacity: rand(0.6, 1),
          fade: 0,
          life: 0,
          fadeAfter: 99,
          maxLife: 99,
          wobble: rand(20, 50),
          wobbleSpeed: rand(1, 3)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) {
        return false;
      }
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Sparkles                                                            */
/* ------------------------------------------------------------------ */

/**
 * Subtle shimmer of sparkles around an element (e.g. a premium CTA).
 * Runs until stopped, or for `duration` ms.
 */
export interface SparklesOptions extends EffectOptions {
  origin?: Origin;
  colors?: readonly string[];
  rate?: number;
  size?: number;
  duration?: number;
}

export function sparkles(opts: SparklesOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#fde68a", "#fef9c3", "#ffffff"]);
  const rate = bounded(opts.rate, 14, 0, 500);
  const size = bounded(opts.size, 3, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    const rect = opts.origin instanceof Element ? opts.origin.getBoundingClientRect() : undefined;
    const target = rect
      ? {
          left: rect.left + (effectSpace() === "document" ? window.scrollX : 0),
          right: rect.right + (effectSpace() === "document" ? window.scrollX : 0),
          top: rect.top + (effectSpace() === "document" ? window.scrollY : 0),
          bottom: rect.bottom + (effectSpace() === "document" ? window.scrollY : 0)
        }
      : undefined;
    const point = toPoint(opts.origin);
    let acc = 0;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        const x = target ? rand(target.left, target.right) : point.x + rand(-40, 40);
        const y = target ? rand(target.top, target.bottom) : point.y + rand(-20, 20);
        em.particles.push({
          x,
          y,
          vx: rand(-10, 10),
          vy: rand(-30, -5),
          gravity: 20,
          drag: 0.9,
          size: size * rand(0.6, 1.4),
          color: pick(palette),
          shape: "sparkle",
          renderer: drawSparkle,
          rotation: 0,
          spin: 0,
          opacity: 1,
          fade: 1.8,
          life: 0,
          fadeAfter: 0.25,
          maxLife: rand(0.8, 1.4)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) {
        return false;
      }
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Streamers                                                           */
/* ------------------------------------------------------------------ */

/** Ribbon-strip streamers raining down from a point. */
export interface StreamersOptions extends BurstOptions {
  count?: number;
}

export function streamers(opts: StreamersOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const count = bounded(opts.count, 30, 0, 2000);
  const gravity = bounded(opts.gravity, 300, -2000, 5000);
  return runInSpace(opts, (onDone) => {
    const sources = effectSources(opts);
    const emitters = sources.map((source, index) =>
      burstEmitter(
        {
          x: source.x,
          y: source.y,
          palette,
          angleDeg: source.angle,
          spreadDeg: opts.spread ?? 50,
          velocity: opts.velocity ?? 800,
          gravity,
          size: opts.size ?? 4,
          shapes: ["ribbon"],
          renderer: drawRibbon,
          count: splitCount(count, index, sources.length)
        },
        onDone
      )
    );
    for (const emitter of emitters) {
      // Give each strip a fluttering wobble so it reads as a ribbon.
      for (const particle of emitter.particles) {
        particle.wobble = rand(30, 70);
        particle.wobbleSpeed = rand(2, 5);
        particle.fade = 0.6;
        particle.fadeAfter = 1.5;
        particle.maxLife = rand(2.5, 4);
      }
    }
    return emitters;
  });
}

/* ------------------------------------------------------------------ */
/* Ribbons                                                             */
/* ------------------------------------------------------------------ */

/**
 * Curling gift ribbons bursting from a point. Compared with
 * {@link streamers} the strips launch harder, fall slower, and flutter
 * far more, so they read as ribbon curls drifting down rather than
 * paper strips raining.
 */
export interface RibbonsOptions extends BurstOptions {
  count?: number;
}

export function ribbons(opts: RibbonsOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const count = bounded(opts.count, 16, 0, 2000);
  const gravity = bounded(opts.gravity, 200, -2000, 5000);
  return runInSpace(opts, (onDone) => {
    const sources = effectSources(opts);
    const emitters = sources.map((source, index) =>
      burstEmitter(
        {
          x: source.x,
          y: source.y,
          palette,
          angleDeg: source.angle,
          spreadDeg: opts.spread ?? 65,
          velocity: opts.velocity ?? 700,
          gravity,
          size: opts.size ?? 5,
          shapes: ["ribbon"],
          renderer: drawRibbon,
          drag: 0.6,
          count: splitCount(count, index, sources.length)
        },
        onDone
      )
    );
    for (const emitter of emitters) {
      // Heavy flutter plus a long, slow fall makes each strip curl down.
      for (const particle of emitter.particles) {
        particle.wobble = rand(60, 120);
        particle.wobbleSpeed = rand(3, 6);
        particle.spin = rand(-12, 12);
        particle.fade = 0.5;
        particle.fadeAfter = 2.2;
        particle.maxLife = rand(3.5, 5);
      }
    }
    return emitters;
  });
}

/* ------------------------------------------------------------------ */
/* Glitter                                                             */
/* ------------------------------------------------------------------ */

/**
 * A fine, shimmery dust burst: a dense puff of tiny motes that hangs in
 * the air for a moment, then twinkles away. Staggered short lifetimes
 * give the shimmer; no two motes fade in step.
 */
export interface GlitterOptions extends BurstOptions {
  count?: number;
}

export function glitter(opts: GlitterOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const count = bounded(opts.count, 140, 0, 2000);
  return runInSpace(opts, (onDone) => {
    const sources = effectSources(opts);
    const emitters = sources.map((source, index) =>
      burstEmitter(
        {
          x: source.x,
          y: source.y,
          palette,
          angleDeg: source.angle,
          spreadDeg: opts.spread ?? 75,
          velocity: opts.velocity ?? 420,
          gravity: opts.gravity ?? 240,
          size: opts.size ?? 3,
          shapes: opts.shapes ?? (["sparkle"] as ParticleShape[]),
          renderer: opts.shapes ? drawAnyShape : drawSparkle,
          drag: 0.5,
          count: splitCount(count, index, sources.length)
        },
        onDone
      )
    );
    for (const emitter of emitters) {
      // Staggered quick fades so the dust twinkles out mote by mote.
      for (const particle of emitter.particles) {
        particle.fadeAfter = rand(0.15, 0.6);
        particle.fade = rand(1.4, 2.8);
        particle.maxLife = rand(0.6, 1.8);
      }
    }
    return emitters;
  });
}

/* ------------------------------------------------------------------ */
/* Pulse                                                               */
/* ------------------------------------------------------------------ */

/**
 * A success ripple: one or more concentric discs expanding outward from
 * an element (or point), like a "saved!" confirmation pulse.
 */
export interface PulseOptions extends EffectOptions {
  origin?: Origin;
  colors?: readonly string[];
  /** Number of concentric rings. */
  rings?: number;
  /** Max radius in px. */
  radius?: number;
  /** Ring lifetime in ms. */
  duration?: number;
}

export function pulse(opts: PulseOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const color = palette[0] ?? "#22c55e";
  const rings = Math.floor(bounded(opts.rings, 3, 1, 20));
  const maxR = bounded(opts.radius, 90, 1, 1000);
  const life = bounded(opts.duration, 900, 16, 60_000) / 1000;

  return runInSpace(opts, (onDone) => {
    const p = toPoint(opts.origin);
    const ringsState: { delay: number; t: number }[] = [];
    for (let i = 0; i < rings; i += 1) ringsState.push({ delay: i * 0.18, t: 0 });

    const update = (dt: number, em: Emitter): boolean => {
      em.particles.length = 0;
      let active = false;
      for (const ring of ringsState) {
        if (ring.delay > 0) {
          ring.delay -= dt;
          active = true;
          continue;
        }
        ring.t += dt;
        if (ring.t >= life) continue;
        active = true;
        const progress = ring.t / life;
        em.particles.push(ringDisc(p.x, p.y, progress * maxR, color, 1 - progress));
      }
      return active;
    };

    const emitter = ambientEmitter(palette, update, onDone);
    emitter.reducedMotionStill = (ctx) => {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, maxR * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };
    return [emitter];
  });
}

/** An expanding faint disc that reads as a confirmation ripple. */
function ringDisc(x: number, y: number, radius: number, color: string, opacity: number): Particle {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    gravity: 0,
    drag: 1,
    size: Math.max(radius, 0.5),
    color,
    shape: "ring",
    renderer: drawRing,
    rotation: 0,
    spin: 0,
    opacity: opacity * 0.35,
    fade: 0,
    life: 0,
    fadeAfter: 99,
    maxLife: 99
  };
}

/* ------------------------------------------------------------------ */
/* Creative presets                                                    */
/* ------------------------------------------------------------------ */

/** A burst of star glyphs. */
export function stars(opts: BurstOptions = {}): EffectHandle {
  return emojiPointBurst({ ...opts, emojis: ["⭐", "✨", "🌟"] });
}

/** A burst of heart glyphs. */
export function hearts(opts: BurstOptions = {}): EffectHandle {
  return emojiPointBurst({ ...opts, emojis: ["❤️", "💖", "💕", "🧡", "💛"] });
}

/** A continuous fountain of emoji shooting up from a point and arcing back. */
export interface EmojiFountainOptions extends EffectOptions {
  /** Emoji glyphs to spray (one is picked at random per particle). */
  emojis?: string[];
  colors?: readonly string[];
  /** Where the fountain springs from. Defaults to bottom-centre. */
  origin?: Origin;
  /** Particles per second. */
  rate?: number;
  /** Base glyph half-size in px. */
  size?: number;
  /** Auto-stop after this many ms (omit to run until `stop()`). */
  duration?: number;
}

export function emojiFountain(opts: EmojiFountainOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const emojis = opts.emojis ?? ["🎉", "✨", "⭐", "🎈"];
  const rate = bounded(opts.rate, 22, 0, 500);
  const size = bounded(opts.size, 14, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    const origin = toPoint(opts.origin ?? { rx: 0.5, ry: 1 });
    let acc = 0;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: origin.x + rand(-26, 26),
          y: origin.y,
          vx: rand(-150, 150),
          vy: -rand(540, 780),
          gravity: 760,
          drag: 1,
          size: size * rand(0.7, 1.2),
          color: pick(palette),
          shape: "emoji",
          renderer: drawEmoji,
          rotation: rand(0, Math.PI * 2),
          spin: rand(-5, 5),
          opacity: 1,
          fade: 0.5,
          life: 0,
          fadeAfter: 1.3,
          maxLife: 3.2,
          glyph: emojis[Math.floor(Math.random() * emojis.length)] ?? "🎉"
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) {
        return false;
      }
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/** Ambient translucent bubbles drifting up and gently popping. */
export interface BubbleOptions extends EffectOptions {
  colors?: readonly string[];
  /** Bubbles per second. */
  rate?: number;
  /** Base bubble radius in px. */
  size?: number;
  duration?: number;
}

export function bubbles(opts: BubbleOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const rate = bounded(opts.rate, 14, 0, 500);
  const size = bounded(opts.size, 10, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    const { width, height } = viewport();
    let acc = 0;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(0, width),
          y: height + 20,
          vx: rand(-10, 10),
          vy: -rand(50, 120),
          gravity: -6,
          drag: 1,
          size: size * rand(0.5, 1.4),
          color: pick(palette),
          shape: "bubble",
          renderer: drawBubble,
          rotation: 0,
          spin: 0,
          opacity: rand(0.25, 0.55),
          fade: 0.16,
          life: 0,
          fadeAfter: 1.6,
          maxLife: 12,
          wobble: rand(15, 40),
          wobbleSpeed: rand(1, 2.5)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) {
        return false;
      }
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/** A few balloons released from below, rising and gently swaying. */
export interface BalloonOptions extends EffectOptions {
  colors?: readonly string[];
  /** Balloons released per second. */
  rate?: number;
  /** Base balloon radius in px. */
  size?: number;
  duration?: number;
}

export function balloons(opts: BalloonOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const rate = bounded(opts.rate, 2, 0, 500);
  const size = bounded(opts.size, 16, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    const { width, height } = viewport();
    let acc = 0;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(width * 0.05, width * 0.95),
          y: height + 30,
          vx: rand(-14, 14),
          vy: -rand(60, 110),
          gravity: -14,
          drag: 1,
          size: size * rand(0.75, 1.2),
          color: pick(palette),
          shape: "balloon",
          renderer: drawBalloon,
          rotation: 0,
          spin: 0,
          opacity: rand(0.85, 1),
          fade: 0,
          life: 0,
          fadeAfter: 99,
          maxLife: 12,
          wobble: rand(10, 30),
          wobbleSpeed: rand(0.6, 1.5)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) {
        return false;
      }
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/** Ambient leaves (or petals, via `colors`) tumbling down from above. */
export interface LeafOptions extends EffectOptions {
  colors?: readonly string[];
  /** Leaves per second. */
  rate?: number;
  /** Base leaf half-size in px. */
  size?: number;
  duration?: number;
}

export function leaves(opts: LeafOptions = {}): EffectHandle {
  const palette = resolvePalette(
    opts.colors ?? ["#d97706", "#b45309", "#dc2626", "#ca8a04", "#65a30d"]
  );
  const rate = bounded(opts.rate, 8, 0, 500);
  const size = bounded(opts.size, 12, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    const { width } = viewport();
    let acc = 0;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(0, width),
          y: -15,
          vx: rand(-30, 30),
          vy: rand(50, 110),
          gravity: 12,
          drag: 1,
          size: size * rand(0.6, 1.3),
          color: pick(palette),
          shape: "leaf",
          renderer: drawLeaf,
          rotation: rand(0, Math.PI * 2),
          spin: rand(-3, 3),
          opacity: rand(0.75, 1),
          fade: 0,
          life: 0,
          fadeAfter: 99,
          maxLife: 99,
          wobble: rand(40, 90),
          wobbleSpeed: rand(1.5, 3.5)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) {
        return false;
      }
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Petals                                                              */
/* ------------------------------------------------------------------ */

/** Soft flower petals drifting down across the viewport. */
export type PetalOptions = LeafOptions;

export function petals(opts: PetalOptions = {}): EffectHandle {
  const palette = resolvePalette(
    opts.colors ?? ["#f9a8d4", "#fbcfe8", "#fda4af", "#fecdd3", "#ffffff"]
  );
  const rate = bounded(opts.rate, 9, 0, 500);
  const size = bounded(opts.size, 12, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    const { width } = viewport();
    let acc = 0;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(0, width),
          y: -18,
          vx: rand(-24, 24),
          vy: rand(35, 75),
          gravity: 7,
          drag: 1,
          size: size * rand(0.55, 1.15),
          color: pick(palette),
          shape: "leaf",
          renderer: drawLeaf,
          rotation: rand(0, Math.PI * 2),
          spin: rand(-2.2, 2.2),
          opacity: rand(0.7, 0.95),
          fade: 0,
          life: 0,
          fadeAfter: 99,
          maxLife: 99,
          wobble: rand(55, 110),
          wobbleSpeed: rand(1.2, 2.8)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) return false;
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Coins                                                               */
/* ------------------------------------------------------------------ */

/** A celebratory burst of spinning coins for rewards and milestones. */
export interface CoinOptions extends BurstOptions {
  count?: number;
}

export function coins(opts: CoinOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#fbbf24", "#f59e0b", "#fde68a"]);
  const count = Math.floor(bounded(opts.count, 44, 0, 2000));
  return runInSpace(opts, (onDone) => {
    const sources = effectSources(opts);
    return sources.map((source, index) =>
      burstEmitter(
        {
          x: source.x,
          y: source.y,
          palette,
          angleDeg: source.angle,
          spreadDeg: opts.spread ?? 65,
          velocity: opts.velocity ?? 820,
          gravity: opts.gravity ?? 950,
          size: opts.size ?? 8,
          shapes: ["coin"],
          renderer: drawCoin,
          drag: 0.9,
          count: splitCount(count, index, sources.length)
        },
        onDone
      )
    );
  });
}

/* ------------------------------------------------------------------ */
/* Shooting stars                                                      */
/* ------------------------------------------------------------------ */

/** Fast diagonal comets crossing the viewport for a bounded duration. */
export interface ShootingStarsOptions extends EffectOptions {
  colors?: readonly string[];
  rate?: number;
  size?: number;
  duration?: number;
}

export function shootingStars(opts: ShootingStarsOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#ffffff", "#bfdbfe", "#fde68a"]);
  const rate = bounded(opts.rate, 4, 0, 500);
  const size = bounded(opts.size, 12, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    let elapsed = 0;
    let acc = 1;
    const update = (dt: number, em: Emitter): boolean => {
      const { width, height } = viewport();
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        const vx = -rand(520, 900);
        const vy = rand(180, 330);
        em.particles.push({
          x: rand(width * 0.45, width + 60),
          y: rand(-30, height * 0.3),
          vx,
          vy,
          gravity: 0,
          drag: 1,
          size: size * rand(0.75, 1.3),
          color: pick(palette),
          shape: "comet",
          renderer: drawComet,
          rotation: Math.atan2(vy, vx),
          spin: 0,
          opacity: 1,
          fade: 0.9,
          life: 0,
          fadeAfter: 0.35,
          maxLife: 1.5
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) return false;
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Fireflies                                                           */
/* ------------------------------------------------------------------ */

/** Warm wandering glow points that slowly appear and fade. */
export interface FireflyOptions extends EffectOptions {
  colors?: readonly string[];
  rate?: number;
  size?: number;
  duration?: number;
}

export function fireflies(opts: FireflyOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#fef08a", "#fde047", "#bef264"]);
  const rate = bounded(opts.rate, 7, 0, 500);
  const size = bounded(opts.size, 3, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    let acc = 1;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      const { width, height } = viewport();
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(width * 0.04, width * 0.96),
          y: rand(height * 0.18, height * 0.9),
          vx: rand(-12, 12),
          vy: rand(-9, 9),
          gravity: 0,
          drag: 0.98,
          size: size * rand(0.65, 1.25),
          color: pick(palette),
          shape: "firefly",
          renderer: drawFirefly,
          rotation: 0,
          spin: 0,
          opacity: rand(0.65, 1),
          fade: rand(0.16, 0.28),
          life: 0,
          fadeAfter: rand(1.4, 3),
          maxLife: rand(4.5, 7),
          wobble: rand(12, 28),
          wobbleSpeed: rand(0.8, 2)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) return false;
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Embers                                                              */
/* ------------------------------------------------------------------ */

/** Glowing orange sparks rising and drifting from below. */
export interface EmberOptions extends EffectOptions {
  colors?: readonly string[];
  rate?: number;
  size?: number;
  duration?: number;
}

export function embers(opts: EmberOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#fef08a", "#fb923c", "#f97316", "#ef4444"]);
  const rate = bounded(opts.rate, 24, 0, 500);
  const size = bounded(opts.size, 3, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    let acc = 2;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      const { width, height } = viewport();
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(width * 0.08, width * 0.92),
          y: height + 12,
          vx: rand(-38, 38),
          vy: -rand(100, 250),
          gravity: -12,
          drag: 0.985,
          size: size * rand(0.5, 1.35),
          color: pick(palette),
          shape: "ember",
          renderer: drawEmber,
          rotation: rand(-0.35, 0.35),
          spin: rand(-0.6, 0.6),
          opacity: rand(0.65, 1),
          fade: rand(0.3, 0.6),
          life: 0,
          fadeAfter: rand(0.7, 1.5),
          maxLife: rand(2.4, 4),
          wobble: rand(10, 35),
          wobbleSpeed: rand(1, 2.5)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) return false;
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Magic trail                                                         */
/* ------------------------------------------------------------------ */

/** A short-lived iridescent sparkle trail following an element or point. */
export interface MagicTrailOptions extends EffectOptions {
  origin?: Origin;
  colors?: readonly string[];
  rate?: number;
  size?: number;
  duration?: number;
}

export function magicTrail(opts: MagicTrailOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#c4b5fd", "#f0abfc", "#67e8f9", "#ffffff"]);
  const rate = bounded(opts.rate, 42, 0, 500);
  const size = bounded(opts.size, 5, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    let acc = 2;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      const point = toPoint(opts.origin);
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        const angle = rand(0, Math.PI * 2);
        const velocity = rand(12, 55);
        em.particles.push({
          x: point.x + rand(-8, 8),
          y: point.y + rand(-8, 8),
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          gravity: -10,
          drag: 0.88,
          size: size * rand(0.45, 1.25),
          color: pick(palette),
          shape: "magic",
          renderer: drawMagic,
          rotation: rand(0, Math.PI * 2),
          spin: rand(-3, 3),
          opacity: rand(0.7, 1),
          fade: rand(0.7, 1.2),
          life: 0,
          fadeAfter: rand(0.15, 0.45),
          maxLife: rand(0.8, 1.5)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) return false;
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Dust motes                                                          */
/* ------------------------------------------------------------------ */

/** Slow, low-contrast ambient depth for large quiet surfaces. */
export interface DustMoteOptions extends EffectOptions {
  colors?: readonly string[];
  rate?: number;
  size?: number;
  duration?: number;
}

export function dustMotes(opts: DustMoteOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#fde68a", "#e2e8f0", "#ffffff"]);
  const rate = bounded(opts.rate, 10, 0, 500);
  const size = bounded(opts.size, 3, 0.5, 128);
  return runInSpace(opts, (onDone) => {
    let acc = 3;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      const { width, height } = viewport();
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(0, width),
          y: rand(height * 0.08, height * 0.95),
          vx: rand(-5, 9),
          vy: rand(-8, -2),
          gravity: 0,
          drag: 1,
          size: size * rand(0.35, 1.2),
          color: pick(palette),
          shape: "circle",
          renderer: drawCircle,
          rotation: 0,
          spin: 0,
          opacity: rand(0.12, 0.38),
          fade: rand(0.08, 0.16),
          life: 0,
          fadeAfter: rand(2, 5),
          maxLife: rand(6, 10),
          wobble: rand(8, 22),
          wobbleSpeed: rand(0.35, 1)
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) return false;
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Fog                                                                 */
/* ------------------------------------------------------------------ */

/** Dense, rolling fog that temporarily obscures the viewport before dissipating. */
export interface FogOptions extends EffectOptions {
  colors?: readonly string[];
  /** New fog banks added per second while the fog builds. */
  rate?: number;
  /** Approximate radius of each fog bank in pixels. */
  size?: number;
  /** How long the fog remains on screen before it dissipates. */
  duration?: number;
}

export function fog(opts: FogOptions = {}): EffectHandle {
  const palette = resolvePalette(
    opts.colors ?? ["rgba(226,232,240,0.62)", "rgba(203,213,225,0.54)", "rgba(248,250,252,0.68)"]
  );
  const rate = bounded(opts.rate, 4, 0, 40);
  const size = bounded(opts.size, 240, 40, 480);
  const duration = bounded(opts.duration, 4200, 400, 30000) / 1000;
  return runInSpace(opts, (onDone) => {
    let elapsed = 0;
    const fadeSpan = Math.min(1.2, duration * 0.3);
    const colorWithOpacity = (color: string, opacity: number): string => {
      const rgba = color.match(
        /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
      );
      if (rgba) {
        const alpha = Number(rgba[4] ?? 1) * opacity;
        return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${alpha})`;
      }
      return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
    };
    const update = (dt: number, emitter: Emitter): boolean => {
      elapsed += dt;
      const envelope = Math.max(
        0,
        Math.min(1, elapsed / fadeSpan, (duration - elapsed) / fadeSpan)
      );
      const density = Math.min(1, 0.64 + rate * 0.055);
      const haze = envelope * density;
      const primary = colorWithOpacity(palette[0] ?? "#e2e8f0", haze * 0.86);
      const secondary = colorWithOpacity(palette[1] ?? "#cbd5e1", haze * 0.72);
      const highlight = colorWithOpacity(palette[2] ?? "#f8fafc", haze * 0.9);
      emitter.overlay = {
        background: [
          `radial-gradient(ellipse at 18% 28%, ${highlight} 0%, transparent 58%)`,
          `radial-gradient(ellipse at 78% 68%, ${secondary} 0%, transparent 62%)`,
          `linear-gradient(112deg, ${primary} 0%, ${highlight} 46%, ${secondary} 100%)`
        ].join(","),
        backgroundPosition: `${50 + Math.sin(elapsed * 0.16) * 9}% ${
          50 + Math.cos(elapsed * 0.12) * 7
        }%`,
        backgroundSize: `${135 + size * 0.16}% ${125 + size * 0.12}%`,
        backdropFilter: `blur(${Math.round(envelope * (8 + size * 0.045))}px) saturate(${
          1 - envelope * 0.28
        }) contrast(${1 - envelope * 0.12})`
      };
      return elapsed < duration;
    };
    const emitter = ambientEmitter(palette, update, onDone);
    emitter.overlay = {
      background: "transparent",
      backdropFilter: "none"
    };
    return [emitter];
  });
}

/* ------------------------------------------------------------------ */
/* Butterflies                                                         */
/* ------------------------------------------------------------------ */

/** Colorful butterflies drifting in from the sides on wandering flight paths. */
export interface ButterflyOptions extends EffectOptions {
  colors?: readonly string[];
  /** New butterflies entering per second. */
  rate?: number;
  /** Base butterfly half-size in px. */
  size?: number;
  /** Stop introducing butterflies after this many ms; the ones already on
   *  screen finish their crossing naturally. */
  duration?: number;
}

/**
 * A butterfly's flight plan. Every frame the emitter steers velocity toward
 * a plan-driven target and turns the sprite to face its motion, so a
 * butterfly can swoop and weave but never flies backwards or upside down.
 */
interface ButterflyFlight {
  /** Horizontal travel: 1 enters from the left edge, -1 from the right. */
  dir: 1 | -1;
  /** Cruising speed in px per second (scaled with size to fake depth). */
  cruise: number;
  /** How steeply the vertical wander may pitch, in [0, 1]. */
  agility: number;
  swoopFreq: number;
  swoopPhase: number;
  weaveFreq: number;
  weavePhase: number;
  surgeFreq: number;
  surgePhase: number;
  /** Altitude band in px the butterfly is pulled back into. */
  bandTop: number;
  bandBottom: number;
}

export function butterflies(opts: ButterflyOptions = {}): EffectHandle {
  const palette = resolvePalette(
    opts.colors ?? ["#f472b6", "#a78bfa", "#38bdf8", "#fb923c", "#facc15"]
  );
  const rate = bounded(opts.rate, 3, 0, 100);
  const size = bounded(opts.size, 10, 1, 128);
  return runInSpace(opts, (onDone) => {
    const flights = new WeakMap<Particle, ButterflyFlight>();
    let acc = 2;
    let elapsed = 0;

    const launch = (
      em: Emitter,
      width: number,
      height: number,
      leader?: { p: Particle; f: ButterflyFlight }
    ): void => {
      const dir: 1 | -1 = leader ? leader.f.dir : Math.random() < 0.5 ? 1 : -1;
      // Smaller reads as further away: slower, dimmer, faster wingbeat.
      const depth = rand(0.5, 1.55);
      const cruise = leader
        ? leader.f.cruise * rand(0.92, 1.08)
        : rand(85, 165) * (0.55 + 0.45 * depth);
      const bandCenter = height * rand(0.22, 0.72);
      const flight: ButterflyFlight = {
        dir,
        cruise,
        agility: rand(0.45, 0.95),
        swoopFreq: leader ? leader.f.swoopFreq : rand(0.5, 1.1),
        // A partner shares its leader's swoop but half a cycle out of phase,
        // so the pair keeps crossing paths in a courtship weave.
        swoopPhase: leader ? leader.f.swoopPhase + Math.PI : rand(0, Math.PI * 2),
        weaveFreq: rand(1.6, 3.2),
        weavePhase: rand(0, Math.PI * 2),
        surgeFreq: rand(0.7, 1.4),
        surgePhase: rand(0, Math.PI * 2),
        bandTop: leader
          ? leader.f.bandTop
          : Math.max(height * 0.06, bandCenter - height * rand(0.1, 0.2)),
        bandBottom: leader
          ? leader.f.bandBottom
          : Math.min(height * 0.9, bandCenter + height * rand(0.1, 0.2))
      };
      // Enter from off-screen at a staggered distance, never mid-viewport.
      const entryX = dir > 0 ? -30 - rand(0, 130) : width + 30 + rand(0, 130);
      const particle: Particle = {
        x: leader ? leader.p.x - dir * rand(10, 60) : entryX,
        y: leader ? leader.p.y + rand(-46, 46) : rand(flight.bandTop, flight.bandBottom),
        vx: dir * cruise * 0.8,
        vy: 0,
        gravity: 0,
        drag: 1,
        size: size * depth,
        color: pick(palette),
        shape: "butterfly",
        renderer: drawButterfly,
        rotation: dir > 0 ? Math.PI / 2 : -Math.PI / 2,
        spin: 0,
        opacity: 0.62 + 0.38 * Math.min(1, depth),
        fade: 0.35,
        life: 0,
        fadeAfter: rand(11, 17),
        maxLife: rand(20, 26),
        wobbleSpeed: rand(9, 15) / Math.sqrt(depth)
      };
      flights.set(particle, flight);
      em.particles.push(particle);
    };

    const update = (dt: number, em: Emitter): boolean => {
      const { width, height } = viewport();
      elapsed += dt;
      const spawning = opts.duration === undefined || elapsed * 1000 < opts.duration;
      if (spawning) {
        acc += rate * dt;
        while (acc >= 1) {
          acc -= 1;
          if (em.particles.length >= 400) continue;
          launch(em, width, height);
          // Sometimes a pair enters together and dances around a shared path.
          if (Math.random() < 0.3) {
            const p = em.particles[em.particles.length - 1];
            const f = p && flights.get(p);
            if (p && f) launch(em, width, height, { p, f });
          }
        }
      }
      for (const p of em.particles) {
        const f = flights.get(p);
        if (!f) continue;
        const t = p.life;
        // Layered sines wander the pitch; a band pull keeps flight on screen.
        let vyTarget =
          (Math.sin(t * f.swoopFreq + f.swoopPhase) * 0.62 +
            Math.sin(t * f.weaveFreq + f.weavePhase) * 0.38) *
          f.cruise *
          f.agility;
        if (p.y < f.bandTop) vyTarget += Math.min((f.bandTop - p.y) * 1.4, f.cruise);
        else if (p.y > f.bandBottom) vyTarget -= Math.min((p.y - f.bandBottom) * 1.4, f.cruise);
        // Forward speed surges and eases but never reverses.
        const surge = 0.7 + 0.4 * Math.sin(t * f.surgeFreq + f.surgePhase);
        const vxTarget = f.dir * f.cruise * surge;
        // Cap the climb/dive around 50 degrees: swoops, never loops.
        const pitchLimit = Math.abs(vxTarget) * 1.2;
        vyTarget = Math.max(-pitchLimit, Math.min(pitchLimit, vyTarget));
        const blend = Math.min(1, dt * 2.6);
        p.vx += (vxTarget - p.vx) * blend;
        p.vy += (vyTarget - p.vy) * blend;
        // Face the motion: the sprite's forward is its local -y axis.
        p.rotation = Math.atan2(p.vy, p.vx) + Math.PI / 2;
        // Gone once fully across the far edge.
        if ((f.dir > 0 && p.x > width + 60) || (f.dir < 0 && p.x < -60)) p.opacity = 0;
      }
      // Spawning may end, but steering runs until the last butterfly leaves;
      // returning false earlier would freeze the survivors mid-flight.
      return spawning || em.particles.length > 0;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Hailstorm                                                           */
/* ------------------------------------------------------------------ */

/** Fast icy pellets driven diagonally by a strong gust. */
export interface HailstormOptions extends EffectOptions {
  colors?: readonly string[];
  rate?: number;
  size?: number;
  duration?: number;
}

export function hailstorm(opts: HailstormOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#dbeafe", "#bfdbfe", "#93c5fd"]);
  const rate = bounded(opts.rate, 72, 0, 500);
  const size = bounded(opts.size, 6, 1, 128);
  return runInSpace(opts, (onDone) => {
    let acc = 2;
    let elapsed = 0;
    const update = (dt: number, em: Emitter): boolean => {
      const { width } = viewport();
      elapsed += dt;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        em.particles.push({
          x: rand(-80, width),
          y: -16,
          vx: rand(70, 150),
          vy: rand(240, 400),
          gravity: 420,
          drag: 1,
          size: size * rand(0.65, 1.35),
          color: pick(palette),
          shape: "hail",
          renderer: drawHail,
          rotation: 0,
          spin: 0,
          opacity: rand(0.7, 1),
          fade: 0,
          life: 0,
          fadeAfter: 99,
          maxLife: 5
        });
      }
      if (opts.duration !== undefined && elapsed * 1000 >= opts.duration) return false;
      return true;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Shockwave debris                                                    */
/* ------------------------------------------------------------------ */

/** Expanding impact ring with sharp fragments thrown from its center. */
export interface ShockwaveDebrisOptions extends BurstOptions {
  radius?: number;
  duration?: number;
}

export function shockwaveDebris(opts: ShockwaveDebrisOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#60a5fa", "#a78bfa", "#f8fafc"]);
  const count = bounded(opts.count, 42, 0, 1000);
  const radius = bounded(opts.radius, 130, 10, 1000);
  const life = bounded(opts.duration, 700, 100, 10_000) / 1000;
  return runInSpace(opts, (onDone) => {
    const sources = effectSources(opts, 0);
    const emitters: Emitter[] = [];
    for (const [index, source] of sources.entries()) {
      let elapsed = 0;
      emitters.push(
        ambientEmitter(
          palette,
          (dt, em) => {
            elapsed += dt;
            em.particles.length = 0;
            if (elapsed >= life) return false;
            const progress = elapsed / life;
            em.particles.push(
              ringDisc(source.x, source.y, progress * radius, palette[0] ?? "#60a5fa", 1 - progress)
            );
            return true;
          },
          onDone
        )
      );
      const debris = burstEmitter(
        {
          x: source.x,
          y: source.y,
          palette,
          angleDeg: source.angle,
          spreadDeg: opts.sources?.length ? (opts.spread ?? 55) : (opts.spread ?? 180),
          velocity: opts.velocity ?? 520,
          gravity: opts.gravity ?? 620,
          size: opts.size ?? 6,
          shapes: ["shard"],
          renderer: drawShard,
          drag: 0.82,
          count: splitCount(count, index, sources.length)
        },
        onDone
      );
      for (const particle of debris.particles) {
        particle.fadeAfter = rand(0.35, 0.8);
        particle.maxLife = rand(1.1, 2);
      }
      emitters.push(debris);
    }
    return emitters;
  });
}

/* ------------------------------------------------------------------ */
/* Firework finale                                                     */
/* ------------------------------------------------------------------ */

/** Coordinated waves of simultaneous firework bursts across the sky. */
export type FireworkFinaleOptions = FireworksOptions;

export function fireworkFinale(opts: FireworkFinaleOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const shells = Math.floor(bounded(opts.shells, 12, 1, 50));
  const interval = bounded(opts.interval, 520, 80, 10_000) / 1000;
  const perShell = Math.floor(bounded(opts.particlesPerShell, 60, 5, 1000));
  const gravity = bounded(opts.gravity, 430, -2000, 5000);
  const size = bounded(opts.size, 4, 0.5, 128);
  const positions = [0.18, 0.5, 0.82, 0.34, 0.66];
  return runInSpace(opts, (onDone) => {
    let elapsed = 0;
    let launched = 0;
    const update = (dt: number, em: Emitter): boolean => {
      const { width, height } = viewport();
      elapsed += dt;
      while (launched < shells) {
        const wave = Math.floor(launched / 3);
        const withinWave = launched % 3;
        const cue = wave * interval + withinWave * 0.07;
        if (elapsed < cue) break;
        const rx = positions[launched % positions.length] ?? 0.5;
        const ry = 0.18 + (launched % 3) * 0.1;
        explode(em.particles, width * rx, height * ry, palette, perShell, gravity, size);
        launched += 1;
      }
      return launched < shells;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/* ------------------------------------------------------------------ */
/* Success check burst                                                 */
/* ------------------------------------------------------------------ */

/** Particles draw a checkmark, then release into a short confirmation burst. */
export interface SuccessCheckOptions extends EffectOptions {
  origin?: Origin;
  colors?: readonly string[];
  count?: number;
  size?: number;
  radius?: number;
  duration?: number;
}

export function successCheck(opts: SuccessCheckOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#22c55e", "#4ade80", "#bbf7d0", "#ffffff"]);
  const origin = withEffectSpace(opts.space ?? "viewport", () => toPoint(opts.origin));
  const count = Math.floor(bounded(opts.count, 18, 8, 500));
  const size = bounded(opts.size, 9, 0.5, 128);
  const radius = bounded(opts.radius, 160, 10, 500);
  const traceLife = bounded(opts.duration, 720, 120, 10_000) / 1000;
  const pointAt = (progress: number): { x: number; y: number } => {
    const a = { x: origin.x - radius * 0.72, y: origin.y };
    const b = { x: origin.x - radius * 0.18, y: origin.y + radius * 0.48 };
    const c = { x: origin.x + radius * 0.78, y: origin.y - radius * 0.62 };
    if (progress < 0.36) {
      const t = progress / 0.36;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    const t = (progress - 0.36) / 0.64;
    return { x: b.x + (c.x - b.x) * t, y: b.y + (c.y - b.y) * t };
  };
  return runInSpace(opts, (onDone) => {
    let elapsed = 0;
    let spawned = 0;
    const update = (dt: number, em: Emitter): boolean => {
      elapsed += dt;
      const progress = Math.min(1, elapsed / traceLife);
      const target = Math.floor(progress * count);
      while (spawned < target) {
        const point = pointAt(spawned / Math.max(1, count - 1));
        em.particles.push({
          x: point.x + rand(-1.5, 1.5),
          y: point.y + rand(-1.5, 1.5),
          vx: 0,
          vy: 0,
          gravity: 0,
          drag: 1,
          size: size * rand(0.65, 1.15),
          color: pick(palette),
          shape: spawned % 6 === 0 ? "magic" : "circle",
          renderer: drawMagicOrCircle,
          rotation: rand(0, Math.PI * 2),
          spin: 0,
          opacity: 1,
          fade: 0,
          life: 0,
          fadeAfter: 99,
          maxLife: 99
        });
        spawned += 1;
      }
      if (progress < 1) return true;
      for (const particle of em.particles) {
        const angle = Math.atan2(particle.y - origin.y, particle.x - origin.x) + rand(-0.5, 0.5);
        const velocity = rand(70, 210);
        particle.vx = Math.cos(angle) * velocity;
        particle.vy = Math.sin(angle) * velocity - 40;
        particle.gravity = 180;
        particle.drag = 0.9;
        particle.fadeAfter = particle.life + 0.08;
        particle.fade = rand(0.8, 1.4);
        particle.maxLife = particle.life + 1.2;
      }
      return false;
    };
    return [ambientEmitter(palette, update, onDone)];
  });
}

/** A numeric option the interactive gallery can expose without guessing which
 * controls an effect actually supports. Consumers can use the same metadata to
 * build their own effect picker. */
export interface EffectControl {
  key:
    | "count"
    | "velocity"
    | "gravity"
    | "size"
    | "spread"
    | "shells"
    | "interval"
    | "particlesPerShell"
    | "rate"
    | "duration"
    | "rings"
    | "radius";
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface EffectCatalogEntry {
  name: string;
  label: string;
  emoji: string;
  /** Short, effect-specific description of the zero-option appearance. */
  description: string;
  kind: "burst" | "sequence" | "ambient" | "ripple";
  origin: boolean;
  /** Whether the effect accepts multiple launch `sources` at once. */
  multiOrigin?: boolean;
  /** Keep the runtime API available while omitting the effect from galleries. */
  hidden?: boolean;
  controls: readonly EffectControl[];
}

const control = (
  key: EffectControl["key"],
  label: string,
  min: number,
  max: number,
  step: number,
  value: number
): EffectControl => ({ key, label, min, max, step, value });

const burstControls = (count = 80, size = 6): readonly EffectControl[] => [
  control("count", "Particles", 10, 300, 1, count),
  control("velocity", "Speed", 200, 1800, 50, 900),
  control("gravity", "Gravity", 0, 1800, 50, 900),
  control("size", "Particle size", 2, 20, 1, size),
  control("spread", "Spread", 5, 180, 5, 55)
];

const ambientControls = (rate: number, size: number): readonly EffectControl[] => [
  control("rate", "Particles / second", 1, 100, 1, rate),
  control("size", "Particle size", 2, 32, 1, size),
  control("duration", "Duration", 400, 8000, 200, 2600)
];

/** Canonical effect metadata. The public names, declarative wrapper, docs
 * gallery, and standalone animation lab all derive from this list so adding an
 * effect no longer requires several independent name registries. */
export const EFFECT_CATALOG = /*#__PURE__*/ (() =>
  [
    {
      name: "confetti",
      label: "Confetti",
      emoji: "🎉",
      description: "Colorful paper burst",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: burstControls()
    },
    {
      name: "fireworks",
      label: "Fireworks",
      emoji: "🎆",
      description: "Multicolor night-sky shells",
      kind: "sequence",
      origin: false,
      controls: [
        control("shells", "Shells", 1, 16, 1, 5),
        control("interval", "Launch interval", 100, 1200, 50, 450),
        control("particlesPerShell", "Particles / shell", 10, 180, 10, 70),
        control("gravity", "Gravity", 0, 1200, 50, 500),
        control("size", "Particle size", 1, 12, 1, 3)
      ]
    },
    {
      name: "pride",
      label: "Pride",
      emoji: "🌈",
      description: "Six-band rainbow ribbon fan",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: [
        control("count", "Particles", 12, 300, 1, 120),
        control("velocity", "Speed", 200, 1600, 10, 760),
        control("gravity", "Gravity", 0, 1400, 10, 520),
        control("size", "Ribbon size", 2, 20, 1, 5),
        control("spread", "Band spread", 2, 40, 1, 8)
      ]
    },
    {
      name: "sparkles",
      label: "Sparkles",
      emoji: "✨",
      description: "Soft gold-and-white shimmer",
      kind: "ambient",
      origin: true,
      controls: ambientControls(14, 3)
    },
    {
      name: "stars",
      label: "Stars",
      emoji: "⭐",
      description: "Bright star burst",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: burstControls(40, 14)
    },
    {
      name: "hearts",
      label: "Hearts",
      emoji: "💖",
      description: "Pink and red heart burst",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: burstControls(40, 14)
    },
    {
      name: "streamers",
      label: "Streamers",
      emoji: "🎊",
      description: "Long colorful streamers",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: burstControls(30, 4)
    },
    {
      name: "pulse",
      label: "Pulse",
      emoji: "💫",
      description: "Expanding colored rings",
      kind: "ripple",
      origin: true,
      controls: [
        control("rings", "Rings", 1, 8, 1, 3),
        control("radius", "Radius", 20, 240, 10, 90),
        control("duration", "Duration", 200, 2400, 100, 900)
      ]
    },
    {
      name: "emojiFountain",
      label: "Emoji fountain",
      emoji: "⛲",
      description: "Rising celebration emoji",
      kind: "ambient",
      origin: true,
      controls: ambientControls(22, 14)
    },
    {
      name: "emojiBurst",
      label: "Emoji burst",
      emoji: "🥳",
      description: "Celebration emoji burst",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: burstControls(40, 14)
    },
    {
      name: "ribbons",
      label: "Ribbons",
      emoji: "🎀",
      description: "Fluttering party ribbons",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: burstControls(16, 5)
    },
    {
      name: "glitter",
      label: "Glitter",
      emoji: "🌟",
      description: "Fine gold-and-white glitter",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: burstControls(140, 3)
    },
    {
      name: "snow",
      label: "Snow",
      emoji: "❄️",
      description: "Soft white-and-blue snowfall",
      kind: "ambient",
      origin: false,
      controls: ambientControls(18, 4)
    },
    {
      name: "emojiRain",
      label: "Emoji rain",
      emoji: "🌧️",
      description: "Falling celebration emoji",
      kind: "ambient",
      origin: false,
      controls: ambientControls(24, 14)
    },
    {
      name: "rain",
      label: "Rain",
      emoji: "🌧️",
      description: "Natural cool-blue rain streaks",
      kind: "ambient",
      origin: false,
      controls: ambientControls(72, 10)
    },
    {
      name: "bubbles",
      label: "Bubbles",
      emoji: "🫧",
      description: "Translucent pastel bubbles",
      kind: "ambient",
      origin: false,
      controls: ambientControls(14, 10)
    },
    {
      name: "balloons",
      label: "Balloons",
      emoji: "🎈",
      description: "Colorful rising balloons",
      kind: "ambient",
      origin: false,
      controls: ambientControls(2, 16)
    },
    {
      name: "leaves",
      label: "Leaves",
      emoji: "🍂",
      description: "Warm autumn leaves",
      kind: "ambient",
      origin: false,
      controls: ambientControls(8, 12)
    },
    {
      name: "petals",
      label: "Petals",
      emoji: "🌸",
      description: "Soft pink-and-white petals",
      kind: "ambient",
      origin: false,
      controls: ambientControls(9, 12)
    },
    {
      name: "coins",
      label: "Coins",
      emoji: "🪙",
      description: "Warm gold reward coins",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: burstControls(44, 8)
    },
    {
      name: "shootingStars",
      label: "Shooting stars",
      emoji: "🌠",
      description: "Fast white-and-gold comets",
      kind: "ambient",
      origin: false,
      controls: ambientControls(4, 12)
    },
    {
      name: "fireflies",
      label: "Fireflies",
      emoji: "🪲",
      description: "Warm wandering glow points",
      kind: "ambient",
      origin: false,
      controls: ambientControls(7, 3)
    },
    {
      name: "embers",
      label: "Embers",
      emoji: "🔥",
      description: "Rising orange heat sparks",
      kind: "ambient",
      origin: false,
      controls: ambientControls(24, 3)
    },
    {
      name: "magicTrail",
      label: "Magic trail",
      emoji: "🪄",
      description: "Iridescent localized sparkle trail",
      kind: "ambient",
      origin: true,
      controls: ambientControls(42, 5)
    },
    {
      name: "dustMotes",
      label: "Dust motes",
      emoji: "🌤️",
      description: "Slow sunlit ambient depth",
      kind: "ambient",
      origin: false,
      hidden: true,
      controls: ambientControls(10, 3)
    },
    {
      name: "fog",
      label: "Fog",
      emoji: "🌫️",
      description: "Dense rolling fog that obscures the viewport",
      kind: "ambient",
      origin: false,
      controls: [
        control("rate", "Fog banks / second", 1, 12, 1, 4),
        control("size", "Fog bank size", 80, 480, 10, 240),
        control("duration", "Obscuration duration", 800, 12000, 200, 4200)
      ]
    },
    {
      name: "butterflies",
      label: "Butterflies",
      emoji: "🦋",
      description: "Butterflies wandering in from the sides",
      kind: "ambient",
      origin: false,
      controls: ambientControls(3, 10)
    },
    {
      name: "hailstorm",
      label: "Hailstorm",
      emoji: "🌨️",
      description: "Fast wind-driven ice pellets",
      kind: "ambient",
      origin: false,
      controls: ambientControls(72, 6)
    },
    {
      name: "shockwaveDebris",
      label: "Shockwave debris",
      emoji: "💥",
      description: "Impact ring with sharp fragments",
      kind: "burst",
      origin: true,
      multiOrigin: true,
      controls: [
        control("count", "Fragments", 10, 200, 1, 42),
        control("velocity", "Speed", 100, 1200, 10, 520),
        control("gravity", "Gravity", 0, 1800, 10, 620),
        control("size", "Fragment size", 2, 20, 1, 6),
        control("radius", "Shockwave radius", 30, 300, 10, 130),
        control("duration", "Ring duration", 200, 1600, 50, 700)
      ]
    },
    {
      name: "fireworkFinale",
      label: "Firework finale",
      emoji: "🎇",
      description: "Coordinated waves of sky bursts",
      kind: "sequence",
      origin: false,
      controls: [
        control("shells", "Shells", 3, 24, 1, 12),
        control("interval", "Wave interval", 100, 1200, 20, 520),
        control("particlesPerShell", "Particles / shell", 10, 160, 10, 60),
        control("gravity", "Gravity", 0, 1200, 10, 430),
        control("size", "Particle size", 1, 16, 1, 4)
      ]
    },
    {
      name: "successCheck",
      label: "Success check",
      emoji: "✅",
      description: "Traced checkmark that disperses",
      kind: "sequence",
      origin: true,
      controls: [
        control("count", "Trace particles", 12, 120, 1, 18),
        control("size", "Particle size", 2, 20, 1, 9),
        control("radius", "Check size", 30, 240, 2, 160),
        control("duration", "Trace duration", 200, 1800, 40, 720)
      ]
    }
  ] as const satisfies readonly EffectCatalogEntry[])();

export type EffectName = (typeof EFFECT_CATALOG)[number]["name"];

/** Every effect name, derived from {@link EFFECT_CATALOG}. */
export const EFFECT_NAMES: readonly EffectName[] = /*#__PURE__*/ EFFECT_CATALOG.map(
  (effect) => effect.name
);

export type EffectFunction = (options?: Record<string, unknown>) => EffectHandle;

/** Canonical callable registry used by `<fluid-celebrate>` and galleries. */
export const EFFECTS: Readonly<Record<EffectName, EffectFunction>> = {
  confetti: confetti as EffectFunction,
  fireworks: fireworks as EffectFunction,
  emojiBurst: emojiBurst as EffectFunction,
  emojiRain: emojiRain as EffectFunction,
  rain: rain as EffectFunction,
  emojiFountain: emojiFountain as EffectFunction,
  bubbles: bubbles as EffectFunction,
  snow: snow as EffectFunction,
  sparkles: sparkles as EffectFunction,
  streamers: streamers as EffectFunction,
  pulse: pulse as EffectFunction,
  stars: stars as EffectFunction,
  hearts: hearts as EffectFunction,
  pride: pride as EffectFunction,
  ribbons: ribbons as EffectFunction,
  glitter: glitter as EffectFunction,
  balloons: balloons as EffectFunction,
  leaves: leaves as EffectFunction,
  petals: petals as EffectFunction,
  coins: coins as EffectFunction,
  shootingStars: shootingStars as EffectFunction,
  fireflies: fireflies as EffectFunction,
  embers: embers as EffectFunction,
  magicTrail: magicTrail as EffectFunction,
  dustMotes: dustMotes as EffectFunction,
  fog: fog as EffectFunction,
  butterflies: butterflies as EffectFunction,
  hailstorm: hailstorm as EffectFunction,
  shockwaveDebris: shockwaveDebris as EffectFunction,
  fireworkFinale: fireworkFinale as EffectFunction,
  successCheck: successCheck as EffectFunction
};
