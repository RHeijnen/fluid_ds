import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  evaluateAuditReport,
  evaluateLicenseReport,
  evaluateLocalPatchDispositions,
  validateAllowlist
} from "./check-dependency-risk.mjs";

const advisory = {
  github_advisory_id: "GHSA-aaaa-bbbb-cccc",
  module_name: "unsafe-package",
  severity: "high",
  title: "fixture advisory",
  vulnerable_versions: "<2.0.0",
  patched_versions: ">=2.0.0",
  findings: [{ version: "1.0.0", paths: [". > unsafe-package@1.0.0"] }]
};
const report = {
  advisories: { 1: advisory },
  metadata: { vulnerabilities: { high: 1 }, dependencies: 1 }
};

async function fixtureRoot(t) {
  const root = await mkdtemp(join(tmpdir(), "fluid-dependency-risk-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify({ dependencies: { "unsafe-package": "1.0.0" } })}\n`
  );
  return root;
}

test("high and critical findings fail closed without an exact exception", async (t) => {
  const root = await fixtureRoot(t);
  const result = await evaluateAuditReport(report, { schemaVersion: 1, exceptions: [] }, root);
  assert.equal(result.blocking.length, 1);
  assert.equal(result.directHighCritical.length, 1);
  assert.equal(result.directHighCritical[0].relationship, "production");
});

test("an exact, owned, reasoned, unexpired exception covers only its stated path", async (t) => {
  const root = await fixtureRoot(t);
  const exception = {
    advisoryId: "GHSA-aaaa-bbbb-cccc",
    module: "unsafe-package",
    versions: ["1.0.0"],
    pathPrefixes: [". > unsafe-package@1.0.0"],
    rationale: "Fixture-only acceptance pending replacement.",
    owner: "security-fixture-owner",
    expires: "2099-01-01T00:00:00.000Z"
  };
  const result = await evaluateAuditReport(
    report,
    { schemaVersion: 1, exceptions: [exception] },
    root,
    new Date("2026-08-27T00:00:00.000Z")
  );
  assert.equal(result.blocking.length, 0);
  assert.equal(result.accepted.length, 1);
  const changedPath = structuredClone(report);
  changedPath.advisories[1].findings[0].paths[0] = ". > wrapper@1.0.0 > unsafe-package@1.0.0";
  assert.equal(
    (
      await evaluateAuditReport(
        changedPath,
        { schemaVersion: 1, exceptions: [exception] },
        root,
        new Date("2026-08-27T00:00:00.000Z")
      )
    ).blocking.length,
    1
  );
});

test("blanket, malformed, duplicate, and expired exceptions are rejected", () => {
  const base = {
    advisoryId: "GHSA-aaaa-bbbb-cccc",
    module: "unsafe-package",
    versions: ["1.0.0"],
    pathPrefixes: [". > unsafe-package@1.0.0"],
    rationale: "Temporary fixture rationale.",
    owner: "security-fixture-owner",
    expires: "2026-08-28T00:00:00.000Z"
  };
  assert.deepEqual(
    validateAllowlist(
      { schemaVersion: 1, exceptions: [base] },
      new Date("2026-08-27T00:00:00.000Z")
    ),
    []
  );
  const failures = validateAllowlist(
    {
      schemaVersion: 1,
      exceptions: [
        { ...base, versions: [], pathPrefixes: [], rationale: "", expires: "2026-01-01" },
        base,
        base
      ]
    },
    new Date("2026-08-27T00:00:00.000Z")
  );
  assert.ok(failures.some((failure) => /non-empty versions/.test(failure)));
  assert.ok(failures.some((failure) => /non-empty pathPrefixes/.test(failure)));
  assert.ok(failures.some((failure) => /requires non-empty rationale/.test(failure)));
  assert.ok(failures.some((failure) => /expired/.test(failure)));
  assert.ok(failures.some((failure) => /duplicates/.test(failure)));
});

test("a malformed exception cannot accidentally accept a finding", async (t) => {
  const root = await fixtureRoot(t);
  const malformed = {
    advisoryId: "GHSA-aaaa-bbbb-cccc",
    module: "unsafe-package",
    rationale: "Missing exact versions and paths.",
    owner: "security-fixture-owner",
    expires: "2099-01-01T00:00:00.000Z"
  };
  const result = await evaluateAuditReport(
    report,
    { schemaVersion: 1, exceptions: [malformed] },
    root
  );
  assert.equal(result.blocking.length, 1);
  assert.ok(result.policyFailures.some((failure) => /non-empty versions/.test(failure)));
  assert.ok(result.policyFailures.some((failure) => /non-empty pathPrefixes/.test(failure)));
});

test("an invalid top-level allowlist fails closed without crashing", async (t) => {
  const root = await fixtureRoot(t);
  const result = await evaluateAuditReport(report, { schemaVersion: 0 }, root);
  assert.equal(result.blocking.length, 1);
  assert.deepEqual(result.accepted, []);
  assert.ok(result.policyFailures.some((failure) => /schemaVersion 1/.test(failure)));
});

test("a local patch stays pending until exact Linux proof activates it", async (t) => {
  const root = await fixtureRoot(t);
  await mkdir(join(root, "patches"));
  await mkdir(join(root, "evidence"));
  const patch = "reviewed patch\n";
  const patchSha256 = createHash("sha256").update(patch).digest("hex");
  const lock = `lockfileVersion: '9.0'\n\npatchedDependencies:\n  unsafe-package@1.0.0:\n    hash: exactpatchhash\n    path: patches/unsafe.patch\n\npackages:\n\n  unsafe-package@1.0.0:\n    resolution: {integrity: fixture}\n\nsnapshots:\n\n  unsafe-package@1.0.0(patch_hash=exactpatchhash): {}\n`;
  const lockSha256 = createHash("sha256").update(lock).digest("hex");
  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify({
      dependencies: { "unsafe-package": "1.0.0" },
      pnpm: { patchedDependencies: { "unsafe-package@1.0.0": "patches/unsafe.patch" } }
    })}\n`
  );
  await writeFile(join(root, "pnpm-lock.yaml"), lock);
  await writeFile(join(root, "patches", "unsafe.patch"), patch);
  const disposition = {
    id: "unsafe-package-local-fix",
    advisoryId: "GHSA-aaaa-bbbb-cccc",
    module: "unsafe-package",
    version: "1.0.0",
    patchedDependency: "unsafe-package@1.0.0",
    lockPatchHash: "exactpatchhash",
    patchPath: "patches/unsafe.patch",
    patchSha256,
    proofPath: "evidence/proof.json",
    requiredChecks: ["malicious-input-rejected"],
    rationale: "Fixture local remediation.",
    owner: "fixture owner"
  };
  const pending = await evaluateLocalPatchDispositions(
    { schemaVersion: 1, dispositions: [disposition] },
    root
  );
  assert.equal(pending.dispositions[0].status, "pending");
  assert.equal(
    (
      await evaluateAuditReport(
        report,
        { schemaVersion: 1, exceptions: [] },
        root,
        new Date(),
        pending.dispositions
      )
    ).blocking.length,
    1
  );

  await writeFile(
    join(root, "evidence", "proof.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      status: "passed",
      platform: "linux",
      dispositionId: disposition.id,
      module: disposition.module,
      version: disposition.version,
      lockPatchHash: disposition.lockPatchHash,
      patchSha256,
      lockSha256,
      checks: [{ id: "malicious-input-rejected", status: "passed" }]
    })}\n`
  );
  const active = await evaluateLocalPatchDispositions(
    { schemaVersion: 1, dispositions: [disposition] },
    root
  );
  assert.deepEqual(active.failures, []);
  assert.equal(active.dispositions[0].status, "active");
  const result = await evaluateAuditReport(
    report,
    { schemaVersion: 1, exceptions: [] },
    root,
    new Date(),
    active.dispositions
  );
  assert.equal(result.blocking.length, 0);
  assert.equal(result.locallyPatched.length, 1);
  assert.equal(result.accepted.length, 0);

  await writeFile(join(root, "patches", "unsafe.patch"), "tampered patch\n");
  const tampered = await evaluateLocalPatchDispositions(
    { schemaVersion: 1, dispositions: [disposition] },
    root
  );
  assert.equal(tampered.dispositions[0].status, "failed");
  assert.ok(tampered.failures.some((failure) => /patch file SHA-256/.test(failure)));
});

test("production licenses are inventoried and unknown or copyleft expressions fail closed", () => {
  const accepted = evaluateLicenseReport({
    MIT: [{ name: "permissive", versions: ["1.0.0"] }],
    "(MPL-2.0 OR Apache-2.0)": [{ name: "dual", versions: ["2.0.0"] }]
  });
  assert.deepEqual(accepted.failures, []);
  assert.equal(accepted.inventory.length, 2);
  assert.ok(evaluateLicenseReport({ "GPL-3.0-only": [] }).failures.length > 0);
  assert.ok(evaluateLicenseReport({ UNKNOWN: [] }).failures.length > 0);
  assert.ok(evaluateLicenseReport({}).failures.some((failure) => /empty/.test(failure)));
});
