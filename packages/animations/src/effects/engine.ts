/**
 * Tiny self-contained canvas particle engine for Fluid's celebration
 * effects (confetti, fireworks, snow, and friends). Zero third-party
 * dependencies.
 *
 * The design is deliberately minimal:
 *
 *   - ONE pooled full-viewport `<canvas>` is shared by every active
 *     emitter. It is `position: fixed; inset: 0; pointer-events: none;`
 *     and sits in the top layer so it paints over the page without
 *     intercepting clicks. It is purely decorative, so it is
 *     `aria-hidden="true"` and never focusable.
 *   - ONE shared `requestAnimationFrame` loop ticks every active emitter.
 *     There is no per-emitter rAF, so a dozen simultaneous bursts cost a
 *     single frame callback.
 *   - When the last emitter finishes, the loop stops and the canvas is
 *     removed from the DOM. The next burst lazily re-creates it.
 *
 * Particles carry position, velocity, gravity, drag, rotation, spin,
 * fade, and lifetime, and render as one of four shapes: `square`,
 * `circle`, `emoji` (drawn as text), or `image` (an HTMLImageElement,
 * which also covers rasterized SVG).
 *
 * Accessibility: when `prefers-reduced-motion: reduce` is set the engine
 * does NOT animate. Emitters created in that mode immediately resolve
 * (the public API may opt to paint a single static flash instead, see
 * {@link Emitter.reducedMotionStill}).
 */

/** The shape a particle is drawn as. */
export type ParticleShape =
  | "square"
  | "circle"
  | "ring"
  | "bubble"
  | "balloon"
  | "leaf"
  | "coin"
  | "comet"
  | "raindrop"
  | "firefly"
  | "ember"
  | "magic"
  | "fog"
  | "butterfly"
  | "hail"
  | "shard"
  | "ribbon"
  | "sparkle"
  | "emoji"
  | "image";

/** Draw a particle after the engine has applied opacity, position, and rotation. */
export type ParticleRenderer = (context: CanvasRenderingContext2D, particle: Particle) => void;

/** A single live particle. All distances are CSS pixels, times in ms. */
export interface Particle {
  x: number;
  y: number;
  /** Velocity in px per second. */
  vx: number;
  vy: number;
  /** Downward acceleration in px per second squared. */
  gravity: number;
  /** Per-second velocity multiplier in [0, 1]; 1 means no drag. */
  drag: number;
  /** Half-extent / radius in px. */
  size: number;
  color: string;
  shape: ParticleShape;
  /** Effect-scoped renderer, allowing unused shape implementations to tree-shake. */
  renderer: ParticleRenderer;
  /** Current rotation in radians. */
  rotation: number;
  /** Spin in radians per second. */
  spin: number;
  /** Current opacity in [0, 1]. */
  opacity: number;
  /** Opacity lost per second once `life` exceeds `fadeAfter`. */
  fade: number;
  /** Elapsed lifetime in seconds. */
  life: number;
  /** Seconds before fading begins. */
  fadeAfter: number;
  /** Total lifetime in seconds; particle dies past this. */
  maxLife: number;
  /** Glyph for `emoji` shape. */
  glyph?: string;
  /** Image for `image` shape. */
  image?: CanvasImageSource;
  /** Optional non-uniform width scale for ribbon-like strips. */
  wobble?: number;
  wobbleSpeed?: number;
}

/**
 * An emitter owns a set of particles and, optionally, a per-frame spawn
 * function that adds more over time (used by ambient effects like snow).
 * The engine ticks emitters; the public API in `index.ts` builds them.
 */
export interface Emitter {
  /** Live particles. The engine mutates this in place. */
  particles: Particle[];
  /**
   * Called once per frame with the seconds since the last frame. May push
   * new particles onto {@link Emitter.particles}. Return `false` to signal
   * the emitter will spawn no more (it then ends once its particles die).
   */
  update?: (dt: number, emitter: Emitter) => boolean | void;
  /** Set once the emitter should stop spawning (e.g. user called stop). */
  done: boolean;
  /** Resolved by the engine when the emitter is fully finished. */
  resolve: () => void;
  /** A single static frame to paint when motion is reduced. */
  reducedMotionStill?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  /** Optional full-canvas atmosphere layered behind particles. */
  overlay?: {
    background: string;
    backgroundPosition?: string;
    backgroundSize?: string;
    backdropFilter?: string;
  };
}

