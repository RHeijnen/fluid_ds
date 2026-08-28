import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import {
  evidenceRoot,
  validateEvidenceDirectory,
  verifyCandidateNames,
  verifyRecordedFiles
} from "./candidate-evidence.mjs";

test("candidate evidence cannot target accepted snapshots or the evidence root", () => {
  assert.throws(() => validateEvidenceDirectory(evidenceRoot));
  assert.throws(() => validateEvidenceDirectory(join(evidenceRoot, "..", "__screenshots__")));
  assert.equal(
    validateEvidenceDirectory(join(evidenceRoot, "dated-platform")),
    join(evidenceRoot, "dated-platform")
  );
});

test("candidate evidence rejects changed hashes and unrecorded artifacts", () => {
  const recorded = [{ path: "screenshots/one.png", bytes: 10, sha256: "abc" }];
  assert.deepEqual(verifyRecordedFiles(recorded, [...recorded]), {
    recordedCount: 1,
    changed: [],
    unexpected: []
  });
  assert.throws(() =>
    verifyRecordedFiles(recorded, [{ path: "screenshots/one.png", bytes: 11, sha256: "def" }])
  );
  assert.throws(() =>
    verifyRecordedFiles(recorded, [
      ...recorded,
      { path: "screenshots/unrecorded.png", bytes: 1, sha256: "123" }
    ])
  );
});

test("candidate evidence must exactly match the named accepted-baseline gap", () => {
  const gap = { missing: [{ name: "one-light.png" }, { name: "two-rtl.png" }] };
  const exact = verifyCandidateNames(gap, [
    { path: "screenshots/catalog.spec.ts/one-light.png" },
    { path: "screenshots/catalog.spec.ts/two-rtl.png" },
    { path: "results.json" }
  ]);
  assert.deepEqual(exact, { expectedCount: 2, actualCount: 2, missing: [], unexpected: [] });
  assert.throws(() =>
    verifyCandidateNames(gap, [{ path: "screenshots/catalog.spec.ts/one-light.png" }])
  );
  assert.throws(() =>
    verifyCandidateNames(gap, [
      { path: "screenshots/catalog.spec.ts/one-light.png" },
      { path: "screenshots/catalog.spec.ts/two-rtl.png" },
      { path: "screenshots/catalog.spec.ts/unexpected.png" }
    ])
  );
});
