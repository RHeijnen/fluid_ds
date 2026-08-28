/** Normalize a pnpm registry audit and production-license inventory without mutating dependencies. */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = dirname(here);
export const allowedProductionLicenses = Object.freeze([
  "(MIT OR CC0-1.0)",
  "(MPL-2.0 OR Apache-2.0)",
  "0BSD",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC0-1.0",
  "ISC",
  "MIT"
]);

const compare = (a, b) => a.localeCompare(b, "en");
const normalizeText = (text) => text.replace(/^\uFEFF/, "");
const hash = (text) => createHash("sha256").update(text).digest("hex");

function dependencyName(segment) {
  const marker = segment.lastIndexOf("@");
  return marker > 0 ? segment.slice(0, marker) : segment;
}

async function classifyPath(root, path) {
  const segments = path.split(" > ");
  const importer = segments[0];
  const directDependency = dependencyName(segments[1] ?? "");
  const manifestPath =
    importer === "." ? join(root, "package.json") : join(root, importer, "package.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return {
      importer,
      directDependency,
      relationship: "unclassified",
      direct: segments.length === 2
    };
  }
  const relationship = Object.hasOwn(manifest.dependencies ?? {}, directDependency)
    ? "production"
    : Object.hasOwn(manifest.optionalDependencies ?? {}, directDependency)
      ? "optional"
      : Object.hasOwn(manifest.devDependencies ?? {}, directDependency)
        ? "development"
        : Object.hasOwn(manifest.peerDependencies ?? {}, directDependency)
          ? "peer"
          : "unclassified";
  return { importer, directDependency, relationship, direct: segments.length === 2 };
}

export function validateAllowlist(allowlist, now = new Date()) {
  const failures = [];
  if (allowlist?.schemaVersion !== 1 || !Array.isArray(allowlist.exceptions))
    return ["allowlist must use schemaVersion 1 and an exceptions array"];
  const seen = new Set();
  for (const [index, entry] of allowlist.exceptions.entries()) {
    const label = `exception ${index + 1}`;
    for (const field of ["advisoryId", "module", "rationale", "owner", "expires"])
      if (typeof entry[field] !== "string" || !entry[field].trim())
        failures.push(`${label} requires non-empty ${field}`);
    if (!/^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(entry.advisoryId ?? ""))
      failures.push(`${label} advisoryId must be an exact GHSA identifier`);
    for (const field of ["versions", "pathPrefixes"])
      if (
        !Array.isArray(entry[field]) ||
        !entry[field].length ||
        entry[field].some((value) => !value)
      )
        failures.push(`${label} requires a non-empty ${field} array`);
    const expires = new Date(entry.expires);
    if (!Number.isFinite(expires.valueOf())) failures.push(`${label} expiry must be ISO-8601`);
    else if (expires <= now) failures.push(`${label} expired on ${entry.expires}`);
    const key = `${entry.advisoryId}\0${entry.module}\0${(entry.versions ?? []).join(",")}\0${(entry.pathPrefixes ?? []).join(",")}`;
    if (seen.has(key)) failures.push(`${label} duplicates another exception`);
    seen.add(key);
  }
  return failures;
}

