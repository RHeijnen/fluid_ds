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
 * Colors default to the live Fluid brand accent plus the status tones,
 * read from CSS custom properties on the document, and are fully
 * overridable per call via `opts.colors`.
 *
 * Accessibility: all effects honor `prefers-reduced-motion: reduce`. In
 * that mode nothing animates; an effect either no-ops or paints a single
 * brief static flash, then resolves immediately.
 */

import {
  addEmitter,
  stopEmitter,
  viewport,
  type Emitter,
  type Particle,
  type ParticleShape
} from "./engine.js";
import { resolvePalette, pick, RAINBOW } from "./colors.js";

export {
  prefersReducedMotion,
  activeEmitterCount,
  isCanvasMounted
} from "./engine.js";
export { defaultColors, RAINBOW } from "./colors.js";
export type { ParticleShape } from "./engine.js";

/** The handle every effect returns. */
export interface EffectHandle {
  /** Stop the effect now. Idempotent. Resolves {@link EffectHandle.finished}. */
  stop(): void;
  /** Resolves when the burst is fully done (or when `stop()` is called). */
  finished: Promise<void>;
}

/**
 * Where an effect originates. Accepts an element (uses its center), an
 * absolute viewport point, or a relative point in [0, 1] on each axis.
 */
export type Origin =
  | Element
  | { x: number; y: number }
  | { rx: number; ry: number };

/** Options shared by most point-burst effects. */
export interface BurstOptions {
  /** Origin of the burst. Defaults to the horizontal center, near the top. */
  origin?: Origin;
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

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function toPoint(origin: Origin | undefined): { x: number; y: number } {
  const { width, height } = viewport();
  if (!origin) return { x: width / 2, y: height * 0.35 };
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
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
function run(make: (onDone: () => void) => Emitter[]): EffectHandle {
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

  const made = make(one);
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
    }
  };
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
  drag?: number;
  glyphs?: string[];
  images?: CanvasImageSource[];
}

