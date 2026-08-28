# Release pipeline integrity and offline dry-run — 2026-08-27

## Outcome

The release path now has a fail-closed, offline rehearsal before the Changesets action. It inventories exactly 18 public packages, calculates a deterministic dependency order, validates package metadata and workspace export targets, rejects stale build/CEM artifacts and dirty inputs, statically verifies release workflow/OIDC assumptions, and retains a JSON result. It contains no registry, network, publish, version, tag, push, or release operation.

The retained 27 August worktree rehearsal correctly finished red. This is retained evidence, not a waived gate: source-newer-than-dist outputs, an unverified canonical manifest generation, and the deliberately dirty shared worktree made publication unsafe at that snapshot. Package metadata and governance-file archive blockers were cleared in that tranche.

Current continuation, 28 August: that 17-refusal result remains a dated historical
rehearsal, not the current source-tree disposition. Local checkpoints now run
through `5ef233a`; all public package versions remain `0.4.0`. The core bundle
budgets were restored without increasing their 19,000/14,000/16,000/23,000-byte
ceilings, and deterministic Chart/story-fixture changes do not authorize visual
baseline acceptance. The authoritative exact-tree
`FLUID_BROWSERS=all corepack pnpm@9.15.0 verify` passed on `0879c8b` in 789
seconds; its retained log SHA-256 is
`792e65305237cd332dd6a4e5a146145b590d192b6686bce345490c2e6b0de0ec`.

The current clean-tree rehearsal is green. On HEAD `5ef233a`, exact command
`corepack pnpm@9.15.0 publish:dry` exited 0. The retained result at
`quality/evidence/release-dry-run/2026-08-28T11-32-38-136Z/result.json` records
18 packages at version `0.4.0`, with `failures: []`, `networkCommands: []` and
`publishCommands: []`. The retained log
`/tmp/publish-dry-5ef233a-20260828-final.log` has SHA-256
`8f19b1b49fd43fbac5016642381edb0e8598668a170118f5159f9b932e8b9f1c`.
The four untracked visual-evidence files were temporarily preserved outside the
checkout to satisfy the clean-tree precondition and restored afterward. This
was an offline no-publish rehearsal: no push, publication, deployment, tag or
visual-baseline approval occurred. Human, remote and channel-policy decisions
remain open.

## Exact package set and order

The fixed public inventory is:

```text
@fluid-ds/animations
@fluid-ds/calendar
@fluid-ds/charts
@fluid-ds/components
@fluid-ds/editor
@fluid-ds/icons
@fluid-ds/kanban
@fluid-ds/map
@fluid-ds/markdown
@fluid-ds/media
@fluid-ds/node-graph
@fluid-ds/parser
@fluid-ds/qr
@fluid-ds/react
@fluid-ds/scheduler
@fluid-ds/table
@fluid-ds/themes
@fluid-ds/tokens
```

The no-publish dependency order, including internal runtime, optional, and peer edges, is:

```text
animations -> icons -> tokens -> components -> themes -> calendar -> charts ->
editor -> kanban -> map -> markdown -> media -> node-graph -> parser -> qr ->
scheduler -> table -> react
```

The command fails if a package is added/removed without an explicit contract update or if internal edges form a cycle.

## Workflow ordering and credentials

The release job still depends on all nine same-commit lanes. Its mutation-capable sequence is now:

1. install with the frozen lock;
2. build packages;
3. run `pnpm publish:dry` locally and offline;
4. prove checkout `HEAD`, event SHA, and current remote `main` still agree;
5. invoke the Changesets action.

Static guards require the npm registry URL, an npm 11 client, job-scoped `id-token: write`, write access for the version PR, the exact `changeset publish --tag latest` command, and `GITHUB_TOKEN` for Changesets. `NPM_TOKEN` and `NODE_AUTH_TOKEN` on the publishing action are rejected. The dry-run itself does not read or require an npm token.

Repository checks cannot prove the remote npm trusted-publisher configuration, the provenance statement returned by npm, GitHub environment protection, or an organization signing policy. Those remain remote owner sign-offs.

