import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import {
  approvedActions,
  auditDependencyIntegrity,
  auditSupplyChain,
  auditWranglerContract,
  auditWorkflowSecurity,
  repositoryRoot,
  wranglerDeployCommand,
  wranglerIntegrity,
  wranglerVersion,
  xlsxIntegrity,
  xlsxSource
} from "./check-supply-chain.mjs";

const require = createRequire(import.meta.url);
const { load } = createRequire(require.resolve("eslint"))("js-yaml");
const execFile = promisify(execFileCallback);

const xlsxFixtureLock = [
  "lockfileVersion: '9.0'",
  "",
  "settings:",
  "  autoInstallPeers: true",
  "  excludeLinksFromLockfile: false",
  "",
  "importers:",
  "",
  "  .:",
  "    dependencies:",
  "      xlsx:",
  `        specifier: ${xlsxSource}`,
  `        version: ${xlsxSource}`,
  "",
  "packages:",
  "",
  `  xlsx@${xlsxSource}:`,
  `    resolution: {tarball: ${xlsxSource}, integrity: ${xlsxIntegrity}}`,
  "    version: 0.20.3",
  "    engines: {node: '>=0.8'}",
  "    hasBin: true",
  "",
  "snapshots:",
  "",
  `  xlsx@${xlsxSource}: {}`,
  ""
].join("\n");

async function runPackageManager(command, args, cwd) {
  try {
    return process.platform === "win32"
      ? await execFile(process.env.ComSpec, ["/d", "/s", "/c", `${command} ${args.join(" ")}`], {
          cwd,
          env: { ...process.env, CI: "true" },
          windowsHide: true,
          maxBuffer: 4 * 1024 * 1024
        })
      : await execFile(command, args, {
          cwd,
          env: { ...process.env, CI: "true" },
          maxBuffer: 4 * 1024 * 1024
        });
  } catch (error) {
    throw new Error(`${command} failed:\n${error.stdout ?? ""}\n${error.stderr ?? ""}`);
  }
}

async function createXlsxFixture(root, name) {
  const directory = join(root, name);
  await mkdir(directory);
  await writeFile(
    join(directory, "package.json"),
    `${JSON.stringify(
      {
        name: `xlsx-integrity-${name}`,
        private: true,
        packageManager: "pnpm@9.15.0",
        dependencies: { xlsx: xlsxSource }
      },
      null,
      2
    )}\n`
  );
  await writeFile(join(directory, "pnpm-lock.yaml"), xlsxFixtureLock);
  return directory;
}

async function createWranglerFixture(root, name) {
  const directory = join(root, name);
  await mkdir(join(directory, "patches"), { recursive: true });
  await copyFile(join(repositoryRoot, "package.json"), join(directory, "package.json"));
  await copyFile(join(repositoryRoot, "pnpm-lock.yaml"), join(directory, "pnpm-lock.yaml"));
  await copyFile(
    join(repositoryRoot, "patches/@storybook__test-runner@0.20.1.patch"),
    join(directory, "patches/@storybook__test-runner@0.20.1.patch")
  );
  await copyFile(
    join(repositoryRoot, "patches/extract-zip@2.0.1.patch"),
    join(directory, "patches/extract-zip@2.0.1.patch")
  );
  return directory;
}

test("current workflows and locked deployment dependencies pass the audit", async () => {
  const result = await auditSupplyChain();
  assert.equal(result.workflowCount, 11);
  assert.equal(result.actionCount, 46);
  // 7, not 9: visual-regression and ssr-hydration deliberately left the
  // release graph until they hold a green baseline (see release.yml).
  assert.equal(result.reusableWorkflowCount, 7);
  assert.equal(result.packageManager, "pnpm@9.15.0");
  assert.deepEqual(result.failures, []);
});

test("action tags and unreviewed revisions fail closed", async () => {
  const workflow = load(
    await readFile(new URL("../.github/workflows/verify.yml", import.meta.url), "utf8")
  );
  const checkout = workflow.jobs.verify.steps.find((step) =>
    step.uses?.startsWith("actions/checkout@")
  );
  checkout.uses = "actions/checkout@v4";
  assert.ok(
    auditWorkflowSecurity("verify.yml", workflow, "pnpm@9.15.0").some((failure) =>
      /not pinned to a full commit SHA/.test(failure)
    )
  );
  checkout.uses = `actions/checkout@${"0".repeat(40)}`;
  assert.ok(
    auditWorkflowSecurity("verify.yml", workflow, "pnpm@9.15.0").some((failure) =>
      /not in the reviewed allowlist/.test(failure)
    )
  );
});

