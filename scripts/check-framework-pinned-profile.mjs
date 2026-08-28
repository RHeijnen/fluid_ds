import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { runRuntime as runAngularRuntime } from "./check-framework-angular-runtime.mjs";
import { runRuntime as runAstroRuntime } from "./check-framework-astro-ssr.mjs";
import { runRuntime as runNextRuntime } from "./check-framework-next-ssr.mjs";
import { runRuntime as runSvelteKitRuntime } from "./check-framework-sveltekit-ssr.mjs";
import { runRuntime as runVanillaRuntime } from "./check-framework-vanilla-runtime.mjs";
import { runRuntime as runVueRuntime } from "./check-framework-vue-runtime.mjs";
import { runFrameworkCommand } from "./framework-commands.mjs";
import { checkFixtureIsolation } from "./framework-isolation.mjs";
import { artifactHashes, assertPortableLock, copyConsumer } from "./framework-packing.mjs";
import { assertPackedConsumer, runReactRuntime, withDeadline } from "./framework-runtime.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const profilePath = join(root, "scripts/framework-pinned-profile.json");
const evidenceRoot = join(root, "quality/evidence/framework-pinned");

const runtimeRunners = {
  angular: runAngularRuntime,
  astro: runAstroRuntime,
  next: runNextRuntime,
  react: runReactRuntime,
  sveltekit: runSvelteKitRuntime,
  vanilla: runVanillaRuntime,
  vue: runVueRuntime
};

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function aggregateArtifactHash(hashes) {
  return sha256(
    JSON.stringify(
      Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)))
    )
  );
}

export function validatePinnedProfile(profile) {
  assert.equal(profile.schemaVersion, 1, "Unsupported pinned framework profile schema");
  assert.equal(profile.packageManager, "pnpm@9.15.0", "Pinned pnpm profile drifted");
  assert.match(
    profile.rootBaseRevision,
    /^[0-9a-f]{40}$/,
    "Missing exact root base revision"
  );
  assert.match(profile.rootLockSha256, /^[0-9a-f]{64}$/, "Missing exact root lock hash");
  assert.equal(profile.lanes?.length, 7, "Pinned profile must contain exactly seven lanes");
  assert.deepEqual(
    profile.lanes.map(({ id }) => id).sort(),
    Object.keys(runtimeRunners).sort(),
    "Pinned profile lane set drifted"
  );
  const manifestNames = new Set();
  for (const lane of profile.lanes) {
    assert.ok(!manifestNames.has(lane.manifestName), `Duplicate manifest: ${lane.manifestName}`);
    manifestNames.add(lane.manifestName);
    assert.equal(
      lane.sourceEvidence,
      `scripts/fixtures/framework-pinned/${lane.id}`,
      `${lane.id}: pinned source must use the tracked replay corpus`
    );
    assert.match(lane.sourceResultSha256, /^[0-9a-f]{64}$/);
    assert.match(lane.bundleSha256, /^[0-9a-f]{64}$/);
    assert.match(lane.consumerLockSha256, /^[0-9a-f]{64}$/);
    if (lane.derivation !== undefined) assert.ok(lane.derivation.length > 40);
    assert.ok(
      lane.renderingContract === "csr" || lane.renderingContract === "build-time-static-dsd",
      `Unsupported rendering contract for ${lane.id}`
    );
  }
  return profile;
}

function resolveEvidenceSource(relativeSource) {
  const source = resolve(root, relativeSource);
  const allowed = resolve(root, "scripts/fixtures/framework-pinned");
  const path = relative(allowed, source);
  assert.ok(
    path && path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path),
    "Evidence escaped root"
  );
  return source;
}

async function retainBundle(temporary, destination) {
  await mkdir(destination, { recursive: true });
  await cp(join(temporary, "packs"), join(destination, "packs"), { recursive: true });
  await copyConsumer(join(temporary, "fixture"), join(destination, "fixture"));
}

