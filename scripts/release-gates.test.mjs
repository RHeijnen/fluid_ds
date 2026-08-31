import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";

// Reuse the YAML parser shipped with the declared, pinned ESLint toolchain.
const require = createRequire(import.meta.url);
const { load } = createRequire(require.resolve("eslint"))("js-yaml");
// visual-regression.yml is deliberately absent: it runs on push through its
// own trigger but does not gate publishing until it holds a green baseline
// (see the comment in release.yml). ssr-hydration rejoined 2026-08-31.
const lanes = {
  verify: "verify.yml",
  coverage: "coverage.yml",
  ssr: "ssr-hydration.yml",
  accessibility: "accessibility.yml",
  interactions: "storybook-interactions.yml",
  performance: "performance.yml",
  packages: "package-contracts.yml",
  frameworks: "framework-contracts.yml"
};
const readWorkflow = async (name) =>
  load(await readFile(new URL(`../.github/workflows/${name}`, import.meta.url), "utf8"));

function assertReleaseGraph(workflow) {
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.deepEqual(workflow.on.push.branches, ["main"]);
  assert.ok(Object.hasOwn(workflow.on, "workflow_dispatch"));
  assert.ok(!Object.hasOwn(workflow.on, "workflow_run"));
  const context = workflow.jobs["release-context"];
  assert.match(context.steps[0].run, /GITHUB_REF/);
  assert.match(context.steps[0].run, /refs\/heads\/main/);
  const release = workflow.jobs.release;
  assert.deepEqual([...release.needs].sort(), Object.keys(lanes).sort());
  assert.equal(release.if, "github.ref == 'refs/heads/main'");
  assert.ok(!release["continue-on-error"]);
  for (const [id, filename] of Object.entries(lanes)) {
    const job = workflow.jobs[id];
    assert.equal(job.uses, `./.github/workflows/${filename}`);
    assert.equal(job.needs, "release-context");
    assert.equal(job.if, undefined);
    assert.equal(job.secrets, undefined);
    assert.ok(!job["continue-on-error"]);
    assert.equal(job.permissions, undefined);
  }
  const publishIndex = release.steps.findIndex((step) =>
    step.uses?.startsWith("changesets/action@")
  );
  assert.ok(publishIndex > 0);
  // The dist-tag must be resolved at run time from `.changeset/pre.json`, never
  // hardcoded here, so a release candidate cannot take npm's latest dist-tag.
  assert.equal(
    release.steps[publishIndex].with.publish,
    "node scripts/changeset-publish.mjs",
    "publishing must go through the audited dist-tag wrapper"
  );
  const buildIndex = release.steps.findIndex((step) => step.run === "pnpm build");
  const supplyChainIndex = release.steps.findIndex(
    (step) => step.run === "pnpm check:supply-chain"
  );
  const dryRunIndex = release.steps.findIndex((step) => step.run === "pnpm publish:dry");
  assert.ok(
    supplyChainIndex >= 0 &&
      buildIndex > supplyChainIndex &&
      dryRunIndex > buildIndex &&
      dryRunIndex < publishIndex
  );
  assert.equal(release.steps[supplyChainIndex].if, undefined);
  assert.ok(!release.steps[supplyChainIndex]["continue-on-error"]);
  assert.equal(release.steps[dryRunIndex].if, undefined);
  assert.ok(!release.steps[dryRunIndex]["continue-on-error"]);
  const exactCommit = release.steps[publishIndex - 1];
  assert.match(exactCommit.run, /git rev-parse HEAD/);
  assert.match(exactCommit.run, /GITHUB_SHA/);
  assert.match(exactCommit.run, /git ls-remote --exit-code origin refs\/heads\/main/);
  assert.ok(!exactCommit["continue-on-error"]);
  const checkout = release.steps.find((step) => step.uses?.startsWith("actions/checkout@"));
  assert.equal(
    checkout.with.ref,
    undefined,
    "checkout must use the event commit, not floating main"
  );
}

test("release requires all nine same-commit lanes before publication, including manual dispatch", async () => {
  assertReleaseGraph(await readWorkflow("release.yml"));
});

