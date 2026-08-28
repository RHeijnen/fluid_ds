import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** Read retained evidence only. Never enumerate or terminate live processes. */
export function auditOwnershipEvidence(evidence) {
  const observed = evidence.observedProcesses ?? [];
  const byPid = new Map(observed.map((entry) => [entry.pid, entry]));
  const invalid = new Map();
  for (const entry of observed) {
    const parent = byPid.get(entry.parent);
    if (!parent) continue;
    if (!/^\d+$/.test(entry.birth ?? "") || !/^\d+$/.test(parent.birth ?? "")) {
      invalid.set(entry.pid, {
        ...entry,
        reason: "birth-order-unverifiable",
        parentBirth: parent.birth
      });
    } else if (
      entry.pid === entry.parent ||
      BigInt(entry.birth) < BigInt(parent.birth) ||
      (BigInt(entry.birth) === BigInt(parent.birth) && entry.clock !== "linux-ticks")
    ) {
      invalid.set(entry.pid, {
        ...entry,
        reason:
          BigInt(entry.birth) < BigInt(parent.birth)
            ? "child-predates-parent"
            : "nonpositive-birth-order",
        parentBirth: parent.birth
      });
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of observed) {
      if (!invalid.has(entry.pid) && invalid.has(entry.parent)) {
        invalid.set(entry.pid, { ...entry, reason: "invalid-ancestor", ancestorPid: entry.parent });
        changed = true;
      }
    }
  }
  const unsafeProcesses = [...invalid.values()];
  const cleanupAttempts = (evidence.cleanup ?? []).filter((entry) =>
    unsafeProcesses.some((unsafe) => unsafe.pid === entry.pid && unsafe.birth === entry.birth)
  );
  return { status: evidence.status, unsafeProcesses, cleanupAttempts };
}

async function artifacts(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await artifacts(path)));
    else if (entry.name.endsWith(".json")) files.push(path);
  }
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directories = process.argv.slice(2);
  if (!directories.length)
    directories.push(
      join(root, "quality/evidence/wtr-lifecycle"),
      join(root, "quality/evidence/wtr-lifecycle-tests")
    );
  const results = [];
  let inspected = 0;
  for (const file of (await Promise.all(directories.map(artifacts))).flat().sort()) {
    const evidence = JSON.parse(await readFile(file, "utf8"));
    if (!Array.isArray(evidence.observedProcesses)) continue;
    inspected++;
    const result = auditOwnershipEvidence(evidence);
    if (result.unsafeProcesses.length) results.push({ file, ...result });
  }
  console.log(JSON.stringify({ inspected, affectedArtifacts: results.length, results }, null, 2));
  if (results.length) process.exitCode = 1;
}
