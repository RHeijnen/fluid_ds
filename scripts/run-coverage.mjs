import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { checkCoverageInventories } from "./coverage-inventory.mjs";

const executable = process.platform === "win32" ? "corepack.cmd" : "corepack";
const packages = [
  "components",
  "charts",
  "scheduler",
  "media",
  "table",
  "calendar",
  "editor",
  "kanban",
  "map",
  "node-graph",
  "animations",
  "qr",
  "parser",
  "markdown"
];
const filters = packages.flatMap((name) => ["--filter", `@fluid-ds/${name}`]);
const startedAt = Date.now();
// Finish every queued package before propagating failures or checking inventory.
const result = spawnSync(
  executable,
  ["pnpm", "--workspace-concurrency=1", "--no-bail", ...filters, "test"],
  {
    cwd: new URL("..", import.meta.url),
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      CI: "true",
      FLUID_COVERAGE: "true",
      PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false"
    }
  }
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
if (process.exitCode === 0) {
  const inventory = await checkCoverageInventories({ since: startedAt });
  await mkdir(new URL("../quality/evidence/coverage/", import.meta.url), { recursive: true });
  const report = new URL(
    `../quality/evidence/coverage/${new Date().toISOString().replaceAll(/[:.]/g, "-")}.json`,
    import.meta.url
  );
  await writeFile(report, `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(`Coverage file inventory: ${report.pathname}`);
  if (inventory.failures.length) {
    console.error(inventory.failures.join("\n"));
    process.exitCode = 1;
  }
}
