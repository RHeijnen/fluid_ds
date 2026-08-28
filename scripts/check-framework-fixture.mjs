import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { checkFixtureIsolation } from "./framework-isolation.mjs";
import { removeWorkspaceLifecycleScripts, runReactRuntime } from "./framework-runtime.mjs";
import { assertPortableLock, createPackedOverrides } from "./framework-packing.mjs";
import { replayFrameworkFixture } from "./replay-framework-fixture.mjs";
import { runFrameworkCommand } from "./framework-commands.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureName = process.argv[2];
const browserRequested = process.argv.slice(3).includes("--browser");
const replayRequested = process.argv.slice(3).includes("--replay");

async function packageDirectories(parent) {
  const result = [];
  for (const entry of await readdir(parent, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = join(parent, entry.name);
    try {
      const manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
      result.push({ directory, manifest });
    } catch {
      // A workspace directory without a package manifest is not a fixture.
    }
  }
  return result;
}

async function retainConsumer(source, destination) {
  try {
    await cp(source, destination, {
      recursive: true,
      filter: (entry) =>
        ![
          "node_modules",
          "dist",
          "build",
          ".next",
          ".angular",
          ".astro",
          ".svelte-kit",
          "out-tsc"
        ].includes(entry.split(sep).at(-1))
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function main() {
  if (!fixtureName) {
    throw new Error(
      "Usage: node scripts/check-framework-fixture.mjs <workspace-package-name> [--browser] [--replay]"
    );
  }
  if (process.argv.slice(3).some((argument) => !["--browser", "--replay"].includes(argument)))
    throw new Error("Unknown fixture argument");
  if (browserRequested && fixtureName !== "@fluid-ds/admin-react")
    throw new Error("Packed browser contracts currently support only @fluid-ds/admin-react");
  if (replayRequested && fixtureName !== "@fluid-ds/admin-react")
    throw new Error("Frozen packed replay currently supports only @fluid-ds/admin-react");

  const fixtures = await packageDirectories(join(root, "apps"));
  const fixture = fixtures.find(({ manifest }) => manifest.name === fixtureName);
  if (!fixture) throw new Error(`Unknown framework fixture: ${fixtureName}`);
  await checkFixtureIsolation(fixture.directory);

  const publishable = (await packageDirectories(join(root, "packages"))).filter(
    ({ manifest }) => !manifest.private
  );
  const publishableByName = new Map(publishable.map((record) => [record.manifest.name, record]));
  const requiredNames = new Set();
  const queue = Object.keys({
    ...(fixture.manifest.dependencies ?? {}),
    ...(fixture.manifest.devDependencies ?? {}),
    ...(fixture.manifest.optionalDependencies ?? {})
  }).filter((name) => publishableByName.has(name));
  while (queue.length) {
    const name = queue.shift();
    if (!name || requiredNames.has(name)) continue;
    requiredNames.add(name);
    const record = publishableByName.get(name);
    for (const dependency of Object.keys({
      ...(record?.manifest.dependencies ?? {}),
      ...(record?.manifest.optionalDependencies ?? {})
    })) {
      if (publishableByName.has(dependency)) queue.push(dependency);
    }
  }
  const packagesToPack = [...requiredNames]
    .map((name) => publishableByName.get(name))
    .filter(Boolean);
  const tempRoot = await mkdtemp(join(tmpdir(), "fluid-framework-contract-"));
  const packsDirectory = join(tempRoot, "packs");
  const consumerDirectory = join(tempRoot, "fixture");
  const evidenceDirectory = join(
    root,
    "quality/evidence/framework-fixtures",
    `${new Date().toISOString().replaceAll(/[:.]/g, "-")}-${fixture.manifest.name.replaceAll(/[^a-z0-9-]/gi, "-")}`
  );
  const commandOutcomes = [];
  const run = (args, cwd, stage, label = stage, quiet = false) =>
    runFrameworkCommand(args, {
      cwd,
      stage,
      quiet,
      outcomes: commandOutcomes,
      logPath: join(evidenceDirectory, `${label}.log`)
    });

  await mkdir(packsDirectory);
  let status = "failed";
  const outcomes = {
    install: "not-run",
    portableLock: "not-run",
    typecheck: "not-run",
    build: "not-run",
    runtime: browserRequested ? "not-run" : "not-requested"
  };
  let browserRuntimeTested = false;
  try {
    const packedDependencies = {};
    for (const record of packagesToPack) {
      await run(
        ["pack", "--pack-destination", packsDirectory],
        record.directory,
        "pack",
        `pack-${record.manifest.name.replaceAll(/[^a-z0-9-]/gi, "-")}`,
        true
      );
      const prefix = record.manifest.name.replace(/^@/, "").replace("/", "-");
      const tarball = (await readdir(packsDirectory)).find(
        (file) => file === `${prefix}-${record.manifest.version}.tgz`
      );
      if (!tarball) throw new Error(`No tarball produced for ${record.manifest.name}`);
      packedDependencies[record.manifest.name] = `file:${relative(
        consumerDirectory,
        join(packsDirectory, tarball)
      )
        .split(sep)
        .join("/")}`;
    }

    await cp(fixture.directory, consumerDirectory, {
      recursive: true,
      filter: (source) =>
        ![
          "node_modules",
          "dist",
          "build",
          "out-tsc",
          ".next",
          ".angular",
          ".astro",
          ".svelte-kit"
        ].includes(source.split(sep).at(-1))
    });
    await checkFixtureIsolation(consumerDirectory);

    const manifestPath = join(consumerDirectory, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    for (const group of ["dependencies", "devDependencies", "optionalDependencies"]) {
      for (const dependency of Object.keys(manifest[group] ?? {})) {
        if (packedDependencies[dependency])
          manifest[group][dependency] = packedDependencies[dependency];
      }
    }
    manifest.scripts = removeWorkspaceLifecycleScripts(manifest.scripts);
    manifest.name = `${manifest.name}-packed-contract`;
    manifest.packageManager = "pnpm@9.15.0";
    if (Object.keys(manifest.pnpm?.overrides ?? {}).length)
      throw new Error("Fixture-specific overrides need an explicit packed-graph review");
    manifest.pnpm = {
      ...(manifest.pnpm ?? {}),
      overrides: createPackedOverrides(packagesToPack, packedDependencies)
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    outcomes.install = "failed";
    await run(
      ["install", "--no-frozen-lockfile", "--ignore-scripts", "--strict-peer-dependencies"],
      consumerDirectory,
      "install"
    );
    outcomes.install = "passed";
    outcomes.portableLock = "failed";
    assertPortableLock(await readFile(join(consumerDirectory, "pnpm-lock.yaml"), "utf8"));
    outcomes.portableLock = "passed";
    if (manifest.scripts?.typecheck) {
      outcomes.typecheck = "failed";
      await run(["run", "typecheck"], consumerDirectory, "typecheck");
      outcomes.typecheck = "passed";
    }
    if (manifest.scripts?.build) {
      outcomes.build = "failed";
      await run(["run", "build"], consumerDirectory, "build");
      outcomes.build = "passed";
    }
    if (browserRequested) {
      outcomes.runtime = "failed";
      if (outcomes.typecheck !== "passed" || outcomes.build !== "passed")
        throw new Error("Browser contracts require successful typecheck and build scripts");
      const runtime = await runReactRuntime(consumerDirectory, join(evidenceDirectory, "runtime"));
      browserRuntimeTested = runtime.browserRuntimeTested;
      outcomes.runtime = runtime.status;
      if (!browserRuntimeTested)
        throw new Error("Packed React runtime contract failed; inspect retained runtime evidence");
    }
    status = "passed";
    console.log(
      `${fixtureName}: latest-compatible packed checks passed. Browser runtime: ${browserRuntimeTested ? "all three engines passed" : "not tested"}. This is not pinned certification.`
    );
  } finally {
    // Keep the exact consumer graph and packed bytes, including on a failed build.
    // The first install is still latest-compatible; a pinned certification lane
    // is a separate requirement, not implied by retaining this resolved lock.
    await mkdir(evidenceDirectory, { recursive: true });
    await cp(packsDirectory, join(evidenceDirectory, "packs"), { recursive: true });
    await retainConsumer(consumerDirectory, join(evidenceDirectory, "fixture"));
    await writeFile(
      join(evidenceDirectory, "result.json"),
      `${JSON.stringify(
        {
          fixture: fixtureName,
          status,
          lane: "latest-compatible",
          node: process.version,
          platform: process.platform,
          packageManager: "pnpm@9.15.0",
          compilerConfiguration: "isolated",
          outcomes,
          commandOutcomes,
          browserRuntimeTested,
          browserRuntimeRequested: browserRequested,
          frozenReplayRequested: replayRequested,
          replay:
            "Run node scripts/replay-framework-fixture.mjs <this-evidence-directory> [--browser] from the toolchain checkout. Replay copies the exact graph to a new temporary directory and uses frozen strict-peer installation.",
          runtimeReplay: browserRequested
            ? "From the toolchain checkout: node scripts/framework-runtime.mjs <retained-fixture-directory> <new-runtime-evidence-directory>. Requires the apps/a11y Playwright dependency and all three installed browser engines."
            : null
        },
        null,
        2
      )}\n`
    );
    console.log(`Retained framework fixture evidence: ${evidenceDirectory}`);
    if (tempRoot.startsWith(`${tmpdir()}${sep}fluid-framework-contract-`)) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }
  // This is a second lane, using the retained graph after the first temporary
  // consumer has been removed. A replay failure must fail the combined command.
  if (replayRequested) {
    const replay = await replayFrameworkFixture(evidenceDirectory, browserRequested);
    if (replay.status !== "passed")
      throw new Error(replay.error ?? replay.retentionError ?? "Frozen replay failed");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
