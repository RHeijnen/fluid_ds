# Production-readiness agent quick start, 27 August 2026

## 28 August final-hardening addendum

This addendum supersedes the dated current-state and count wording below.
All 59 stable critical-mode ledger rows are now covered by executable evidence
or an explicit API/manual-policy boundary. The canonical all-engine verify passes
on product HEAD `049a530` with 7,506 assertions (2,502 per engine), unchanged
coverage floors, all 18 builds, 1,904 isolated Node imports, 155 renders and
26,043 local documentation links. Exact-product-tree runs pass 657/657 broad
accessibility checks and 231/231 browser SSR/hydration checks. The website build
and three-engine visitor journeys pass 24 cases over 275 requests with zero
diagnostics; Dialog is 13,996 B against the unchanged 14,000 B ceiling.

Final-tree package verification passes 32/32 policies across 18 tarball installs
and 16 runtime plus 16 type roots; packed CEM passes 14/14; all seven pinned
framework consumers pass; packed request-time Next SSR passes; Storybook passes
102 selected interactions; and the offline `publish:dry` rehearsal records all
18 packages at `0.4.0` without network or publish commands. Human
visual/fluent-language/RTL/AT/device review,
deployed and remote release proof, governance decisions, two independent RCs and
owner sign-offs remain open. No maturity or release-readiness claim follows.
Nothing has been pushed, published, deployed or tagged; keep all work local for
the later squash.

## Read this first

- Work in `D:\dev\repos\fluid_ds` on the current `main` checkout.
- Preserve the dirty working tree. It contains the owner's final-hardening work
  on top of the local WIP checkpoints. Do not reset, restore, clean, stash or
  overwrite unrelated work.
- The latest product-code checkpoint is `049a530`; the reconciled handoff is the
  next local docs-only checkpoint. Nothing has been pushed.
- The owner has authorized another local checkpoint commit after the remaining
  gates and documentation reconciliation. Do not push, publish, deploy, tag or
  promote maturity. The local commits will be squashed later.
- Read the [detailed handoff](handoff-production-readiness-2026-08-27.md) and
  [production-readiness plan](plans/production-readiness-plan.md) before editing.

## Retained pre-final verified state

The exact synchronized Linux worktree has these passing results:

- the full three-engine unit/browser matrix: 2,501 assertions per engine,
  7,503 total across Chromium, Firefox and WebKit;
- fresh coverage for all 14 packages with every unchanged threshold passing;
  evidence: `quality/evidence/coverage/2026-08-27T19-42-51-163Z.json`;
- broad automated accessibility: 642/642, 214 per engine;
- stable-depth accessibility/interaction: 765/765, 255 per engine, with clean
  supervised teardown;
- 18/18 package builds and a fresh production Storybook build;
- 1,904 isolated cold Node imports and 155/155 element renders, including the
  latest slider and tabs SSR-shim guards;
- browser SSR/hydration: 231/231 across Chromium, Firefox and WebKit in
  approximately 6.5 minutes;
- seven packed framework consumer lanes, each replayed in Chromium, Firefox and
  WebKit: 21/21 runtime cases plus their install, typecheck and build checks;
- packed CEM: 14/14; packed-package policy: 32/32, with 18 tarballs installed
  and all 16 runtime and 16 type roots verified; supply-chain: 11/11;
- 136 documentation pages and 26,043 local link checks with zero failures;
- landing/docs visitor journeys: 24/24 across three engines;
- the accepted active inventory remains 1,009 PNGs; current replay differences
  are classified below and are not represented as byte-identical.

The authoritative exact-tree `FLUID_BROWSERS=all corepack pnpm@9.15.0 verify`
passed on `0879c8b` in 789 seconds. Its retained log is
`/tmp/fluid-verify-0879c8b-20260828.log` with SHA-256
`792e65305237cd332dd6a4e5a146145b590d192b6686bce345490c2e6b0de0ec`.

On clean HEAD `5ef233a`, the pinned framework profile and every explicit
serialized lane pass (400 seconds summed lane time; 493 seconds wall time).
`/tmp/framework-final-5ef233a-20260828.log` has SHA-256
`14741619b0ec10ccf8adf3df1c0469a5cbb00fa497b1c31503711b88681d5054`.
The exact `corepack pnpm@9.15.0 publish:dry` rehearsal also exited 0. Its
`quality/evidence/release-dry-run/2026-08-28T11-32-38-136Z/result.json`
records 18 packages at `0.4.0` and empty `failures`, `networkCommands` and
`publishCommands`. `/tmp/publish-dry-5ef233a-20260828-final.log` has SHA-256
`8f19b1b49fd43fbac5016642381edb0e8598668a170118f5159f9b932e8b9f1c`.
The four untracked visual-evidence files were temporarily preserved outside the
checkout and restored afterward; no baseline was accepted or changed.

## Work completed since the checkpoint

