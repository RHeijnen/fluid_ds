import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  describePlan,
  readPreState,
  repositoryRoot,
  resolvePublishPlan
} from "./changeset-publish.mjs";

async function preStateFixture(t, contents) {
  const root = await mkdtemp(join(tmpdir(), "fluid-pre-state-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, ".changeset"), { recursive: true });
  if (contents !== undefined) await writeFile(join(root, ".changeset/pre.json"), contents);
  return root;
}

test("an absent pre.json publishes the stable latest dist-tag", async (t) => {
  const root = await preStateFixture(t, undefined);
  assert.equal(await readPreState(root), undefined);
  const plan = resolvePublishPlan(await readPreState(root));
  assert.deepEqual(plan, {
    mode: "none",
    tag: "latest",
    args: ["exec", "changeset", "publish", "--tag", "latest"]
  });
  assert.match(describePlan(plan), /not active/);
});

test("pre.json with mode pre publishes the prerelease tag without an explicit --tag", async (t) => {
  // `changeset publish --tag <name>` is a hard refusal while mode is "pre", so the
  // wrapper must omit the flag and let changesets route to preState.tag.
  const root = await preStateFixture(
    t,
    `${JSON.stringify({ mode: "pre", tag: "next", initialVersions: {}, changesets: [] }, null, 2)}\n`
  );
  const plan = resolvePublishPlan(await readPreState(root));
  assert.deepEqual(plan, { mode: "pre", tag: "next", args: ["exec", "changeset", "publish"] });
  assert.ok(!plan.args.includes("--tag"), "pre mode must not pass an explicit dist-tag");
  assert.match(describePlan(plan), /pre-mode is active/);
  assert.match(describePlan(plan), /"next"/);

  // The version suffix and the dist-tag are the same string in pre mode, so an rc
  // enter yields the rc tag. Both are prerelease tags; neither is latest.
  assert.equal(resolvePublishPlan({ mode: "pre", tag: "rc" }).tag, "rc");
});

test("pre.json with mode exit publishes the stable latest dist-tag", async (t) => {
  // `changeset pre exit` rewrites pre.json with mode "exit" instead of deleting it;
  // only the next `changeset version` removes the file. The exiting run is therefore
  // the stable release, and it must pass --tag latest explicitly, because changesets
  // otherwise prefers preState.tag whenever the file exists at all.
  const root = await preStateFixture(
    t,
    `${JSON.stringify({ mode: "exit", tag: "next", initialVersions: {}, changesets: [] }, null, 2)}\n`
  );
  const plan = resolvePublishPlan(await readPreState(root));
  assert.deepEqual(plan, {
    mode: "exit",
    tag: "latest",
    args: ["exec", "changeset", "publish", "--tag", "latest"]
  });
  assert.match(describePlan(plan), /marked exit/);
});

test("a prerelease may never claim the latest dist-tag", () => {
  for (const tag of ["latest", "  latest  ", "", "   ", undefined, null, 7])
    assert.throws(
      () => resolvePublishPlan({ mode: "pre", tag }),
      /missing or is the stable "latest" tag/,
      `pre-mode tag ${JSON.stringify(tag)} must be refused`
    );
  assert.equal(resolvePublishPlan({ mode: "pre", tag: "  next  " }).tag, "next");
});

test("unrecognized or unreadable pre-state fails closed", async (t) => {
  for (const mode of ["exited", "PRE", "", null, 1])
    assert.throws(
      () => resolvePublishPlan({ mode, tag: "next" }),
      /unrecognized changesets pre-mode/,
      `mode ${JSON.stringify(mode)} must be refused`
    );
  const root = await preStateFixture(t, "{ not json");
  await assert.rejects(() => readPreState(root), SyntaxError);
});

test("the repository's own committed state resolves to the stable latest dist-tag", async () => {
  // The repository is deliberately not in pre-mode yet; entering it flips this.
  const plan = resolvePublishPlan(await readPreState(repositoryRoot));
  assert.equal(plan.tag, "latest");
});