/** True when the user asked for reduced motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const CANVAS_ATTR = "data-fluid-effects-canvas";

let canvas: HTMLCanvasElement | undefined;
let ctx: CanvasRenderingContext2D | undefined;
let rafId = 0;
let lastTime = 0;
let dpr = 1;
const emitters = new Set<Emitter>();
/**
 * Emitters whose `update` has returned `false` at least once. Per the
 * {@link Emitter.update} contract that signals "spawn no more", so the engine
 * must STOP calling `update` from then on (otherwise an ambient effect with a
 * `duration` keeps spawning forever and never winds down). The emitter lives on
 * only until its already-spawned particles die. A WeakSet auto-clears once the
 * emitter is unreferenced.
 */
const spawnEnded = new WeakSet<Emitter>();

function createCanvas(): HTMLCanvasElement {
  const el = document.createElement("canvas");
  el.setAttribute(CANVAS_ATTR, "");
  el.setAttribute("aria-hidden", "true");
  // Decorative overlay: cover the viewport, never intercept input, never
  // take focus, paint above app chrome.
  el.style.cssText = [
    "position:fixed",
    "inset:0",
    "width:100%",
    "height:100%",
    "margin:0",
    "padding:0",
    "border:0",
    "pointer-events:none",
    "z-index:2147483646",
    "background:transparent"
  ].join(";");
  el.tabIndex = -1;
  return el;
}

function ensureCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!canvas || !canvas.isConnected) {
    canvas = createCanvas();
    (document.body ?? document.documentElement).appendChild(canvas);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("@fluid-ds/animations: 2D canvas context unavailable.");
    }
    ctx = context;
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });
  }
  if (!ctx) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("@fluid-ds/animations: 2D canvas context unavailable.");
    }
    ctx = context;
  }
  return { canvas, ctx };
}

function resizeCanvas(): void {
  if (!canvas || !ctx) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

function teardownCanvas(): void {
  if (canvas) {
    window.removeEventListener("resize", resizeCanvas);
    canvas.remove();
  }
  canvas = undefined;
  ctx = undefined;
}

/** Current viewport size in CSS px. */
export function viewport(): { width: number; height: number } {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Register an emitter with the engine and start the shared loop if it is
 * not already running. When motion is reduced the emitter does NOT
 * animate: its optional static frame is painted once, then it resolves.
 */
export function addEmitter(emitter: Emitter): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    emitter.resolve();
    return;
  }

  if (prefersReducedMotion()) {
    if (emitter.reducedMotionStill) {
      const { canvas: c, ctx: context } = ensureCanvas();
      context.save();
      context.scale(dpr, dpr);
      emitter.reducedMotionStill(context, c.width / dpr, c.height / dpr);
      context.restore();
      // Clear the static flash shortly after so it does not linger.
      window.setTimeout(() => {
        if (emitters.size === 0) {
          context.clearRect(0, 0, c.width, c.height);
          teardownCanvas();
        }
      }, 400);
    }
    emitter.resolve();
    return;
  }

  ensureCanvas();
  emitters.add(emitter);
  if (!rafId) {
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }
}

/** Stop an emitter immediately: its remaining particles are dropped. */
export function stopEmitter(emitter: Emitter): void {
  emitter.done = true;
  emitter.particles.length = 0;
  emitters.delete(emitter);
  emitter.resolve();
  if (emitters.size === 0) stopLoop();
}

/**
 * Wind an emitter down gracefully: it spawns no more particles (its `update` is
 * never called again), but the ones already on screen finish their motion, and
 * the emitter ends itself and resolves once they are gone. Contrast with
 * {@link stopEmitter}, which drops the particles at once. This reuses the same
 * "spawn no more" path a `duration` uses when it elapses, so a manual stop
 * fizzles out exactly like a timed one.
 */
export function windDownEmitter(emitter: Emitter): void {
  spawnEnded.add(emitter);
}

function stopLoop(): void {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  teardownCanvas();
}

