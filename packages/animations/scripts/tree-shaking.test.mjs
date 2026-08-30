import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "vite";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const effectsRoot = path.join(packageRoot, "src", "effects");

const effects = [
  "confetti",
  "fireworks",
  "emojiBurst",
  "emojiRain",
  "rain",
  "emojiFountain",
  "bubbles",
  "snow",
  "sparkles",
  "streamers",
  "pulse",
  "stars",
  "hearts",
  "pride",
  "ribbons",
  "glitter",
  "balloons",
  "leaves",
  "petals",
  "coins",
  "shootingStars",
  "fireflies",
  "embers",
  "magicTrail",
  "dustMotes",
  "fog",
  "butterflies",
  "hailstorm",
  "shockwaveDebris",
  "fireworkFinale",
  "successCheck"
];

const rendererNames = [
  "drawBalloon",
  "drawBubble",
  "drawButterfly",
  "drawCircle",
  "drawCoin",
  "drawComet",
  "drawEmber",
  "drawEmoji",
  "drawFirefly",
  "drawFog",
  "drawHail",
  "drawImage",
  "drawLeaf",
  "drawMagic",
  "drawRaindrop",
  "drawRibbon",
  "drawRing",
  "drawShard",
  "drawSparkle",
  "drawSquare"
];

const expectedRenderers = {
  fireworks: ["drawCircle"],
  emojiBurst: ["drawEmoji", "drawImage"],
  emojiRain: ["drawEmoji", "drawImage"],
  rain: ["drawRaindrop"],
  emojiFountain: ["drawEmoji"],
  bubbles: ["drawBubble"],
  snow: ["drawCircle"],
  sparkles: ["drawSparkle"],
  streamers: ["drawRibbon"],
  pulse: ["drawRing"],
  stars: ["drawEmoji", "drawImage"],
  hearts: ["drawEmoji", "drawImage"],
  pride: ["drawRibbon", "drawSparkle"],
  ribbons: ["drawRibbon"],
  balloons: ["drawBalloon"],
  leaves: ["drawLeaf"],
  petals: ["drawLeaf"],
  coins: ["drawCoin"],
  shootingStars: ["drawComet"],
  fireflies: ["drawFirefly"],
  embers: ["drawEmber"],
  magicTrail: ["drawMagic"],
  dustMotes: ["drawCircle"],
  fog: [],
  butterflies: ["drawButterfly"],
  hailstorm: ["drawHail"],
  shockwaveDebris: ["drawRing", "drawShard"],
  fireworkFinale: ["drawCircle"],
  successCheck: ["drawCircle", "drawMagic"]
};

async function bundle(effect, subpath) {
  const entry = `virtual:tree-shaking/${effect}/${subpath ? "subpath" : "barrel"}`;
  const resolvedEntry = `\0${entry}`;
  const specifier = subpath
    ? `@fluid-ds/animations/effects/${effect}`
    : "@fluid-ds/animations/effects";
  const result = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [
      {
        name: "tree-shaking-fixture",
        resolveId(id) {
          if (id === entry) return resolvedEntry;
          if (id === "@fluid-ds/animations/effects") return path.join(effectsRoot, "index.ts");
          if (id === "@fluid-ds/animations/effects/origins") {
            return path.join(effectsRoot, "origins.ts");
          }
          if (id === specifier) return path.join(effectsRoot, `${effect}.ts`);
          return null;
        },
        load(id) {
          if (id !== resolvedEntry) return null;
          const originsSpecifier = subpath
            ? "@fluid-ds/animations/effects/origins"
            : "@fluid-ds/animations/effects";
          return `import { ${effect} } from ${JSON.stringify(specifier)};
            import { EFFECT_ORIGIN_PRESETS } from ${JSON.stringify(originsSpecifier)};
            ${effect}({ sources: EFFECT_ORIGIN_PRESETS.bottom });`;
        }
      }
    ],
    build: {
      write: false,
      minify: false,
      rollupOptions: {
        input: entry,
        output: { format: "es" },
        treeshake: true
      }
    }
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output);
  const chunk = outputs.find((item) => item.type === "chunk" && item.isEntry);
  assert.ok(chunk, `missing bundle output for ${effect}`);
  return chunk.code;
}

for (const effect of effects) {
  test(`${effect} excludes unrelated effects and renderers`, async () => {
    for (const subpath of [false, true]) {
      const code = await bundle(effect, subpath);
      assert.ok(!code.includes("Traced checkmark that disperses"), "gallery catalog leaked in");
      assert.ok(!code.includes("drawLegacyParticle"), "legacy all-shapes renderer leaked in");

      for (const other of effects) {
        if (other === effect) continue;
        assert.ok(!code.includes(`function ${other}(`), `${other} leaked into ${effect}`);
      }

      if (effect === "confetti" || effect === "glitter") continue;
      const allowed = new Set(expectedRenderers[effect] ?? []);
      for (const renderer of rendererNames) {
        if (allowed.has(renderer)) continue;
        assert.ok(!code.includes(`const ${renderer} =`), `${renderer} leaked into ${effect}`);
      }
    }
  });
}
