import { readFile, writeFile } from "node:fs/promises";
import { availableParallelism, cpus, freemem, hostname, release, totalmem, type } from "node:os";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import { build } from "esbuild";
import { chromium } from "playwright";
import {
  assertHydrationNodes,
  captureHydrationNodes,
  heapSampler,
  metricDeltas,
  performanceSampler,
  validateBudgetMeasurements
} from "./measurement-validity.mjs";
import { summarizeRuns, summarizeSamples } from "./sample-statistics.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const root = join(app, "..", "..");
const resultPath = join(app, "results.json");
const browserMetricNames = [
  "definitionMilliseconds",
  "create100Milliseconds",
  "update100Milliseconds",
  "localeSwitch100Milliseconds",
  "hydrate100Milliseconds",
  "lifecycleHeapGrowthBytes"
];
const cdpMetricNames = ["TaskDuration", "ScriptDuration", "LayoutDuration", "RecalcStyleDuration"];

function configuredInteger(name, fallback, { minimum, maximum }) {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} through ${maximum}`);
  }
  return value;
}

function measurementConfig() {
  return {
    browserWarmupRuns: configuredInteger("BENCHMARK_BROWSER_WARMUPS", 2, {
      minimum: 0,
      maximum: 10
    }),
    browserSampleRuns: configuredInteger("BENCHMARK_BROWSER_SAMPLES", 7, {
      minimum: 3,
      maximum: 20
    }),
    ssrWarmupIterations: configuredInteger("BENCHMARK_SSR_WARMUPS", 50, {
      minimum: 0,
      maximum: 1000
    }),
    ssrSampleRuns: configuredInteger("BENCHMARK_SSR_RUNS", 7, {
      minimum: 3,
      maximum: 20
    }),
    ssrIterationsPerRun: configuredInteger("BENCHMARK_SSR_ITERATIONS", 100, {
      minimum: 10,
      maximum: 1000
    }),
    budgetStatistic: "p95"
  };
}

async function bundleCase(name, definition) {
  const result = await build({
    bundle: true,
    conditions: ["browser", "import"],
    format: "esm",
    logLevel: "silent",
    metafile: true,
    minify: true,
    platform: "browser",
    stdin: { contents: definition.contents, loader: "ts", resolveDir: app },
    treeShaking: true,
    write: false
  });
  const output = result.outputFiles[0].contents;
  const inputs = Object.keys(result.metafile.inputs).map((path) => path.replaceAll("\\", "/"));
  return {
    name,
    result: {
      bytes: output.byteLength,
      gzipBytes: gzipSync(output, { level: 9 }).byteLength,
      modules: inputs.length,
      budgeted: definition.budgeted,
      scenario: definition.scenario
    },
    emittedInputs: Object.values(result.metafile.outputs)[0].inputs
  };
}

async function browserBundle(contents) {
  const result = await build({
    bundle: true,
    conditions: ["browser", "import"],
    format: "iife",
    logLevel: "silent",
    minify: true,
    platform: "browser",
    stdin: { contents, loader: "ts", resolveDir: app },
    write: false
  });
  return result.outputFiles[0].text;
}

function captureErrors(page, errors) {
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console error: ${message.text()}`);
  });
  page.on("requestfailed", (request) =>
    errors.push(`request: ${request.url()} ${request.failure()?.errorText ?? ""}`)
  );
}

async function injectBundle(page, bundle, definition, settleSelector) {
  return page.evaluate(
    async ({ source, expectedDefinition, selector }) => {
      const script = document.createElement("script");
      script.textContent = source;
      const start = performance.now();
      document.head.append(script);
      await customElements.whenDefined(expectedDefinition);
      if (selector) {
        await Promise.all(
          [...document.querySelectorAll(selector)].map((element) => element.updateComplete)
        );
      }
      return performance.now() - start;
    },
    { source: bundle, expectedDefinition: definition, selector: settleSelector }
  );
}