## Package and artifact audit

For every public package the guard checks:

- exact scoped name and fixed-group version agreement;
- public access and current `latest` tag policy;
- MIT license, author, homepage, repository directory, issue-support URL;
- physical and declared tarball inclusion of README, LICENSE, and CHANGELOG;
- absence of unreviewed pack/publish lifecycle hooks;
- every workspace export/main/module/types target through the existing artifact validator;
- built-root presence and source-versus-dist freshness;
- byte-exact canonical CEM agreement for all manifest-owning packages;
- clean tracked and untracked git state.

Current metadata result:

- all 18 packages declare README, LICENSE, and CHANGELOG in their pack allowlists;
- node-graph and React have truthful package-local changelog placeholders that explicitly record no package-specific release entries rather than fabricating history;
- React now has the repository-standard MIT license, author, homepage, repository directory, issue-support URL, and package keywords;
- all 18 `pnpm pack --dry-run --json` archive checks contain package.json, README, LICENSE, and CHANGELOG and write no tarball;
- all current public package versions remain `0.4.0`, and the Changesets fixed group remains exactly `@fluid-ds/*`.

The archive test uses each package directly when its internal workspace links are installed. For a shared checkout whose package-local link is absent, only pnpm's exact `ERR_PNPM_CANNOT_RESOLVE_WORKSPACE_PROTOCOL` failure permits a temporary mirror: it copies the declared package files and normalizes internal `workspace:*` ranges to the same unchanged package version before running the real pnpm dry-run. Any other packing failure remains fatal. This keeps the check offline and avoids mutating the lockfile or shared installation.

The retained dated rehearsal has exactly 17 refusal reasons: 15 packages had source newer than `dist`, canonical CEM generation rejected `FluidInput/fluid-change` because it had no proven literal dispatch, and the shared worktree was dirty. Those are historical snapshot facts; package metadata contributed zero failures.

## Version-policy decision

There is an unresolved policy mismatch. `SECURITY.md` says pre-1.0 security fixes ship on `0.x.x-alpha.*`, while the actual workflow unconditionally publishes `--tag latest` and packages currently use stable-looking `0.4.0`. The tooling reports this as an owner decision and does not silently select a channel or modify versions/tags.

Before prerelease publishing, owners must choose and document one rule: either prohibit prerelease versions in this workflow, or derive/require a reviewed non-`latest` tag for prerelease semver. This tranche intentionally changes neither policy nor version state.

## Rollback boundary

Published npm versions are immutable. The proposed owner policy is:

1. stop further publication and deprecate the bad version with a precise warning;
2. restore the last known-good dependency graph and artifacts from a verified commit;
3. run every release lane and the clean offline rehearsal again;
4. publish a new patch version and document migration/impact;
5. never unpublish a consumed version, reuse a version number, or retag an unverified artifact.

This procedure is documented for approval only; no remote rollback action was performed.

## Retained evidence and verification

The passing 28 August clean-tree result is retained at
`quality/evidence/release-dry-run/2026-08-28T11-32-38-136Z/result.json`. It
records all 18 packages at `0.4.0` and empty failure, network-command and
publish-command arrays. This supersedes the old result as the current machine
disposition without erasing that dated failure evidence.

The genuine red rehearsal is retained at `quality/evidence/release-dry-run/2026-08-27T13-27-00-459Z/result.json`. It records:

- mode `offline-no-publish`;
- zero network commands and zero publish commands;
- all 18 packages in exact dependency order;
- current version `0.4.0`;
- exactly 17 remaining refusal reasons and the three external/owner decisions;
- zero package metadata or governance-file failures.

Focused verification:

```text
node --test scripts/release-gates.test.mjs scripts/dry-run-publish.test.mjs
  18/18 passed, including all 18 package archive-content checks.

node scripts/dry-run-publish.mjs
  refused with exit 1; evidence retained; no network or publish command executed.
```

No package version, publish tag, product runtime, localization file, application, lockfile, canonical manifest, commit, tag, push, release, or remote service was changed.
