import { writeFile } from "node:fs/promises";
import { availableParallelism, cpus, hostname, release, totalmem, type } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import { chromium } from "playwright";
import { heapSampler } from "./measurement-validity.mjs";
import { summarizeSamples } from "./sample-statistics.mjs";
import { EXPANSION_CASES, validateExpansionReport } from "./expansion-validity.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const resultPath = join(app, "expansion-results.json");
const mapHeapSnapshotPath = join(app, "map-retention.heapsnapshot");
const warmupRuns = configuredInteger("BENCHMARK_EXPANSION_WARMUPS", 1, 0, 5);
const sampleRuns = configuredInteger("BENCHMARK_EXPANSION_SAMPLES", 5, 3, 20);
let mapHeapSnapshotCaptured = false;

function configuredInteger(name, fallback, minimum, maximum) {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} through ${maximum}`);
  }
  return value;
}

const entries = {
  table: "../../packages/table/src/components/table/define.ts",
  chart: "../../packages/charts/src/components/chart/define.ts",
  scheduler: "../../packages/scheduler/src/components/scheduler/define.ts",
  editor: "../../packages/editor/src/components/rich-text-editor/define.ts",
  parser: "../../packages/parser/src/components/file-parser/define.ts",
  map: "../../packages/map/src/components/map/define.ts",
  "node-graph": "../../packages/node-graph/src/components/node-graph/define.ts"
};

async function bundleEntry(name, entry) {
  const result = await build({
    bundle: true,
    conditions: ["browser", "import"],
    format: "esm",
    logLevel: "silent",
    metafile: true,
    minify: true,
    platform: "browser",
    stdin: { contents: `import ${JSON.stringify(entry)};`, loader: "ts", resolveDir: app },
    treeShaking: true,
    write: false
  });
  const output = result.outputFiles[0].contents;
  return {
    name,
    bytes: output.byteLength,
    gzipBytes: gzipSync(output, { level: 9 }).byteLength,
    modules: Object.keys(result.metafile.inputs).length,
    budgeted: false,
    scenario: "expansion-informational"
  };
}

async function runtimeBundle() {
  const imports = Object.values(entries)
    .map((entry) => `import ${JSON.stringify(entry)};`)
    .join("\n");
  const source = `${imports}
    window.fluidExpansionCases = {
      table: {
        tag: "fluid-table",
        setup(el) {
          el.caption = "People";
          el.columns = [{ key: "id", label: "ID", sortable: true }, { key: "name", label: "Name", sortable: true }, { key: "score", label: "Score", sortable: true }];
          el.rows = Array.from({ length: 100 }, (_, id) => ({ id, name: "Person " + id, score: id % 17 }));
        },
        update(el) { el.sort = { key: "score", direction: "desc" }; }
      },
      chart: {
        tag: "fluid-chart",
        setup(el) {
          el.style.cssText = "display:block;width:640px;height:320px";
          el.type = "line";
          el.data = { labels: Array.from({ length: 100 }, (_, i) => "P" + i), datasets: [{ label: "Series", data: Array.from({ length: 100 }, (_, i) => i % 23) }] };
          el.options = { animation: false, responsive: false };
        },
        update(el) { el.data = { ...el.data, datasets: [{ label: "Series", data: Array.from({ length: 100 }, (_, i) => (i * 3) % 29) }] }; }
      },
      scheduler: {
        tag: "fluid-scheduler",
        setup(el) {
          el.availability = { weekly: Object.fromEntries([0,1,2,3,4,5,6].map(day => [day, [{ start: "09:00", end: "17:00" }]])), slotMinutes: 30 };
          el.min = "2035-01-01";
          el.max = "2035-12-31";
        },
        update(el) { el.bookings = [{ start: "2035-06-18T10:00", end: "2035-06-18T10:30" }]; }
      },
      editor: {
        tag: "fluid-rich-text-editor",
        setup(el) { el.value = "<h2>Performance</h2><p>" + "Representative editor content. ".repeat(50) + "</p>"; },
        update(el) { el.readOnly = true; }
      },
      parser: {
        tag: "fluid-file-parser",
        setup(el) { el.blueprint = { fields: [{ key: "name", label: "Name", type: "string", required: true }, { key: "age", label: "Age", type: "integer", min: 0 }, { key: "email", label: "Email", type: "email", required: true }] }; },
        async update(el) {
          const csv = "name,age,email\\n" + Array.from({ length: 100 }, (_, i) => "Person " + i + "," + (20 + i % 50) + ",person" + i + "@example.test").join("\\n");
          const loaded = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Parser did not emit fluid-file-loaded")), 3000);
            el.addEventListener("fluid-file-loaded", event => { clearTimeout(timeout); resolve(event); }, { once: true });
          });
          el.shadowRoot.querySelector("fluid-dropzone").dispatchEvent(new CustomEvent("fluid-change", { detail: { files: [new File([csv], "benchmark.csv", { type: "text/csv" })] }, bubbles: true, composed: true }));
          await loaded;
        }
      },
      map: {
        tag: "fluid-map",
        lightDom: true,
        setup(el) {
          el.style.cssText = "display:block;width:640px;height:320px";
          el.tileUrl = "";
          el.center = [52.37, 4.9];
          el.markers = Array.from({ length: 25 }, (_, i) => ({ lat: 52.30 + i / 200, lng: 4.82 + i / 200, label: "Marker " + i }));
        },
        update(el) { el.zoom = 11; }
      },
      "node-graph": {
        tag: "fluid-node-graph",
        setup(el) {
          el.style.cssText = "display:block;width:800px;height:500px";
          el.nodeTypes = { task: { label: "Task", outputs: [{ id: "next", label: "Next" }] } };
          el.nodes = Array.from({ length: 30 }, (_, i) => ({ id: "n" + i, type: "task", x: (i % 6) * 260, y: Math.floor(i / 6) * 140, label: "Node " + i }));
          el.edges = Array.from({ length: 29 }, (_, i) => ({ id: "e" + i, from: "n" + i, port: "next", to: "n" + (i + 1) }));
        },
        update(el) { el.traversedEdges = el.edges.slice(0, 10).map(edge => edge.id); }
      }
    };
  `;
  const result = await build({
    bundle: true,
    conditions: ["browser", "import"],
    format: "iife",
    logLevel: "silent",
    minify: true,
    platform: "browser",
    stdin: { contents: source, loader: "ts", resolveDir: app },
    write: false
  });
  return result.outputFiles[0].text;
}

async function measureCase(browser, bundle, name) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack ?? error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    page.on("requestfailed", (request) =>
      errors.push(`request: ${request.url()} ${request.failure()?.errorText ?? ""}`)
    );
    await page.setContent(
      "<!doctype html><html lang='en'><head><link data-fluid-map-leaflet-css></head><body></body></html>"
    );
    await page.addScriptTag({ content: bundle });
    const cdp = await context.newCDPSession(page);
    const sampleHeap = await heapSampler(cdp);
    const calibrationBefore = await sampleHeap();
    await page.evaluate(() => {
      window.fluidExpansionCalibration = new Array(1_000_000).fill(42);
    });
    const calibrationAfter = await sampleHeap();
    await page.evaluate(() => {
      delete window.fluidExpansionCalibration;
    });
    await sampleHeap();
    const timing = await page.evaluate(async (caseName) => {
      const definition = window.fluidExpansionCases[caseName];
      if (!definition) throw new Error("Missing runtime case " + caseName);
      const settle = async (element) => {
        await element.updateComplete;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (caseName === "map") {
          const deadline = performance.now() + 3000;
          while (!element.map && performance.now() < deadline)
            await new Promise((resolve) => setTimeout(resolve, 10));
          if (!element.map) throw new Error("Map did not initialize");
        }
      };
      const element = document.createElement(definition.tag);
      definition.setup(element);
      const initialStart = performance.now();
      document.body.append(element);
      await settle(element);
      const initialRenderMilliseconds = performance.now() - initialStart;
      if (definition.lightDom) {
        if (!element.querySelector('[part="base"]'))
          throw new Error(caseName + " did not render its light-DOM base");
      } else if (!element.shadowRoot) {
        throw new Error(caseName + " did not render a shadow root");
      }
      const updateStart = performance.now();
      await definition.update(element);
      await settle(element);
      const updateMilliseconds = performance.now() - updateStart;
      element.remove();
      return { initialRenderMilliseconds, updateMilliseconds, renderedMarker: caseName };
    }, name);
    await page.evaluate(
      async ({ caseName, tagRetainedMaps }) => {
        const definition = window.fluidExpansionCases[caseName];
        const settle = async (element) => {
          await element.updateComplete;
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );
          if (caseName === "map") {
            const deadline = performance.now() + 3000;
            while (!element.map && performance.now() < deadline)
              await new Promise((resolve) => setTimeout(resolve, 10));
            if (!element.map) throw new Error("Map did not initialize");
          }
        };
        const element = document.createElement(definition.tag);
        definition.setup(element);
        document.body.append(element);
        await settle(element);
        element.remove();
        window.fluidExpansionLifecycleElement = element;
        window.fluidExpansionLifecycleRefs = [];
        window.fluidExpansionReconnect = async (cycles) => {
          const current = window.fluidExpansionLifecycleElement;
          if (!current) throw new Error("Missing prepared lifecycle element");
          const reconnectStart = performance.now();
          for (let cycle = 0; cycle < cycles; cycle += 1) {
            current.remove();
            document.body.append(current);
            await settle(current);
            const resource =
              caseName === "chart" ? current.instance : caseName === "map" ? current.map : null;
            if (resource) {
              if (caseName === "map" && tagRetainedMaps) {
                resource.__fluidExpansionRetainedMap = `map-${window.fluidExpansionLifecycleRefs.length}`;
              }
              window.fluidExpansionLifecycleRefs.push(new WeakRef(resource));
            }
          }
          current.remove();
          return performance.now() - reconnectStart;
        };
      },
      {
        caseName: name,
        tagRetainedMaps: Boolean(process.env.BENCHMARK_EXPANSION_HEAP_SNAPSHOT)
      }
    );
    // Keep the same initialized, disconnected object alive across both
    // windows. The first reconnect window records per-object warm-up
    // allocation separately; the second equal window measures steady-state
    // retention without hiding a leak that grows with repeated reconnects.
    const heapPreparedBytes = await sampleHeap();
    await page.evaluate(async () => window.fluidExpansionReconnect(20));
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    const heapBeforeBytes = await sampleHeap();
    const retainedWarmupInstances = await page.evaluate(
      () => window.fluidExpansionLifecycleRefs.filter((ref) => ref.deref()).length
    );
    await page.evaluate(() => {
      window.fluidExpansionLifecycleRefs = [];
    });
    const reconnectMilliseconds = await page.evaluate(async () =>
      window.fluidExpansionReconnect(20)
    );
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    const heapAfterBytes = await sampleHeap();
    const retainedLifecycleInstances = await page.evaluate(
      () => window.fluidExpansionLifecycleRefs.filter((ref) => ref.deref()).length
    );
    let retainedLifecycleInstancesAfterDelay = retainedLifecycleInstances;
    if (name === "map") {
      await page.waitForTimeout(1000);
      await sampleHeap();
      retainedLifecycleInstancesAfterDelay = await page.evaluate(
        () => window.fluidExpansionLifecycleRefs.filter((ref) => ref.deref()).length
      );
      if (process.env.BENCHMARK_EXPANSION_HEAP_SNAPSHOT && !mapHeapSnapshotCaptured) {
        mapHeapSnapshotCaptured = true;
        const chunks = [];
        cdp.on("HeapProfiler.addHeapSnapshotChunk", ({ chunk }) => chunks.push(chunk));
        await cdp.send("HeapProfiler.takeHeapSnapshot", {
          reportProgress: false,
          captureNumericValue: true
        });
        await writeFile(mapHeapSnapshotPath, chunks.join(""));
      }
    }
    let retainedLibraryControlInstances = 0;
    if (name === "map") {
      await page.evaluate(() => {
        const L = window.fluidExpansionLifecycleElement.constructor.leaflet;
        window.fluidExpansionLibraryControlRefs = [];
        const host = document.createElement("div");
        const container = document.createElement("div");
        container.style.cssText = "width:640px;height:320px";
        host.append(container);
        for (let cycle = 0; cycle < 20; cycle += 1) {
          document.body.append(host);
          const control = L.map(container, {
            center: [52.37, 4.9],
            zoom: 11,
            zoomAnimation: false
          });
          const markers = L.layerGroup().addTo(control);
          for (let index = 0; index < 25; index += 1) {
            const marker = L.marker([52.3 + index / 200, 4.82 + index / 200], {
              title: `Marker ${index}`,
              alt: `Marker ${index}`
            });
            marker.bindPopup(`Marker ${index}`);
            marker.bindTooltip(`Marker ${index}`);
            marker.on("click keypress", () => undefined);
            markers.addLayer(marker);
          }
          control.on("moveend", () => control.getCenter());
          control.off();
          control.remove();
          host.remove();
          window.fluidExpansionLibraryControlRefs.push(new WeakRef(control));
        }
      });
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      );
      await sampleHeap();
      retainedLibraryControlInstances = await page.evaluate(
        () => window.fluidExpansionLibraryControlRefs.filter((ref) => ref.deref()).length
      );
    }
    await page.evaluate(() => {
      delete window.fluidExpansionLifecycleElement;
      delete window.fluidExpansionLifecycleRefs;
      delete window.fluidExpansionLibraryControlRefs;
      delete window.fluidExpansionReconnect;
    });
    if (errors.length) throw new Error(`${name} browser errors: ${errors.join("; ")}`);
    return {
      ...timing,
      reconnectMilliseconds,
      reconnectCycles: 20,
      retainedWarmupInstances,
      retainedLifecycleInstances,
      retainedLifecycleInstancesAfterDelay,
      retainedLibraryControlInstances,
      heapPreparedBytes,
      heapBeforeBytes,
      heapAfterBytes,
      lifecycleWarmupHeapGrowthBytes: Math.max(0, heapBeforeBytes - heapPreparedBytes),
      lifecycleHeapGrowthBytes: Math.max(0, heapAfterBytes - heapBeforeBytes),
      heapCalibrationGrowthBytes: calibrationAfter - calibrationBefore
    };
  } finally {
    await context.close();
  }
}

function summarizeCase(samples) {
  return Object.fromEntries(
    [
      "initialRenderMilliseconds",
      "updateMilliseconds",
      "reconnectMilliseconds",
      "lifecycleHeapGrowthBytes"
    ].map((metric) => [
      metric,
      summarizeSamples(
        samples.map((sample) => sample[metric]),
        sampleRuns,
        metric
      )
    ])
  );
}

async function main() {
  await writeFile(
    resultPath,
    `${JSON.stringify({ schemaVersion: 1, status: "running", generatedAt: new Date().toISOString() }, null, 2)}\n`
  );
  const bundles = Object.fromEntries(
    await Promise.all(
      Object.entries(entries).map(async ([name, entry]) => [name, await bundleEntry(name, entry)])
    )
  );
  const bundle = await runtimeBundle();
  const browser = await chromium.launch({ headless: true, args: ["--enable-precise-memory-info"] });
  let browserVersion;
  const cases = {};
  try {
    browserVersion = browser.version();
    for (const name of EXPANSION_CASES) {
      for (let run = 0; run < warmupRuns; run += 1) await measureCase(browser, bundle, name);
      const samples = [];
      for (let run = 0; run < sampleRuns; run += 1)
        samples.push(await measureCase(browser, bundle, name));
      cases[name] = { samples, summaries: summarizeCase(samples) };
    }
  } finally {
    await browser.close();
  }
  const cpu = cpus()[0];
  const report = {
    schemaVersion: 1,
    status: "passed",
    measurementValid: true,
    generatedAt: new Date().toISOString(),
    config: { warmupRuns, sampleRuns, reconnectCycles: 20, budgeted: false },
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
      browser: "chromium",
      browserVersion,
      headless: true,
      preciseMemoryInfo: true,
      ci: Boolean(process.env.CI)
    },
    bundles,
    cases
  };
  validateExpansionReport(report, sampleRuns);
  await writeFile(resultPath, `${JSON.stringify(report, null, 2)}\n`);
  for (const name of EXPANSION_CASES) {
    const item = cases[name];
    console.log(
      `${name}: ${bundles[name].gzipBytes} B gzip; render p95 ${item.summaries.initialRenderMilliseconds.p95.toFixed(1)} ms; update p95 ${item.summaries.updateMilliseconds.p95.toFixed(1)} ms; reconnect p95 ${item.summaries.reconnectMilliseconds.p95.toFixed(1)} ms; heap growth p95 ${item.summaries.lifecycleHeapGrowthBytes.p95.toFixed(0)} B`
    );
  }
}

main().catch(async (error) => {
  await writeFile(
    resultPath,
    `${JSON.stringify({ schemaVersion: 1, status: "failed", measurementValid: false, generatedAt: new Date().toISOString(), error: error.message }, null, 2)}\n`
  );
  console.error(error);
  process.exitCode = 1;
});
