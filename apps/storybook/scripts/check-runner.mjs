/** Exercise the installed runner without its automatic navigation retry. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const runnerRequire = createRequire(require.resolve("@storybook/test-runner"));
const { chromium } = runnerRequire("playwright");
const { setupPage } = require("@storybook/test-runner");
process.env.TARGET_URL = process.env.TARGET_URL ?? "http://127.0.0.1:6006";
process.env.STORYBOOK_CONFIG_DIR = resolve(here, "../.storybook");
process.env.TEST_CHECK_CONSOLE = "true";

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setupPage(page, context);
  const navigations = [];
  const errors = [];
  // Storybook uses history.replaceState between stories, which also emits
  // framenavigated. Only document requests or lost document identity are reloads.
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      navigations.push(request.url());
  });
  await page.evaluate(() => {
    globalThis.__fluidRunnerDocument = "original-document";
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const ids = [
    "quality-interaction-contracts--button-activation",
    "quality-interaction-contracts--input-typing",
    "quality-interaction-contracts--checkbox-toggle",
    "quality-interaction-contracts--button-activation"
  ];
  for (const id of ids) {
    await page.evaluate((storyId) => globalThis.__test(storyId), id);
    const viewMode = new URL(page.url()).searchParams.get("viewMode");
    assert.equal(viewMode, "story", `Invalid viewMode after ${id}`);
    assert.equal(await page.evaluate(() => globalThis.__fluidRunnerDocument), "original-document");
  }
  assert.deepEqual(navigations, [], "Consecutive stories must not reload the iframe");
  assert.deepEqual(errors, [], "Consecutive stories must not raise page errors");

  // A setup-only play can resolve even when the component does nothing. Prove
  // that this real contract rejects a disabled public operation, not just a
  // deliberately thrown test-runner error. Mutation stays in this browser only.
  const signatureStory = "components-forms-signature-pad--placed-image";
  await page.evaluate((id) => globalThis.__test(id), signatureStory);
  await page.evaluate(() => {
    const pad = globalThis.document.querySelector("fluid-signature-pad");
    if (!pad) throw new Error("Signature negative-control fixture is missing");
    pad.clear();
    const prototype = globalThis.customElements.get("fluid-signature-pad").prototype;
    globalThis.__fluidOriginalPlaceImage = prototype.placeImage;
    globalThis.__fluidPlaceImageMutationCalls = 0;
    prototype.placeImage = async () => {
      globalThis.__fluidPlaceImageMutationCalls++;
    };
  });
  // Storybook can reuse an already-finished render for the same story id.
  // Switch away so the next request must actually run the mutated contract.
  await page.evaluate((id) => globalThis.__test(id), ids[0]);
  try {
    await assert.rejects(
      page.evaluate((id) => globalThis.__test(id), signatureStory),
      /Signature was not signed after placing image/,
      "A no-op placeImage must fail the signature behavior contract"
    );
    assert.equal(await page.evaluate(() => globalThis.__fluidPlaceImageMutationCalls), 1);
  } finally {
    await page.evaluate(() => {
      globalThis.customElements.get("fluid-signature-pad").prototype.placeImage =
        globalThis.__fluidOriginalPlaceImage;
      delete globalThis.__fluidOriginalPlaceImage;
      delete globalThis.__fluidPlaceImageMutationCalls;
    });
  }

  // Replace the cached play function in this disposable browser only. A passing
  // render must not hide an actual play failure after the dependency patch.
  await page.evaluate(async () => {
    const story = await globalThis.__getContext("quality-interaction-contracts--input-typing");
    story.playFunction = async () => {
      throw new Error("runner-regression-intentional-play-failure");
    };
  });
  await assert.rejects(
    page.evaluate(() => globalThis.__test("quality-interaction-contracts--input-typing")),
    /runner-regression-intentional-play-failure/
  );
  assert.deepEqual(navigations, [], "Failure detection must not depend on a reload");
  console.log(
    JSON.stringify(
      {
        browser: browser.version(),
        consecutiveStories: ids.length,
        navigations: navigations.length,
        intentionalPlayFailureRejected: true,
        signatureNoOpRejected: true
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
