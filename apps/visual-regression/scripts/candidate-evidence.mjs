import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { hashFiles, inventory, readGeneratedCatalog } from "./baseline-inventory.mjs";
import visualRasterPolicy from "../visual-platform-policy.json" with { type: "json" };

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "..");
export const evidenceRoot = resolve(app, "candidate-evidence");

export function validateEvidenceDirectory(directory) {
  const absolute = resolve(directory);
  const child = relative(evidenceRoot, absolute);
  if (!child || child.startsWith("..") || resolve(absolute).includes("__screenshots__")) {
    throw new Error("Candidate evidence must be a named directory below candidate-evidence/");
  }
  return absolute;
}

export function verifyCandidateNames(gap, files) {
  const actual = files
    .filter(({ path }) => path.startsWith("screenshots/") && path.endsWith(".png"))
    .map(({ path }) => path.split("/").at(-1))
    .sort();
  const expected = gap.missing.map(({ name }) => name).sort();
  const missing = expected.filter((name) => !actual.includes(name));
  const unexpected = actual.filter((name) => !expected.includes(name));
  if (missing.length || unexpected.length) {
    throw new Error(
      `Candidate set does not match accepted gap (missing=${missing.length}, unexpected=${unexpected.length})`
    );
  }
  return { expectedCount: expected.length, actualCount: actual.length, missing, unexpected };
}

export function verifyRecordedFiles(recorded, actual) {
  const byPath = new Map(actual.map((file) => [file.path, file]));
  const changed = recorded.filter((file) => {
    const current = byPath.get(file.path);
    return !current || current.bytes !== file.bytes || current.sha256 !== file.sha256;
  });
  const unexpected = actual.filter((file) => !recorded.some(({ path }) => path === file.path));
  if (changed.length || unexpected.length) {
    throw new Error(
      `Candidate evidence hash verification failed (changed=${changed.length}, unexpected=${unexpected.length})`
    );
  }
  return { recordedCount: recorded.length, changed: [], unexpected: [] };
}

export async function verifyCandidate(directory) {
  const root = validateEvidenceDirectory(directory);
  const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
  const current = (await hashFiles(root)).filter(({ path }) => path !== "manifest.json");
  const files = verifyRecordedFiles(manifest.files, current);
  const gap = await inventory();
  const candidateSet = verifyCandidateNames(gap, current);
  const catalogBytes = await readFile(resolve(app, ".generated/catalog.ts"));
  const catalogSha256 = createHash("sha256").update(catalogBytes).digest("hex");
  if (
    manifest.accepted !== false ||
    manifest.humanAccepted !== false ||
    manifest.catalog.sha256 !== catalogSha256 ||
    JSON.stringify(manifest.determinism?.rasterPolicy) !== JSON.stringify(visualRasterPolicy)
  ) {
    throw new Error("Candidate manifest acceptance flags or catalog attribution do not match");
  }
  return { ...files, candidateSet, catalogSha256 };
}

export async function finalizeCandidate(directory) {
  const root = validateEvidenceDirectory(directory);
  const gap = await inventory();
  const files = (await hashFiles(root)).filter(({ path }) => path !== "manifest.json");
  const candidateSet = verifyCandidateNames(gap, files);
  const catalogBytes = await readFile(resolve(app, ".generated/catalog.ts"));
  const catalog = await readGeneratedCatalog();
  const manifest = {
    schemaVersion: 1,
    accepted: false,
    humanAccepted: false,
    generatedAt: new Date().toISOString(),
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: app,
      encoding: "utf8"
    }).trim(),
    platform: {
      id: process.env.VR_PLATFORM_ID ?? "unattributed",
      os: process.env.VR_PLATFORM_OS ?? os.platform(),
      release: process.env.VR_PLATFORM_RELEASE ?? os.release(),
      arch: process.env.VR_PLATFORM_ARCH ?? os.arch(),
      node: process.env.VR_PLATFORM_NODE ?? process.version,
      playwright: process.env.VR_PLAYWRIGHT_VERSION ?? "unknown",
      browser: "chromium",
      locale: "en-US/ar-EG",
      timezone: "UTC",
      viewport: "1024x768@1"
    },
    determinism: {
      fixedTime: "2026-08-27T12:00:00.000Z",
      randomSeed: 20260827,
      localFonts: ["Inter", "JetBrains Mono"],
      animationsDisabledAtCapture: true,
      caretHidden: true,
      rasterPolicy: visualRasterPolicy
    },
    catalog: {
      sha256: createHash("sha256").update(catalogBytes).digest("hex"),
      storyCount: catalog.length,
      attributedTagCount: gap.attributedTagCount,
      expectedSnapshotCount: gap.expectedCount,
      acceptedSnapshotCountBeforeCandidate: gap.acceptedCount,
      gapCount: gap.missingCount,
      gapTags: gap.missingTags
    },
    candidateSet,
    files
  };
  await mkdir(root, { recursive: true });
  await writeFile(resolve(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

async function main() {
  const verify = process.argv[2] === "--verify";
  const directory = process.argv[verify ? 3 : 2];
  if (!directory) throw new Error("Usage: node candidate-evidence.mjs <candidate-directory>");
  if (verify) {
    console.log(JSON.stringify(await verifyCandidate(directory), null, 2));
    return;
  }
  const manifest = await finalizeCandidate(directory);
  console.log(JSON.stringify(manifest, null, 2));
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
