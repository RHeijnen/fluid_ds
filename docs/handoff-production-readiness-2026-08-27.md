# Detailed production-readiness handoff, 27 August 2026

## 28 August final-hardening addendum

This addendum supersedes the dated current-state and count wording below.
The fixed 59-row stable critical-mode ledger is fully covered by executable
recovery/interaction evidence or explicit API/manual-policy boundaries. The
authoritative `FLUID_BROWSERS=all corepack pnpm@9.15.0 verify` passes on product
HEAD `049a530`: 7,506 assertions (2,502 per engine), unchanged coverage floors,
all 18 builds, 1,904 isolated Node imports, 155 renders and 26,043 local links.
Exact-product-tree broad accessibility and browser SSR/hydration runs pass
657/657 and 231/231 respectively. The website build and three-engine visitor
journeys pass 24 cases over 275 requests with zero diagnostics. Dialog measures
13,996 B against its unchanged 14,000 B ceiling.

Package verification passes 32/32 policies across 18 tarball installs and 16
runtime plus 16 type roots; packed CEM passes 14/14; all seven pinned framework
consumers pass; packed request-time Next SSR passes; Storybook passes 102
selected interactions; and the offline `publish:dry` rehearsal records all 18
packages at `0.4.0` without network or publish commands. Visual acceptance,
fluent-language and visual RTL review, manual AT/native Safari/physical-device
evidence, deployed/remote release proof, governance decisions, owner sign-offs
and two independent frozen RCs remain human or external gates. No maturity,
section-completion or release-readiness claim is authorized. Nothing has been
pushed, published, deployed or tagged; local commits will be squashed later.

## Objective and authority

Continue the approved Fluid 1.0 production-readiness plan from the current
working tree. The owner wants the large TODO completed, not merely summarized.
Work can be parallelized in bounded areas.

Current authority and constraints:

- edit and test the current working tree;
- preserve all existing tracked and untracked owner work;
- create a local WIP checkpoint after the final gates and staged-diff review;
- do not push, publish, deploy, tag, sign off a section or promote maturity;
- the local WIP commits will be squashed later;
- do not reinterpret automated evidence as fluent-language, manual
  assistive-technology or release approval.

Repository state:

- checkout: `main`;
- latest committed checkpoint: `5ef233a docs: refresh production readiness handoff`;
- it includes `9ae245e` (unchanged bundle-budget restoration), `8defff0`
  (deterministic visual/story fixtures), and subsequent focused corrections;
- temporary lock experiments under `.codex-tmp/**` must not be staged;
- nothing has been pushed.

## Authoritative documents

Read in this order:

