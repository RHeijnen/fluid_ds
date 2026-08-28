import assert from "node:assert/strict";
import { copyFile, mkdtemp, mkdir, readFile, readdir, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { validateTargets, withPackedEvidence } from "./check-package-artifacts.mjs";
import * as packedGate from "./check-package-artifacts.mjs";
import { archiveCommand } from "./cem/publication.mjs";
import { assertPortableLock } from "./framework-packing.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test("fresh packed consumer pins dependency edges without rewriting semver peers", () => {
  assert.equal(typeof packedGate.createPackedConsumerDescriptor, "function");
  const dependencies = {
    "@fluid-ds/components": "file:../packs/components.tgz",
    "@fluid-ds/icons": "file:../packs/icons.tgz",
    "@fluid-ds/react": "file:../packs/react.tgz"
  };
  const records = [
    {
      manifest: {
        name: "@fluid-ds/components",
        version: "0.4.0",
        dependencies: { "@fluid-ds/icons": "workspace:*" }
      }
    },
    {
      manifest: {
        name: "@fluid-ds/react",
        version: "0.4.0",
        peerDependencies: { "@fluid-ds/components": "^0.4.0" }
      }
    }
  ];
  const descriptor = packedGate.createPackedConsumerDescriptor(records, dependencies);
  assert.deepEqual(descriptor.dependencies, dependencies);
  assert.deepEqual(descriptor.pnpm.overrides, {
    "@fluid-ds/components@0.4.0>@fluid-ds/icons": dependencies["@fluid-ds/icons"]
  });
  assert.notDeepEqual(
    descriptor.pnpm.overrides,
    dependencies,
    "the old global override graph rewrites peers"
  );
  assert.equal(records[1].manifest.peerDependencies["@fluid-ds/components"], "^0.4.0");
});

test("fresh packed consumer rejects ambiguous dependency/peer overlap", () => {
  assert.equal(typeof packedGate.createPackedConsumerDescriptor, "function");
  assert.throws(
    () =>
      packedGate.createPackedConsumerDescriptor(
        [
          {
            manifest: {
              name: "@fluid-ds/overlap",
              version: "0.4.0",
              dependencies: { "@fluid-ds/icons": "*" },
              peerDependencies: { "@fluid-ds/icons": "^0.4.0" }
            }
          }
        ],
        { "@fluid-ds/icons": "file:../packs/icons.tgz" }
      ),
    /both dependency and peer/
  );
});

