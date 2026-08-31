import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import {
  auditReleaseDryRun,
  auditReleaseWorkflow,
  auditArtifactFreshness,
  auditPackageMetadata,
  auditPublishWrapper,
  expectedPackageNames,
  readPublishablePackages,
  releaseOrder,
  repositoryRoot
} from "./dry-run-publish.mjs";

const require = createRequire(import.meta.url);
const { load } = createRequire(require.resolve("eslint"))("js-yaml");
const execFile = promisify(execFileCallback);

function packInspection(dir, destination) {
  const args = ["pack", "--json", "--pack-destination", destination];
  return process.platform === "win32"
    ? execFile(process.env.ComSpec, ["/d", "/s", "/c", `pnpm ${args.join(" ")}`], {
        cwd: dir,
        windowsHide: true
      })
    : execFile("pnpm", args, { cwd: dir });
}

async function portablePackInspection(record, scratchRoot) {
  const archives = join(scratchRoot, "archives");
  await mkdir(archives, { recursive: true });
  try {
    return await packInspection(record.dir, archives);
  } catch (error) {
    assert.match(
      `${error.stdout ?? ""}\n${error.stderr ?? ""}`,
      /ERR_PNPM_CANNOT_RESOLVE_WORKSPACE_PROTOCOL/,
      `${record.manifest.name}: pnpm pack failed for an unexpected reason`
    );
    const mirror = join(scratchRoot, record.manifest.name.slice("@fluid-ds/".length));
    await mkdir(mirror, { recursive: true });
    for (const entry of record.manifest.files)
      await cp(join(record.dir, entry), join(mirror, entry), { recursive: true });
    const manifest = structuredClone(record.manifest);
    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
      "devDependencies"
    ])
      for (const [name, range] of Object.entries(manifest[field] ?? {}))
        if (
          typeof range === "string" &&
          range.startsWith("workspace:") &&
          expectedPackageNames.includes(name)
        )
          manifest[field][name] = manifest.version;
    await writeFile(join(mirror, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    return packInspection(mirror, archives);
  }
}

const expectedOrder = [
  "@fluid-ds/angular",
  "@fluid-ds/animations",
  "@fluid-ds/icons",
  "@fluid-ds/tokens",
  "@fluid-ds/components",
  "@fluid-ds/themes",
  "@fluid-ds/calendar",
  "@fluid-ds/charts",
  "@fluid-ds/editor",
  "@fluid-ds/kanban",
  "@fluid-ds/map",
  "@fluid-ds/markdown",
  "@fluid-ds/media",
  "@fluid-ds/node-graph",
  "@fluid-ds/parser",
  "@fluid-ds/qr",
  "@fluid-ds/scheduler",
  "@fluid-ds/table",
  "@fluid-ds/react"
];

test("release rehearsal owns the exact 19-package dependency order", async () => {
  const records = await readPublishablePackages();
  assert.equal(records.length, 19);
  assert.deepEqual(
    records.map((record) => record.manifest.name),
    [...expectedPackageNames]
  );
  assert.deepEqual(releaseOrder(records), expectedOrder);
  const cycle = structuredClone(records.slice(0, 2));
  cycle[0].manifest.dependencies = { [cycle[1].manifest.name]: "workspace:*" };
  cycle[1].manifest.dependencies = { [cycle[0].manifest.name]: "workspace:*" };
  assert.throws(() => releaseOrder(cycle), /Cyclic publish graph/);
});

test("all 19 package archives contain the required governance files", async (t) => {
  const records = await readPublishablePackages();
  assert.deepEqual(await auditPackageMetadata(records), []);
  const scratchRoot = await mkdtemp(join(tmpdir(), "fluid-release-pack-"));
  t.after(() => rm(scratchRoot, { recursive: true, force: true }));
  for (const { dir, manifest } of records) {
    const before = (await readdir(dir)).filter((name) => name.endsWith(".tgz"));
    const { stdout } = await portablePackInspection({ dir, manifest }, scratchRoot);
    const packed = JSON.parse(stdout);
    assert.equal(packed.name, manifest.name);
    assert.equal(packed.version, manifest.version);
    const files = new Set(packed.files.map((file) => file.path));
    for (const required of ["package.json", "README.md", "LICENSE", "CHANGELOG.md"])
      assert.ok(files.has(required), `${manifest.name}: packed archive excludes ${required}`);
    const after = (await readdir(dir)).filter((name) => name.endsWith(".tgz"));
    assert.deepEqual(after, before, `${manifest.name}: isolated pack wrote into the package tree`);
  }
});

