/** Fail-closed, read-only audit of workflow and dependency trust boundaries. */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = dirname(here);
const require = createRequire(import.meta.url);
const { load: parseYaml } = createRequire(require.resolve("eslint"))("js-yaml");

export const approvedActions = Object.freeze({
  "actions/cache": ["0057852bfaa89a56745cba8c7296529d2fc39830"],
  "actions/checkout": [
    "11d5960a326750d5838078e36cf38b85af677262",
    "d23441a48e516b6c34aea4fa41551a30e30af803"
  ],
  "actions/github-script": ["f28e40c7f34bde8b3046d885e986cb6290c5673b"],
  "actions/setup-node": [
    "49933ea5288caeca8642d1e84afbd3f7d6820020",
    "249970729cb0ef3589644e2896645e5dc5ba9c38"
  ],
  "actions/setup-python": ["5fda3b95a4ea91299a34e894583c3862153e4b97"],
  "actions/upload-artifact": ["ea165f8d65b6e75b540449e92b4886f43607fa02"],
  "changesets/action": ["a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d"],
  "pnpm/action-setup": ["f40ffcd9367d9f12939873eb1018b921a783ffaa"]
});
export const xlsxSource = "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz";
export const xlsxIntegrity =
  "sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA==";
export const wranglerVersion = "4.127.0";
export const wranglerIntegrity =
  "sha512-4dPqcBEMJfGeZeNnjHT7ThNJs+EiNYxUTg4ywqIdQubcXHBhFeVMQyHV4A9AOhZRFr83cckqdds034KGcr/dtw==";
export const wranglerDeployCommand =
  "pnpm exec wrangler pages deploy website --project-name=fluid-25z --branch=main";

const compare = (a, b) => a.localeCompare(b, "en");
const hasTrigger = (workflow, name) =>
  Array.isArray(workflow.on) ? workflow.on.includes(name) : Object.hasOwn(workflow.on ?? {}, name);