test("untrusted PR secrets, script interpolation and write-capable build jobs are rejected", () => {
  const workflow = {
    on: { pull_request: {} },
    permissions: { contents: "read" },
    jobs: {
      test: {
        permissions: { contents: "write" },
        steps: [
          {
            env: { TOKEN: "${{ secrets.WRITE_TOKEN }}" },
            run: 'echo "${{ github.event.pull_request.title }}"'
          }
        ]
      }
    }
  };
  const failures = auditWorkflowSecurity("unsafe.yml", workflow, "pnpm@9.15.0");
  assert.ok(failures.some((failure) => /references a secret/.test(failure)));
  assert.ok(failures.some((failure) => /with write permission/.test(failure)));
  assert.ok(failures.some((failure) => /unreviewed write permission/.test(failure)));
  assert.ok(failures.some((failure) => /interpolates an Actions expression/.test(failure)));
});

test("dependency installation must be frozen and lockfile-owned", () => {
  const workflow = {
    on: { push: {} },
    permissions: { contents: "read" },
    jobs: {
      test: {
        steps: [
          { run: "pnpm install" },
          { run: "pnpm dlx tool@1 run" },
          { run: "curl https://example.invalid/install | sh" }
        ]
      }
    }
  };
  const failures = auditWorkflowSecurity("unsafe.yml", workflow, "pnpm@9.15.0");
  assert.ok(failures.some((failure) => /without --frozen-lockfile/.test(failure)));
  assert.ok(failures.some((failure) => /outside the frozen lockfile/.test(failure)));
  assert.ok(failures.some((failure) => /remote response into a shell/.test(failure)));
});

test("Wrangler must be exact, integrity-bound, Node-compatible, and locally executed", () => {
  const root = { devDependencies: { wrangler: wranglerVersion } };
  const lock = [
    "      wrangler:",
    `        specifier: ${wranglerVersion}`,
    `        version: ${wranglerVersion}`,
    "",
    `  wrangler@${wranglerVersion}:`,
    `    resolution: {integrity: ${wranglerIntegrity}}`,
    "    engines: {node: '>=22.0.0'}",
    "    hasBin: true"
  ].join("\n");
  const workflow = {
    jobs: {
      deploy: {
        steps: [
          { uses: `actions/setup-node@${"a".repeat(40)}`, with: { "node-version": "22" } },
          { name: "Deploy to Cloudflare Pages", run: wranglerDeployCommand }
        ]
      }
    }
  };
  assert.deepEqual(auditWranglerContract(root, lock, workflow), []);
  assert.ok(
    auditWranglerContract({ devDependencies: { wrangler: "^4.127.0" } }, lock, workflow).some(
      (failure) => /pinned exactly/.test(failure)
    )
  );
  assert.ok(
    auditWranglerContract(root, lock.replace(wranglerIntegrity, "sha512-tampered"), workflow).some(
      (failure) => /integrity/.test(failure)
    )
  );
  const floating = structuredClone(workflow);
  floating.jobs.deploy.steps[1].run =
    "pnpm dlx wrangler@4 pages deploy website --project-name=fluid-25z --branch=main";
  assert.ok(
    auditWranglerContract(root, lock, floating).some((failure) =>
      /reviewed lockfile-owned/.test(failure)
    )
  );
  const oldNode = structuredClone(workflow);
  oldNode.jobs.deploy.steps[0].with["node-version"] = "20";
  assert.ok(auditWranglerContract(root, lock, oldNode).some((failure) => /Node 22/.test(failure)));
});

