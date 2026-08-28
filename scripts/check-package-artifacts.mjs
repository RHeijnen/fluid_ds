import {
  copyFile,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { archiveCommand } from "./cem/publication.mjs";
import { resolveCorepackPnpm, runOwnedNode } from "./cem/owned-node.mjs";
import { assertPortableLock, createPackedOverrides } from "./framework-packing.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packagesRoot = join(root, "packages");
const installPacked = process.argv.includes("--install");

export const packedInstallArguments = Object.freeze([
  "install",
  "--no-frozen-lockfile",
  "--ignore-scripts",
  "--strict-peer-dependencies"
]);

export function createPackedConsumerDescriptor(records, dependencies) {
  return {
    name: "fluid-packed-consumer",
    private: true,
    type: "module",
    packageManager: "pnpm@9.15.0",
    dependencies,
    devDependencies: { typescript: "^5.7.2" },
    pnpm: { overrides: createPackedOverrides(records, dependencies) }
  };
}

async function run(command, args, cwd, record, { timeoutMs = 60_000 } = {}) {
  if (command !== "pnpm" && command !== process.execPath)
    throw new Error(`Unsupported packed command: ${command}; only owned Node execution is allowed`);
  const nodeArgs = command === "pnpm" ? [await resolveCorepackPnpm(), ...args] : args;
  const { stdout, stderr, ...outcome } = await runOwnedNode(nodeArgs, {
    cwd,
    env: { ...process.env, CI: "true", PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false" },
    timeoutMs
  });
  const output = stdout + stderr;
  Object.assign(record, outcome, {
    output,
    timeoutMs,
    outputTruncated: outcome.reason === "output-limit"
  });
  if (outcome.status !== "passed" || !outcome.directChildExitObserved)
    throw new Error(
      `${command} ${args.join(" ")} failed (${outcome.exitCode}): ${outcome.reason}\n${output}`
    );
  return output;
}

export async function withPackedEvidence(
  tempRoot,
  evidenceDirectory,
  operation,
  { removeTemporaryArtifacts = rm } = {}
) {
  const commands = [];
  const startedAt = new Date().toISOString();
  let failure;
  await mkdir(join(evidenceDirectory, "commands"), { recursive: true });
  const recordedRun = async (command, args, cwd, options) => {
    const record = {
      command,
      args,
      cwd,
      startedAt: new Date().toISOString(),
      outputTruncated: false
    };
    commands.push(record);
    try {
      return await run(command, args, cwd, record, options);
    } catch (error) {
      record.status = "failed";
      record.error = error.message;
      throw error;
    } finally {
      record.completedAt = new Date().toISOString();
      record.log = `commands/${String(commands.length).padStart(2, "0")}.log`;
      await writeFile(join(evidenceDirectory, record.log), record.output ?? record.error ?? "");
      delete record.output;
    }
  };
  try {
    await operation(recordedRun);
  } catch (error) {
    failure = error;
  }
  const preserveTemporaryArtifacts = commands.some(
    (command) => command.terminationRequested || command.directChildExitObserved === false
  );
  const result = {
    startedAt,
    completedAt: null,
    status: "running",
    error: failure?.stack ?? (failure ? String(failure) : null),
    commands,
    retained: [],
    temporaryArtifactsPreserved: preserveTemporaryArtifacts ? tempRoot : null,
    cleanup: { status: "pending", directory: tempRoot, error: null }
  };
  const save = () =>
    writeFile(join(evidenceDirectory, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  try {
    for (const [directory, allowed] of [
      ["packs", (name) => name.endsWith(".tgz")],
      [
        "consumer",
        (name) =>
          ["package.json", "pnpm-lock.yaml", "verify.mjs", "consumer.ts", "tsconfig.json"].includes(
            name
          )
      ]
    ]) {
      await mkdir(join(evidenceDirectory, directory), { recursive: true });
      for (const entry of await readdir(join(tempRoot, directory), { withFileTypes: true })) {
        if (!allowed(entry.name)) continue;
        const source = join(tempRoot, directory, entry.name);
        if (!(await lstat(source)).isFile())
          throw new Error(`Refusing non-regular evidence file: ${source}`);
        await copyFile(source, join(evidenceDirectory, directory, entry.name));
        result.retained.push(`${directory}/${entry.name}`);
      }
    }
    // Retain bytes first, but never certify success before cleanup has completed.
    await save();
  } catch (retentionError) {
    throw new AggregateError(
      [failure, retentionError].filter(Boolean),
      `Packed evidence retention failed; temporary artifacts preserved at ${tempRoot}: ${retentionError.message}`
    );
  }
  let cleanupFailure;
  if (preserveTemporaryArtifacts) {
    result.cleanup.status = "preserved-after-command-termination";
  } else if (
    // Only remove this command's explicitly named temporary package-contract directory.
    resolve(tempRoot).startsWith(`${resolve(tmpdir())}${sep}fluid-package-contract-`) &&
    dirname(resolve(tempRoot)) === resolve(tmpdir())
  ) {
    try {
      await removeTemporaryArtifacts(tempRoot, { recursive: true, force: true });
      result.cleanup.status = "completed";
    } catch (error) {
      cleanupFailure = error;
      result.cleanup.status = "failed";
      result.cleanup.error = error.stack ?? String(error);
    }
  } else {
    result.cleanup.status = "preserved-outside-owned-temporary-root";
  }
  result.status = failure || cleanupFailure ? "failed" : "passed";
  result.error ??= cleanupFailure?.stack ?? (cleanupFailure ? String(cleanupFailure) : null);
  result.completedAt = new Date().toISOString();
  try {
    await save();
  } catch (finalizationError) {
    throw new AggregateError(
      [failure, cleanupFailure, finalizationError].filter(Boolean),
      `Packed evidence finalization failed; retained artifacts are at ${evidenceDirectory}: ${finalizationError.message}`
    );
  }
  if (cleanupFailure)
    throw new AggregateError(
      [failure, cleanupFailure].filter(Boolean),
      `Packed temporary cleanup failed; retained artifacts are at ${evidenceDirectory}: ${cleanupFailure.message}`
    );
  if (failure) throw failure;
}

function collectTargets(value, targets = []) {
  if (typeof value === "string") targets.push(value);
  else if (value && typeof value === "object") {
    for (const child of Object.values(value)) collectTargets(child, targets);
  }
  return targets;
}

function wildcardPattern(target) {
  const parts = target.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(
    `^${parts[0]}${parts
      .slice(1)
      .map((part, index) => `${index === 0 ? "(.+)" : "\\1"}${part}`)
      .join("")}$`
  );
}

async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else result.push(path);
  }
  return result;
}

async function packageRecords() {
  const records = [];
  for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(packagesRoot, entry.name);
    const manifest = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    if (!manifest.private) records.push({ dir, manifest });
  }
  return records.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

function publishedDescriptor(manifest) {
  return { ...manifest, ...manifest.publishConfig };
}

function resolvedTargets(manifest, files) {
  const failures = [];
  const resolved = new Set();
  const valid = (target) => {
    if (
      typeof target !== "string" ||
      !target.startsWith("./") ||
      target.includes("\\") ||
      target
        .split("/")
        .slice(1)
        .some((part) => ["", ".", "..", "node_modules"].includes(part))
    ) {
      failures.push(`Unsafe or unsupported package target: ${String(target)}`);
      return false;
    }
    return true;
  };
  const declaration = manifest.exports;
  const entries =
    declaration &&
    typeof declaration === "object" &&
    !Array.isArray(declaration) &&
    Object.keys(declaration).some((key) => key.startsWith("."))
      ? Object.entries(declaration)
      : [[".", declaration]];
  const exact = new Map(entries.filter(([key]) => !key.includes("*")));
  // Node selects exact keys first, then longest prefix and longest pattern trailer.
  const patterns = entries
    .filter(([key]) => key.includes("*"))
    .sort(([a], [b]) => b.indexOf("*") - a.indexOf("*") || b.length - a.length);
  const publicKeys = new Set(exact.keys());
  for (const [key, value] of patterns) {
    if (key.indexOf("*") !== key.lastIndexOf("*")) {
      failures.push(`Unsupported public export pattern: ${key}`);
      continue;
    }
    const targets = collectTargets(value).filter(valid);
    let discovered = false;
    for (const target of targets) {
      if (!target.includes("*")) {
        // A constant target behind a wildcard still names a concrete file.
        resolved.add(target);
        discovered = true;
        continue;
      }
      const pattern = wildcardPattern(target);
      for (const file of files) {
        const match = pattern.exec(file);
        if (!match) continue;
        publicKeys.add(key.replace("*", () => match[1]));
        discovered = true;
      }
    }
    if (targets.length && !discovered) {
      failures.push(`${key}: ${targets.join(", ")} matches no package file`);
    }
  }
  for (const publicKey of publicKeys) {
    let value = exact.get(publicKey);
    let capture;
    if (!exact.has(publicKey)) {
      for (const [key, candidate] of patterns) {
        const match = wildcardPattern(key).exec(publicKey);
        if (!match) continue;
        value = candidate;
        capture = match[1];
        break;
      }
    }
    // Null and exact overrides suppress the less-specific mapping completely.
    for (const target of collectTargets(value)) {
      const concrete = capture === undefined ? target : target.replaceAll("*", () => capture);
      if (valid(concrete)) resolved.add(concrete);
      if (
        capture !== undefined &&
        target.includes("*") &&
        !files.some((file) => wildcardPattern(target).test(file))
      ) {
        failures.push(`${publicKey}: ${target} matches no package file`);
      }
    }
  }
  for (const target of [manifest.main, manifest.module, manifest.types].filter(Boolean)) {
    if (valid(target)) resolved.add(target);
  }
  return { resolved, failures };
}

async function fileInventory(directory) {
  return (await walk(directory)).map(
    (file) => `./${relative(directory, file).split(sep).join("/")}`
  );
}

async function inspectArchive(archive) {
  const entries = (await archiveCommand(["-tzf", archive])).split(/\r?\n/).filter(Boolean);
  if (
    new Set(entries).size !== entries.length ||
    entries.some(
      (entry) =>
        !entry.startsWith("package/") || entry.includes("\\") || entry.split("/").includes("..")
    )
  ) {
    throw new Error("Unsafe or duplicate packed archive paths");
  }
  // Do not let an archive link or directory stand in for a required target.
  const details = (await archiveCommand(["-tvzf", archive])).split(/\r?\n/).filter(Boolean);
  if (details.length !== entries.length) {
    throw new Error("Packed archive file-type inventory does not match its paths");
  }
  if (details.some((line) => !["-", "d"].includes(line[0]))) {
    throw new Error("Packed archive contains a link or non-regular entry");
  }
  if (entries.filter((entry) => entry === "package/package.json").length !== 1) {
    throw new Error("Packed archive must contain exactly one package/package.json");
  }
  return {
    manifest: JSON.parse(await archiveCommand(["-xOzf", archive, "package/package.json"])),
    files: entries
      .filter((_entry, index) => details[index][0] === "-")
      .map((entry) => `./${entry.slice("package/".length)}`)
  };
}

export async function validateTargets(record, { archive, installedDirectory, consumerRoot } = {}) {
  if (archive && installedDirectory)
    throw new Error("Select one packed artifact boundary at a time");
  if (
    installedDirectory &&
    consumerRoot &&
    !(await realpath(installedDirectory)).startsWith(`${await realpath(consumerRoot)}${sep}`)
  ) {
    return ["Installed package root resolves outside the fresh consumer"];
  }
  const expected = publishedDescriptor(record.manifest);
  const expectedFiles = await fileInventory(record.dir);
  const { resolved: required, failures } = resolvedTargets(expected, expectedFiles);
  let directory = record.dir;
  let files = expectedFiles;
  if (archive || installedDirectory) {
    const packed = archive
      ? await inspectArchive(archive)
      : {
          manifest: JSON.parse(await readFile(join(installedDirectory, "package.json"), "utf8")),
          files: await fileInventory(installedDirectory)
        };
    for (const field of ["name", "version", "exports", "main", "module", "types"]) {
      if (!isDeepStrictEqual(packed.manifest[field], expected[field])) {
        failures.push(`Packed ${field} differs from the intended published descriptor`);
      }
    }
    files = packed.files;
    directory = installedDirectory;
    const actual = resolvedTargets(packed.manifest, files);
    failures.push(...actual.failures);
    for (const target of actual.resolved) required.add(target);
  }
  const fileSet = new Set(files);
  const realDirectory = directory ? await realpath(directory) : undefined;
  for (const target of required) {
    if (!fileSet.has(target)) {
      failures.push(
        `${target} is missing from ${archive ? "the actual tarball" : installedDirectory ? "the installed package" : "the workspace"}`
      );
      continue;
    }
    if (!directory) continue;
    try {
      const file = resolve(directory, target);
      const actualPath = await realpath(file);
      if (!actualPath.startsWith(`${realDirectory}${sep}`) || !(await stat(file)).isFile()) {
        failures.push(`${target} is not a regular file inside the package`);
      }
    } catch {
      failures.push(`${target} does not exist inside the package`);
    }
  }
  return failures;
}

async function main() {
  const records = await packageRecords();
  const targetFailures = [];
  for (const record of records) {
    for (const failure of await validateTargets(record)) {
      targetFailures.push(`${record.manifest.name}: ${failure}`);
    }
  }
  if (targetFailures.length)
    throw new Error(`Broken package targets:\n${targetFailures.join("\n")}`);
  console.log(`Package targets: ${records.length} publishable packages verified.`);

  if (!installPacked) return;

  const tempRoot = await mkdtemp(join(tmpdir(), "fluid-package-contract-"));
  const packs = join(tempRoot, "packs");
  const consumer = join(tempRoot, "consumer");
  await mkdir(packs);
  await mkdir(consumer);
  const evidenceDirectory = join(
    root,
    "quality/evidence/packed-packages",
    new Date().toISOString().replaceAll(/[:.]/g, "-")
  );
  console.log(`Packed artifact evidence: ${evidenceDirectory}`);
  await withPackedEvidence(tempRoot, evidenceDirectory, async (run) => {
    const dependencies = {};
    const runtimeImports = [];
    const typeImports = [];
    for (const record of records) {
      for (const hook of ["prepack", "prepare", "postpack"]) {
        if (record.manifest.scripts?.[hook])
          throw new Error(
            `${record.manifest.name}: pack lifecycle hook ${hook} requires an explicit ownership review`
          );
      }
      await run("pnpm", ["pack", "--pack-destination", packs], record.dir);
      const prefix = record.manifest.name.replace(/^@/, "").replace("/", "-");
      const tarball = (await readdir(packs)).find(
        (file) => file === `${prefix}-${record.manifest.version}.tgz`
      );
      if (!tarball) throw new Error(`No tarball produced for ${record.manifest.name}`);
      const packedFailures = await validateTargets(record, { archive: join(packs, tarball) });
      if (packedFailures.length) {
        throw new Error(
          `${record.manifest.name}: broken tarball targets:\n${packedFailures.join("\n")}`
        );
      }
      dependencies[record.manifest.name] =
        `file:${relative(consumer, join(packs, tarball)).split(sep).join("/")}`;

      const rootExport =
        record.manifest.publishConfig?.exports?.["."] ?? record.manifest.exports?.["."];
      const importTarget = typeof rootExport === "string" ? rootExport : rootExport?.import;
      const typeTarget = typeof rootExport === "object" ? rootExport?.types : record.manifest.types;
      if (importTarget?.endsWith(".js")) runtimeImports.push(record.manifest.name);
      if (typeTarget?.endsWith(".d.ts")) typeImports.push(record.manifest.name);
    }

    await writeFile(
      join(consumer, "package.json"),
      `${JSON.stringify(createPackedConsumerDescriptor(records, dependencies), null, 2)}\n`
    );
    await run("pnpm", packedInstallArguments, consumer, { timeoutMs: 120_000 });
    assertPortableLock(await readFile(join(consumer, "pnpm-lock.yaml"), "utf8"));
    for (const record of records) {
      const installedFailures = await validateTargets(record, {
        installedDirectory: join(consumer, "node_modules", record.manifest.name),
        consumerRoot: consumer
      });
      if (installedFailures.length) {
        throw new Error(
          `${record.manifest.name}: broken installed targets:\n${installedFailures.join("\n")}`
        );
      }
    }
    console.log(
      `Packed file targets: every resolved target in ${records.length} tarballs and installed packages verified.`
    );

    await writeFile(
      join(consumer, "verify.mjs"),
      `${runtimeImports.map((name) => `await import(${JSON.stringify(name)});`).join("\n")}\nconsole.log("Packed runtime imports: ${runtimeImports.length} passed.");\n`
    );
    await run(process.execPath, ["verify.mjs"], consumer);

    await writeFile(
      join(consumer, "consumer.ts"),
      `${typeImports.map((name, index) => `import type * as Package${index} from ${JSON.stringify(name)};\ntype Contract${index} = typeof Package${index};`).join("\n")}\n`
    );
    await writeFile(
      join(consumer, "tsconfig.json"),
      `${JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            strict: true,
            skipLibCheck: false,
            noEmit: true
          },
          include: ["consumer.ts"]
        },
        null,
        2
      )}\n`
    );
    await run("pnpm", ["exec", "tsc"], consumer);
    console.log(
      `Packed consumer: ${runtimeImports.length} runtime and ${typeImports.length} type roots passed.`
    );
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