- Machine localization/RTL accounting is reconciled for 155/155 elements and
  12/12 surfaces. Official `nl`, `de`, `fr`, `es` and `ar` dictionaries plus
  `en-XA`/`ar-XB` pseudo-locales are exercised, including every parameterized
  core term.
- Calendar, kanban, QR and Markdown branch/function coverage gaps were closed
  without lowering thresholds or adding exclusions.
- The localization tests exposed and fixed pseudo-locale argument masking that
  broke formatter discriminants such as binary units.
- SSR now tolerates the restricted server shim for slider element creation and
  tabs child queries; the focused Node SSR gate is green.
- Scheduler validity focus now falls back to the first enabled day when today's
  last slot is already closed or past, instead of delegating focus to a
  navigation button. Its deterministic unit suite passes 68/68.
- The serial browser SSR configuration timeout is now 600 seconds for the grown
  231-case matrix; per-test and server timeouts are unchanged.
- `extract-zip@2.0.1` is locally patched and proven on Linux. It is a
  development-only transitive dependency of the Web Test Runner browser tooling,
  not a runtime dependency of `@fluid-ds/components` or `@fluid-ds/parser`.
- Core bundle budgets remain unchanged at Button 19,000 B, Dialog 14,000 B,
  Input 16,000 B and React Button 23,000 B. `9ae245e` restored them without a
  budget increase by moving disabled-fieldset preservation from universal
  `FluidElement` into an opt-in controller used by checkbox, number-input,
  range-slider, rating, slider, switch and textarea. The checkbox regression
  covers nested fieldset release, detached edits and reconnect reacquisition;
  the focused bundle-budget gate passes all four unchanged ceilings.
- `8defff0` makes visual setup deterministic without changing product Chart APIs:
  nine animated Chart fixtures stop their public Chart.js instance and update it
  with mode `none`; sparkline remains excluded because it already disables
  animation. Fixture selection passes 9/9 and the fail-closed lifecycle contract
  passes 42/42 across Chromium, Firefox and WebKit.
- AspectRatio, Lightbox and all seven Map stories now avoid network-dependent
  pixels, using deterministic inline assets where applicable and locally served
  Leaflet CSS.

## Remaining exact-tree sequence

1. Reconcile live readiness documents while preserving every red blocker, then
   rerun their focused documentation, lint, formatting and diff-integrity gates.
2. Stage only intended documentation changes, inspect the staged diff and create
   an owner-authorized local WIP checkpoint if requested. Do not push.
3. Preserve the green clean-tree framework and non-publishing rehearsal evidence;
   rerun only if later source, package artifacts or release inputs invalidate it.

React raw packing is repaired: exact internal development ranges produce 10/10
initial and 5/5 final byte-identical archives, and the newly packed consumer
passes install, typecheck, build and all-engine runtime. The separate packed Next
request-time production-server gate also passes locally; deployed adapters remain
outside that evidence.

## Release blockers that remain red

- The old visual history is 85/86 clean (1.163%), but its replacement window is
  machine-green under the attested Chromium raster policy
  `--num-raster-threads=1`: 50/50 exact full-catalog executions, each with 60
  candidate and 5 accepted-smoke captures, produced zero flaky executions and
  zero fresh-capture variance. All 60 visual candidates still need human approval.
  That window exercised only those 60 candidates and five accepted smoke images,
  not all 1,009 accepted PNGs. A partial normal run observed 18 accepted-baseline
  diffs before cancellation on a changing tree; treat 18 as partial, not final.
  Human review must separately reconcile stale Chart captures and accepted
  AspectRatio/Lightbox/Map pixels changed by the new hermetic story fixtures.
  Exact identifiers and counts are in
  [the compact final-status record](../apps/visual-regression/candidate-evidence/stability/2026-08-27-raster1-full-50/final-status.json).
- The retained 27 August live dependency audit is 0 critical / 1 high / 20
  moderate / 6 low with zero
  unaccepted high/critical paths. No publishable production/optional path is
  affected. The sole retained high is the 14-path, development-only
  `extract-zip` finding covered by the exact Linux-tested local patch.
  The normal release-gate suite does not query the live registry; refresh the
  audit after lock changes, at least weekly during hardening, and for every RC.
- Fluent-language review, visual RTL review, manual assistive-technology review
  and native Safari/mobile evidence remain open. The demonstrated Map retained-
  object defect is repaired (0/20 old Leaflet Maps; 5,664 B steady-state heap p95).
  Chart retains 0/20 old Chart.js instances but its 45,448 B positive heap p95,
  multi-date history and cross-engine performance evidence remain open.
- Governance/support/Figma boundaries, remote workflow and trusted-publishing
  proof, RC1/RC2, deployed/external validation and owner sign-offs remain open.

The dedicated container is `fluid-readiness-linux-20260826`. Its `/workspace`
is a copied snapshot; only `.git` is bind-mounted. Synchronize host changes
deliberately and compare the source/lock before trusting container output. The
authoritative lock hash is
`17ec483e01ecc1fc4cb109ecf076428b640fd62a3541842516277755e1a0eec0`.