function assertRequiredJobs(workflow, filename) {
  for (const [jobName, job] of Object.entries(workflow.jobs)) {
    assert.ok(!job["continue-on-error"], filename);
    if (filename === "visual-regression.yml" && jobName === "comment") {
      assert.equal(job.needs, "visual");
      assert.equal(
        job.if,
        "always() && needs.visual.result == 'failure' && github.event_name == 'pull_request'"
      );
      assert.deepEqual(job.permissions, { contents: "read", "pull-requests": "write" });
      assert.ok(job.steps.every((step) => !step.run));
      continue;
    }
    assert.equal(job.if, undefined, `${filename}: required jobs cannot be conditionally skipped`);
    assert.equal(
      job.strategy?.matrix.exclude,
      undefined,
      `${filename}: no excluded matrix members`
    );
    assert.equal(
      job.strategy?.matrix.include,
      undefined,
      `${filename}: no unreviewed matrix overrides`
    );
    for (const step of job.steps ?? []) {
      assert.ok(!step["continue-on-error"], `${filename}: failed steps must remain failures`);
      if (step.run && step.if !== undefined) {
        assert.equal(
          filename,
          "framework-contracts.yml",
          "only reviewed framework alternatives may conditionally execute"
        );
        assert.ok(
          [
            "matrix.package == '@fluid-ds/admin-react'",
            "matrix.package != '@fluid-ds/admin-react'"
          ].includes(step.if),
          "conditional framework steps must use the reviewed exhaustive alternatives"
        );
      }
      if (step.uses?.startsWith("actions/checkout@")) {
        assert.equal(step.with?.ref, undefined, `${filename}: event commit checkout`);
      }
    }
  }
}

test("all release lanes are callable without path filters or cancellation crossing the caller boundary", async () => {
  for (const filename of Object.values(lanes)) {
    const workflow = await readWorkflow(filename);
    assert.ok(Object.hasOwn(workflow.on, "workflow_call"), filename);
    assert.equal(workflow.on.workflow_call, null, filename);
    if (workflow.concurrency) {
      assert.ok(workflow.concurrency.group.includes("${{ github.workflow }}"), filename);
      assert.ok(!workflow.concurrency.group.startsWith("release-"), filename);
    }
    assertRequiredJobs(workflow, filename);
  }
  assert.deepEqual((await readWorkflow("verify.yml")).jobs.verify.strategy.matrix.node, [22, 24]);
  assert.deepEqual(
    (await readWorkflow("framework-contracts.yml")).jobs.build.strategy.matrix.package,
    [
      "@fluid-ds/admin-react",
      "@fluid-ds/admin-next",
      "@fluid-ds/admin-angular",
      "@fluid-ds/framework-vue",
      "@fluid-ds/framework-astro",
      "@fluid-ds/framework-sveltekit"
    ]
  );
});

function assertPackageLane(workflow) {
  const steps = workflow.jobs["packed-consumer"].steps;
  const packedIndex = steps.findIndex((step) => step.run === "pnpm test:packed");
  const cemIndex = steps.findIndex((step) => step.run === "pnpm check:cem:packed");
  assert.ok(packedIndex >= 0, "package lane must execute the packed consumer gate");
  assert.ok(
    cemIndex > packedIndex,
    "packed CEM validation must follow the packed build/install gate"
  );
  for (const index of [packedIndex, cemIndex]) {
    assert.equal(steps[index].if, undefined, "package checks cannot be conditionally skipped");
    assert.ok(!steps[index]["continue-on-error"], "package failures must remain failures");
  }
  const uploadIndex = steps.findIndex((step) => step.uses?.startsWith("actions/upload-artifact@"));
  assert.ok(uploadIndex > cemIndex, "artifact retention must follow both package checks");
  const upload = steps[uploadIndex];
  assert.equal(upload.if, "always()", "failed package checks must retain evidence");
  assert.equal(upload.with["if-no-files-found"], "error");
  assert.deepEqual(
    upload.with.path
      .trim()
      .split(/\r?\n/)
      .map((path) => path.trim()),
    [
      "quality/evidence/packed-packages/",
      "quality/evidence/package-artifact-tests/",
      "quality/evidence/*-cem-publication/"
    ]
  );
}

