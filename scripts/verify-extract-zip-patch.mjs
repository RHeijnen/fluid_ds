import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = (value) => createHash("sha256").update(value).digest("hex");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(entries) {
  const localRecords = [];
  const centralRecords = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const data = Buffer.from(entry.data);
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localRecords.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE((entry.mode * 0x10000) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralRecords.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const centralSize = centralRecords.reduce((size, record) => size + record.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localRecords, ...centralRecords, end]);
}

async function findInstalledPackage(root, lockPatchHash) {
  const pnpmDirectory = join(root, "node_modules", ".pnpm");
  const candidates = (await readdir(pnpmDirectory))
    .filter((entry) => /^extract-zip@2\.0\.1(?:$|[_()])/.test(entry))
    .sort((left, right) => {
      const leftPatched = left.includes(lockPatchHash) || left.includes("patch_hash");
      const rightPatched = right.includes(lockPatchHash) || right.includes("patch_hash");
      return Number(rightPatched) - Number(leftPatched) || left.localeCompare(right);
    });
  assert.ok(candidates.length, "extract-zip 2.0.1 is not installed");
  return join(pnpmDirectory, candidates[0], "node_modules", "extract-zip");
}

async function prepareExtractor(root, lockPatchHash) {
  const source = await findInstalledPackage(root, lockPatchHash);
  const temporaryRoot = await mkdtemp(join(tmpdir(), "fluid-extract-zip-proof-"));
  const packageRoot = join(temporaryRoot, "extract-zip");
  await mkdir(packageRoot);
  await cp(join(source, "index.js"), join(packageRoot, "index.js"));
  await cp(join(source, "package.json"), join(packageRoot, "package.json"));
  await symlink(dirname(source), join(packageRoot, "node_modules"), "dir");
  return {
    extract: (await import(pathToFileURL(join(packageRoot, "index.js")).href)).default,
    temporaryRoot
  };
}

export async function verifyExtractZipPatch(root = repositoryRoot, lockPatchHash) {
  assert.equal(process.platform, "linux", "extract-zip proof must run on Linux");
  const prepared = await prepareExtractor(root, lockPatchHash);
  const checks = [];
  try {
    for (const fixture of [
      {
        id: "escaping-symlink-target-rejected",
        entries: [{ name: "link", data: "../outside.txt", mode: 0o120777 }],
        error: /Out of bound symbolic link/
      },
      {
        id: "duplicate-symlink-write-rejected",
        entries: [
          { name: "link", data: "target.txt", mode: 0o120777 },
          { name: "link", data: "owned", mode: 0o100644 }
        ],
        error: /Refusing to extract through symbolic link/
      }
    ]) {
      const caseRoot = join(prepared.temporaryRoot, fixture.id);
      const destination = join(caseRoot, "destination");
      const archive = join(caseRoot, "fixture.zip");
      await mkdir(caseRoot);
      await writeFile(archive, createZip(fixture.entries));
      await assert.rejects(prepared.extract(archive, { dir: destination }), fixture.error);
      checks.push({ id: fixture.id, status: "passed" });
    }

    const safeRoot = join(prepared.temporaryRoot, "safe");
    const destination = join(safeRoot, "destination");
    const archive = join(safeRoot, "fixture.zip");
    await mkdir(safeRoot);
    await writeFile(
      archive,
      createZip([
        { name: "target.txt", data: "expected", mode: 0o100644 },
        { name: "link", data: "target.txt", mode: 0o120777 }
      ])
    );
    await prepared.extract(archive, { dir: destination });
    assert.equal(await readFile(join(destination, "target.txt"), "utf8"), "expected");
    assert.equal(await readFile(join(destination, "link"), "utf8"), "expected");
    checks.push({ id: "safe-file-and-in-root-symlink-preserved", status: "passed" });
    return checks;
  } finally {
    await rm(prepared.temporaryRoot, { recursive: true, force: true });
  }
}

async function main() {
  const outputIndex = process.argv.indexOf("--write-evidence");
  if (outputIndex < 0 || !process.argv[outputIndex + 1])
    throw new Error("Usage: node scripts/verify-extract-zip-patch.mjs --write-evidence <path>");
  const config = JSON.parse(
    await readFile(join(repositoryRoot, "scripts", "dependency-local-patches.json"), "utf8")
  );
  const disposition = config.dispositions?.find(
    (entry) => entry.id === "extract-zip-2.0.1-symlink-traversal"
  );
  assert.ok(disposition, "extract-zip local patch disposition is missing");
  const lock = await readFile(join(repositoryRoot, "pnpm-lock.yaml"));
  const patch = await readFile(resolve(repositoryRoot, disposition.patchPath));
  assert.equal(hash(patch), disposition.patchSha256, "configured patch SHA-256 mismatch");
  const checks = await verifyExtractZipPatch(repositoryRoot, disposition.lockPatchHash);
  const proof = {
    schemaVersion: 1,
    status: "passed",
    observedAt: new Date().toISOString(),
    platform: process.platform,
    architecture: process.arch,
    nodeVersion: process.version,
    dispositionId: disposition.id,
    module: disposition.module,
    version: disposition.version,
    lockPatchHash: disposition.lockPatchHash,
    patchSha256: disposition.patchSha256,
    lockSha256: hash(lock),
    checks
  };
  const output = resolve(repositoryRoot, process.argv[outputIndex + 1]);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(`extract-zip Linux proof passed: ${output}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await main();
