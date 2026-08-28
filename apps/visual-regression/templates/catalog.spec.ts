import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { catalog } from "../.generated/catalog.js";
import { prepareVisualFixture } from "../fixtures/fixture-helpers.js";
import { attestVisualChromiumLaunch, visualPlatform } from "../visual-platform.js";

const here = dirname(fileURLToPath(import.meta.url));
const acceptedDirectory = resolve(here, "../__screenshots__/catalog.spec.ts");

test.beforeAll(async ({ browser }) => {
  // Materialize the project browser before checking the actual Linux process,
  // so the deterministic raster policy cannot silently fall out of config.
  void browser;
  attestVisualChromiumLaunch();
});

for (const fixture of catalog) {
  test(`${fixture.id} visual contract`, async ({ page }, testInfo) => {
    if (testInfo.project.name !== "light" && !fixture.representative) test.skip();

    if (
      process.env.VR_CANDIDATE_CAPTURE === "1" &&
      existsSync(resolve(acceptedDirectory, `${fixture.id}-${testInfo.project.name}.png`))
    ) {
      test.skip(true, "Accepted baseline exists; candidate capture is gap-only");
    }

    await page.addInitScript(
      ({ fixedTime, randomSeed, mode }) => {
        const NativeDate = Date;
        const fixedEpoch = NativeDate.parse(fixedTime);
        const FixedDate = function (...args: unknown[]) {
          if (new.target) {
            return Reflect.construct(
              NativeDate,
              args.length === 0 ? [fixedEpoch] : args,
              new.target
            );
          }
          return NativeDate();
        } as DateConstructor;
        Object.setPrototypeOf(FixedDate, NativeDate);
        Object.defineProperty(FixedDate, "prototype", { value: NativeDate.prototype });
        FixedDate.now = () => fixedEpoch;
        globalThis.Date = FixedDate;
        let state = randomSeed >>> 0;
        Math.random = () => {
          state = (Math.imul(1_664_525, state) + 1_013_904_223) >>> 0;
          return state / 0x1_0000_0000;
        };
        const applyEnvironment = () => {
          document.documentElement.setAttribute(
            "data-fluid-theme",
            mode === "dark" ? "dark" : "light"
          );
          document.documentElement.lang = mode === "rtl" ? "ar" : "en";
          document.documentElement.dir = mode === "rtl" ? "rtl" : "ltr";
          document.documentElement.dataset.fluidVisualMode = mode;
          document.documentElement.dataset.fluidVisualPlatform = "ubuntu-24.04-x64";
        };
        if (document.documentElement) applyEnvironment();
        else new MutationObserver(applyEnvironment).observe(document, { childList: true });
      },
      {
        fixedTime: visualPlatform.fixedTime,
        randomSeed: visualPlatform.randomSeed,
        mode: testInfo.project.name
      }
    );

    if (testInfo.project.name === "forced-colors") {
      await page.emulateMedia({ forcedColors: "active" });
    } else if (testInfo.project.name === "reduced-motion") {
      await page.emulateMedia({ reducedMotion: "reduce" });
    }

    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.goto(`/iframe.html?id=${fixture.id}&viewMode=story`, {
      waitUntil: "domcontentloaded"
    });
    await page.waitForFunction(
      () => (document.getElementById("storybook-root")?.childElementCount ?? 0) > 0
    );
    await page.evaluate(async (mode) => {
      await document.fonts?.ready;
      document.documentElement.setAttribute("data-fluid-theme", mode === "dark" ? "dark" : "light");
      document.documentElement.lang = mode === "rtl" ? "ar" : "en";
      document.documentElement.dir = mode === "rtl" ? "rtl" : "ltr";
      document.documentElement.dataset.fluidVisualMode = mode;
      document.documentElement.dataset.fluidVisualPlatform = "ubuntu-24.04-x64";
      const tags = new Set(
        [...document.querySelectorAll("*")]
          .map((element) => element.localName)
          .filter((tag) => tag.startsWith("fluid-"))
      );
      await Promise.all([...tags].map((tag) => customElements.whenDefined(tag)));
    }, testInfo.project.name);
    await page.addStyleTag({ content: "* { caret-color: transparent !important; }" });
    await page.evaluate(
      () =>
        new Promise<void>((resolveFrame) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()))
        )
    );

    const guard = await prepareVisualFixture(page, fixture);
    try {
      await guard.assertAttached();
      expect(runtimeErrors, `Runtime errors in ${fixture.id}`).toEqual([]);
      await expect(page).toHaveScreenshot(`${fixture.id}.png`, {
        fullPage: false
      });
      await guard.assertAttached();
      expect(runtimeErrors, `Runtime errors during capture of ${fixture.id}`).toEqual([]);
    } finally {
      await guard.dispose();
    }
  });
}
