import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { acceptedSnapshotDirectory, hashFiles, inventory, modes } from "./baseline-inventory.mjs";
import visualRasterPolicy from "../visual-platform-policy.json" with { type: "json" };

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "..");
export const stabilityRoot = resolve(app, "candidate-evidence", "stability");
const acceptedFixtureId = "components-navigation-accordion--default";
const minimumRunCount = 3;

export function validateRasterPolicy(policy) {
  const expected = `--num-raster-threads=${policy.rasterThreads}`;
  const rasterArguments = policy.chromiumLaunchArgs.filter((argument) =>
    argument.startsWith("--num-raster-threads=")
  );
  if (rasterArguments.length !== 1 || rasterArguments[0] !== expected) {
    throw new Error("Visual raster metadata and Chromium launch arguments disagree");
  }
  return policy;
}

validateRasterPolicy(visualRasterPolicy);

export function validateRunCount(value) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < minimumRunCount || count > 200) {
    throw new Error(`Stability run count must be an integer from ${minimumRunCount} through 200`);
  }
  return count;
}

export function validateStabilityDirectory(directory) {
  const absolute = resolve(directory);
  const child = relative(stabilityRoot, absolute);
  if (!child || child.startsWith("..") || absolute.includes("__screenshots__")) {
    throw new Error(
      "Stability evidence must be a named directory below candidate-evidence/stability/"
    );
  }
  return absolute;
}

function names(files) {
  return files
    .filter(({ path }) => path.endsWith(".png"))
    .map(({ path }) => basename(path))
    .sort();
}

function shaMap(files) {
  return new Map(
    files
      .filter(({ path }) => path.endsWith(".png"))
      .map((file) => [basename(file.path), file.sha256])
  );
}

export function compareSnapshotRuns(runFiles, expectedNames) {
  if (runFiles.length < minimumRunCount) throw new Error("At least three fresh runs are required");
  const expected = [...expectedNames].sort();
  for (const files of runFiles) {
    const actual = names(files);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Run screenshot set mismatch (expected=${expected.length}, actual=${actual.length})`
      );
    }
  }
  const reference = shaMap(runFiles[0]);
  const variance = [];
  for (let index = 1; index < runFiles.length; index += 1) {
    const candidate = shaMap(runFiles[index]);
    for (const name of expected) {
      if (candidate.get(name) !== reference.get(name)) variance.push({ run: index + 1, name });
    }
  }
  if (variance.length) {
    throw new Error(
      `Visual nondeterminism detected in ${variance.length} comparisons: ${JSON.stringify(variance)}`
    );
  }
  return { runCount: runFiles.length, screenshotCountPerRun: expected.length, variance };
}

export function validateRunMetadata(
  metadata,
  { gapCount, acceptedFileCount, acceptedAggregate, platformId, rasterPolicy = visualRasterPolicy }
) {
  const platformIds = new Set(metadata.map((run) => run.platform.id));
  const platformAttribution = new Set(metadata.map((run) => JSON.stringify(run.platform)));
  const gapCounts = new Set(metadata.map((run) => run.gapCount));
  const acceptedFileCounts = new Set(
    metadata.flatMap((run) => [run.acceptedBefore.fileCount, run.acceptedAfter.fileCount])
  );
  const acceptedBefore = new Set(metadata.map((run) => run.acceptedBefore.aggregateSha256));
  const acceptedAfter = new Set(metadata.map((run) => run.acceptedAfter.aggregateSha256));
  const rasterPolicies = new Set(metadata.map((run) => JSON.stringify(run.platform.rasterPolicy)));
  if (
    platformIds.size !== 1 ||
    platformAttribution.size !== 1 ||
    gapCounts.size !== 1 ||
    !gapCounts.has(gapCount) ||
    acceptedFileCounts.size !== 1 ||
    !acceptedFileCounts.has(acceptedFileCount) ||
    acceptedBefore.size !== 1 ||
    acceptedAfter.size !== 1 ||
    rasterPolicies.size !== 1 ||
    !rasterPolicies.has(JSON.stringify(rasterPolicy))
  ) {
    throw new Error("Run metadata or accepted-baseline lifecycle changed across stability runs");
  }
  if (!acceptedBefore.has(acceptedAggregate) || !acceptedAfter.has(acceptedAggregate)) {
    throw new Error("Retained run metadata does not match the current accepted-baseline bytes");
  }
  if (platformId && !platformIds.has(platformId)) {
    throw new Error("Retained run platform does not match VR_PLATFORM_ID");
  }
  return metadata[0].platform;
}

function aggregate(files) {
  return createHash("sha256")
    .update(JSON.stringify(files.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }))))
    .digest("hex");
}

async function acceptedState() {
  const status = execFileSync("git", ["status", "--porcelain", "--", acceptedSnapshotDirectory], {
    cwd: app,
    encoding: "utf8"
  }).trim();
  if (status) throw new Error("Accepted snapshots have worktree changes");
  const files = await hashFiles(acceptedSnapshotDirectory);
  return { fileCount: files.length, aggregateSha256: aggregate(files), files };
}

function playwright(arguments_, environment) {
  execFileSync(resolve(app, "node_modules", ".bin", "playwright"), arguments_, {
    cwd: app,
    env: {
      ...process.env,
      ...environment,
      VR_CANDIDATE_CAPTURE: environment.VR_CANDIDATE_CAPTURE ?? "0"
    },
    stdio: "inherit"
  });
}

async function retainedRunNumbers(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  return entries
    .filter((entry) => entry.isDirectory() && /^run-\d+$/.test(entry.name))
    .map((entry) => Number(entry.name.slice(4)))
    .sort((left, right) => left - right);
}

async function seedEvidence(directory, seedDirectory, targetRunCount) {
  const source = validateStabilityDirectory(seedDirectory);
  if (source === directory) throw new Error("Seed evidence must be a different directory");
  const destinationRuns = await retainedRunNumbers(directory);
  if (destinationRuns.length) {
    throw new Error("Seed evidence can only initialize a history with no retained runs");
  }
  const sourceRuns = await retainedRunNumbers(source);
  if (sourceRuns.length < minimumRunCount) {
    throw new Error("Seed evidence must contain at least three retained runs");
  }
  const copiedRuns = sourceRuns.filter((number) => number <= targetRunCount);
  for (const number of copiedRuns) {
    await cp(resolve(source, `run-${number}`), resolve(directory, `run-${number}`), {
      recursive: true,
      errorOnExist: true
    });
  }
  await writeFile(
    resolve(directory, "history-provenance.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        seededFrom: relative(stabilityRoot, source).replaceAll("\\", "/"),
        copiedRuns,
        policy:
          "Copied retained executions remain subject to the same full-set hash, platform, and accepted-baseline lifecycle comparison as newly captured executions."
      },
      null,
      2
    )}\n`
  );
}