test("release workflow requires the offline rehearsal and OIDC assumptions before changesets", async () => {
  const workflow = load(
    await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8")
  );
  assert.deepEqual(auditReleaseWorkflow(workflow), []);
  for (const mutate of [
    (copy) =>
      copy.jobs.release.steps.splice(
        copy.jobs.release.steps.findIndex((step) => step.run === "pnpm publish:dry"),
        1
      ),
    (copy) => delete copy.jobs.release.permissions["id-token"],
    (copy) => {
      copy.jobs.release.steps.find((step) =>
        step.uses?.startsWith("changesets/action@")
      ).env.NPM_TOKEN = "forbidden";
    },
    // Publishing directly, bypassing the wrapper that resolves the dist-tag from
    // changesets pre-state, would pin latest onto a release candidate.
    (copy) => {
      copy.jobs.release.steps.find((step) =>
        step.uses?.startsWith("changesets/action@")
      ).with.publish = "pnpm exec changeset publish --tag latest";
    }
  ]) {
    const changed = structuredClone(workflow);
    mutate(changed);
    assert.ok(auditReleaseWorkflow(changed).length > 0);
  }
});

test("the audited wrapper resolves the dist-tag from changesets pre-state", async () => {
  const source = await readFile(new URL("./changeset-publish.mjs", import.meta.url), "utf8");
  assert.deepEqual(auditPublishWrapper(source), []);

  const stable = { mode: "none", tag: "latest", args: ["exec", "changeset", "publish"] };
  for (const [name, resolver] of [
    ["latest for every state", () => stable],
    [
      "an explicit --tag in pre mode, which changesets refuses",
      (preState) =>
        preState?.mode === "pre"
          ? { mode: "pre", tag: "next", args: ["exec", "changeset", "publish", "--tag", "next"] }
          : { ...stable, args: [...stable.args, "--tag", "latest"] }
    ],
    [
      "a stable release with no explicit tag, which would inherit the prerelease tag",
      (preState) => (preState?.mode === "pre" ? { mode: "pre", tag: "next", args: [] } : stable)
    ],
    [
      "a prerelease that claims latest",
      (preState) =>
        preState?.mode === "pre"
          ? { mode: "pre", tag: "latest", args: ["exec", "changeset", "publish"] }
          : { ...stable, args: [...stable.args, "--tag", "latest"] }
    ]
  ])
    assert.ok(auditPublishWrapper(source, resolver).length > 0, name);

  for (const [name, tamper] of [
    ["unread pre-state", (text) => text.replaceAll('".changeset/pre.json"', '"pre-state.json"')],
    ["no pre-mode branch", (text) => text.replaceAll('mode === "pre"', 'mode === "prerelease"')],
    ["resolver bypassed", (text) => text.replaceAll("resolvePublishPlan", "publishPlan")],
    ["no stable dist-tag", (text) => text.replaceAll('"--tag", "latest"', '"--no-git-tag"')],
    ["a hardcoded prerelease tag", (text) => `${text}\nconst extra = ["--tag", "next"];\n`]
  ])
    assert.ok(auditPublishWrapper(tamper(source)).length > 0, name);
});

test("offline rehearsal cannot claim network or publish work", async () => {
  const result = await auditReleaseDryRun(repositoryRoot, { gitStatus: async () => "" });
  assert.equal(result.mode, "offline-no-publish");
  assert.equal(result.packageCount, 19);
  assert.deepEqual(result.packageOrder, expectedOrder);
  assert.deepEqual(result.networkCommands, []);
  assert.deepEqual(result.publishCommands, []);
  assert.ok(result.ownerDecisions.some((decision) => /OIDC provenance/.test(decision)));
});