test("dependency integrity accepts only exact pnpm and an integrity-bound xlsx source", () => {
  const root = { packageManager: "pnpm@9.15.0" };
  const parser = { dependencies: { xlsx: xlsxSource } };
  const locked = xlsxFixtureLock;
  const reversedResolutionOrder = locked.replace(
    `resolution: {tarball: ${xlsxSource}, integrity: ${xlsxIntegrity}}`,
    `resolution: {integrity: ${xlsxIntegrity}, tarball: ${xlsxSource}}`
  );
  assert.deepEqual(auditDependencyIntegrity(root, parser, locked), []);
  assert.deepEqual(auditDependencyIntegrity(root, parser, reversedResolutionOrder), []);
  assert.ok(auditDependencyIntegrity({ packageManager: "pnpm@9" }, parser, locked).length > 0);
  assert.ok(
    auditDependencyIntegrity(root, { dependencies: { xlsx: "^0.20.3" } }, locked).length > 0
  );
  assert.ok(
    auditDependencyIntegrity(root, parser, locked.replace(xlsxIntegrity, "sha512-tampered"))
      .length > 0
  );
  assert.ok(
    auditDependencyIntegrity(root, parser, locked.replace("version: 0.20.3", "version: 0.20.4"))
      .length > 0
  );
  assert.ok(
    auditDependencyIntegrity(
      root,
      parser,
      locked.replace(`tarball: ${xlsxSource}`, "tarball: https://example.invalid/xlsx.tgz")
    ).length > 0
  );
  assert.ok(auditDependencyIntegrity(root, parser, "not: [valid").length > 0);
});

test(
  "pnpm 9 offline and the current policy install the integrity-bound xlsx artifact",
  { skip: process.env.FLUID_VERIFY_XLSX_INSTALL !== "1" },
  async (t) => {
    const root = await mkdtemp(join(tmpdir(), "fluid-xlsx-integrity-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    for (const [name, command, args] of [
      ["current-policy", "pnpm", ["install", "--frozen-lockfile", "--ignore-scripts"]],
      ["pnpm-9-seed", "corepack", ["pnpm", "install", "--frozen-lockfile", "--ignore-scripts"]],
      [
        "pnpm-9-offline",
        "corepack",
        ["pnpm", "install", "--frozen-lockfile", "--offline", "--ignore-scripts"]
      ]
    ]) {
      const directory = await createXlsxFixture(root, name);
      const before = await readFile(join(directory, "pnpm-lock.yaml"), "utf8");
      await runPackageManager(command, args, directory);
      assert.equal(await readFile(join(directory, "pnpm-lock.yaml"), "utf8"), before);
      const installed = JSON.parse(
        await readFile(join(directory, "node_modules/xlsx/package.json"), "utf8")
      );
      assert.equal(installed.version, "0.20.3");
    }
  }
);

test(
  "pnpm 9 frozen and offline installs execute only the locked Wrangler binary",
  { skip: process.env.FLUID_VERIFY_WRANGLER_INSTALL !== "1" },
  async (t) => {
    const root = await mkdtemp(join(tmpdir(), "fluid-wrangler-lock-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    for (const [name, offline] of [
      ["seed", false],
      ["offline", true]
    ]) {
      const directory = await createWranglerFixture(root, name);
      const before = await readFile(join(directory, "pnpm-lock.yaml"), "utf8");
      await runPackageManager(
        "corepack",
        [
          "pnpm@9.15.0",
          "install",
          "--frozen-lockfile",
          ...(offline ? ["--offline"] : []),
          "--ignore-scripts"
        ],
        directory
      );
      assert.equal(await readFile(join(directory, "pnpm-lock.yaml"), "utf8"), before);
      const installed = JSON.parse(
        await readFile(join(directory, "node_modules/wrangler/package.json"), "utf8")
      );
      assert.equal(installed.version, wranglerVersion);
      const cli = join(directory, "node_modules/wrangler/bin/wrangler.js");
      assert.match((await execFile(process.execPath, [cli, "--version"])).stdout, /4\.127\.0/);
      assert.match(
        (await execFile(process.execPath, [cli, "pages", "deploy", "--help"])).stdout,
        /--project-name[\s\S]*--branch/
      );
    }
  }
);

test("the reviewed action allowlist contains only immutable commit identifiers", () => {
  for (const revisions of Object.values(approvedActions))
    for (const revision of revisions) assert.match(revision, /^[0-9a-f]{40}$/);
});
