import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactHashes, assertPortableLock, copyConsumer } from "./framework-packing.mjs";
import { checkFixtureIsolation } from "./framework-isolation.mjs";
import { assertPackedConsumer, runReactRuntime } from "./framework-runtime.mjs";
import { runFrameworkCommand } from "./framework-commands.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
export async function replayFrameworkFixture(sourceDirectory, browserRequested = false) {
  const source = await realpath(sourceDirectory);
  const evidence = join(
    root,
    "quality/evidence/framework-replays",
    new Date().toISOString().replaceAll(/[:.]/g, "-")
  );
  await mkdir(evidence, { recursive: true });
  const temporary = await mkdtemp(join(tmpdir(), "fluid-framework-replay-"));
  const consumer = join(temporary, "fixture");
  const report = {
    status: "failed",
    source,
    node: process.version,
    platform: process.platform,
    packageManager: "pnpm@9.15.0",
    lane: "retained-exact-graph-frozen-replay",
    outcomes: {
      copy: "not-run",
      install: "not-run",
      typecheck: "not-run",
      build: "not-run",
      runtime: browserRequested ? "not-run" : "not-requested",
      hashes: "not-run"
    },
    browserRuntimeTested: false
  };
  report.commandOutcomes = [];
  const run = (args, stage) =>
    runFrameworkCommand(args, {
      cwd: consumer,
      stage,
      outcomes: report.commandOutcomes,
      logPath: join(evidence, `${stage}.log`)
    });
  try {
    const before = await artifactHashes(source);
    report.sha256 = before;
    assertPortableLock(await readFile(join(source, "fixture/pnpm-lock.yaml"), "utf8"));
    report.outcomes.copy = "failed";
    await cp(join(source, "packs"), join(temporary, "packs"), { recursive: true });
    await copyConsumer(join(source, "fixture"), consumer);
    assert.deepEqual(
      await artifactHashes(temporary),
      before,
      "Copied artifacts differ before installation"
    );
    report.outcomes.copy = "passed";
    const manifest = JSON.parse(await readFile(join(consumer, "package.json"), "utf8"));
    assert.equal(
      manifest.packageManager,
      "pnpm@9.15.0",
      "Replay must use the retained package manager"
    );
    assert.equal(
      manifest.name,
      "@fluid-ds/admin-react-packed-contract",
      "Exact packed replay currently supports the React fixture only"
    );
    assert.ok(
      manifest.scripts?.typecheck && manifest.scripts?.build,
      "Replay requires typecheck and build scripts"
    );
    await checkFixtureIsolation(consumer);
    report.outcomes.install = "failed";
    await run(
      ["install", "--frozen-lockfile", "--ignore-scripts", "--strict-peer-dependencies"],
      "install"
    );
    report.outcomes.install = "passed";
    await assertPackedConsumer(consumer);
    for (const stage of ["typecheck", "build"]) {
      report.outcomes[stage] = "failed";
      await run(["run", stage], stage);
      report.outcomes[stage] = "passed";
    }
    if (browserRequested) {
      report.outcomes.runtime = "failed";
      const runtime = await runReactRuntime(consumer, join(evidence, "runtime"));
      report.outcomes.runtime = runtime.status;
      report.browserRuntimeTested = runtime.browserRuntimeTested;
      assert.ok(runtime.browserRuntimeTested, "Frozen replay browser contracts failed");
    }
    report.outcomes.hashes = "failed";
    assert.deepEqual(
      await artifactHashes(temporary),
      before,
      "Frozen replay changed retained graph/source bytes"
    );
    assert.deepEqual(
      await artifactHashes(source),
      before,
      "Original evidence changed during replay"
    );
    report.outcomes.hashes = "passed";
    report.status = "passed";
  } catch (error) {
    report.error = String(error.stack ?? error);
  } finally {
    // Retain a separate copy for diagnosis; the original evidence is read-only.
    try {
      await cp(join(temporary, "packs"), join(evidence, "packs"), { recursive: true });
      await copyConsumer(consumer, join(evidence, "fixture"));
    } catch (error) {
      if (error.code !== "ENOENT") {
        report.status = "failed";
        report.retentionError = String(error.stack ?? error);
      }
    }
    await writeFile(join(evidence, "result.json"), `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Retained frozen replay evidence: ${evidence}`);
    if (temporary.startsWith(`${tmpdir()}${sep}fluid-framework-replay-`))
      await rm(temporary, { recursive: true, force: true });
  }
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , source, ...flags] = process.argv;
  if (!source || flags.some((flag) => flag !== "--browser"))
    throw new Error(
      "Usage: node scripts/replay-framework-fixture.mjs <retained-evidence-directory> [--browser]"
    );
  const result = await replayFrameworkFixture(source, flags.includes("--browser"));
  if (result.status !== "passed") {
    console.error(result.error ?? result.retentionError);
    process.exitCode = 1;
  }
}