async function runLane(lane, outputDirectory) {
  const source = await realpath(resolveEvidenceSource(lane.sourceEvidence));
  const temporary = await mkdtemp(join(tmpdir(), `fluid-framework-pinned-${lane.id}-`));
  const consumer = join(temporary, "fixture");
  const laneOutput = join(outputDirectory, lane.id);
  const report = {
    id: lane.id,
    manifestName: lane.manifestName,
    renderingContract: lane.renderingContract,
    sourceEvidence: lane.sourceEvidence,
    relocatedTemporaryRoot: temporary,
    status: "failed",
    outcomes: {
      profile: "not-run",
      copy: "not-run",
      install: "not-run",
      isolation: "not-run",
      typecheck: "not-run",
      build: "not-run",
      runtime: "not-run",
      immutableBytes: "not-run",
      cleanup: "not-run"
    },
    commandOutcomes: []
  };
  const run = (args, stage) =>
    runFrameworkCommand(args, {
      cwd: consumer,
      stage,
      outcomes: report.commandOutcomes,
      logPath: join(laneOutput, `${stage}.log`)
    });

  try {
    await mkdir(laneOutput, { recursive: true });
    const before = await artifactHashes(source);
    report.artifactHashes = before;
    const sourceResultBytes = await readFile(join(source, "result.json"));
    assert.equal(sha256(sourceResultBytes), lane.sourceResultSha256, "Source result hash drifted");
    const sourceResult = JSON.parse(sourceResultBytes);
    assert.equal(sourceResult.status, "passed", "Pinned source evidence was not successful");
    report.latestCompatible = {
      lane: sourceResult.lane,
      node: sourceResult.node,
      platform: sourceResult.platform,
      packageManager: sourceResult.packageManager,
      resultSha256: lane.sourceResultSha256
    };
    if (lane.derivation) report.latestCompatible.pinnedDerivation = lane.derivation;
    assert.equal(aggregateArtifactHash(before), lane.bundleSha256, "Pinned bundle hash drifted");
    assert.equal(
      before["fixture/pnpm-lock.yaml"],
      lane.consumerLockSha256,
      "Pinned consumer lock hash drifted"
    );
    assertPortableLock(await readFile(join(source, "fixture/pnpm-lock.yaml"), "utf8"));
    report.outcomes.profile = "passed";

    await cp(join(source, "packs"), join(temporary, "packs"), { recursive: true });
    await copyConsumer(join(source, "fixture"), consumer);
    assert.deepEqual(
      await artifactHashes(temporary),
      before,
      "Relocated bytes differ before install"
    );
    report.outcomes.copy = "passed";

    const manifest = JSON.parse(await readFile(join(consumer, "package.json"), "utf8"));
    assert.equal(manifest.name, lane.manifestName, "Pinned fixture identity drifted");
    assert.equal(manifest.packageManager, "pnpm@9.15.0", "Fixture package manager drifted");
    assert.ok(manifest.scripts?.typecheck && manifest.scripts?.build, "Missing required scripts");
    await checkFixtureIsolation(consumer);
    report.outcomes.isolation = "passed";

    await run(
      [
        "install",
        "--offline",
        "--frozen-lockfile",
        "--ignore-scripts",
        "--strict-peer-dependencies"
      ],
      "install"
    );
    report.outcomes.install = "passed";
    await assertPackedConsumer(consumer, ["@fluid-ds/components"]);

    for (const stage of ["typecheck", "build"]) {
      await run(["run", stage], stage);
      report.outcomes[stage] = "passed";
    }

    const runtime = await runtimeRunners[lane.id](consumer, join(laneOutput, "runtime"));
    report.runtime = runtime;
    assert.equal(runtime.status, "passed", `${lane.id} browser runtime contract failed`);
    report.outcomes.runtime = "passed";

    assert.deepEqual(await artifactHashes(temporary), before, "Replay changed pinned source bytes");
    assert.deepEqual(
      await artifactHashes(source),
      before,
      "Replay changed original evidence bytes"
    );
    report.outcomes.immutableBytes = "passed";
    report.status = "passed";
  } catch (error) {
    report.error = String(error.stack ?? error);
  } finally {
    try {
      await withDeadline(retainBundle(temporary, laneOutput), 30_000, `${lane.id} retention`);
    } catch (error) {
      report.status = "failed";
      report.retentionError = String(error.stack ?? error);
    }
    if (temporary.startsWith(`${tmpdir()}${sep}fluid-framework-pinned-${lane.id}-`)) {
      try {
        await withDeadline(
          rm(temporary, { recursive: true, force: true }),
          30_000,
          `${lane.id} cleanup`
        );
        report.outcomes.cleanup = "passed";
      } catch (error) {
        report.status = "failed";
        report.outcomes.cleanup = "failed";
        report.cleanupError = String(error.stack ?? error);
      }
    } else {
      report.status = "failed";
      report.outcomes.cleanup = "failed";
      report.cleanupError = "Temporary path did not match owned prefix";
    }
    await writeFile(join(laneOutput, "result.json"), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

export async function runPinnedProfile({ profileFile = profilePath, output } = {}) {
  const profile = validatePinnedProfile(JSON.parse(await readFile(profileFile, "utf8")));
  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  const outputDirectory = output ?? join(evidenceRoot, timestamp);
  await mkdir(outputDirectory, { recursive: true });
  const rootLockBefore = sha256(await readFile(join(root, "pnpm-lock.yaml")));
  const report = {
    schemaVersion: 1,
    status: "failed",
    lane: "seven-consumer-retained-exact-graph-frozen-replay",
    profile: relative(root, profileFile).replaceAll("\\", "/"),
    rootBaseRevision: profile.rootBaseRevision,
    rootLockSha256: rootLockBefore,
    expectedRootLockSha256: profile.rootLockSha256,
    node: process.version,
    platform: process.platform,
    packageManager: profile.packageManager,
    networkPolicy: "offline",
    lanes: []
  };
  try {
    assert.equal(rootLockBefore, profile.rootLockSha256, "Root lock changed after profile capture");
    for (const lane of profile.lanes) report.lanes.push(await runLane(lane, outputDirectory));
    assert.ok(
      report.lanes.every(({ status }) => status === "passed"),
      "One or more lanes failed"
    );
    assert.equal(
      sha256(await readFile(join(root, "pnpm-lock.yaml"))),
      rootLockBefore,
      "Pinned replay changed the root lock"
    );
    report.status = "passed";
  } catch (error) {
    report.error = String(error.stack ?? error);
  } finally {
    await cp(profileFile, join(outputDirectory, "profile.json"));
    await writeFile(join(outputDirectory, "result.json"), `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Retained pinned framework evidence: ${outputDirectory}`);
  }
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runPinnedProfile();
  if (result.status !== "passed") {
    console.error(result.error);
    process.exitCode = 1;
  }
}