function spawnParticle(seed: ParticleSeed): Particle {
  const angle = (seed.angleDeg + rand(-seed.spreadDeg, seed.spreadDeg)) * (Math.PI / 180);
  const speed = seed.velocity * rand(0.6, 1);
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
    gravity: seed.gravity,
    drag: seed.drag ?? 0.86,
    size: seed.size * rand(0.7, 1.3),
    color: pick(seed.palette),
    shape,
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
  for (let i = 0; i < args.count; i += 1) {
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
   * Fire two opposing cannons from the lower corners (the classic
   * "tada" effect) instead of a single point burst.
   */
  cannons?: boolean;
}

export function confetti(opts: ConfettiOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const shapes = opts.shapes ?? (["square", "circle"] as ParticleShape[]);
  const count = opts.count ?? 80;
  const gravity = opts.gravity ?? 900;
  const size = opts.size ?? 6;
  const velocity = opts.velocity ?? 900;

  return run((onDone) => {
    if (opts.cannons) {
      const { width, height } = viewport();
      const half = Math.round(count / 2);
      return [
        burstEmitter(
          {
            x: 0,
            y: height,
            palette,
            angleDeg: 60,
            spreadDeg: opts.spread ?? 45,
            velocity,
            gravity,
            size,
            shapes,
            count: half
          },
          onDone
        ),
        burstEmitter(
          {
            x: width,
            y: height,
            palette,
            angleDeg: 120,
            spreadDeg: opts.spread ?? 45,
            velocity,
            gravity,
            size,
            shapes,
            count: half
          },
          onDone
        )
      ];
    }
    const p = toPoint(opts.origin);
    return [
      burstEmitter(
        {
          x: p.x,
          y: p.y,
          palette,
          angleDeg: opts.angle ?? 90,
          spreadDeg: opts.spread ?? 55,
          velocity,
          gravity,
          size,
          shapes,
          count
        },
        onDone
      )
    ];
  });
}

/** A rainbow-palette confetti preset (fires from both cannons). */
export function pride(opts: ConfettiOptions = {}): EffectHandle {
  return confetti({ cannons: true, ...opts, colors: opts.colors ?? RAINBOW });
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
  const shells = opts.shells ?? 5;
  const interval = opts.interval ?? 450;
  const perShell = opts.particlesPerShell ?? 70;
  const gravity = opts.gravity ?? 500;

  return run((onDone) => {
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
          size: 3,
          color: pick(palette),
          shape: "circle",
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
          explode(em.particles, rocket.x, rocket.y, palette, perShell, gravity);
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
  gravity: number
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
      size: rand(1.5, 3),
      color: Math.random() < 0.85 ? hue : pick(palette),
      shape: "circle",
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

/** A point burst of emoji (or image) particles. */
export function emojiBurst(opts: EmojiBurstOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const emojis = opts.emojis ?? ["🎉", "🎊", "✨"];
  const images = opts.images;
  const useImages = !!images && images.length > 0;
  const count = opts.count ?? 40;
  return run((onDone) => {
    const p = toPoint(opts.origin);
    return [
      burstEmitter(
        {
          x: p.x,
          y: p.y,
          palette,
          angleDeg: opts.angle ?? 90,
          spreadDeg: opts.spread ?? 60,
          velocity: opts.velocity ?? 700,
          gravity: opts.gravity ?? 700,
          size: opts.size ?? 14,
          shapes: useImages ? ["image"] : ["emoji"],
          glyphs: emojis,
          images,
          count
        },
        onDone
      )
    ];
  });
}

/** Ambient emoji (or image) rain falling from above. Runs until stopped. */
export interface EmojiRainOptions {
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
  const rate = opts.rate ?? 24;
  const size = opts.size ?? 14;

  return run((onDone) => {
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
          rotation: rand(0, Math.PI * 2),
          spin: rand(-2, 2),
          opacity: 1,
          fade: 0.6,
          life: 0,
          fadeAfter: 6,
          maxLife: 12,
          glyph: useImages
            ? undefined
            : emojis[Math.floor(Math.random() * emojis.length)],
          image: useImages
            ? images[Math.floor(Math.random() * images.length)]
            : undefined
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
/* Snow                                                                */
/* ------------------------------------------------------------------ */

/** Ambient snow falling gently. Runs until stopped. */
export interface SnowOptions {
  colors?: readonly string[];
  /** Flakes per second. */
  rate?: number;
  /** Base flake radius in px. */
  size?: number;
  duration?: number;
}

export function snow(opts: SnowOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#ffffff", "#e0f2fe", "#dbeafe"]);
  const rate = opts.rate ?? 18;
  const size = opts.size ?? 4;
  return run((onDone) => {
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
export interface SparklesOptions {
  origin?: Origin;
  colors?: readonly string[];
  rate?: number;
  size?: number;
  duration?: number;
}

export function sparkles(opts: SparklesOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors ?? ["#fde68a", "#fef9c3", "#ffffff"]);
  const rate = opts.rate ?? 14;
  const size = opts.size ?? 3;
  return run((onDone) => {
    const target =
      opts.origin instanceof Element ? opts.origin.getBoundingClientRect() : undefined;
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
          shape: "circle",
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
  const count = opts.count ?? 30;
  const gravity = opts.gravity ?? 300;
  return run((onDone) => {
    const p = toPoint(opts.origin);
    const emitter = burstEmitter(
      {
        x: p.x,
        y: p.y,
        palette,
        angleDeg: opts.angle ?? 90,
        spreadDeg: opts.spread ?? 50,
        velocity: opts.velocity ?? 800,
        gravity,
        size: opts.size ?? 4,
        shapes: ["square"],
        count
      },
      onDone
    );
    // Give each strip a fluttering wobble so it reads as a ribbon.
    for (const particle of emitter.particles) {
      particle.wobble = rand(30, 70);
      particle.wobbleSpeed = rand(2, 5);
      particle.fade = 0.6;
      particle.fadeAfter = 1.5;
      particle.maxLife = rand(2.5, 4);
    }
    return [emitter];
  });
}

/* ------------------------------------------------------------------ */
/* Pulse                                                               */
/* ------------------------------------------------------------------ */

/**
 * A success ripple: one or more concentric discs expanding outward from
 * an element (or point), like a "saved!" confirmation pulse.
 */
export interface PulseOptions {
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
  const rings = opts.rings ?? 3;
  const maxR = opts.radius ?? 90;
  const life = (opts.duration ?? 900) / 1000;

  return run((onDone) => {
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
function ringDisc(
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity: number
): Particle {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    gravity: 0,
    drag: 1,
    size: Math.max(radius, 0.5),
    color,
    shape: "circle",
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
  return emojiBurst({ ...opts, emojis: ["⭐", "✨", "🌟"] });
}

/** A burst of heart glyphs. */
export function hearts(opts: BurstOptions = {}): EffectHandle {
  return emojiBurst({ ...opts, emojis: ["❤️", "💖", "💕", "🧡", "💛"] });
}

/** A continuous fountain of emoji shooting up from a point and arcing back. */
export interface EmojiFountainOptions {
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
  const rate = opts.rate ?? 22;
  const size = opts.size ?? 14;
  return run((onDone) => {
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
export interface BubbleOptions {
  colors?: readonly string[];
  /** Bubbles per second. */
  rate?: number;
  /** Base bubble radius in px. */
  size?: number;
  duration?: number;
}

export function bubbles(opts: BubbleOptions = {}): EffectHandle {
  const palette = resolvePalette(opts.colors);
  const rate = opts.rate ?? 14;
  const size = opts.size ?? 10;
  return run((onDone) => {
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
          shape: "circle",
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

/** Every effect name, for introspection / the docs gallery. */
export const EFFECT_NAMES = [
  "confetti",
  "fireworks",
  "emojiBurst",
  "emojiRain",
  "emojiFountain",
  "bubbles",
  "snow",
  "sparkles",
  "streamers",
  "pulse",
  "stars",
  "hearts",
  "pride"
] as const;

export type EffectName = (typeof EFFECT_NAMES)[number];
