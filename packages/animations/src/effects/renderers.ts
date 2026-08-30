import type { Particle, ParticleRenderer, ParticleShape } from "./engine.js";

export const drawCircle: ParticleRenderer = (context, p) => {
  context.fillStyle = p.color;
  context.beginPath();
  context.arc(0, 0, p.size, 0, Math.PI * 2);
  context.fill();
};

export const drawRing: ParticleRenderer = (context, p) => {
  context.strokeStyle = p.color;
  context.lineWidth = Math.max(1.5, p.size * 0.08);
  context.beginPath();
  context.arc(0, 0, p.size, 0, Math.PI * 2);
  context.stroke();
};

export const drawBubble: ParticleRenderer = (context, p) => {
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
};

export const drawBalloon: ParticleRenderer = (context, p) => {
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
};

export const drawLeaf: ParticleRenderer = (context, p) => {
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
};

export const drawCoin: ParticleRenderer = (context, p) => {
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
};

export const drawComet: ParticleRenderer = (context, p) => {
  context.fillStyle = p.color;
  context.globalAlpha *= 0.28;
  context.fillRect(-p.size * 7, -p.size * 0.35, p.size * 7, p.size * 0.7);
  context.globalAlpha = Math.max(0, Math.min(1, p.opacity));
  context.beginPath();
  context.arc(0, 0, p.size, 0, Math.PI * 2);
  context.fill();
};

export const drawRaindrop: ParticleRenderer = (context, p) => {
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
};

export const drawFirefly: ParticleRenderer = (context, p) => {
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
};