test("package lane verifies packed consumers then canonical CEM and always retains all evidence paths", async () => {
  assertPackageLane(await readWorkflow("package-contracts.yml"));
});

test("package lane guard rejects missing or reordered checks and lost failure evidence", async () => {
  const original = await readWorkflow("package-contracts.yml");
  for (const [name, mutate] of [
    [
      "missing packed check",
      (steps) =>
        steps.splice(
          steps.findIndex((step) => step.run === "pnpm test:packed"),
          1
        )
    ],
    [
      "missing CEM check",
      (steps) =>
        steps.splice(
          steps.findIndex((step) => step.run === "pnpm check:cem:packed"),
          1
        )
    ],
    [
      "CEM before packed build",
      (steps) => {
        const packed = steps.findIndex((step) => step.run === "pnpm test:packed");
        const cem = steps.findIndex((step) => step.run === "pnpm check:cem:packed");
        [steps[packed], steps[cem]] = [steps[cem], steps[packed]];
      }
    ],
    [
      "skipped CEM check",
      (steps) => {
        steps.find((step) => step.run === "pnpm check:cem:packed").if = false;
      }
    ],
    [
      "ignored packed failure",
      (steps) => {
        steps.find((step) => step.run === "pnpm test:packed")["continue-on-error"] = true;
      }
    ],
    ["missing upload", (steps) => steps.pop()],
    [
      "success-only upload",
      (steps) => {
        steps.at(-1).if = "success()";
      }
    ],
    [
      "missing evidence accepted",
      (steps) => {
        steps.at(-1).with["if-no-files-found"] = "ignore";
      }
    ],
    ...["packed-packages", "package-artifact-tests", "*-cem-publication"].map((path) => [
      `incorrect ${path} path`,
      (steps) => {
        steps.at(-1).with.path = steps.at(-1).with.path.replace(path, "wrong-directory");
      }
    ])
  ]) {
    const workflow = structuredClone(original);
    mutate(workflow.jobs["packed-consumer"].steps);
    assert.throws(() => assertPackageLane(workflow), undefined, name);
  }
});

test("required-lane guards reject excluded matrix members and skipped test steps", async () => {
  for (const filename of ["verify.yml", "framework-contracts.yml"]) {
    const original = await readWorkflow(filename);
    assertRequiredJobs(original, filename);
    const excluded = structuredClone(original);
    const job = Object.values(excluded.jobs)[0];
    job.strategy.matrix.exclude = [
      filename === "verify.yml" ? { node: 24 } : { package: "@fluid-ds/admin-react" }
    ];
    assert.throws(() => assertRequiredJobs(excluded, filename), /excluded matrix/);
    const skipped = structuredClone(original);
    Object.values(skipped.jobs)[0].steps.find((step) => step.run).if = false;
    assert.throws(() => assertRequiredJobs(skipped, filename));
  }
});

for (const [name, mutate] of [
  [
    "missing coverage dependency",
    (w) => {
      w.jobs.release.needs = w.jobs.release.needs.filter((id) => id !== "coverage");
    }
  ],
  [
    "floating workflow revision",
    (w) => {
      w.jobs.verify.uses += "@main";
    }
  ],
  [
    "manual-dispatch verification bypass",
    (w) => {
      w.jobs.verify.if = "github.event_name != 'workflow_dispatch'";
    }
  ],
  [
    "always-publish bypass",
    (w) => {
      w.jobs.release.if = "always()";
    }
  ],
  [
    "ignored verification failure",
    (w) => {
      w.jobs.verify["continue-on-error"] = true;
    }
  ],
  [
    "floating release checkout",
    (w) => {
      w.jobs.release.steps[0].with.ref = "main";
    }
  ],
  [
    "ignored exact-commit failure",
    (w) => {
      w.jobs.release.steps.at(-2)["continue-on-error"] = true;
    }
  ],
  [
    "a hardcoded publish dist-tag",
    (w) => {
      w.jobs.release.steps.at(-1).with.publish = "pnpm exec changeset publish --tag latest";
    }
  ]
]) {
  test(`release graph rejects ${name}`, async () => {
    const workflow = await readWorkflow("release.yml");
    assertReleaseGraph(workflow);
    mutate(workflow);
    assert.throws(() => assertReleaseGraph(workflow));
  });
}
