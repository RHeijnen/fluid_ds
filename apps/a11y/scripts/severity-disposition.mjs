import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const impacts = ["critical", "serious", "moderate", "minor", "unknown"];

function requireInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function collectSpecs(suites, result = []) {
  if (!Array.isArray(suites)) throw new Error("report.suites must be an array");
  for (const suite of suites) {
    if (!suite || typeof suite !== "object") throw new Error("report suite must be an object");
    if (!Array.isArray(suite.specs)) throw new Error("suite.specs must be an array");
    result.push(...suite.specs);
    collectSpecs(suite.suites ?? [], result);
  }
  return result;
}

export function buildSeverityDisposition(report, sourceBytes, sourceName) {
  if (!report || typeof report !== "object") throw new Error("report must be an object");
  const stats = report.stats;
  if (!stats || typeof stats !== "object") throw new Error("report.stats is required");

  const expected = requireInteger(stats.expected, "stats.expected");
  const skipped = requireInteger(stats.skipped, "stats.skipped");
  const unexpected = requireInteger(stats.unexpected, "stats.unexpected");
  const flaky = requireInteger(stats.flaky, "stats.flaky");
  if (unexpected || skipped || flaky) {
    throw new Error(
      `report is not a clean final run: unexpected=${unexpected}, skipped=${skipped}, flaky=${flaky}`
    );
  }

  const projects = report.config?.projects;
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new Error("report projects are required");
  }
  const engines = projects.map(({ name }) => name);
  if (engines.some((name) => typeof name !== "string" || !name)) {
    throw new Error("every report project needs a name");
  }
  if (new Set(engines).size !== engines.length) {
    throw new Error("report project names must be unique");
  }

  const specs = collectSpecs(report.suites);
  if (specs.length !== expected) {
    throw new Error(`spec count ${specs.length} does not match stats.expected ${expected}`);
  }
  for (const spec of specs) {
    if (!Array.isArray(spec.tests) || spec.tests.length !== 1) {
      throw new Error(`spec ${JSON.stringify(spec.title)} must contain exactly one project test`);
    }
    const test = spec.tests[0];
    if (
      test.expectedStatus !== "passed" ||
      !Array.isArray(test.results) ||
      test.results.length !== 1
    ) {
      throw new Error(
        `spec ${JSON.stringify(spec.title)} does not have one expected passing result`
      );
    }
    const result = test.results[0];
    if (result.status !== "passed" || result.retry !== 0 || result.errors?.length) {
      throw new Error(`spec ${JSON.stringify(spec.title)} is not a clean first-attempt pass`);
    }
  }

  const axeAudits = specs.filter(({ title }) =>
    String(title).endsWith(" has no browser-level accessibility violations")
  );
  if (axeAudits.length === 0) throw new Error("report contains no catalog axe audits");

  const byEngine = Object.fromEntries(engines.map((engine) => [engine, 0]));
  for (const spec of axeAudits) {
    const engine = spec.tests[0].projectName;
    if (!(engine in byEngine)) throw new Error(`axe audit references unknown project ${engine}`);
    byEngine[engine] += 1;
  }
  if (Object.values(byEngine).some((count) => count === 0)) {
    throw new Error("every configured engine must contribute catalog axe audits");
  }

  const zeroSeverities = Object.fromEntries(impacts.map((impact) => [impact, 0]));
  return {
    schemaVersion: 1,
    kind: "automated-accessibility-severity-disposition",
    source: {
      report: sourceName,
      sha256: createHash("sha256").update(sourceBytes).digest("hex")
    },
    run: {
      engines,
      tests: expected,
      passed: expected,
      skipped,
      unexpected,
      flaky,
      catalogAxeAudits: axeAudits.length,
      catalogAxeAuditsByEngine: byEngine
    },
    automatedViolations: {
      total: 0,
      byImpact: zeroSeverities,
      disposition: "no-automated-violations-observed"
    },
    manualAssistiveTechnology: {
      covered: false,
      disposition: "pending-human-evidence",
      inferenceFromAutomatedResultProhibited: true
    },
    boundaries: [
      "Severity counts describe the retained automated catalog axe audits only.",
      "Passing interaction tests are not manual assistive-technology evidence.",
      "Zero automated violations does not approve screen-reader, native Safari, mobile, or fluent-language review."
    ]
  };
}

export function validateSeverityDisposition(value) {
  if (
    value?.schemaVersion !== 1 ||
    value?.kind !== "automated-accessibility-severity-disposition"
  ) {
    throw new Error("unsupported severity/disposition export schema");
  }
  requireInteger(value.run?.catalogAxeAudits, "run.catalogAxeAudits");
  if (value.automatedViolations?.total !== 0) {
    throw new Error("current export must have zero violations");
  }
  for (const impact of impacts) {
    if (value.automatedViolations?.byImpact?.[impact] !== 0) {
      throw new Error(`current ${impact} violation count must be zero`);
    }
  }
  if (
    value.manualAssistiveTechnology?.covered !== false ||
    value.manualAssistiveTechnology?.disposition !== "pending-human-evidence" ||
    value.manualAssistiveTechnology?.inferenceFromAutomatedResultProhibited !== true
  ) {
    throw new Error("manual assistive-technology boundary must remain explicitly pending");
  }
  return value;
}

export function serializeSeverityDisposition(value) {
  const enginesMarker = "__FLUID_A11Y_ENGINES__";
  const marked = {
    ...value,
    run: { ...value.run, engines: enginesMarker }
  };
  return `${JSON.stringify(marked, null, 2).replace(
    JSON.stringify(enginesMarker),
    `[${value.run.engines.map((engine) => JSON.stringify(engine)).join(", ")}]`
  )}\n`;
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const appDir = path.resolve(scriptDir, "..");
  const input = path.resolve(
    process.argv[2] ??
      path.join(appDir, "evidence/full-accessibility-regression-2026-08-27-final.json")
  );
  const output = path.resolve(
    process.argv[3] ??
      path.join(appDir, "evidence/accessibility-severity-disposition-2026-08-27.json")
  );
  const sourceBytes = await readFile(input);
  const result = validateSeverityDisposition(
    buildSeverityDisposition(JSON.parse(sourceBytes), sourceBytes, path.basename(input))
  );
  await writeFile(output, serializeSeverityDisposition(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