function tick(now: number): void {
  rafId = 0;
  if (!ctx || !canvas) return;

  const dt = Math.min((now - lastTime) / 1000, 0.064);
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  const height = canvas.height / dpr;

  for (const emitter of emitters) {
    // Once `update` has returned false, it is done spawning for good: never
    // call it again, just let the remaining particles play out.
    let stillSpawning = !spawnEnded.has(emitter);
    if (!emitter.done && stillSpawning && emitter.update) {
      if (emitter.update(dt, emitter) === false) {
        spawnEnded.add(emitter);
        stillSpawning = false;
      }
    }

    const next: Particle[] = [];
    for (const p of emitter.particles) {
      stepParticle(p, dt);
      if (isAlive(p, height)) {
        drawParticle(ctx, p);
        next.push(p);
      }
    }
    emitter.particles = next;

    const finished = emitter.done || (!stillSpawning && emitter.particles.length === 0);
    if (finished) {
      emitters.delete(emitter);
      emitter.resolve();
    }
  }

  syncOverlayStyle();

  ctx.restore();

  if (emitters.size > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    stopLoop();
  }
}

function syncOverlayStyle(): void {
  if (!canvas) return;
  let overlay: Emitter["overlay"];
  for (const emitter of emitters) {
    if (emitter.overlay) overlay = emitter.overlay;
  }
  canvas.style.background = overlay?.background ?? "transparent";
  canvas.style.backgroundPosition = overlay?.backgroundPosition ?? "0 0";
  canvas.style.backgroundSize = overlay?.backgroundSize ?? "auto";
  canvas.style.backdropFilter = overlay?.backdropFilter ?? "none";
}

function stepParticle(p: Particle, dt: number): void {
  p.life += dt;
  p.vy += p.gravity * dt;
  const dragFactor = Math.pow(p.drag, dt);
  p.vx *= dragFactor;
  p.vy *= dragFactor;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.rotation += p.spin * dt;
  if (p.life > p.fadeAfter) {
    p.opacity -= p.fade * dt;
  }
  if (p.wobble !== undefined && p.wobbleSpeed !== undefined) {
    p.x += Math.sin(p.life * p.wobbleSpeed) * p.wobble * dt;
  }
}

function isAlive(p: Particle, height: number): boolean {
  return p.opacity > 0.02 && p.life < p.maxLife && p.y < height + 80;
}

/*
 * Emoji are rasterized ONCE per glyph into an offscreen canvas, then blitted
 * with drawImage every frame. Calling ctx.fillText per particle per frame
 * (re-shaping text and rasterizing color-glyph bitmaps each time) is an order
 * of magnitude slower and caused visible frame drops with many emoji on screen.
 */