export const drawEmber: ParticleRenderer = (context, p) => {
  context.shadowColor = p.color;
  context.shadowBlur = p.size * 2.5;
  context.fillStyle = p.color;
  context.beginPath();
  context.ellipse(0, 0, p.size * 0.42, p.size * 1.55, 0, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
};

export const drawMagic: ParticleRenderer = (context, p) => {
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
};

const FOG_SPRITE_WIDTH = 640;
const FOG_SPRITE_HEIGHT = 320;
const fogSpriteCache = new Map<string, HTMLCanvasElement>();
const fogLobes = [
  [0.08, 0.56, 0.27, 0.52],
  [0.18, 0.42, 0.32, 0.72],
  [0.29, 0.6, 0.3, 0.62],
  [0.4, 0.35, 0.36, 0.82],
  [0.5, 0.56, 0.42, 0.72],
  [0.61, 0.4, 0.34, 0.78],
  [0.72, 0.61, 0.31, 0.6],
  [0.82, 0.38, 0.3, 0.7],
  [0.92, 0.55, 0.25, 0.48],
  [0.27, 0.25, 0.21, 0.38],
  [0.53, 0.22, 0.25, 0.42],
  [0.76, 0.24, 0.2, 0.34],
  [0.35, 0.78, 0.23, 0.34],
  [0.66, 0.77, 0.25, 0.38]
] as const;

function fogSprite(color: string): HTMLCanvasElement | null {
  const cached = fogSpriteCache.get(color);
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = FOG_SPRITE_WIDTH;
  canvas.height = FOG_SPRITE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) return null;

  for (const [rx, ry, rr, opacity] of fogLobes) {
    const x = rx * FOG_SPRITE_WIDTH;
    const y = ry * FOG_SPRITE_HEIGHT;
    const radius = rr * FOG_SPRITE_WIDTH;
    const gradient = context.createRadialGradient(x, y, radius * 0.06, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.28, color);
    gradient.addColorStop(0.68, "rgba(241,245,249,0.26)");
    gradient.addColorStop(1, "rgba(241,245,249,0)");
    context.globalAlpha = opacity;
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x, y, radius, radius * 0.48, 0, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 1;
  fogSpriteCache.set(color, canvas);
  return canvas;
}

export const drawFog: ParticleRenderer = (context, particle) => {
  const sprite = fogSprite(particle.color);
  if (!sprite) return;
  const drift = 1 + Math.sin(particle.life * 0.22 + particle.rotation * 3) * 0.035;
  const width = particle.size * 4.1 * drift;
  const height = particle.size * 1.72;
  context.drawImage(sprite, -width / 2, -height / 2, width, height);
};

export const drawButterfly: ParticleRenderer = (context, p) => {
  const s = p.size;
  // Stable per-particle phase (size is random per butterfly) so wingbeats
  // and glides never sync up across the flock.
  const seed = s * 61.7;
  const beat = Math.sin(p.life * (p.wobbleSpeed ?? 12) + seed);
  // Eased fold: a crisp stroke with a floaty recovery.
  const stroke = Math.pow(Math.abs(beat), 0.65);
  // Brief open-winged glides between flurries of beats.
  const glide = Math.min(1, Math.max(0, (Math.sin(p.life * 0.9 + seed) - 0.55) * 3.4));
  const flap = (0.18 + 0.82 * stroke) * (1 - glide) + 0.96 * glide;
  const alpha = context.globalAlpha;
  // The body bobs against the wingbeat so the flutter reads in the silhouette.
  context.translate(0, (1 - flap) * s * 0.22);

  for (const side of [-1, 1] as const) {
    context.save();
    context.scale(side, 1);
    // Hindwing: softer and translucent, tucked behind the forewing.
    context.globalAlpha = alpha * 0.72;
    context.fillStyle = p.color;
    context.beginPath();
    context.ellipse(s * 0.34 * flap, s * 0.4, s * 0.46 * flap, s * 0.58, 0.6, 0, Math.PI * 2);
    context.fill();
    // Forewing.
    context.globalAlpha = alpha;
    context.beginPath();
    context.ellipse(s * 0.48 * flap, -s * 0.26, s * 0.6 * flap, s * 0.78, 0.42, 0, Math.PI * 2);
    context.fill();
    // A dusky outer tip and a pale spot give the wing its pattern.
    context.fillStyle = "rgba(45,35,55,0.32)";
    context.beginPath();
    context.ellipse(s * 0.82 * flap, -s * 0.62, s * 0.26 * flap, s * 0.34, 0.42, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.4)";
    context.beginPath();
    context.ellipse(s * 0.52 * flap, -s * 0.3, s * 0.11 * flap, s * 0.11, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  // Body, head, and antennae.
  context.fillStyle = "rgba(45,35,55,0.92)";
  context.beginPath();
  context.ellipse(0, s * 0.08, s * 0.08, s * 0.52, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(0, -s * 0.5, s * 0.11, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(45,35,55,0.85)";
  context.lineWidth = Math.max(0.5, s * 0.045);
  context.beginPath();
  context.moveTo(0, -s * 0.52);
  context.quadraticCurveTo(-s * 0.12, -s * 0.86, -s * 0.3, -s * 0.98);
  context.moveTo(0, -s * 0.52);
  context.quadraticCurveTo(s * 0.12, -s * 0.86, s * 0.3, -s * 0.98);
  context.stroke();
};

export const drawHail: ParticleRenderer = (context, p) => {
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
};

export const drawShard: ParticleRenderer = (context, p) => {
  context.fillStyle = p.color;
  context.beginPath();
  context.moveTo(0, -p.size * 1.45);
  context.lineTo(p.size * 0.7, p.size);
  context.lineTo(-p.size * 0.45, p.size * 0.45);
  context.closePath();
  context.fill();
};

const EMOJI_SPRITE_PX = 64;
const emojiSpriteCache = new Map<string, HTMLCanvasElement>();

function emojiSprite(glyph: string): HTMLCanvasElement | null {
  const cached = emojiSpriteCache.get(glyph);
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = EMOJI_SPRITE_PX;
  canvas.height = EMOJI_SPRITE_PX;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.font = `${Math.round(EMOJI_SPRITE_PX * 0.8)}px serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(glyph, EMOJI_SPRITE_PX / 2, EMOJI_SPRITE_PX / 2);
  emojiSpriteCache.set(glyph, canvas);
  return canvas;
}

export const drawEmoji: ParticleRenderer = (context, p) => {
  if (!p.glyph) return;
  const sprite = emojiSprite(p.glyph);
  const size = p.size * 2;
  if (sprite) context.drawImage(sprite, -p.size, -p.size, size, size);
};

export const drawImage: ParticleRenderer = (context, p) => {
  if (!p.image) return;
  const size = p.size * 2;
  context.drawImage(p.image, -p.size, -p.size, size, size);
};

export const drawRibbon: ParticleRenderer = (context, p) => {
  context.fillStyle = p.color;
  const flutter = 0.25 + 0.75 * Math.abs(Math.cos(p.life * (p.wobbleSpeed ?? 4)));
  const width = p.size * 0.6 * flutter;
  const height = p.size * 3.2;
  context.fillRect(-width, -height, width * 2, height * 2);
};

export const drawSparkle: ParticleRenderer = (context, p) => {
  context.fillStyle = p.color;
  const radius = p.size;
  const thickness = Math.max(0.6, radius * 0.32);
  context.beginPath();
  context.moveTo(0, -radius);
  context.lineTo(thickness, 0);
  context.lineTo(0, radius);
  context.lineTo(-thickness, 0);
  context.closePath();
  context.moveTo(-radius, 0);
  context.lineTo(0, -thickness);
  context.lineTo(radius, 0);
  context.lineTo(0, thickness);
  context.closePath();
  context.fill();
};

export const drawSquare: ParticleRenderer = (context, p) => {
  context.fillStyle = p.color;
  context.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
};

const rendererByShape: Readonly<Record<ParticleShape, ParticleRenderer>> = {
  circle: drawCircle,
  ring: drawRing,
  bubble: drawBubble,
  balloon: drawBalloon,
  leaf: drawLeaf,
  coin: drawCoin,
  comet: drawComet,
  raindrop: drawRaindrop,
  firefly: drawFirefly,
  ember: drawEmber,
  magic: drawMagic,
  fog: drawFog,
  butterfly: drawButterfly,
  hail: drawHail,
  shard: drawShard,
  emoji: drawEmoji,
  image: drawImage,
  ribbon: drawRibbon,
  sparkle: drawSparkle,
  square: drawSquare
};

/** Full shape renderer used only by effects that accept arbitrary user shapes. */
export const drawAnyShape: ParticleRenderer = (context, particle) => {
  rendererByShape[particle.shape](context, particle);
};

export const drawRibbonOrSparkle: ParticleRenderer = (context, particle) => {
  (particle.shape === "ribbon" ? drawRibbon : drawSparkle)(context, particle);
};

export const drawEmojiOrImage: ParticleRenderer = (context, particle) => {
  (particle.shape === "image" ? drawImage : drawEmoji)(context, particle);
};

export const drawMagicOrCircle: ParticleRenderer = (context, particle) => {
  (particle.shape === "magic" ? drawMagic : drawCircle)(context, particle);
};

export function particleWithRenderer(
  particle: Omit<Particle, "renderer">,
  renderer: ParticleRenderer
): Particle {
  return { ...particle, renderer };
}