export async function compareEvidence(root, requestedRunCount = minimumRunCount) {
  const directory = validateStabilityDirectory(root);
  const runCount = validateRunCount(requestedRunCount);
  const gap = await inventory();
  const expectedCandidateNames = gap.missing.map(({ name }) => name);
  const expectedAcceptedNames = modes.map((mode) => `${acceptedFixtureId}-${mode}.png`);
  const runs = [];
  const expectedRunNumbers = Array.from({ length: runCount }, (_, index) => index + 1);
  const actualRunNumbers = await retainedRunNumbers(directory);
  if (JSON.stringify(actualRunNumbers) !== JSON.stringify(expectedRunNumbers)) {
    throw new Error(
      `Retained run set mismatch (expected=${runCount}, actual=${actualRunNumbers.length})`
    );
  }
  for (let number = 1; number <= runCount; number += 1) {
    const run = resolve(directory, `run-${number}`);
    runs.push({
      candidate: await hashFiles(resolve(run, "candidate", "screenshots")),
      accepted: await hashFiles(resolve(run, "accepted-smoke", "screenshots")),
      metadata: JSON.parse(await readFile(resolve(run, "run-metadata.json"), "utf8"))
    });
    if (runs.at(-1).metadata.run !== number) {
      throw new Error(`Run metadata number mismatch for run-${number}`);
    }
  }
  const candidate = compareSnapshotRuns(
    runs.map(({ candidate: files }) => files),
    expectedCandidateNames
  );
  const accepted = compareSnapshotRuns(
    runs.map(({ accepted: files }) => files),
    expectedAcceptedNames
  );
  const acceptedBaselines = await hashFiles(acceptedSnapshotDirectory);
  const acceptedMap = shaMap(acceptedBaselines);
  const acceptedByteMismatches = [];
  for (const run of runs) {
    const captureMap = shaMap(run.accepted);
    for (const name of expectedAcceptedNames) {
      if (captureMap.get(name) !== acceptedMap.get(name)) {
        acceptedByteMismatches.push({ run: run.metadata.run, name });
      }
    }
  }
  const acceptedAggregate = aggregate(acceptedBaselines);
  const runFingerprints = runs.map((run) => ({
    run: run.metadata.run,
    candidateAggregateSha256: aggregate(run.candidate),
    acceptedSmokeAggregateSha256: aggregate(run.accepted)
  }));
  const platform = validateRunMetadata(
    runs.map(({ metadata }) => metadata),
    {
      gapCount: gap.missingCount,
      acceptedFileCount: acceptedBaselines.length,
      acceptedAggregate,
      platformId: process.env.VR_PLATFORM_ID
    }
  );
  const summary = {
    schemaVersion: 1,
    accepted: false,
    humanAccepted: false,
    stable: true,
    generatedAt: new Date().toISOString(),
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: app,
      encoding: "utf8"
    }).trim(),
    platform,
    candidate,
    acceptedSmoke: accepted,
    history: {
      executions: runs.length,
      flakyExecutions: 0,
      flakeRate: 0,
      requiredMaximumFlakeRate: 0.01,
      candidateComparisons: (runs.length - 1) * candidate.screenshotCountPerRun,
      acceptedSmokeComparisons: (runs.length - 1) * accepted.screenshotCountPerRun,
      runFingerprints
    },
    acceptedBaseline: {
      fileCount: acceptedBaselines.length,
      aggregateSha256: acceptedAggregate,
      unchangedAcrossRuns: true,
      worktreeClean: true,
      freshByteMismatches: acceptedByteMismatches,
      comparisonPolicy:
        "Fresh captures are required to be byte-identical to each other; the immutable accepted baseline remains governed by the configured Playwright pixel tolerance."
    }
  };
  await rm(resolve(directory, "stability-failure.json"), { force: true });
  await writeFile(
    resolve(directory, "stability-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`
  );
  return summary;
}

