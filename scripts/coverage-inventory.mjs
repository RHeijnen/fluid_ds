import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { requireCoverageThresholds } from "./coverage-thresholds.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const normalize = (path) => resolve(path).replaceAll("\\", "/");

export function hasLocalRuntime(source, name = "source.ts") {
  const file = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true);
  if (file.parseDiagnostics.length) throw new Error(`Cannot parse coverage source: ${name}`);
  return file.statements.some((statement) => {
    if (
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isExportDeclaration(statement) ||
      ts.isEmptyStatement(statement)
    )
      return false;
    if (ts.isImportDeclaration(statement)) return !statement.importClause;
    if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword))
      return false;
    return true;
  });
}

async function sourceFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await sourceFiles(path)));
    else if (entry.name.endsWith(".ts") && !/\.(test|stories|d)\.ts$/.test(entry.name))
      result.push(path);
  }
  return result.sort();
}

export function validateCoverageSummary(summary) {
  if (!summary || typeof summary !== "object" || !summary.total)
    throw new Error("Missing coverage total");
  for (const [path, metrics] of Object.entries(summary)) {
    for (const metric of ["statements", "lines", "functions", "branches"]) {
      const value = metrics?.[metric];
      if (
        !value ||
        !Number.isInteger(value.total) ||
        !Number.isInteger(value.covered) ||
        value.total < 0 ||
        value.covered < 0 ||
        value.covered > value.total ||
        typeof value.pct !== "number" ||
        !Number.isFinite(value.pct) ||
        value.pct < 0 ||
        value.pct > 100
      ) {
        throw new Error(`Invalid ${metric} coverage for ${path}`);
      }
      const actual = value.total === 0 ? 100 : (value.covered / value.total) * 100;
      if (Math.abs(value.pct - actual) > 0.011)
        throw new Error(`Inconsistent ${metric} percentage for ${path}`);
    }
  }
  const files = Object.entries(summary)
    .filter(([path]) => path !== "total")
    .map(([, metrics]) => metrics);
  if (!files.length) throw new Error("No measured files in coverage summary");
  for (const metric of ["statements", "lines", "functions", "branches"]) {
    for (const count of ["total", "covered"]) {
      const actual = files.reduce((sum, metrics) => sum + metrics[metric][count], 0);
      if (summary.total[metric][count] !== actual)
        throw new Error(`Inconsistent aggregate ${metric} ${count}: expected ${actual}`);
    }
  }
}

export async function readCoverageSummary(path, since = 0) {
  if ((await stat(path)).mtimeMs < since) throw new Error("Coverage summary predates this run");
  const summary = JSON.parse(await readFile(path, "utf8"));
  validateCoverageSummary(summary);
  return summary;
}

/** Require every local runtime module to appear in the measured denominator. */
export async function inspectCoverageInventory(
  packageRoot,
  summary,
  { separatelyTested = {} } = {}
) {
  validateCoverageSummary(summary);
  const measured = new Set(
    Object.keys(summary)
      .filter((path) => path !== "total")
      .map(normalize)
  );
  const result = { required: [], measured: [], missing: [], nonRuntime: [], separate: [] };
  const seenExceptions = new Set();
  for (const path of await sourceFiles(join(packageRoot, "src"))) {
    const name = relative(packageRoot, path).replaceAll("\\", "/");
    if (name.endsWith("/define.ts")) {
      result.separate.push({
        path: name,
        reason:
          "Registration entry excluded by the browser coverage configuration, not counted as executed code.",
        gate: "pnpm check:ssr (cold Node import and registration/render behavior, not registration branch coverage)"
      });
      continue;
    }
    const exception = separatelyTested[name];
    if (exception) {
      if (
        typeof exception.reason !== "string" ||
        !exception.reason.trim() ||
        typeof exception.gate !== "string" ||
        !exception.gate.trim()
      )
        throw new Error(`Unexplained coverage boundary: ${name}`);
      result.separate.push({ path: name, ...exception });
      seenExceptions.add(name);
      continue;
    }
    if (!hasLocalRuntime(await readFile(path, "utf8"), path)) {
      result.nonRuntime.push(name);
      continue;
    }
    result.required.push(name);
    (measured.has(normalize(path)) ? result.measured : result.missing).push(name);
  }
  for (const path of Object.keys(separatelyTested)) {
    if (!seenExceptions.has(path)) throw new Error(`Stale coverage boundary: ${path}`);
  }
  return result;
}

export async function checkCoverageInventories({ since = 0 } = {}) {
  const thresholds = JSON.parse(
    await readFile(join(root, "quality/coverage-thresholds.json"), "utf8")
  );
  const boundaries = JSON.parse(
    await readFile(join(root, "quality/coverage-boundaries.json"), "utf8")
  );
  const packages = {};
  const failures = [];
  const catalog = JSON.parse(await readFile(join(root, "quality/component-quality.json"), "utf8"));
  const catalogPackages = new Set(
    catalog.components.map((component) => component.package.replace(/^@fluid-ds\//, ""))
  );
  for (const name of catalogPackages) {
    if (!Object.hasOwn(thresholds, name))
      failures.push(`Catalog package missing from coverage gate: ${name}`);
  }
  for (const name of Object.keys(thresholds).sort()) {
    const packageRoot = join(root, "packages", name);
    const report = join(packageRoot, "coverage", name, "coverage-summary.json");
    try {
      requireCoverageThresholds(name, thresholds);
      const summary = await readCoverageSummary(report, since);
      const inventory = await inspectCoverageInventory(packageRoot, summary, {
        separatelyTested: boundaries[name] ?? {}
      });
      packages[name] = { ...inventory, measuredTotals: summary.total };
      if (inventory.missing.length)
        failures.push(`${name}: unmeasured runtime files: ${inventory.missing.join(", ")}`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    }
  }
  for (const name of Object.keys(boundaries)) {
    if (!Object.hasOwn(thresholds, name))
      failures.push(`Unknown package coverage boundary: ${name}`);
  }
  return {
    measurement: "browser-loaded-module-coverage-with-runtime-file-inventory",
    packages,
    failures
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await checkCoverageInventories();
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
}