const EMOJI_SPRITE_PX = 64;
const emojiSpriteCache = new Map<string, HTMLCanvasElement>();
function emojiSprite(glyph: string): HTMLCanvasElement | null {
  const cached = emojiSpriteCache.get(glyph);
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = EMOJI_SPRITE_PX;
  canvas.height = EMOJI_SPRITE_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = `${Math.round(EMOJI_SPRITE_PX * 0.8)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, EMOJI_SPRITE_PX / 2, EMOJI_SPRITE_PX / 2);
  emojiSpriteCache.set(glyph, canvas);
  return canvas;
}

/** @deprecated Internal fallback; public effects use tree-shakeable scoped renderers. */
export function drawLegacyParticle(context: CanvasRenderingContext2D, p: Particle): void {
  context.save();
  context.globalAlpha = Math.max(0, Math.min(1, p.opacity));
  context.translate(p.x, p.y);
  context.rotate(p.rotation);

  switch (p.shape) {
    case "circle": {
      context.fillStyle = p.color;
      context.beginPath();
      context.arc(0, 0, p.size, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "ring": {
      context.strokeStyle = p.color;
      context.lineWidth = Math.max(1.5, p.size * 0.08);
      context.beginPath();
      context.arc(0, 0, p.size, 0, Math.PI * 2);
      context.stroke();
      break;
    }
    case "bubble": {
      context.fillStyle = p.color;
      context.strokeStyle = "rgba(255,255,255,0.75)";
      context.lineWidth = Math.max(1, p.size * 0.1);
      context.beginPath();
      context.arc(0, 0, p.size, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(-p.size * 0.28, -p.size * 0.28, p.size * 0.2, Math.PI, Math.PI * 1.55);
      context.stroke();
      break;
    }
    case "balloon": {
      context.fillStyle = p.color;
      context.beginPath();
      context.ellipse(0, 0, p.size * 0.82, p.size * 1.08, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(255,255,255,0.35)";
      context.beginPath();
      context.ellipse(
        -p.size * 0.25,
        -p.size * 0.32,
        p.size * 0.13,
        p.size * 0.28,
        -0.4,
        0,
        Math.PI * 2
      );
      context.fill();
      context.fillStyle = p.color;
      context.beginPath();
      context.moveTo(-p.size * 0.16, p.size);
      context.lineTo(p.size * 0.16, p.size);
      context.lineTo(0, p.size * 1.28);
      context.closePath();
      context.fill();
      context.strokeStyle = "rgba(60,60,70,0.55)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, p.size * 1.25);
      context.quadraticCurveTo(p.size * 0.35, p.size * 1.9, 0, p.size * 2.5);
      context.stroke();
      break;
    }
    case "leaf": {
      context.fillStyle = p.color;
      context.beginPath();
      context.moveTo(0, -p.size * 1.5);
      context.bezierCurveTo(p.size * 1.15, -p.size * 0.7, p.size, p.size * 0.8, 0, p.size * 1.5);
      context.bezierCurveTo(-p.size, p.size * 0.8, -p.size * 1.15, -p.size * 0.7, 0, -p.size * 1.5);
      context.fill();
      context.strokeStyle = "rgba(70,45,20,0.45)";
      context.lineWidth = Math.max(0.75, p.size * 0.08);
      context.beginPath();
      context.moveTo(0, -p.size * 1.15);
      context.lineTo(0, p.size * 1.25);
      context.stroke();
      break;
    }
    case "coin": {
      context.fillStyle = p.color;
      context.strokeStyle = "rgba(120,70,0,0.7)";
      context.lineWidth = Math.max(1, p.size * 0.16);
      context.beginPath();
      context.ellipse(0, 0, p.size, p.size * 0.72, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.strokeStyle = "rgba(255,255,255,0.55)";
      context.lineWidth = Math.max(0.8, p.size * 0.1);
      context.beginPath();
      context.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
      context.stroke();
      break;
    }
    case "comet": {
      context.fillStyle = p.color;
      context.globalAlpha *= 0.28;
      context.fillRect(-p.size * 7, -p.size * 0.35, p.size * 7, p.size * 0.7);
      context.globalAlpha = Math.max(0, Math.min(1, p.opacity));
      context.beginPath();
      context.arc(0, 0, p.size, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "raindrop": {
      context.strokeStyle = p.color;
      context.lineWidth = Math.max(1, p.size * 0.16);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(0, -p.size * 1.8);
      context.lineTo(0, p.size * 0.65);
      context.stroke();
      context.fillStyle = p.color;
      context.beginPath();
      context.arc(0, p.size * 0.72, Math.max(1, p.size * 0.18), 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "firefly": {
      context.shadowColor = p.color;
      context.shadowBlur = p.size * 3.5;
      context.fillStyle = p.color;
      context.beginPath();
      context.arc(0, 0, p.size, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.fillStyle = "rgba(255,255,255,0.9)";
      context.beginPath();
      context.arc(-p.size * 0.2, -p.size * 0.2, p.size * 0.32, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "ember": {
      context.shadowColor = p.color;
      context.shadowBlur = p.size * 2.5;
      context.fillStyle = p.color;
      context.beginPath();
      context.ellipse(0, 0, p.size * 0.42, p.size * 1.55, 0, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      break;
    }
    case "magic": {
      context.shadowColor = p.color;
      context.shadowBlur = p.size * 3.2;
      context.fillStyle = p.color;
      const r = p.size;
      const t = Math.max(0.8, r * 0.34);
      context.beginPath();
      context.moveTo(0, -r);
      context.lineTo(t, 0);
      context.lineTo(0, r);
      context.lineTo(-t, 0);
      context.closePath();
      context.moveTo(-r, 0);
      context.lineTo(0, -t);
      context.lineTo(r, 0);
      context.lineTo(0, t);
      context.closePath();
      context.fill();
      context.shadowBlur = 0;
      break;
    }
    case "fog": {
      // A stretched radial gradient avoids the hard-edged "floating oval"
      // look and lets overlapping banks merge into one continuous fog field.
      context.scale(2.35, 0.72);
      const fogGradient = context.createRadialGradient(0, 0, p.size * 0.08, 0, 0, p.size);
      fogGradient.addColorStop(0, p.color);
      fogGradient.addColorStop(0.48, p.color);
      fogGradient.addColorStop(1, "transparent");
      context.fillStyle = fogGradient;
      context.beginPath();
      context.arc(0, 0, p.size, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "butterfly": {
      const flap = 0.22 + 0.78 * Math.abs(Math.sin(p.life * (p.wobbleSpeed ?? 7)));
      context.fillStyle = p.color;
      context.beginPath();
      context.ellipse(-p.size * 0.48, 0, p.size * 0.62 * flap, p.size, -0.45, 0, Math.PI * 2);
      context.ellipse(p.size * 0.48, 0, p.size * 0.62 * flap, p.size, 0.45, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(45,35,55,0.8)";
      context.fillRect(-p.size * 0.08, -p.size * 0.72, p.size * 0.16, p.size * 1.44);
      break;
    }
    case "hail": {
      context.fillStyle = p.color;
      context.strokeStyle = "rgba(148,163,184,0.75)";
      context.lineWidth = Math.max(0.8, p.size * 0.12);
      context.beginPath();
      context.arc(0, 0, p.size, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = "rgba(255,255,255,0.9)";
      context.beginPath();
      context.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "shard": {
      context.fillStyle = p.color;
      context.beginPath();
      context.moveTo(0, -p.size * 1.45);
      context.lineTo(p.size * 0.7, p.size);
      context.lineTo(-p.size * 0.45, p.size * 0.45);
      context.closePath();
      context.fill();
      break;
    }
    case "emoji": {
      if (p.glyph) {
        const sprite = emojiSprite(p.glyph);
        const s = p.size * 2;
        if (sprite) context.drawImage(sprite, -p.size, -p.size, s, s);
      }
      break;
    }
    case "image": {
      if (p.image) {
        const s = p.size * 2;
        context.drawImage(p.image, -p.size, -p.size, s, s);
      }
      break;
    }
    case "ribbon": {
      context.fillStyle = p.color;
      // A long, thin strip whose width breathes as it tumbles, so it reads as
      // a party ribbon curling and flashing its edge on the way down.
      const flutter = 0.25 + 0.75 * Math.abs(Math.cos(p.life * (p.wobbleSpeed ?? 4)));
      const w = p.size * 0.6 * flutter;
      const h = p.size * 3.2;
      context.fillRect(-w, -h, w * 2, h * 2);
      break;
    }
    case "sparkle": {
      context.fillStyle = p.color;
      // A four-point twinkle: two crossed spikes. Paired with a quick opacity
      // fade this reads as glinting glitter, not paper confetti.
      const r = p.size;
      const t = Math.max(0.6, r * 0.32);
      context.beginPath();
      context.moveTo(0, -r);
      context.lineTo(t, 0);
      context.lineTo(0, r);
      context.lineTo(-t, 0);
      context.closePath();
      context.moveTo(-r, 0);
      context.lineTo(0, -t);
      context.lineTo(r, 0);
      context.lineTo(0, t);
      context.closePath();
      context.fill();
      break;
    }
    case "square":
    default: {
      context.fillStyle = p.color;
      context.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
      break;
    }
  }

  context.restore();
}

function drawParticle(context: CanvasRenderingContext2D, particle: Particle): void {
  context.save();
  context.globalAlpha = Math.max(0, Math.min(1, particle.opacity));
  context.translate(particle.x, particle.y);
  context.rotate(particle.rotation);
  particle.renderer(context, particle);
  context.restore();
}

/** Test-only: how many emitters are currently active. */
export function activeEmitterCount(): number {
  return emitters.size;
}

/** Test-only: total live particles across every active emitter. Lets a test
 *  watch that an effect stops spawning (the count holds or falls) rather than
 *  runs away (it climbs), without waiting for slow particles to fully drain. */
export function activeParticleCount(): number {
  let total = 0;
  for (const emitter of emitters) total += emitter.particles.length;
  return total;
}

/** Test-only: is the shared canvas currently in the DOM. */
export function isCanvasMounted(): boolean {
  return !!canvas && canvas.isConnected;
}