export async function runStability(
  root,
  requestedRunCount = minimumRunCount,
  seedDirectory = undefined
) {
  if (process.platform !== "linux")
    throw new Error("Canonical stability capture must run on Linux");
  const directory = validateStabilityDirectory(root);
  const runCount = validateRunCount(requestedRunCount);
  await mkdir(directory, { recursive: true });
  if (seedDirectory) await seedEvidence(directory, seedDirectory, runCount);
  const gap = await inventory();
  const fixtureIds = [...new Set(gap.missing.map(({ fixtureId }) => fixtureId))];
  const gapPattern = fixtureIds.map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const initialAccepted = await acceptedState();
  const retainedBeforeCapture = await retainedRunNumbers(directory);
  if (retainedBeforeCapture.length) {
    if (retainedBeforeCapture.length < minimumRunCount) {
      throw new Error("A resumed history must contain at least three complete retained runs");
    }
    await compareEvidence(directory, retainedBeforeCapture.length);
  }
  const existingRuns = new Set(await retainedRunNumbers(directory));
  for (let number = 1; number <= runCount; number += 1) {
    const run = resolve(directory, `run-${number}`);
    if (existingRuns.has(number)) continue;
    const child = relative(directory, run);
    if (!child || child.startsWith(".."))
      throw new Error("Unsafe generated stability run directory");
    await rm(run, { recursive: true, force: true });
    await mkdir(run, { recursive: true });
    playwright(
      [
        "test",
        "--config",
        "playwright.stability.config.ts",
        "tests/catalog.spec.ts",
        "--grep",
        gapPattern
      ],
      { VR_STABILITY_DIR: run, VR_STABILITY_KIND: "candidate", VR_CANDIDATE_CAPTURE: "1" }
    );
    playwright(
      [
        "test",
        "--config",
        "playwright.stability.config.ts",
        "tests/catalog.spec.ts",
        "--grep",
        `${acceptedFixtureId} visual contract`
      ],
      { VR_STABILITY_DIR: run, VR_STABILITY_KIND: "accepted-smoke" }
    );
    const acceptedAfter = await acceptedState();
    if (acceptedAfter.aggregateSha256 !== initialAccepted.aggregateSha256) {
      throw new Error("Accepted baseline bytes changed during stability capture");
    }
    await writeFile(
      resolve(run, "run-metadata.json"),
      `${JSON.stringify(
        {
          run: number,
          platform: {
            id: process.env.VR_PLATFORM_ID ?? "unattributed",
            os: os.platform(),
            release: os.release(),
            arch: os.arch(),
            node: process.version,
            playwright: process.env.VR_PLAYWRIGHT_VERSION ?? "unknown",
            rasterPolicy: visualRasterPolicy
          },
          gapCount: gap.missingCount,
          acceptedBefore: {
            fileCount: initialAccepted.fileCount,
            aggregateSha256: initialAccepted.aggregateSha256
          },
          acceptedAfter: {
            fileCount: acceptedAfter.fileCount,
            aggregateSha256: acceptedAfter.aggregateSha256
          }
        },
        null,
        2
      )}\n`
    );
    if (number >= minimumRunCount) await compareEvidence(directory, number);
  }
  return compareEvidence(directory, runCount);
}

async function main() {
  const arguments_ = process.argv.slice(2);
  const compare = arguments_.includes("--compare");
  const countArgument = arguments_.find((argument) => argument.startsWith("--runs="));
  const seedArgument = arguments_.find((argument) => argument.startsWith("--seed="));
  const directory = arguments_.find((argument) => !argument.startsWith("--"));
  const runCount = validateRunCount(countArgument?.slice("--runs=".length) ?? minimumRunCount);
  const seedDirectory = seedArgument?.slice("--seed=".length);
  if (!directory)
    throw new Error(
      "Usage: node stability-evidence.mjs [--compare] [--runs=<count>] [--seed=<directory>] <directory>"
    );
  if (compare && seedDirectory) throw new Error("--seed cannot be used with --compare");
  try {
    console.log(
      JSON.stringify(
        await (compare
          ? compareEvidence(directory, runCount)
          : runStability(directory, runCount, seedDirectory)),
        null,
        2
      )
    );
  } catch (error) {
    const root = validateStabilityDirectory(directory);
    await mkdir(root, { recursive: true });
    await writeFile(
      resolve(root, "stability-failure.json"),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          accepted: false,
          humanAccepted: false,
          stable: false,
          generatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        },
        null,
        2
      )}\n`
    );
    throw error;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
