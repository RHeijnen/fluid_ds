import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import {
  compareSnapshotRuns,
  stabilityRoot,
  validateRasterPolicy,
  validateRunMetadata,
  validateRunCount,
  validateStabilityDirectory
} from "./stability-evidence.mjs";

const file = (path, sha256) => ({ path, bytes: 10, sha256 });

test("raster policy metadata and launch argument cannot drift", () => {
  assert.deepEqual(
    validateRasterPolicy({ rasterThreads: 1, chromiumLaunchArgs: ["--num-raster-threads=1"] }),
    { rasterThreads: 1, chromiumLaunchArgs: ["--num-raster-threads=1"] }
  );
  assert.throws(() =>
    validateRasterPolicy({ rasterThreads: 1, chromiumLaunchArgs: ["--num-raster-threads=2"] })
  );
  assert.throws(() =>
    validateRasterPolicy({
      rasterThreads: 1,
      chromiumLaunchArgs: ["--num-raster-threads=1", "--num-raster-threads=2"]
    })
  );
});

test("stability evidence requires a named isolated directory", () => {
  assert.throws(() => validateStabilityDirectory(stabilityRoot));
  assert.throws(() => validateStabilityDirectory(join(stabilityRoot, "..", "__screenshots__")));
  assert.equal(
    validateStabilityDirectory(join(stabilityRoot, "three-runs")),
    join(stabilityRoot, "three-runs")
  );
});

test("stability run counts are explicit and bounded", () => {
  assert.equal(validateRunCount(3), 3);
  assert.equal(validateRunCount("50"), 50);
  for (const value of [2, 3.5, 201, "many"]) assert.throws(() => validateRunCount(value));
});

test("three exact identical screenshot sets establish zero variance", () => {
  const run = [file("screenshots/one-light.png", "a"), file("screenshots/two-rtl.png", "b")];
  assert.deepEqual(compareSnapshotRuns([run, run, run], ["one-light.png", "two-rtl.png"]), {
    runCount: 3,
    screenshotCountPerRun: 2,
    variance: []
  });
});

test("stability comparison fails on missing captures, hash variance, or too few runs", () => {
  const run = [file("screenshots/one-light.png", "a")];
  assert.throws(() => compareSnapshotRuns([run, run], ["one-light.png"]));
  assert.throws(() => compareSnapshotRuns([run, [], run], ["one-light.png"]));
  assert.throws(() =>
    compareSnapshotRuns(
      [run, [file("screenshots/one-light.png", "changed")], run],
      ["one-light.png"]
    )
  );
});

test("run metadata fails closed on attribution and accepted-lifecycle drift", () => {
  const metadata = {
    platform: {
      id: "canonical",
      os: "linux",
      release: "one",
      rasterPolicy: { rasterThreads: 1, chromiumLaunchArgs: ["--num-raster-threads=1"] }
    },
    gapCount: 60,
    acceptedBefore: { fileCount: 1009, aggregateSha256: "accepted" },
    acceptedAfter: { fileCount: 1009, aggregateSha256: "accepted" }
  };
  const expected = {
    gapCount: 60,
    acceptedFileCount: 1009,
    acceptedAggregate: "accepted",
    platformId: "canonical"
  };
  assert.deepEqual(validateRunMetadata([metadata, metadata], expected), metadata.platform);
  assert.throws(() =>
    validateRunMetadata(
      [metadata, { ...metadata, platform: { ...metadata.platform, release: "two" } }],
      expected
    )
  );
  assert.throws(() =>
    validateRunMetadata(
      [metadata, { ...metadata, acceptedAfter: { fileCount: 1009, aggregateSha256: "changed" } }],
      expected
    )
  );
  assert.throws(() =>
    validateRunMetadata(
      [{ ...metadata, platform: { ...metadata.platform, rasterPolicy: undefined } }, metadata],
      expected
    )
  );
});