test("metadata and freshness guards reject unsupported ownership and stale output", async (t) => {
  const records = await readPublishablePackages();
  const changed = structuredClone(records[0]);
  changed.manifest.author = "";
  assert.ok(
    (await auditPackageMetadata([changed])).some((failure) =>
      /author\/support owner metadata/.test(failure)
    )
  );
  changed.manifest.author = "Fluid contributors";
  changed.manifest.files = changed.manifest.files.filter((entry) => entry !== "CHANGELOG.md");
  assert.ok(
    (await auditPackageMetadata([changed])).some((failure) =>
      /CHANGELOG\.md is excluded/.test(failure)
    )
  );

  const directory = await mkdtemp(join(tmpdir(), "fluid-release-stale-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "src"));
  await mkdir(join(directory, "dist"));
  await writeFile(join(directory, "src/index.ts"), "export {};\n");
  await writeFile(join(directory, "dist/index.js"), "export {};\n");
  const old = new Date("2026-01-01T00:00:00Z");
  const recent = new Date("2026-01-02T00:00:00Z");
  await utimes(join(directory, "dist/index.js"), old, old);
  await utimes(join(directory, "src/index.ts"), recent, recent);
  assert.deepEqual(
    await auditArtifactFreshness([
      {
        dir: directory,
        manifest: { name: "@fluid-ds/fixture", files: ["dist"], main: "./dist/index.js" }
      }
    ]),
    ["@fluid-ds/fixture: source is newer than dist; rebuild before release"]
  );
});

test("package metadata requires an exact changelog heading for the manifest version", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "fluid-release-changelog-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dir = join(root, "packages/fixture");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "README.md"), "# Fixture\n");
  await writeFile(join(dir, "LICENSE"), "MIT\n");

  const record = {
    dir,
    manifest: {
      name: "@fluid-ds/fixture",
      version: "0.4.0",
      license: "MIT",
      author: "Fluid contributors",
      homepage: "https://github.com/RHeijnen/fluid_ds",
      bugs: { url: "https://github.com/RHeijnen/fluid_ds/issues" },
      repository: { directory: "packages/fixture" },
      publishConfig: { access: "public", tag: "latest" },
      files: ["README.md", "LICENSE", "CHANGELOG.md"]
    }
  };
  const audit = () => auditPackageMetadata([record], root);
  const changelogFailure = (failures) =>
    failures.some((failure) =>
      failure.includes('CHANGELOG.md lacks exact current-version heading "## 0.4.0"')
    );

  assert.ok((await audit()).some((failure) => failure.endsWith("missing CHANGELOG.md")));

  await writeFile(join(dir, "CHANGELOG.md"), "# Fixture\n\n## 0.3.0\n");
  assert.ok(changelogFailure(await audit()), "a stale heading must fail");

  await writeFile(join(dir, "CHANGELOG.md"), "# Fixture\n\n## v0.4.0\n\n### 0.4.0\n");
  assert.ok(changelogFailure(await audit()), "malformed headings must fail");

  await writeFile(
    join(dir, "CHANGELOG.md"),
    "# Fixture\n\n```md\n## 0.4.0\n```\n\n<!--\n## 0.4.0\n-->\n"
  );
  assert.ok(changelogFailure(await audit()), "headings in code or comments must fail");

  await writeFile(join(dir, "CHANGELOG.md"), "# Fixture\n\n```md <!--\n-->\n## 0.4.0\n```\n");
  assert.ok(changelogFailure(await audit()), "comment tokens in fence metadata stay fenced");

  await writeFile(join(dir, "CHANGELOG.md"), "# Fixture\n\n```md\n<!--\n```\n\n## 0.4.0\n");
  assert.deepEqual(await audit(), [], "comment tokens inside fences do not hide real headings");

  await writeFile(
    join(dir, "CHANGELOG.md"),
    "# Fixture\n\n## 0.3.0\n\nHistorical entry.\n\n## 0.4.0\n\nCurrent entry.\n"
  );
  assert.deepEqual(await audit(), [], "a valid current heading may follow historical entries");

  record.manifest.version = "v0.4.0";
  await writeFile(join(dir, "CHANGELOG.md"), "# Fixture\n\n## v0.4.0\n");
  assert.ok((await audit()).some((failure) => failure.endsWith("invalid semver version")));
});

test("dirty inputs are a terminal dry-run failure with no bypass", async () => {
  const result = await auditReleaseDryRun(repositoryRoot, {
    gitStatus: async () => " M packages/components/src/index.ts\n"
  });
  assert.ok(result.failures.some((failure) => /worktree is dirty/.test(failure)));
  assert.deepEqual(result.publishCommands, []);
});