function acceptedBy(exception, finding) {
  return (
    exception.advisoryId === finding.advisoryId &&
    exception.module === finding.module &&
    exception.versions?.includes(finding.version) &&
    exception.pathPrefixes?.some((prefix) => finding.path.startsWith(prefix))
  );
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function evaluateLocalPatchDispositions(config, root = repositoryRoot) {
  const failures = [];
  const dispositions = [];
  if (config?.schemaVersion !== 1 || !Array.isArray(config.dispositions)) {
    return {
      dispositions,
      failures: ["local patch dispositions must use schemaVersion 1 and a dispositions array"]
    };
  }
  const lockText = await readFile(join(root, "pnpm-lock.yaml"), "utf8");
  const lockSha256 = hash(lockText);
  const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const seen = new Set();
  for (const [index, entry] of config.dispositions.entries()) {
    const label = `local patch disposition ${index + 1}`;
    const entryFailures = [];
    for (const field of [
      "id",
      "advisoryId",
      "module",
      "version",
      "patchedDependency",
      "lockPatchHash",
      "patchPath",
      "patchSha256",
      "proofPath",
      "rationale",
      "owner"
    ]) {
      if (typeof entry[field] !== "string" || !entry[field].trim())
        entryFailures.push(`${label} requires non-empty ${field}`);
    }
    if (!Array.isArray(entry.requiredChecks) || !entry.requiredChecks.length)
      entryFailures.push(`${label} requires non-empty requiredChecks`);
    if (seen.has(entry.id)) entryFailures.push(`${label} duplicates id ${entry.id}`);
    seen.add(entry.id);
    if (manifest.pnpm?.patchedDependencies?.[entry.patchedDependency] !== entry.patchPath)
      entryFailures.push(`${label} root patchedDependencies mapping does not match`);
    const lockPatch = new RegExp(
      `^  ${escapeRegExp(entry.patchedDependency)}:\\r?\\n    hash: ${escapeRegExp(entry.lockPatchHash)}\\r?\\n    path: ${escapeRegExp(entry.patchPath)}$`,
      "m"
    );
    if (!lockPatch.test(lockText))
      entryFailures.push(`${label} lock patch hash/path does not match`);
    if (
      !new RegExp(
        `^  ${escapeRegExp(entry.patchedDependency)}\\(patch_hash=${escapeRegExp(entry.lockPatchHash)}\\):`,
        "m"
      ).test(lockText)
    )
      entryFailures.push(`${label} patched snapshot identity is missing`);
    try {
      const patchBytes = await readFile(resolve(root, entry.patchPath));
      if (hash(patchBytes) !== entry.patchSha256)
        entryFailures.push(`${label} patch file SHA-256 does not match`);
    } catch (error) {
      entryFailures.push(`${label} patch file is unreadable: ${error.code ?? error.message}`);
    }

    let proof;
    let pending = false;
    try {
      proof = JSON.parse(await readFile(resolve(root, entry.proofPath), "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") pending = true;
      else entryFailures.push(`${label} proof is unreadable: ${error.code ?? error.message}`);
    }
    if (proof) {
      if (
        proof.schemaVersion !== 1 ||
        proof.status !== "passed" ||
        proof.platform !== "linux" ||
        proof.dispositionId !== entry.id ||
        proof.module !== entry.module ||
        proof.version !== entry.version ||
        proof.lockPatchHash !== entry.lockPatchHash ||
        proof.patchSha256 !== entry.patchSha256 ||
        proof.lockSha256 !== lockSha256
      )
        entryFailures.push(`${label} proof identity does not match the current Linux patch/lock`);
      const passedChecks = new Set(
        Array.isArray(proof.checks)
          ? proof.checks.filter((check) => check?.status === "passed").map((check) => check.id)
          : []
      );
      for (const check of entry.requiredChecks ?? [])
        if (!passedChecks.has(check))
          entryFailures.push(`${label} proof is missing passed ${check}`);
    }
    const status = entryFailures.length ? "failed" : pending ? "pending" : "active";
    failures.push(...entryFailures);
    dispositions.push({ ...entry, status, lockSha256 });
  }
  return { dispositions, failures };
}

export async function evaluateAuditReport(
  report,
  allowlist,
  root = repositoryRoot,
  now = new Date(),
  localPatchDispositions = []
) {
  const policyFailures = validateAllowlist(allowlist, now);
  const exceptions = Array.isArray(allowlist?.exceptions) ? allowlist.exceptions : [];
  const findings = [];
  const advisories = Object.values(report?.advisories ?? {});
  for (const advisory of advisories) {
    for (const occurrence of advisory.findings ?? []) {
      for (const path of occurrence.paths ?? []) {
        const classification = await classifyPath(root, path);
        findings.push({
          advisoryId: advisory.github_advisory_id,
          module: advisory.module_name,
          severity: advisory.severity,
          title: advisory.title,
          vulnerableVersions: advisory.vulnerable_versions,
          patchedVersions: advisory.patched_versions,
          version: occurrence.version,
          path,
          ...classification
        });
      }
    }
  }
  const uniqueFindings = [
    ...new Map(
      findings.map((finding) => [
        `${finding.advisoryId}\0${finding.module}\0${finding.version}\0${finding.path}`,
        finding
      ])
    ).values()
  ];
  const blocking = uniqueFindings.filter(
    (finding) =>
      ["critical", "high"].includes(finding.severity) &&
      !exceptions.some((exception) => acceptedBy(exception, finding)) &&
      !localPatchDispositions.some(
        (entry) =>
          entry.status === "active" &&
          entry.advisoryId === finding.advisoryId &&
          entry.module === finding.module &&
          entry.version === finding.version
      )
  );
  const locallyPatched = uniqueFindings.filter(
    (finding) =>
      ["critical", "high"].includes(finding.severity) &&
      localPatchDispositions.some(
        (entry) =>
          entry.status === "active" &&
          entry.advisoryId === finding.advisoryId &&
          entry.module === finding.module &&
          entry.version === finding.version
      )
  );
  const severityOccurrences = Object.fromEntries(
    ["critical", "high", "moderate", "low", "info"].map((severity) => [
      severity,
      report.metadata?.vulnerabilities?.[severity] ?? 0
    ])
  );
  return {
    registryOccurrenceCounts: severityOccurrences,
    dependencyCount: report.metadata?.dependencies ?? null,
    advisoryEntryCount: advisories.length,
    distinctAdvisoryCount: new Set(advisories.map((advisory) => advisory.github_advisory_id)).size,
    affectedModuleCount: new Set(advisories.map((advisory) => advisory.module_name)).size,
    uniquePathFindingCount: uniqueFindings.length,
    publishedProductionFindingCount: uniqueFindings.filter(
      (finding) =>
        /^packages[\\/]/.test(finding.importer) &&
        ["production", "optional"].includes(finding.relationship)
    ).length,
    directHighCritical: uniqueFindings.filter(
      (finding) => finding.direct && ["critical", "high"].includes(finding.severity)
    ),
    blocking,
    locallyPatched,
    localPatchDispositions,
    accepted: uniqueFindings.filter((finding) =>
      exceptions.some((exception) => acceptedBy(exception, finding))
    ),
    policyFailures
  };
}

export function evaluateLicenseReport(report) {
  const failures = [];
  const inventory = [];
  for (const [license, packages] of Object.entries(report ?? {})) {
    if (!allowedProductionLicenses.includes(license))
      failures.push(`unapproved production license expression: ${license}`);
    for (const pkg of packages)
      inventory.push({
        license,
        name: pkg.name,
        versions: [...(pkg.versions ?? [])].sort(compare)
      });
  }
  inventory.sort((a, b) => compare(a.name, b.name) || compare(a.license, b.license));
  if (!inventory.length) failures.push("production license inventory is empty");
  return { inventory, failures };
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    if (!["--audit-json", "--licenses-json", "--write-evidence"].includes(key) || !argv[index + 1])
      throw new Error(
        "Usage: node scripts/check-dependency-risk.mjs --audit-json <file> --licenses-json <file> [--write-evidence <directory>]"
      );
    values[key.slice(2)] = argv[index + 1];
  }
  if (!values["audit-json"] || !values["licenses-json"])
    throw new Error("Both --audit-json and --licenses-json are required");
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const auditPath = resolve(args["audit-json"]);
  const licensesPath = resolve(args["licenses-json"]);
  const auditText = normalizeText(await readFile(auditPath, "utf8"));
  const licensesText = normalizeText(await readFile(licensesPath, "utf8"));
  const allowlist = JSON.parse(
    await readFile(join(repositoryRoot, "scripts/dependency-audit-allowlist.json"), "utf8")
  );
  const localPatchConfig = JSON.parse(
    await readFile(join(repositoryRoot, "scripts/dependency-local-patches.json"), "utf8")
  );
  const localPatches = await evaluateLocalPatchDispositions(localPatchConfig);
  const result = {
    schemaVersion: 1,
    observedAt: new Date().toISOString(),
    lockSha256: hash(await readFile(join(repositoryRoot, "pnpm-lock.yaml"), "utf8")),
    auditInputSha256: hash(auditText),
    licenseInputSha256: hash(licensesText),
    audit: await evaluateAuditReport(
      JSON.parse(auditText),
      allowlist,
      repositoryRoot,
      new Date(),
      localPatches.dispositions
    ),
    licenses: evaluateLicenseReport(JSON.parse(licensesText))
  };
  result.failures = [
    ...localPatches.failures,
    ...result.audit.policyFailures,
    ...result.audit.blocking.map(
      (finding) =>
        `${finding.severity} ${finding.advisoryId} ${finding.module}@${finding.version}: ${finding.path}`
    ),
    ...result.licenses.failures
  ];
  result.status = result.failures.length ? "failed" : "passed";
  if (args["write-evidence"]) {
    const directory = resolve(args["write-evidence"]);
    await mkdir(directory, { recursive: true });
    await copyFile(auditPath, join(directory, "pnpm-audit.json"));
    await copyFile(licensesPath, join(directory, "production-licenses.json"));
    await writeFile(join(directory, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
    console.log(`Dependency-risk evidence: ${directory}`);
  }
  console.log(
    `Dependency audit: ${result.audit.registryOccurrenceCounts.critical} critical, ${result.audit.registryOccurrenceCounts.high} high; ${result.audit.locallyPatched.length} locally patched and ${result.audit.blocking.length} unaccepted high/critical paths.`
  );
  console.log(
    `Published production advisory paths: ${result.audit.publishedProductionFindingCount}; production license packages: ${result.licenses.inventory.length}.`
  );
  if (result.failures.length) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