export function auditWorkflowSecurity(filename, workflow, packageManager) {
  const failures = [];
  const fail = (message) => failures.push(`${filename}: ${message}`);
  if (JSON.stringify(workflow.permissions) !== JSON.stringify({ contents: "read" }))
    fail("top-level permissions must default to contents: read only");
  for (const trigger of ["pull_request_target", "workflow_run"])
    if (hasTrigger(workflow, trigger))
      fail(`${trigger} is forbidden for repository code workflows`);
  const handlesPullRequests = hasTrigger(workflow, "pull_request");
  if (handlesPullRequests && /\$\{\{\s*secrets\./.test(JSON.stringify(workflow)))
    fail("pull_request workflow references a secret");

  for (const [jobName, job] of Object.entries(workflow.jobs ?? {})) {
    if (job.uses && !job.uses.startsWith("./"))
      fail(`${jobName} uses an unreviewed remote reusable workflow: ${job.uses}`);
    const writes = Object.entries(job.permissions ?? {})
      .filter(([, permission]) => permission === "write")
      .map(([scope]) => scope)
      .sort(compare);
    const reviewedWrites = {
      "deploy.yml/deploy": ["deployments"],
      "release.yml/release": ["contents", "id-token", "pull-requests"],
      // The visual lane's call site forwards the grant its declared
      // PR-comment job requires; the job itself never runs on push events.
      "release.yml/visual": ["pull-requests"],
      "visual-regression.yml/comment": ["pull-requests"]
    }[`${filename}/${jobName}`];
    if (
      writes.length &&
      JSON.stringify(writes) !== JSON.stringify(reviewedWrites?.sort(compare) ?? [])
    )
      fail(`${jobName} has unreviewed write permission: ${writes.join(", ")}`);
    if (handlesPullRequests && writes.length) {
      const isolatedComment =
        filename === "visual-regression.yml" &&
        jobName === "comment" &&
        JSON.stringify(writes) === JSON.stringify(["pull-requests"]) &&
        (job.steps ?? []).every((step) => !step.run) &&
        (job.steps ?? []).every(
          (step) => !step.uses || step.uses.startsWith("actions/github-script@")
        );
      if (!isolatedComment)
        fail(`${jobName} executes pull-request work with write permission: ${writes.join(", ")}`);
    }
    for (const step of job.steps ?? []) {
      if (step.uses && !step.uses.startsWith("./")) {
        const match = /^([^@]+)@([0-9a-f]{40})$/.exec(step.uses);
        if (!match) fail(`${jobName} action is not pinned to a full commit SHA: ${step.uses}`);
        else if (!(approvedActions[match[1]] ?? []).includes(match[2]))
          fail(`${jobName} action revision is not in the reviewed allowlist: ${step.uses}`);
        if (match?.[1] === "pnpm/action-setup") {
          const expected = packageManager.slice("pnpm@".length);
          if (step.with?.version && String(step.with.version) !== expected)
            fail(`${jobName} pnpm setup version differs from packageManager`);
        }
      }
      if (!step.run) continue;
      if (/\$\{\{/.test(step.run)) fail(`${jobName} interpolates an Actions expression into run`);
      if (
        /(?:^|\s)(?:corepack\s+)?pnpm\s+install\b/.test(step.run) &&
        !/--frozen-lockfile\b/.test(step.run)
      )
        fail(`${jobName} installs without --frozen-lockfile`);
      if (/(?:^|\s)(?:pnpm\s+dlx|npx\s+)/.test(step.run))
        fail(`${jobName} executes a dependency outside the frozen lockfile`);
      if (/curl\b[^\n|]*\|\s*(?:ba)?sh\b/.test(step.run))
        fail(`${jobName} pipes a remote response into a shell`);
    }
  }
  return failures;
}

export function auditDependencyIntegrity(rootManifest, parserManifest, lockText) {
  const failures = [];
  if (!/^pnpm@\d+\.\d+\.\d+$/.test(rootManifest.packageManager ?? ""))
    failures.push("root packageManager must pin an exact pnpm version");
  const xlsx = parserManifest.dependencies?.xlsx;
  if (xlsx !== xlsxSource)
    failures.push("parser xlsx source must remain bound to the reviewed 0.20.3 URL");
  let lockedXlsx;
  try {
    lockedXlsx = parseYaml(lockText)?.packages?.[`xlsx@${xlsxSource}`];
  } catch {
    // A malformed lockfile cannot satisfy the integrity contract.
  }
  if (
    lockedXlsx?.resolution?.tarball !== xlsxSource ||
    lockedXlsx?.resolution?.integrity !== xlsxIntegrity ||
    lockedXlsx?.version !== "0.20.3"
  )
    failures.push("xlsx lock resolution must bind the reviewed URL, version, and SHA-512");
  return failures;
}

export function auditWranglerContract(rootManifest, lockText, deployWorkflow) {
  const failures = [];
  if (rootManifest.devDependencies?.wrangler !== wranglerVersion)
    failures.push(`root Wrangler must be pinned exactly to ${wranglerVersion}`);
  const normalizedLock = lockText.replaceAll("\r\n", "\n");
  const expectedImporter = [
    "      wrangler:",
    `        specifier: ${wranglerVersion}`,
    `        version: ${wranglerVersion}`
  ].join("\n");
  if (!normalizedLock.includes(expectedImporter))
    failures.push("root Wrangler importer must resolve the exact declared version");
  const expectedPackage = [
    `  wrangler@${wranglerVersion}:`,
    `    resolution: {integrity: ${wranglerIntegrity}}`,
    "    engines: {node: '>=22.0.0'}",
    "    hasBin: true"
  ].join("\n");
  if (!normalizedLock.includes(expectedPackage))
    failures.push(
      "Wrangler lock entry must bind the reviewed version, integrity, engine, and binary"
    );

  const deployJob = deployWorkflow?.jobs?.deploy;
  const deployStep = deployJob?.steps?.find((step) => step.name === "Deploy to Cloudflare Pages");
  if (deployStep?.run !== wranglerDeployCommand)
    failures.push("deploy workflow must invoke the reviewed lockfile-owned Wrangler command");
  const setupNode = deployJob?.steps?.find((step) => step.uses?.startsWith("actions/setup-node@"));
  if (String(setupNode?.with?.["node-version"]) !== "22")
    failures.push("deploy workflow must use Node 22 for the pinned Wrangler engine");
  return failures;
}

export async function auditSupplyChain(root = repositoryRoot) {
  const rootManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const parserManifest = JSON.parse(
    await readFile(join(root, "packages/parser/package.json"), "utf8")
  );
  const lockText = await readFile(join(root, "pnpm-lock.yaml"), "utf8");
  const workflowDirectory = join(root, ".github/workflows");
  const failures = [];
  const workflowFiles = (await readdir(workflowDirectory))
    .filter((name) => /\.ya?ml$/.test(name))
    .sort(compare);
  const workflows = [];
  for (const filename of workflowFiles) {
    const workflow = parseYaml(await readFile(join(workflowDirectory, filename), "utf8"));
    workflows.push(workflow);
    failures.push(...auditWorkflowSecurity(filename, workflow, rootManifest.packageManager));
  }
  failures.push(...auditDependencyIntegrity(rootManifest, parserManifest, lockText));
  failures.push(
    ...auditWranglerContract(rootManifest, lockText, workflows[workflowFiles.indexOf("deploy.yml")])
  );
  const actionCount = workflows.reduce(
    (sum, workflow) =>
      sum +
      Object.values(workflow.jobs ?? {}).reduce(
        (jobSum, job) =>
          jobSum +
          (job.steps ?? []).filter((step) => step.uses && !step.uses.startsWith("./")).length,
        0
      ),
    0
  );
  const reusableWorkflowCount = workflows.reduce(
    (sum, workflow) =>
      sum + Object.values(workflow.jobs ?? {}).filter((job) => job.uses?.startsWith("./")).length,
    0
  );
  return {
    schemaVersion: 1,
    mode: "offline-read-only",
    workflowCount: workflowFiles.length,
    actionCount,
    reusableWorkflowCount,
    packageManager: rootManifest.packageManager,
    failures,
    ownerDecisions: [
      "Verify npm trusted-publisher configuration, package provenance receipts, GitHub environment protection, and organization signing requirements remotely."
    ]
  };
}

async function main() {
  if (process.argv.length !== 2) throw new Error("Usage: node scripts/check-supply-chain.mjs");
  const startedAt = new Date().toISOString();
  const directory = join(
    repositoryRoot,
    "quality/evidence/supply-chain",
    startedAt.replaceAll(/[:.]/g, "-")
  );
  await mkdir(directory, { recursive: true });
  const result = {
    startedAt,
    ...(await auditSupplyChain()),
    completedAt: new Date().toISOString()
  };
  result.status = result.failures.length ? "failed" : "passed";
  await writeFile(join(directory, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Supply-chain evidence: ${directory}`);
  if (result.failures.length) {
    console.error(`Supply-chain audit refused:\n${result.failures.join("\n")}`);
    process.exitCode = 1;
  } else console.log(`Supply-chain audit passed for ${result.workflowCount} workflows.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
