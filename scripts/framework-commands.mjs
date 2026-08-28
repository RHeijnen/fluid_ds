import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { resolveCorepackPnpm, runOwnedNode } from "./cem/owned-node.mjs";

export const frameworkCommandDeadlines = {
  pack: 60_000,
  install: 120_000,
  typecheck: 60_000,
  build: 120_000
};

export async function runFrameworkCommand(
  args,
  { cwd, logPath, outcomes, stage, quiet = false },
  dependencies = {}
) {
  const timeoutMs = frameworkCommandDeadlines[stage];
  if (!timeoutMs) throw new Error(`Unsupported framework command stage: ${stage}`);
  await mkdir(dirname(logPath), { recursive: true });
  const record = { stage, args, status: "failed", reason: "setup-error" };
  outcomes.push(record);
  try {
    const entry = await (dependencies.resolveCorepackPnpm ?? resolveCorepackPnpm)();
    const result = await (dependencies.runOwnedNode ?? runOwnedNode)([entry, ...args], {
      cwd,
      env: { ...process.env, CI: "true", PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false" },
      timeoutMs
    });
    const { stdout, stderr, ...outcome } = result;
    Object.assign(record, outcome);
    await writeFile(logPath, `${stdout}${stderr}`);
    if (!quiet) {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
    }
    if (result.status !== "passed" || !result.directChildExitObserved)
      throw new Error(
        `Framework ${stage} failed: ${result.reason ?? "direct child exit not observed"}`
      );
  } catch (error) {
    record.status = "failed";
    record.error = error.message;
    throw error;
  } finally {
    await writeFile(`${logPath}.result.json`, `${JSON.stringify(record, null, 2)}\n`);
  }
}
