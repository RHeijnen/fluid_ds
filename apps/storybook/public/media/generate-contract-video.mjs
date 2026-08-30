// Generates our own silent, two-second test video. No third-party media assets.
/* global URL, document, MediaRecorder, Blob, setTimeout */
// Run from the workspace root: node apps/storybook/public/media/generate-contract-video.mjs
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";

const require = createRequire(new URL("../../../../packages/media/package.json", import.meta.url));
const { chromium } = require("playwright");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 90;
    const context = canvas.getContext("2d");
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
    const chunks = [];
    const complete = new Promise((resolve) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = async () =>
        resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));
    });
    recorder.start();
    for (let frame = 0; frame < 20; frame++) {
      context.fillStyle = frame % 2 ? "#14532d" : "#1e3a8a";
      context.fillRect(0, 0, 160, 90);
      context.fillStyle = "white";
      context.font = "16px sans-serif";
      context.fillText(`Fluid ${frame + 1}`, 12, 50);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    recorder.stop();
    const output = await complete;
    stream.getTracks().forEach((track) => track.stop());
    return output;
  });
  await writeFile(new URL("contract-video.webm", import.meta.url), new Uint8Array(bytes));
} finally {
  await browser.close();
}