1. [Agent quick start](handoff-agent-quick-start-2026-08-27.md)
2. [Production-readiness plan](plans/production-readiness-plan.md)
3. [Current shared handoff](HANDOFF.md#current-state)
4. [Certification defect ledger](../quality/defects.md)
5. The dated evidence and reconciliation reviews linked by the plan

The plan and current handoff override historical prose. Preserve retained
failing evidence; never relabel an earlier failure as a pass.

## Current implementation state

### Localization and RTL

- The guarded owned-string inventory accounts for all 155 catalog elements and
  all 12 tracked surfaces.
- Core units, file-size, meter, calendar/date/time/preset flows, media,
  scheduling, editor, kanban, node graph, table, chart, map, Markdown, QR and
  parser diagnostic surfaces have machine-covered localization/RTL work.
- Official draft dictionaries cover `nl`, `de`, `fr`, `es` and `ar`;
  `en-XA` and `ar-XB` provide pseudo-locale coverage.
- Every parameterized core localization term is now invoked in tests. This
  exposed a real pseudo-locale bug: string arguments were masked before a
  formatter consumed semantic discriminants. The implementation now calls the
  formatter with real arguments and masks consumer strings in its result.
- Fluent-speaker approval, visual RTL review, manual assistive-technology review
  and native Safari/mobile validation remain human gates.

### SSR

- The guarded state-adoption inventory still covers 14/14 applicable elements,
  with eight explicit non-applicable boundaries.
- Native-ancestor `lang`/`dir` handling remains parser-correct and
  request-isolated.
- All 1,904 isolated built-JavaScript imports pass.
- All 155 catalog elements render in the Node SSR gate; 154 emit declarative
  shadow DOM.
- Slider now guards an SSR shim without `ownerDocument.createElement`; tabs
  treats a missing SSR-shim `querySelectorAll` as an empty child list.
- Node renderer-contract coverage remains 18 tests with 100% lines, branches and
  functions.
- The exact-tree all-engine browser SSR gate passes 231/231 across Chromium,
  Firefox and WebKit in approximately 6.5 minutes.
- The final regression fixed scheduler validity focus when today's last slot is
  already closed or past: a disabled roving day had delegated focus to a
  navigation button. Scheduler now falls back to the first enabled day and its
  deterministic unit suite passes 68/68.
- The serial matrix's global configuration timeout increased from 420 to 600
  seconds as the suite grew from 213 to 231 cases. Per-test and server timeouts
  are unchanged.

### Framework consumers and packaging

- Seven consumer lanes are implemented and use selected packed artifacts.
- Each lane passes install/typecheck/build checks and three-engine runtime replay:
  21/21 runtime cases in total.
- The selected-artifact replay is valid. Exact internal development ranges make
  raw React `pnpm pack` repeatable: 10/10 initial and 5/5 final archives are
  byte-identical, and the newly packed consumer passes install, typecheck, build
  and all-engine runtime.
- A separate packed Next production-server gate passes concurrent request
  isolation, cache semantics and the three-engine hydration contract; it does not
  certify a deployed ingress, CDN or hosting adapter.
- Packed CEM passes 14/14.
- Packed-package policy passes 32/32; all 18 package tarballs install and all 16
  runtime roots plus 16 type roots resolve.
- The supply-chain gate passes 11/11.

### Accessibility and interaction

- Broad automated accessibility passes 642/642: 214 in each of Chromium,
  Firefox and WebKit, in approximately 12 minutes.
- The deeper stable-scope accessibility/interaction matrix passes 765/765:
  255 per engine, with clean supervised teardown.
- These are automated browser checks, not manual AT approval or native
  Safari/mobile evidence.

### Coverage and focused fixes

Fresh all-package coverage passes every existing floor without exclusions or
threshold reductions. Evidence:
`quality/evidence/coverage/2026-08-27T19-42-51-163Z.json`.

- components: 1,902/1,902 focused Chromium assertions; 92.90% functions,
  96.69% statements/lines and 86.87% branches;
- calendar: 22/22; 100% functions and 85.47% branches;
- kanban: 20/20; 100% functions;
- QR: 23/23; 92.03% branches;
- Markdown: 13/13; 100% in all measured dimensions.

The focused additions cover locale callback execution, invalid calendar inputs,
all kanban move-label setters, rounded QR eye/module gaps and non-`Error`
Markdown fetch rejection.

### Performance and visual determinism

- Core bundle ceilings were not rebased: Button remains 19,000 B, Dialog 14,000
  B, Input 16,000 B and React Button 23,000 B. The budget file is unchanged from
  `00d0098` through the current tree, and the focused bundle-budget gate passes.
- `9ae245e` removes disabled-fieldset preservation from universal `FluidElement`
  and installs an opt-in `FormDisabledController` only on checkbox, number-input,
  range-slider, rating, slider, switch and textarea. The nested-fieldset checkbox
  regression proves disconnect release, detached authored edits, reconnect
  reacquisition and restoration only after every owner releases.
- The nine animated FluidChart-based visual fixtures now require a live public
  Chart.js instance, call `stop()` and `update("none")`, and await the host update.
  Sparkline is excluded because it already has `animation: false`. Selection
  passes 9/9, visual TypeScript passes, generation reports 513 stories for 155
  elements, and the lifecycle contracts pass 42/42 across three engines.
- AspectRatio uses a deterministic inline 800×300 SVG; Lightbox uses seven
  distinct inline 200×200 SVGs; all seven Map stories avoid network-dependent
  assets through inline tiles/pins where applicable, local Leaflet CSS and
  non-network attribution. Their focused fixture/story
  coverage is 12 tests. No product endpoint, accepted PNG or baseline policy was
  changed.

## Retained pre-final verification inventory

The following package breakdown is the retained pre-final snapshot. The current
aggregate is the 7,506-assertion result recorded in the addendum above.

| Package    | Per engine |
| ---------- | ---------: |
| Components |      1,904 |
| Animations |         61 |
| Calendar   |         22 |
| Charts     |         43 |
| Editor     |         50 |
| Kanban     |         20 |
| Map        |         34 |
| Markdown   |         13 |
| Media      |         61 |
| Node graph |         33 |
| Parser     |        119 |
| QR         |         23 |
| Scheduler  |         68 |
| Table      |         50 |
| **Total**  |  **2,501** |

Other distinct verification processes should be reported separately instead of
folded into a misleading grand total:

| Gate                             | Current result                                 |
| -------------------------------- | ---------------------------------------------- |
| Three-engine unit/browser matrix | 7,503, all passing                             |
| Broad automated accessibility    | 642/642                                        |
| Stable-depth a11y/interaction    | 765/765                                        |
| Framework runtime                | 21/21 across seven lanes and three engines     |
| Landing/docs visitor journeys    | 24/24                                          |
| Node SSR cold imports            | 1,904                                          |
| Node SSR catalog renders         | 155/155                                        |
| Node renderer-contract tests     | 18                                             |
| Browser SSR/hydration            | 231/231                                        |
| Visual accepted inventory        | 1,009 PNGs; current differences need review    |
| Documentation                    | 136 pages; 26,043 local links, zero failures   |
| Package builds                   | 18/18                                          |
| Storybook production build       | Passing                                        |
| Packed CEM                       | 14/14                                          |
| Packed-package policy            | 32/32; 18 installs; 16 runtime + 16 type roots |
| Supply-chain                     | 11/11                                          |

Coverage reruns the Chromium package suites and is not an additional set of
unique tests. Release, package, framework, lifecycle, documentation and policy
guards contain hundreds of further assertions; retain their named gate results
instead of adding them to the browser-test total.

The preceding complete `FLUID_BROWSERS=all pnpm verify` passed before the final
localization and focused coverage changes. Its gate groups included:

- 35/35 runnable release/security guards plus two intentional opt-in skips;
- 32/32 package-artifact guards;
- 7/7 framework-isolation and 31/31 framework guard tests;
- browser selection 10/10, process ownership 11/11, policy 6/6 and lifecycle
  41/41 runnable plus one platform skip;
- all 18 builds, 1,903 cold imports, 155 renders and the documentation gate.

The authoritative exact-tree `FLUID_BROWSERS=all corepack pnpm@9.15.0 verify`
passed on `0879c8b` in 789 seconds. The retained log
`/tmp/fluid-verify-0879c8b-20260828.log` has SHA-256
`792e65305237cd332dd6a4e5a146145b590d192b6686bce345490c2e6b0de0ec`.

The final clean-HEAD framework confirmation ran on `5ef233a`: the pinned profile
and every explicit serialized lane pass, with 400 seconds summed lane time and
493 seconds wall time. `/tmp/framework-final-5ef233a-20260828.log` has SHA-256
`14741619b0ec10ccf8adf3df1c0469a5cbb00fa497b1c31503711b88681d5054`.
The exact `corepack pnpm@9.15.0 publish:dry` rehearsal then exited 0. Evidence
`quality/evidence/release-dry-run/2026-08-28T11-32-38-136Z/result.json` records
18 packages at version `0.4.0`, with `failures: []`, `networkCommands: []` and
`publishCommands: []`. `/tmp/publish-dry-5ef233a-20260828-final.log` has SHA-256
`8f19b1b49fd43fbac5016642381edb0e8598668a170118f5159f9b932e8b9f1c`.
Four untracked visual-evidence files were temporarily preserved outside the
checkout to meet the clean-tree precondition and restored afterward.

## Dependency and package boundaries

The authoritative lock hash is
`17ec483e01ecc1fc4cb109ecf076428b640fd62a3541842516277755e1a0eec0`.

- Retained 27 August live audit: 0 critical / 1 high / 20 moderate / 6 low.
- There are zero unaccepted high/critical paths, so the dependency-risk gate
  passes.
- Zero publishable production/optional dependency paths are affected.
- Linux proof credits exactly 14 registry paths for the local
  `extract-zip@2.0.1` patch.
- The ordinary release-gate suite checks policy, dependency floors and the exact
  proof/lock binding without a live registry call. Refresh the live audit after
  every dependency/lock change, at least weekly during hardening, and for every
  release candidate so newly published advisories cannot age invisibly.
- `extract-zip` is only a development transitive dependency:
  `@web/test-runner -> @web/test-runner-chrome -> puppeteer-core ->`
  `@puppeteer/browsers -> extract-zip`. It extracts downloaded browser archives
  on developer/CI machines.
- Parser's spreadsheet runtime is `xlsx`, dynamically imported only for
  `.xlsx`, `.xls` and `.xlsm`; CSV, TSV and JSON do not load it.
- `@fluid-ds/components` has five direct runtime dependencies:
  `@lit-labs/ssr`, `@lit-labs/ssr-client`, `@fluid-ds/icons`,
  `@fluid-ds/tokens` and `parse5`, with `lit` as a peer. It has no runtime
  path to `extract-zip` or `xlsx`.

## Remaining release blockers

- The old visual history remains red at 85/86 clean runs (1.163%), but the
  replacement full-catalog machine gate is green under the fail-closed,
  process-attested Chromium policy `--num-raster-threads=1`. It completed 50/50
  exact executions, with 60 candidates and 5 accepted-smoke captures per run,
  zero flaky executions and zero fresh-capture variance. All 60 candidates still
  need human approval. The window covered the candidates plus five accepted
  smoke images, not the complete 1,009-image accepted set. A partial normal run
  later observed 18 accepted-baseline diffs before cancellation on a changing
  tree, so that count is not exhaustive. Human review must reconcile three
  provenance groups: the 60 missing candidates; stale Chart baselines (including
  a mid-animation doughnut and pre-HTML-legend captures); and accepted
  AspectRatio/Lightbox/Map pixels changed by hermetic story assets. No snapshot
  was automatically accepted.
  See the [final-status record](../apps/visual-regression/candidate-evidence/stability/2026-08-27-raster1-full-50/final-status.json)
  for source/lock/policy identifiers and exact counts; the bounded
  one-pixel policy correction is recorded beside it in the validation evidence.
- The dependency security gate passes with no affected publishable
  production/optional paths; the sole raw high remains locally patched as above.
- The Map retained-object defect is closed by retained-root evidence: Leaflet's
  omitted viewport scroll listener is cleared after teardown, old Map instances
  fall from 20/20 to 0/20 and steady-state heap p95 falls from 154,956 B to
  5,664 B. Chart retains 0/20 old Chart.js instances but still records a 45,448 B
  positive heap p95. Multi-date, uncontended and cross-engine performance history
  remains open; this is not a broad leak-freedom claim.
- Fluent-language, visual RTL, manual AT, native Safari and real mobile device
  review remain open.
- Governance/support/Figma boundary decisions, remote workflow evidence,
  trusted publishing, RC1/RC2, deployed/external validation and owner sign-offs
  remain open.

No release-readiness claim, section completion, stable promotion or final
competitor-review grade is authorized.

## Required continuation sequence

1. Reconcile the live plan, defect ledger, feature claims and remaining-readiness
   review without erasing red evidence.
2. Rerun `FLUID_BROWSERS=all pnpm verify` on the final source.
3. Run `pnpm check:docs`, `pnpm lint`, `pnpm format:check` and
   `git diff --check` after documentation changes.
4. Confirm no residual browser processes or listening test ports.
5. Stage intended files with `git add -A -- . ':(exclude).codex-tmp/**'`, inspect
   status and the cached diff, then create the authorized local WIP commit. Do
   not push.
6. Preserve the passing clean-tree framework and `publish:dry` evidence above.
   Rerun it only if later source, artifacts or release inputs invalidate it.

## Container workflow

Use the dedicated `fluid-readiness-linux-20260826` container. Its
`/workspace` is copied, not live-mounted; only `.git` is bind-mounted.
Therefore synchronize intended host changes explicitly, compare source and lock
state before trusting evidence and copy back only intended generated artifacts.
Do not touch unrelated project containers or run conflicting full browser
matrices concurrently.

Use `FLUID_BROWSERS=all` explicitly for the production matrix. The canonical
final command is:

```text
FLUID_BROWSERS=all pnpm verify
```

## Stop conditions

Stop and request authority before a breaking public API decision, dependency
addition, maturity promotion, publication, deployment, destructive git action
or push. Translation approval, manual AT, visual acceptance and owner sign-off
remain human decisions. A local WIP checkpoint is already authorized after the
required verification and staged-diff review.
