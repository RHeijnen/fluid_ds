import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { canonicalModule, resolveRegistry } from "./canonical.mjs";

/** Validate the published (not workspace) descriptor and exact CEM bytes. */
export function validatePackedCem({ descriptor, entries, manifestText }, record) {
  assert.equal(
    descriptor.name,
    record.packageName,
    "Packed package name differs from the expected component package"
  );
  assert.equal(
    descriptor.version,
    record.version,
    "Packed package version differs from the source descriptor"
  );
  assert.equal(
    descriptor.customElements,
    "custom-elements.json",
    "Packed customElements metadata is missing or incorrect"
  );
  assert.equal(
    descriptor.exports?.["./custom-elements.json"],
    "./custom-elements.json",
    "Packed effective exports omit or redirect the manifest"
  );
  assert.ok(
    descriptor.files?.includes("custom-elements.json"),
    "Packed descriptor excludes the manifest from its public file list"
  );
  assert.ok(Array.isArray(entries) && entries.length > 0, "Packed file inventory is missing");
  assert.equal(
    new Set(entries).size,
    entries.length,
    "Duplicate archive paths can shadow the validated files"
  );
  for (const path of entries) {
    assert.ok(
      path.startsWith("package/") && !path.includes("\\") && !path.split("/").includes(".."),
      `Unsafe or unexpected packed path: ${path}`
    );
  }
  for (const path of ["package/package.json", "package/custom-elements.json"])
    assert.ok(entries.includes(path), `Archive does not contain ${path}`);
  assert.equal(
    manifestText,
    `${JSON.stringify(record.manifest, null, 2)}\n`,
    "Packed manifest bytes differ from the source-verified canonical manifest"
  );
  const manifest = JSON.parse(manifestText);
  for (const module of manifest.modules)
    assert.ok(
      entries.includes(`package/${canonicalModule(module.path)}`),
      `Packed manifest references an absent source module: ${module.path}`
    );
  const registry = resolveRegistry([{ packageName: record.packageName, manifest }]);
  return {
    package: descriptor.name,
    version: descriptor.version,
    tags: registry.length,
    manifestSha256: createHash("sha256").update(manifestText).digest("hex")
  };
}

/** Native tar reads only; no extraction can follow links or overwrite files. */
export function archiveCommand(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("tar", args, {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    const output = [];
    const errors = [];
    let size = 0;
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Tar inspection exceeded its 30-second deadline"));
    }, 30_000);
    child.stdout.on("data", (chunk) => {
      size += chunk.length;
      if (size > 32 * 1024 * 1024) {
        child.kill();
        reject(new Error("Tar inspection exceeded its output bound"));
      } else output.push(chunk);
    });
    child.stderr.on("data", (chunk) => errors.push(chunk));
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0)
        reject(
          new Error(`Tar inspection failed (${code}): ${Buffer.concat(errors).toString("utf8")}`)
        );
      else resolve(Buffer.concat(output).toString("utf8"));
    });
  });
}

export async function inspectPackedCem(archive, record) {
  const entries = (await archiveCommand(["-tzf", archive])).split(/\r?\n/).filter(Boolean);
  // Reject duplicate/missing metadata before asking tar to concatenate any file.
  for (const path of ["package/package.json", "package/custom-elements.json"])
    assert.equal(
      entries.filter((entry) => entry === path).length,
      1,
      `Archive needs exactly one ${path}`
    );
  const descriptor = JSON.parse(await archiveCommand(["-xOzf", archive, "package/package.json"]));
  const manifestText = await archiveCommand(["-xOzf", archive, "package/custom-elements.json"]);
  return {
    ...validatePackedCem({ descriptor, entries, manifestText }, record),
    archiveSha256: createHash("sha256")
      .update(await readFile(archive))
      .digest("hex")
  };
}