test("fresh packed install requires strict peers and validates the resulting portable lock", async () => {
  assert.deepEqual(packedGate.packedInstallArguments, [
    "install",
    "--no-frozen-lockfile",
    "--ignore-scripts",
    "--strict-peer-dependencies"
  ]);
  const source = await readFile(new URL("./check-package-artifacts.mjs", import.meta.url), "utf8");
  assert.match(source, /run\("pnpm", packedInstallArguments, consumer/);
  assert.match(
    source,
    /assertPortableLock\(await readFile\(join\(consumer, "pnpm-lock.yaml"\), "utf8"\)\)/
  );
});

test("the packed lock policy rejects original absolute peer metadata and registry Fluid edges", () => {
  assert.throws(
    () =>
      assertPortableLock(
        "peerDependencies:\n  '@fluid-ds/components': file:C:/Temp/consumer/packs/components.tgz\n"
      ),
    /Non-portable/
  );
  assert.throws(
    () =>
      assertPortableLock("packages:\n  '@fluid-ds/components@0.4.0':\n    resolution: registry\n"),
    /outside retained tarballs/
  );
  assert.doesNotThrow(() =>
    assertPortableLock(
      "packages:\n  '@fluid-ds/components@file:../packs/components.tgz':\n    peerDependencies:\n      '@fluid-ds/icons': ^0.4.0\n"
    )
  );
});
const execution = new Date().toISOString().replaceAll(/[:.]/g, "-");
const exportsMap = {
  ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
  "./ssr-client": { types: "./dist/ssr-client.d.ts", import: "./dist/ssr-client.js" },
  "./theme.css": "./dist/theme.css",
  "./define/*": {
    types: "./dist/components/*/define.d.ts",
    import: "./dist/components/*/define.js"
  }
};
const manifest = {
  name: "@fluid-ds/packed-fixture",
  version: "1.0.0",
  type: "module",
  main: "./dist/index.js",
  module: "./dist/index.js",
  types: "./dist/index.d.ts",
  exports: { ".": "./source-only.ts" },
  publishConfig: { exports: exportsMap },
  files: ["dist"]
};
const fixtureFiles = new Map([
  ["dist/index.js", "export const value = 1;\n"],
  ["dist/index.d.ts", "export declare const value: number;\n"],
  ["dist/ssr-client.js", "export const browserOnly = true;\n"],
  ["dist/ssr-client.d.ts", "export declare const browserOnly: boolean;\n"],
  ["dist/theme.css", ":root { --fixture-color: blue; }\n"],
  ...["a", "b"].flatMap((name) => [
    [`dist/components/${name}/define.js`, `export const name = '${name}';\n`],
    [`dist/components/${name}/define.d.ts`, "export declare const name: string;\n"]
  ])
]);

async function fixture(
  name,
  omitted = [],
  mutateDescriptor = (descriptor) => descriptor,
  directoryTargets = [],
  { workspaceOmitted = [], effectiveExports = exportsMap } = {}
) {
  const directory = join(root, "quality/evidence/package-artifact-tests", execution, name);
  const workspace = join(directory, "workspace");
  const packed = join(directory, "archive/package");
  const intended = { ...manifest, publishConfig: { exports: effectiveExports } };
  for (const [base, descriptor, skipped] of [
    [workspace, intended, workspaceOmitted],
    [packed, mutateDescriptor({ ...intended, exports: structuredClone(effectiveExports) }), omitted]
  ]) {
    await mkdir(base, { recursive: true });
    await writeFile(join(base, "package.json"), JSON.stringify(descriptor));
    for (const [file, content] of fixtureFiles) {
      if (skipped.includes(file)) continue;
      await mkdir(dirname(join(base, file)), { recursive: true });
      await writeFile(join(base, file), content);
    }
  }
  for (const target of directoryTargets) await mkdir(join(packed, target), { recursive: true });
  const archive = join(directory, "fixture.tgz");
  await archiveCommand(["-czf", archive, "-C", join(directory, "archive"), "package"]);
  const entries = (await archiveCommand(["-tzf", archive])).split(/\r?\n/);
  for (const file of omitted) assert.equal(entries.includes(`package/${file}`), false);
  assert.equal(
    entries.includes("package/dist/index.js"),
    true,
    "root remains present in the actual archive"
  );
  return { record: { dir: workspace, manifest: intended }, archive, installedDirectory: packed };
}

test("normal actual archive and installed tree contain every root, wildcard, CSS and declaration target", async () => {
  const { record, archive, installedDirectory } = await fixture("normal");
  assert.deepEqual(await validateTargets(record), []);
  assert.deepEqual(await validateTargets(record, { archive }), []);
  assert.deepEqual(await validateTargets(record, { installedDirectory }), []);
});

for (const omitted of [
  "dist/ssr-client.js",
  "dist/theme.css",
  "dist/ssr-client.d.ts",
  "dist/components/b/define.js",
  "dist/components/b/define.d.ts"
]) {
  test(`actual tarball rejects omitted non-root target ${omitted} even though workspace and root pass`, async () => {
    const { record, archive } = await fixture(omitted.replaceAll("/", "-"), [omitted]);
    assert.deepEqual(
      await validateTargets(record),
      [],
      "the original workspace-only check still passes"
    );
    const failures = await validateTargets(record, { archive });
    assert.ok(
      failures.some((failure) => failure.includes(omitted)),
      JSON.stringify(failures)
    );
  });
}

test("installed package validation cannot borrow a missing declaration from the workspace", async () => {
  const omitted = "dist/components/b/define.d.ts";
  const { record, installedDirectory } = await fixture("installed-missing", [omitted]);
  const failures = await validateTargets(record, { installedDirectory });
  assert.ok(
    failures.some((failure) => failure.includes(omitted)),
    JSON.stringify(failures)
  );
});

test("packed effective exports must retain the intended non-root contract", async () => {
  const { record, archive } = await fixture("redirected-descriptor", [], (descriptor) => {
    descriptor.exports["./ssr-client"].import = "./dist/index.js";
    return descriptor;
  });
  const failures = await validateTargets(record, { archive });
  assert.ok(
    failures.some((failure) => /exports/.test(failure)),
    JSON.stringify(failures)
  );
});

test("fixtures retain their actual manifest bytes for independent inspection", async () => {
  const { archive } = await fixture("manifest-bytes");
  const descriptor = JSON.parse(await archiveCommand(["-xOzf", archive, "package/package.json"]));
  assert.deepEqual(descriptor.exports, exportsMap);
  assert.ok((await readFile(archive)).length > 0);
});

test("an archived directory cannot satisfy a CSS file target", async () => {
  const target = "dist/theme.css";
  const { record, archive, installedDirectory } = await fixture(
    "directory-target",
    [target],
    (descriptor) => descriptor,
    [target]
  );
  assert.ok(
    (await validateTargets(record, { archive })).some((failure) => failure.includes(target))
  );
  assert.ok(
    (await validateTargets(record, { installedDirectory })).some((failure) =>
      failure.includes(target)
    )
  );
});

test("removing every wildcard match cannot erase the intended published entries", async () => {
  const omitted = ["dist/components/a/define.js", "dist/components/b/define.js"];
  const { record, archive } = await fixture("empty-wildcard", omitted);
  const failures = await validateTargets(record, { archive });
  for (const target of omitted) assert.ok(failures.some((failure) => failure.includes(target)));
  assert.ok(failures.some((failure) => /matches no package file/.test(failure)));
});

test("every discovered public wildcard key requires its declaration even when missing from both boundaries", async () => {
  const missing = "dist/components/b/define.d.ts";
  const { record, archive, installedDirectory } = await fixture(
    "missing-both",
    [missing],
    undefined,
    [],
    { workspaceOmitted: [missing] }
  );
  for (const options of [{}, { archive }, { installedDirectory }]) {
    const failures = await validateTargets(record, options);
    assert.ok(
      failures.some((failure) => failure.includes(missing)),
      JSON.stringify(failures)
    );
  }
});

test("conditions with different patterns share concrete public-key captures", async () => {
  const effectiveExports = {
    ...exportsMap,
    "./define/*": { types: "./dist/*-client.d.ts", import: "./dist/components/*/define.js" }
  };
  const { record, archive } = await fixture("different-patterns", [], undefined, [], {
    effectiveExports
  });
  const failures = await validateTargets(record, { archive });
  for (const missing of [
    "dist/a-client.d.ts",
    "dist/b-client.d.ts",
    "dist/components/ssr/define.js"
  ]) {
    assert.ok(
      failures.some((failure) => failure.includes(missing)),
      `${missing}: ${JSON.stringify(failures)}`
    );
  }
});

for (const [name, override] of [
  ["null-exact", { "./define/b": null }],
  ["null-pattern", { "./define/b/*": null }],
  ["exact-override", { "./define/b": exportsMap["."] }],
  ["specific-pattern", { "./define/b/*": exportsMap["."] }]
]) {
  test(`${name} excludes the less-specific wildcard target`, async () => {
    const missing = "dist/components/b/define.d.ts";
    const effectiveExports = { ...exportsMap, ...override };
    if (name.includes("pattern")) {
      delete effectiveExports["./define/*"];
      effectiveExports["./define/*/entry"] = exportsMap["./define/*"];
    }
    const { record, archive } = await fixture(name, [missing], undefined, [], {
      workspaceOmitted: [missing],
      effectiveExports
    });
    assert.deepEqual(await validateTargets(record), []);
    assert.deepEqual(await validateTargets(record, { archive }), []);
  });
}

test("installed package root cannot resolve outside the fresh consumer", async () => {
  const { record, installedDirectory } = await fixture("external-install-root");
  const consumerRoot = join(dirname(installedDirectory), "consumer");
  const linked = join(consumerRoot, "node_modules", "fixture");
  await mkdir(dirname(linked), { recursive: true });
  await symlink(installedDirectory, linked, process.platform === "win32" ? "junction" : "dir");
  const failures = await validateTargets(record, { installedDirectory: linked, consumerRoot });
  assert.ok(
    failures.some((failure) => /outside.*consumer/.test(failure)),
    JSON.stringify(failures)
  );
});

test("an installed link resolving inside the fresh consumer remains valid", async () => {
  const { record, installedDirectory } = await fixture("internal-install-root");
  const consumerRoot = dirname(installedDirectory);
  const linked = join(consumerRoot, "node_modules", "fixture");
  await mkdir(dirname(linked), { recursive: true });
  await symlink(installedDirectory, linked, process.platform === "win32" ? "junction" : "dir");
  assert.deepEqual(await validateTargets(record, { installedDirectory: linked, consumerRoot }), []);
});

test("null exclusions can remove every discovered wildcard entry", async () => {
  const missing = ["dist/components/a/define.d.ts", "dist/components/b/define.d.ts"];
  const effectiveExports = { ...exportsMap, "./define/a": null, "./define/b": null };
  const { record, archive } = await fixture("all-excluded", missing, undefined, [], {
    workspaceOmitted: missing,
    effectiveExports
  });
  assert.deepEqual(await validateTargets(record, { archive }), []);
});

test("repeated target stars must use the same captured subpath", async () => {
  const effectiveExports = {
    ...exportsMap,
    "./define/*": { types: "./dist/components/*/*.d.ts", import: "./dist/components/*/define.js" }
  };
  const { record, archive } = await fixture("repeated-capture", [], undefined, [], {
    effectiveExports
  });
  const failures = await validateTargets(record, { archive });
  for (const missing of ["dist/components/a/a.d.ts", "dist/components/b/b.d.ts"]) {
    assert.ok(
      failures.some((failure) => failure.includes(missing)),
      JSON.stringify(failures)
    );
  }
  assert.equal(
    failures.some((failure) => failure.includes("dist/components/define/define.js")),
    false
  );
});

for (const exitCode of [0, 7]) {
  test(`packed diagnostics retain actual bytes, consumer files and command outcome ${exitCode} before scoped cleanup`, async () => {
    const { archive } = await fixture(`retention-${exitCode}`);
    const tempRoot = await mkdtemp(join(tmpdir(), "fluid-package-contract-test-"));
    const evidence = join(dirname(archive), "retained");
    await mkdir(join(tempRoot, "packs"));
    await mkdir(join(tempRoot, "consumer", "node_modules"), { recursive: true });
    await copyFile(archive, join(tempRoot, "packs", "fixture.tgz"));
    for (const file of ["package.json", "pnpm-lock.yaml", "consumer.ts", "tsconfig.json"]) {
      await writeFile(join(tempRoot, "consumer", file), `fixture ${file}\n`);
    }
    await writeFile(join(tempRoot, "consumer", "node_modules", "excluded.txt"), "must not copy");
    await writeFile(
      join(tempRoot, "consumer", "verify.mjs"),
      `console.log('retained stdout'); console.error('retained stderr'); process.exitCode = ${exitCode};\n`
    );
    const operation = withPackedEvidence(tempRoot, evidence, (run) =>
      run(process.execPath, ["verify.mjs"], join(tempRoot, "consumer"))
    );
    if (exitCode) await assert.rejects(operation, /failed \(7\)/);
    else await operation;
    assert.deepEqual(
      await readFile(join(evidence, "packs", "fixture.tgz")),
      await readFile(archive)
    );
    assert.deepEqual((await readdir(join(evidence, "consumer"))).sort(), [
      "consumer.ts",
      "package.json",
      "pnpm-lock.yaml",
      "tsconfig.json",
      "verify.mjs"
    ]);
    const result = JSON.parse(await readFile(join(evidence, "result.json"), "utf8"));
    assert.equal(result.status, exitCode ? "failed" : "passed");
    assert.equal(result.commands[0].exitCode, exitCode);
    const log = await readFile(join(evidence, result.commands[0].log), "utf8");
    assert.match(log, /retained stdout/);
    assert.match(log, /retained stderr/);
    await assert.rejects(readdir(tempRoot), { code: "ENOENT" });
  });
}

test("retention failure preserves the original temporary archive instead of deleting the only evidence", async () => {
  const { archive } = await fixture("retention-write-failure");
  const tempRoot = await mkdtemp(join(tmpdir(), "fluid-package-contract-test-"));
  await mkdir(join(tempRoot, "packs"));
  await mkdir(join(tempRoot, "consumer"));
  await copyFile(archive, join(tempRoot, "packs", "fixture.tgz"));
  await writeFile(join(tempRoot, "consumer", "package.json"), "{}");
  const evidence = join(dirname(archive), "retention-blocked");
  await mkdir(join(evidence, "consumer", "package.json"), { recursive: true });
  const original = new Error("original packed check failure");
  await assert.rejects(
    withPackedEvidence(tempRoot, evidence, async () => {
      throw original;
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors[0], original);
      assert.match(error.message, /temporary artifacts preserved/);
      return true;
    }
  );
  assert.deepEqual(await readFile(join(tempRoot, "packs", "fixture.tgz")), await readFile(archive));
  // Retain those bytes successfully before the same scoped cleanup is allowed.
  await withPackedEvidence(tempRoot, join(dirname(archive), "retention-recovered"), async () => {});
  await assert.rejects(readdir(tempRoot), { code: "ENOENT" });
});

test("owned command deadlines remain failed and preserve original artifacts after direct termination", async () => {
  const { archive } = await fixture("owned-command-timeout");
  const tempRoot = await mkdtemp(join(tmpdir(), "fluid-package-contract-test-"));
  await mkdir(join(tempRoot, "packs"));
  await mkdir(join(tempRoot, "consumer"));
  await copyFile(archive, join(tempRoot, "packs", "fixture.tgz"));
  const evidence = join(dirname(archive), "timed-out");
  await assert.rejects(
    withPackedEvidence(tempRoot, evidence, (run) =>
      run(
        process.execPath,
        ["-e", "console.log('waiting for deadline'); setInterval(() => {}, 1000);"],
        join(tempRoot, "consumer"),
        { timeoutMs: 1500 }
      )
    ),
    /command-timeout/
  );
  const result = JSON.parse(await readFile(join(evidence, "result.json"), "utf8"));
  assert.equal(result.status, "failed");
  assert.equal(result.commands[0].status, "failed");
  assert.equal(result.commands[0].reason, "command-timeout");
  assert.equal(result.commands[0].timeoutMs, 1500);
  assert.equal(result.commands[0].terminationRequested, true);
  assert.equal(result.commands[0].directChildExitObserved, true);
  assert.equal(result.commands[0].descendantCleanup, "unknown-not-inspected");
  assert.equal(result.temporaryArtifactsPreserved, tempRoot);
  assert.match(
    await readFile(join(evidence, result.commands[0].log), "utf8"),
    /waiting for deadline/
  );
  assert.deepEqual(await readFile(join(tempRoot, "packs", "fixture.tgz")), await readFile(archive));
  // This fixture starts only the observed direct Node process, with no children.
  // Retain again after its confirmed exit before permitting scoped fixture cleanup.
  await withPackedEvidence(
    tempRoot,
    join(dirname(archive), "after-observed-fixture-exit"),
    async () => {}
  );
});

test("packed commands reject shell/PATH fallbacks without starting a child", async () => {
  const { archive } = await fixture("unsupported-command");
  const tempRoot = await mkdtemp(join(tmpdir(), "fluid-package-contract-test-"));
  await mkdir(join(tempRoot, "packs"));
  await mkdir(join(tempRoot, "consumer"));
  const evidence = join(dirname(archive), "unsupported-command-result");
  await assert.rejects(
    withPackedEvidence(tempRoot, evidence, (run) =>
      run("corepack.cmd", ["pnpm", "--version"], tempRoot)
    ),
    /only owned Node execution/
  );
  const result = JSON.parse(await readFile(join(evidence, "result.json"), "utf8"));
  assert.equal(result.status, "failed");
  assert.equal(result.commands[0].status, "failed");
  assert.equal(result.commands[0].pid, undefined);
  assert.match(
    await readFile(join(evidence, result.commands[0].log), "utf8"),
    /Unsupported packed command/
  );
});

for (const exitCode of [0, 7]) {
  test(`cleanup failure retains failed final evidence and original command outcome ${exitCode}`, async () => {
    const { archive } = await fixture(`cleanup-failure-${exitCode}`);
    const tempRoot = await mkdtemp(join(tmpdir(), "fluid-package-contract-test-"));
    await mkdir(join(tempRoot, "packs"));
    await mkdir(join(tempRoot, "consumer"));
    await copyFile(archive, join(tempRoot, "packs", "fixture.tgz"));
    const evidence = join(dirname(archive), "cleanup-failed");
    const cleanupFailure = new Error("injected owned-directory cleanup failure");
    let cleanupCalls = 0;
    await assert.rejects(
      withPackedEvidence(
        tempRoot,
        evidence,
        (run) =>
          run(
            process.execPath,
            ["-e", `console.log('command retained'); process.exitCode = ${exitCode};`],
            join(tempRoot, "consumer")
          ),
        {
          removeTemporaryArtifacts: async (directory, options) => {
            cleanupCalls++;
            assert.equal(directory, tempRoot);
            assert.deepEqual(options, { recursive: true, force: true });
            const pending = JSON.parse(await readFile(join(evidence, "result.json"), "utf8"));
            assert.equal(
              pending.status,
              "running",
              "evidence cannot pass before cleanup completes"
            );
            assert.equal(pending.cleanup.status, "pending");
            assert.deepEqual(
              await readFile(join(evidence, "packs", "fixture.tgz")),
              await readFile(archive)
            );
            throw cleanupFailure;
          }
        }
      ),
      (error) => {
        assert.ok(error instanceof AggregateError);
        assert.equal(error.errors.at(-1), cleanupFailure);
        assert.equal(error.errors.length, exitCode ? 2 : 1);
        if (exitCode) assert.match(error.errors[0].message, /failed \(7\)/);
        return true;
      }
    );
    assert.equal(cleanupCalls, 1);
    const result = JSON.parse(await readFile(join(evidence, "result.json"), "utf8"));
    assert.equal(result.status, "failed");
    assert.equal(result.cleanup.status, "failed");
    assert.match(result.cleanup.error, /injected owned-directory cleanup failure/);
    assert.equal(result.commands[0].exitCode, exitCode);
    if (exitCode) assert.match(result.error, /failed \(7\)/);
    assert.match(
      await readFile(join(evidence, result.commands[0].log), "utf8"),
      /command retained/
    );
    assert.deepEqual(
      await readFile(join(tempRoot, "packs", "fixture.tgz")),
      await readFile(archive)
    );
    await withPackedEvidence(tempRoot, join(dirname(archive), "cleanup-recovered"), async () => {});
    const recovered = JSON.parse(
      await readFile(join(dirname(archive), "cleanup-recovered/result.json"), "utf8")
    );
    assert.equal(recovered.status, "passed");
    assert.equal(recovered.cleanup.status, "completed");
  });
}