async function measureBrowserRun(browser, runtimeBundle, hydrationBundle, ssrMarkup) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const runtimeErrors = [];
    captureErrors(page, runtimeErrors);
    await page.setContent("<!doctype html><html lang='en'><body></body></html>");

    const runtimeCdp = await context.newCDPSession(page);
    const samplePerformance = await performanceSampler(runtimeCdp, cdpMetricNames);
    const runtimeMetricsBefore = await samplePerformance();
    const definitionMilliseconds = await injectBundle(page, runtimeBundle, "fluid-input");
    const runtime = await page.evaluate(async () => {
      const settle = (elements) => Promise.all(elements.map((element) => element.updateComplete));
      const createStart = performance.now();
      const buttons = Array.from({ length: 100 }, (_, index) => {
        const button = document.createElement("fluid-button");
        button.textContent = `Button ${index}`;
        return button;
      });
      document.body.append(...buttons);
      await settle(buttons);
      const create100Milliseconds = performance.now() - createStart;
      buttons.forEach((button) => button.remove());

      const inputs = Array.from({ length: 100 }, () => document.createElement("fluid-input"));
      document.body.append(...inputs);
      await settle(inputs);
      const updateStart = performance.now();
      inputs.forEach((input, index) => (input.value = `Value ${index}`));
      await settle(inputs);
      const update100Milliseconds = performance.now() - updateStart;
      inputs.forEach((input) => input.remove());

      const copies = Array.from({ length: 100 }, () => document.createElement("fluid-copy-button"));
      document.body.append(...copies);
      await settle(copies);
      const labelsBefore = copies.map((copy) =>
        copy.shadowRoot.querySelector("button").getAttribute("aria-label")
      );
      const localeStart = performance.now();
      document.documentElement.lang = "en-XA";
      await new Promise((resolve) => setTimeout(resolve));
      await settle(copies);
      const localeSwitch100Milliseconds = performance.now() - localeStart;
      const labelsAfter = copies.map((copy) =>
        copy.shadowRoot.querySelector("button").getAttribute("aria-label")
      );
      if (
        labelsAfter.some(
          (label, index) => !label || label === labelsBefore[index] || !label.includes("~~~")
        )
      ) {
        throw new Error("Locale timing completed without translated labels");
      }
      copies.forEach((copy) => copy.remove());
      document.documentElement.lang = "en";
      return { create100Milliseconds, update100Milliseconds, localeSwitch100Milliseconds };
    });

    const heapSize = await heapSampler(runtimeCdp);
    const calibrationBefore = await heapSize();
    await page.evaluate(() => {
      window.fluidHeapCalibration = new Array(1_000_000).fill(42);
    });
    const calibrationAfter = await heapSize();
    const heapCalibrationGrowthBytes = calibrationAfter - calibrationBefore;
    if (heapCalibrationGrowthBytes < 1_000_000) {
      throw new Error("Heap telemetry failed its retained-allocation control");
    }
    await page.evaluate(() => {
      delete window.fluidHeapCalibration;
    });
    await heapSize();
    await page.evaluate(async () => {
      const warm = Array.from({ length: 200 }, () => document.createElement("fluid-button"));
      document.body.append(...warm);
      await Promise.all(warm.map((element) => element.updateComplete));
      warm.forEach((element) => element.remove());
    });
    const heapBeforeBytes = await heapSize();
    await page.evaluate(async () => {
      for (let round = 0; round < 5; round += 1) {
        const elements = Array.from({ length: 200 }, () => document.createElement("fluid-button"));
        document.body.append(...elements);
        await Promise.all(elements.map((element) => element.updateComplete));
        elements.forEach((element) => element.remove());
      }
    });
    const heapAfterBytes = await heapSize();
    const runtimeMetricsAfter = await samplePerformance();
    if (runtimeErrors.length)
      throw new Error(`Runtime browser errors: ${runtimeErrors.join("; ")}`);

    // The runtime page already registered fluid-button. Hydration must use a
    // separate Document realm with parser-created declarative shadow roots.
    const hydrationPage = await context.newPage();
    const hydrationErrors = [];
    captureErrors(hydrationPage, hydrationErrors);
    hydrationPage.on("console", (message) => {
      if (message.type() === "warning" && /hydrat/i.test(message.text())) {
        hydrationErrors.push(`console warning: ${message.text()}`);
      }
    });
    await hydrationPage.route("https://fluid-benchmark.invalid/", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><body>${ssrMarkup}</body></html>`
      })
    );
    await hydrationPage.goto("https://fluid-benchmark.invalid/");
    const hydrationCdp = await context.newCDPSession(hydrationPage);
    const sampleHydrationPerformance = await performanceSampler(hydrationCdp, cdpMetricNames);
    const hydrationMetricsBefore = await sampleHydrationPerformance();
    const serverNodes = await hydrationPage.evaluateHandle(captureHydrationNodes, 100);
    const hydrate100Milliseconds = await injectBundle(
      hydrationPage,
      hydrationBundle,
      "fluid-button",
      "fluid-button"
    );
    await hydrationPage.evaluate(assertHydrationNodes, serverNodes);
    await hydrationPage.evaluate(() => {
      window.fluidHydrationClicks = 0;
      document
        .querySelector("fluid-button")
        .addEventListener("click", () => window.fluidHydrationClicks++);
    });
    await hydrationPage.getByRole("button").first().focus();
    await hydrationPage.keyboard.press("Space");
    if ((await hydrationPage.evaluate(() => window.fluidHydrationClicks)) !== 1) {
      throw new Error("First hydrated interaction failed");
    }
    const hydrationMetricsAfter = await sampleHydrationPerformance();
    if (hydrationErrors.length) {
      throw new Error(`Hydration browser errors: ${hydrationErrors.join("; ")}`);
    }
    await serverNodes.dispose();
    await hydrationPage.close();

    return {
      definitionMilliseconds,
      ...runtime,
      hydrate100Milliseconds,
      heapBeforeBytes,
      heapAfterBytes,
      heapCalibrationGrowthBytes,
      hydratedServerNodesPreserved: 100,
      hydrationFirstInteractionPassed: true,
      lifecycleHeapGrowthBytes: Math.max(0, heapAfterBytes - heapBeforeBytes),
      cdp: {
        domainEnabled: true,
        requiredMetrics: cdpMetricNames,
        runtimeDeltas: metricDeltas(runtimeMetricsBefore, runtimeMetricsAfter),
        hydrationDeltas: metricDeltas(hydrationMetricsBefore, hydrationMetricsAfter)
      }
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const config = measurementConfig();
  await writeFile(
    resultPath,
    `${JSON.stringify(
      { schemaVersion: 3, status: "running", generatedAt: new Date().toISOString(), config },
      null,
      2
    )}\n`
  );
  const budgets = JSON.parse(await readFile(join(app, "budgets.json"), "utf8"));
  const check = process.argv.includes("--check");
  const failures = [];
  const bundleCases = {
    button: {
      contents: 'import "@fluid-ds/components/define/button";',
      budgeted: true,
      scenario: "core"
    },
    dialog: {
      contents: 'import "@fluid-ds/components/define/dialog";',
      budgeted: true,
      scenario: "core"
    },
    input: {
      contents: 'import "@fluid-ds/components/define/input";',
      budgeted: true,
      scenario: "core"
    },
    "react-button": {
      contents: 'export { FluidButton } from "@fluid-ds/react/button";',
      budgeted: true,
      scenario: "framework-wrapper"
    },
    kanban: {
      contents: 'import "../../packages/kanban/src/components/kanban/define.ts";',
      budgeted: false,
      scenario: "expansion-informational"
    },
    "node-graph": {
      contents: 'import "../../packages/node-graph/src/components/node-graph/define.ts";',
      budgeted: false,
      scenario: "expansion-informational"
    }
  };

  const bundles = {};
  for (const [name, definition] of Object.entries(bundleCases)) {
    const measurement = await bundleCase(name, definition);
    bundles[name] = measurement.result;
    const limit = budgets.bundleGzipBytes[name];
    if (definition.budgeted) {
      if (typeof limit !== "number" || !Number.isFinite(limit) || limit < 0) {
        throw new Error(`Invalid bundle budget for ${name}`);
      }
      if (measurement.result.gzipBytes > limit) {
        failures.push(
          `${name} bundle is ${measurement.result.gzipBytes} B gzip; budget is ${limit} B`
        );
      }
      const unrelated = name.includes("button") ? "/components/dialog/" : "/components/button/";
      if (
        Object.entries(measurement.emittedInputs).some(
          ([path, contribution]) =>
            path.replaceAll("\\", "/").includes(unrelated) && contribution.bytesInOutput > 0
        )
      ) {
        failures.push(`${name} bundle includes unrelated path ${unrelated}`);
      }
    }
  }

  await import(
    pathToFileURL(join(root, "packages/components/dist/components/button/define.js")).href
  );
  const { renderFluidToString } = await import(
    pathToFileURL(join(root, "packages/components/dist/ssr.js")).href
  );
  const { html } = await import("lit");
  for (let index = 0; index < config.ssrWarmupIterations; index += 1) {
    await renderFluidToString(html`<fluid-button>Warm up</fluid-button>`);
  }
  const ssrRuns = [];
  for (let run = 0; run < config.ssrSampleRuns; run += 1) {
    const rawMilliseconds = [];
    for (let index = 0; index < config.ssrIterationsPerRun; index += 1) {
      const start = performance.now();
      await renderFluidToString(html`<fluid-button>Benchmark ${run}-${index}</fluid-button>`);
      rawMilliseconds.push(performance.now() - start);
    }
    ssrRuns.push({
      run,
      rawMilliseconds,
      summary: summarizeSamples(rawMilliseconds, config.ssrIterationsPerRun, `SSR run ${run}`)
    });
  }
  const allSsrSamples = ssrRuns.flatMap((run) => run.rawMilliseconds);
  const ssr = {
    warmupIterations: config.ssrWarmupIterations,
    sampleRuns: config.ssrSampleRuns,
    iterationsPerRun: config.ssrIterationsPerRun,
    totalIterations: allSsrSamples.length,
    summary: summarizeSamples(
      allSsrSamples,
      config.ssrSampleRuns * config.ssrIterationsPerRun,
      "SSR"
    ),
    runs: ssrRuns
  };
  if (ssr.summary.mean > budgets.ssr.averageMilliseconds) {
    failures.push(
      `SSR mean is ${ssr.summary.mean.toFixed(3)} ms; budget is ${budgets.ssr.averageMilliseconds} ms`
    );
  }
  if (ssr.summary.p95 > budgets.ssr.p95Milliseconds) {
    failures.push(
      `SSR p95 is ${ssr.summary.p95.toFixed(3)} ms; budget is ${budgets.ssr.p95Milliseconds} ms`
    );
  }

  const runtimeBundle = await browserBundle(`
    import "@fluid-ds/components/define/button";
    import "@fluid-ds/components/define/copy-button";
    import "@fluid-ds/components/define/input";
    import "@fluid-ds/components/locales/en-xa";
  `);
  const hydrationBundle = await browserBundle(`
    import "@fluid-ds/components/ssr-client";
    import "@fluid-ds/components/define/button";
  `);
  const ssrMarkup = await renderFluidToString(
    html`${Array.from(
      { length: 100 },
      (_, index) => html`<fluid-button>Hydrate ${index}</fluid-button>`
    )}`
  );

  const browser = await chromium.launch({
    headless: true,
    args: ["--enable-precise-memory-info"]
  });
  let browserVersion;
  const browserSamples = [];
  try {
    browserVersion = browser.version();
    for (let run = 0; run < config.browserWarmupRuns; run += 1) {
      await measureBrowserRun(browser, runtimeBundle, hydrationBundle, ssrMarkup);
    }
    for (let run = 0; run < config.browserSampleRuns; run += 1) {
      browserSamples.push({
        run,
        ...(await measureBrowserRun(browser, runtimeBundle, hydrationBundle, ssrMarkup))
      });
    }
  } finally {
    await browser.close();
  }

  const browserSummaries = summarizeRuns(
    browserSamples,
    browserMetricNames,
    config.browserSampleRuns
  );
  const budgetObservations = Object.fromEntries(
    browserMetricNames.map((metric) => [metric, browserSummaries[metric][config.budgetStatistic]])
  );
  const cdpSummaries = Object.fromEntries(
    ["runtimeDeltas", "hydrationDeltas"].map((phase) => [
      phase,
      Object.fromEntries(
        cdpMetricNames.map((metric) => [
          metric,
          summarizeSamples(
            browserSamples.map((sample) => sample.cdp[phase][metric]),
            config.browserSampleRuns,
            `${phase}.${metric}`
          )
        ])
      )
    ])
  );
  failures.push(...validateBudgetMeasurements(budgetObservations, budgets.browser));

  const cpu = cpus()[0];
  const report = {
    schemaVersion: 3,
    status: failures.length ? "failed" : "passed",
    measurementValid: true,
    generatedAt: new Date().toISOString(),
    config,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      osType: type(),
      osRelease: release(),
      hostname: hostname(),
      cpuModel: cpu?.model ?? "unknown",
      cpuCount: cpus().length,
      availableParallelism: availableParallelism(),
      totalMemoryBytes: totalmem(),
      freeMemoryBytesAtReport: freemem(),
      browser: "chromium",
      browserVersion,
      headless: true,
      preciseMemoryInfo: true,
      ci: Boolean(process.env.CI)
    },
    bundles,
    ssr,
    browser: {
      warmupRuns: config.browserWarmupRuns,
      sampleRuns: config.browserSampleRuns,
      budgetStatistic: config.budgetStatistic,
      budgetObservations,
      summaries: browserSummaries,
      cdpSummaries,
      rawSamples: browserSamples
    },
    failures
  };
  await writeFile(resultPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  for (const [name, result] of Object.entries(bundles)) {
    console.log(
      `${name}: ${result.gzipBytes} B gzip across ${result.modules} modules (${result.scenario}${result.budgeted ? ", budgeted" : ", informational"})`
    );
  }
  console.log(
    `SSR: ${ssr.summary.median.toFixed(3)} ms median, ${ssr.summary.p95.toFixed(3)} ms p95, CV ${(ssr.summary.coefficientOfVariation * 100).toFixed(1)}% across ${ssr.totalIterations} samples`
  );
  console.log(
    `Browser p95: define ${browserSummaries.definitionMilliseconds.p95.toFixed(1)} ms, create 100 ${browserSummaries.create100Milliseconds.p95.toFixed(1)} ms, update 100 ${browserSummaries.update100Milliseconds.p95.toFixed(1)} ms, hydrate 100 ${browserSummaries.hydrate100Milliseconds.p95.toFixed(1)} ms`
  );
  console.log(
    `Browser p95: locale switch 100 ${browserSummaries.localeSwitch100Milliseconds.p95.toFixed(1)} ms, lifecycle heap growth ${browserSummaries.lifecycleHeapGrowthBytes.p95.toFixed(0)} B`
  );
  if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    if (check) process.exitCode = 1;
  }
}

main().catch(async (error) => {
  await writeFile(
    resultPath,
    `${JSON.stringify(
      {
        schemaVersion: 3,
        status: "failed",
        measurementValid: false,
        generatedAt: new Date().toISOString(),
        error: error.message
      },
      null,
      2
    )}\n`
  );
  console.error(error);
  process.exitCode = 1;
});
