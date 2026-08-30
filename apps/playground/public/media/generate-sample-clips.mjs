// Generates the playground's own silent sample clips. No third-party media assets:
// the previous remote demo URLs went dead and left the player showing a black box.
/* global URL, document, MediaRecorder, Blob, requestAnimationFrame, performance */
// Run from the workspace root: node apps/playground/public/media/generate-sample-clips.mjs
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";

const require = createRequire(new URL("../../../../packages/media/package.json", import.meta.url));
const { chromium } = require("playwright");

/**
 * Two calm clips.
 *
 * The motion is a slow drift of one gradient, never a cut between two states.
 * An earlier version alternated the background colour on every recorded frame,
 * which at 10fps is a full-frame flash five times a second: unpleasant to sit
 * next to, and past the WCAG 2.3.1 limit of three flashes per second, which is
 * a seizure risk and not something a design system that advertises WCAG 2.2 AA
 * should ship in its own demo. Nothing here changes faster than the eye
 * comfortably follows.
 */
const CLIPS = [
  { file: "sample-clip-1.webm", label: "Chapter 1: Setup", hue: 219 },
  { file: "sample-clip-2.webm", label: "Chapter 2: Theming", hue: 258 }
];

/**
 * Long enough to read as footage rather than a stutter, small enough to live in
 * the repo. These are demo assets committed alongside the source, so the size
 * budget matters: a smooth gradient dithers and compresses poorly, and the
 * clips are only ever shown in a small card.
 */
const DURATION_MS = 6000;
const FPS = 20;
const WIDTH = 480;
const HEIGHT = 270;

// Both demo surfaces serve their own static dir, so each gets a copy.
const TARGETS = [
  new URL("./", import.meta.url),
  new URL("../../../storybook/public/media/", import.meta.url)
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const clip of CLIPS) {
    const bytes = await page.evaluate(
      async ({ label, hue, durationMs, fps, width, height }) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        const stream = canvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
        const chunks = [];
        const complete = new Promise((resolve) => {
          recorder.ondataavailable = (event) => chunks.push(event.data);
          recorder.onstop = async () =>
            resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));
        });

        const draw = (progress) => {
          // One gradient whose angle eases through a third of a turn over the
          // whole clip. Slow enough that any two adjacent frames are nearly
          // identical, which is what keeps it calm and compresses well.
          const angle = progress * Math.PI * 0.66;
          const x = Math.cos(angle) * width;
          const y = Math.sin(angle) * height;
          const gradient = context.createLinearGradient(0, 0, x, y);
          gradient.addColorStop(0, `hsl(${hue} 62% 26%)`);
          gradient.addColorStop(1, `hsl(${hue + 26} 58% 46%)`);
          context.fillStyle = gradient;
          context.fillRect(0, 0, width, height);

          // A single drifting highlight, so there is something to see moving
          // without anything appearing or disappearing.
          const glow = context.createRadialGradient(
            width * (0.3 + progress * 0.4),
            height * 0.5,
            0,
            width * (0.3 + progress * 0.4),
            height * 0.5,
            width * 0.5
          );
          glow.addColorStop(0, "rgba(255,255,255,0.16)");
          glow.addColorStop(1, "rgba(255,255,255,0)");
          context.fillStyle = glow;
          context.fillRect(0, 0, width, height);

          context.fillStyle = "rgba(255,255,255,0.92)";
          context.font = "600 26px system-ui, sans-serif";
          context.fillText(label, 34, height / 2 + 10);
        };

        recorder.start();
        const started = performance.now();
        await new Promise((resolve) => {
          const tick = () => {
            const elapsed = performance.now() - started;
            draw(Math.min(1, elapsed / durationMs));
            if (elapsed >= durationMs) resolve();
            else requestAnimationFrame(tick);
          };
          tick();
        });
        recorder.stop();
        const output = await complete;
        stream.getTracks().forEach((track) => track.stop());
        return output;
      },
      { ...clip, durationMs: DURATION_MS, fps: FPS, width: WIDTH, height: HEIGHT }
    );
    for (const target of TARGETS) {
      await writeFile(new URL(clip.file, target), new Uint8Array(bytes));
    }
  }
} finally {
  await browser.close();
}
