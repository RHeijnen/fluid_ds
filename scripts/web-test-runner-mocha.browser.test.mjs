import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { runOwnedNode } from "./cem/owned-node.mjs";

test("real browser Mocha policy rejects excluded tests and preserves normal execution", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const evidenceRoot = join(
    root,
    "quality/evidence/wtr-mocha-policy",
    new Date().toISOString().replaceAll(/[:.]/g, "-")
  );
  const outcomes = [];
  await mkdir(evidenceRoot, { recursive: true });
  const cases = [
    ["only", true],
    ["skip", true],
    ["normal", false],
    ["only", false],
    ["suite-only", false],
    ["skip", false],
    ["suite-skip", false],
    ["runtime-skip", false]
  ];
  for (const [fixture, baseline] of cases) {
    const label = `${baseline ? "old-policy-negative-control" : "certification"}-${fixture}`;
    const directory = join(evidenceRoot, label);
    const lifecycleDirectory = join(directory, "lifecycle");
    await mkdir(directory, { recursive: true });
    const result = await runOwnedNode(
      [
        fileURLToPath(new URL("./fixtures/wtr-mocha-policy-cli.mjs", import.meta.url)),
        lifecycleDirectory
      ],
      {
        cwd: root,
        timeoutMs: 180000,
        env: {
          ...process.env,
          CI: "true",
          FLUID_BROWSERS: "chromium",
          FLUID_COVERAGE: "false",
          FLUID_MOCHA_POLICY_CASE: fixture,
          FLUID_MOCHA_POLICY_BASELINE: String(baseline),
          PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false"
        }
      }
    );
    const { stdout, stderr, ...command } = result;
    await writeFile(join(directory, "output.log"), stdout + stderr);
    outcomes.push({ fixture, baseline, command });
    await writeFile(join(evidenceRoot, "commands.json"), `${JSON.stringify(outcomes, null, 2)}\n`);
    const expectedPass = baseline || fixture === "normal";
    assert.equal(result.terminationRequested, false, `${label}: outer timeout is not policy proof`);
    assert.equal(result.directChildExitObserved, true, `${label}: direct child must exit normally`);
    assert.equal(result.signal, null, label);
    assert.equal(result.exitCode, expectedPass ? 0 : 1, `${label}\n${stdout}${stderr}`);
    const files = await readdir(lifecycleDirectory);
    assert.equal(files.length, 1, `${label}: one actual supervised run`);
    const evidence = JSON.parse(await readFile(join(lifecycleDirectory, files[0]), "utf8"));
    assert.equal(evidence.status, expectedPass ? "passed" : "failed", label);
    assert.equal(evidence.completion?.passed, expectedPass, label);
    assert.equal(evidence.completion?.serverClosed, true, label);
    assert.deepEqual(evidence.cleanup, [], `${label}: no forced cleanup`);
    assert.deepEqual(evidence.remainingProcesses, [], label);
    assert.deepEqual(evidence.ownershipUncertainties, [], label);
    assert.deepEqual(Object.values(evidence.completion.launchers), ["stopped"], label);
    if (!expectedPass) {
      assert.match(
        stdout + stderr,
        fixture.includes("only") ? /\.only.*forbid-only/i : /Pending test forbidden/i,
        label
      );
    } else {
      assert.match(stdout + stderr, fixture === "normal" ? /2 passed/ : /1 passed/, label);
    }
    console.log(`${label}: expected exit ${result.exitCode}, normal teardown; ${directory}`);
  }
});
