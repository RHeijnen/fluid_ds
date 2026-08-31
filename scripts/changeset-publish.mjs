/**
 * Resolve the npm dist-tag for the release publish step from changesets pre-mode state.
 *
 * Verified against the pinned toolchain (@changesets/cli 2.31.0, @changesets/pre 2.0.2,
 * @changesets/apply-release-plan 7.1.1). The true `.changeset/pre.json` lifecycle is:
 *
 *   1. `changeset pre enter <tag>` writes the file with `mode: "pre"` and `tag: "<tag>"`.
 *   2. `changeset pre exit` rewrites the SAME file with `mode: "exit"`. It does not
 *      delete it, so an absent file and a `mode: "exit"` file are different states.
 *   3. The next `changeset version` consumes `mode: "exit"`, promotes the prerelease
 *      versions to stable, and only then deletes `.changeset/pre.json`.
 *
 * Two publish behaviours follow from that, and both shape this wrapper:
 *
 *   - While `mode` is `"pre"`, `changeset publish --tag <anything>` is a hard refusal
 *     ("Releasing under custom tag is not allowed in pre mode", exit 1). A prerelease
 *     therefore must publish with NO explicit `--tag`; changesets then routes every
 *     package to `preState.tag` itself, which is why that tag may never be "latest".
 *   - Conversely, changesets prefers `preState.tag` over "latest" whenever the file
 *     exists at all, `mode: "exit"` included. The stable branch must therefore pass
 *     `--tag latest` explicitly, or the exiting release would land on the rc tag.
 *
 * Residual behaviour owned upstream: in pre mode changesets publishes a package to
 * "latest" when every version already on the registry is a prerelease of this same
 * tag ("only-pre"). Packages with a prior stable release, which is all of the
 * @fluid-ds family, are unaffected.
 */
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = dirname(here);

/** Read `.changeset/pre.json`, tolerating its absence but never its corruption. */
export async function readPreState(root = repositoryRoot) {
  let contents;
  try {
    contents = await readFile(join(root, ".changeset/pre.json"), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
  return JSON.parse(contents);
}

/**
 * Map pre-state to the exact publish invocation. Unknown states fail closed rather
 * than defaulting to the stable tag: an unreleasable state is safer than a wrong one.
 */
export function resolvePublishPlan(preState) {
  const mode = preState?.mode;
  if (mode === "pre") {
    const tag = typeof preState.tag === "string" ? preState.tag.trim() : "";
    if (!tag || tag === "latest")
      throw new Error(
        `Refusing to publish: pre-mode dist-tag ${JSON.stringify(preState.tag)} is missing or is the stable "latest" tag. A prerelease must never take latest; re-enter pre mode with a prerelease tag, for example "changeset pre enter next".`
      );
    return { mode: "pre", tag, args: ["exec", "changeset", "publish"] };
  }
  if (mode === undefined || mode === "exit")
    return {
      mode: mode ?? "none",
      tag: "latest",
      args: ["exec", "changeset", "publish", "--tag", "latest"]
    };
  throw new Error(
    `Refusing to publish: unrecognized changesets pre-mode ${JSON.stringify(mode)} in .changeset/pre.json.`
  );
}

export function describePlan(plan) {
  if (plan.mode === "pre")
    return `Changesets pre-mode is active. Publishing under the "${plan.tag}" dist-tag, routed by changesets itself (an explicit --tag is refused in pre mode).`;
  const state =
    plan.mode === "exit"
      ? "pre.json is marked exit and awaits its promoting version run"
      : "no .changeset/pre.json is present";
  return `Changesets pre-mode is not active (${state}). Publishing under the "${plan.tag}" dist-tag.`;
}

async function main() {
  if (process.argv.length !== 2) throw new Error("Usage: node scripts/changeset-publish.mjs");
  const plan = resolvePublishPlan(await readPreState());
  console.log(describePlan(plan));
  console.log(`> pnpm ${plan.args.join(" ")}`);
  const result =
    process.platform === "win32"
      ? spawnSync(process.env.ComSpec, ["/d", "/s", "/c", `pnpm ${plan.args.join(" ")}`], {
          cwd: repositoryRoot,
          stdio: "inherit",
          windowsHide: true
        })
      : spawnSync("pnpm", plan.args, { cwd: repositoryRoot, stdio: "inherit" });
  if (result.error) throw result.error;
  // A signalled or status-less child is a failure, never a silent success.
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
