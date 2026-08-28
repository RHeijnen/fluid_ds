# Fluid DS 0.4.0 verification and test inventory

This document is the evidence-backed source for engineering and marketing test
claims. It deliberately separates unique test assertions from repeated browser
executions, audits, import probes, rendered fixtures and link checks. Those
populations answer different questions and must not be added into a single
"number of tests" total.

## Snapshot and headline

- Product commit: `d2d0ee8e4e8a321d4059f9929d5bc96931037343`
  (`0.4 hardening`).
- Scope: 155 public custom elements across 14 component packages; 18 packages
  are built and package-checked by the release workflow.
- Browser unit/interaction suite: **2,719 assertions in 146 test files per
  engine**.
- Cross-browser execution: **8,157 passing assertion executions** across
  Chromium, Firefox and WebKit (2,719 × 3). This is not 8,157 unique tests.
- Fresh measured runtime-source coverage: **96.48% statements, 96.48% lines,
  93.75% functions and 86.45% branches**, with zero inventory failures.
- Every one of the 155 public elements has a unit-test source, an accessibility
  audit source, a Storybook story, a visual-regression fixture and an SSR render
  fixture in the generated quality inventory.

CI status caveat: the first GitHub Node 24 `verify` run for `d2d0ee8` was red.
It failed in the unit-matrix runner guard before any component matrix task
started because the runner assumed Node supplied `corepack`, even though the
workflow had already installed exact pnpm. The uncommitted follow-up validates
the active pnpm as 9.15.0 and invokes it directly. Its focused native-runner
guard passes 11/11 on Windows and Linux, but the fix still needs a commit, push
and GitHub confirmation. Until then, use the measured results below as local
exact-tree evidence, not as a claim that every remote CI lane is green.

The fresh coverage run was executed in the pinned Linux verification container
on 2026-08-28 against the exact commit above:

```text
corepack pnpm@9.15.0 test:coverage
14 packages passed; coverage inventory failures: 0
```

## Browser assertion inventory

These are executable Web Test Runner/Mocha assertions. The same 2,719-assertion
suite is run independently in each browser by the authoritative matrix.

| Package                | Test files | Assertions per engine | Three-engine executions |
| ---------------------- | ---------: | --------------------: | ----------------------: |
| `@fluid-ds/components` |        109 |                 2,122 |                   6,366 |
| `@fluid-ds/animations` |          4 |                    61 |                     183 |
| `@fluid-ds/charts`     |          1 |                    43 |                     129 |
| `@fluid-ds/scheduler`  |          4 |                    68 |                     204 |
| `@fluid-ds/media`      |          8 |                    61 |                     183 |
| `@fluid-ds/table`      |          2 |                    50 |                     150 |
| `@fluid-ds/calendar`   |          1 |                    22 |                      66 |
| `@fluid-ds/editor`     |          1 |                    50 |                     150 |
| `@fluid-ds/kanban`     |          1 |                    20 |                      60 |
| `@fluid-ds/map`        |          4 |                    34 |                     102 |
| `@fluid-ds/node-graph` |          1 |                    33 |                      99 |
| `@fluid-ds/qr`         |          1 |                    23 |                      69 |
| `@fluid-ds/parser`     |          8 |                   119 |                     357 |
| `@fluid-ds/markdown`   |          1 |                    13 |                      39 |
| **Total**              |    **146** |             **2,719** |               **8,157** |

The assertions span component rendering and state, public properties and events,
form participation and validation, keyboard/focus behavior, dynamic recovery,
localization/RTL contracts, accessibility regressions, SSR-client behavior,
offline fixtures and component-specific interactions. They are broader than
pure function-level unit tests, so "browser unit and interaction assertions" is
the most accurate short label.

## Fresh source coverage

Coverage is weighted from the underlying covered/total counters, not averaged
from package percentages. It measures browser-loaded runtime source and checks
that required runtime files cannot silently disappear from the denominator.

| Metric     | Covered / measured |  Aggregate |
| ---------- | -----------------: | ---------: |
| Statements |    52,959 / 54,890 | **96.48%** |
| Lines      |    52,959 / 54,890 | **96.48%** |
| Functions  |      2,565 / 2,736 | **93.75%** |
| Branches   |      7,540 / 8,722 | **86.45%** |

| Package    | Statements / lines | Functions | Branches |
| ---------- | -----------------: | --------: | -------: |
| animations |             84.41% |    87.64% |   74.62% |
| calendar   |             97.90% |   100.00% |   85.47% |
| charts     |             98.15% |    97.29% |   82.97% |
| components |             97.05% |    94.03% |   87.23% |
| editor     |            100.00% |   100.00% |   98.07% |
| kanban     |             97.07% |   100.00% |   76.63% |
| map        |            100.00% |   100.00% |   94.62% |
| markdown   |            100.00% |   100.00% |  100.00% |
| media      |             95.91% |    82.14% |   89.94% |
| node graph |             90.89% |    90.90% |   72.25% |
| parser     |             98.28% |    98.07% |   89.33% |
| QR         |             99.30% |    95.65% |   92.03% |
| scheduler  |             97.02% |    93.65% |   87.46% |
| table      |             96.41% |    94.50% |   84.66% |

The enforced package floors are recorded in
[`../quality/coverage-thresholds.json`](../quality/coverage-thresholds.json).
Registration-only entries and the Node-only streaming renderer are disclosed as
separate execution domains in
[`../quality/coverage-boundaries.json`](../quality/coverage-boundaries.json);
they are not falsely counted as browser-covered code. The built Node SSR wrapper
has a separate 100% line/function/branch gate.

## Other verification categories

These counts overlap with the browser suite or measure a different artifact.
Keep them separate in public copy.

| Category                             |          Current passing evidence | What it proves                                                                                                    |
| ------------------------------------ | --------------------------------: | ----------------------------------------------------------------------------------------------------------------- |
| Broad automated accessibility        |          657/657 (219 per engine) | Current catalog and regression accessibility cases across Chromium, Firefox and WebKit                            |
| Retained deeper accessibility matrix |          765/765 (255 per engine) | A deeper stable-candidate run; overlaps the broad suite and is not additive                                       |
| Catalog axe audits                   |              465 (155 per engine) | One automated audit for every public element in every engine; contained within accessibility evidence             |
| Storybook interactions               |     102/102 applicable components | Executed `play` contracts for all 39 interactive and 63 composite elements; 65.8% of the full 155-element catalog |
| Browser SSR/hydration                |           231/231 (77 per engine) | Client hydration, form state and SSR recovery across all three engines                                            |
| Node SSR cold imports                |                       1,904/1,904 | Isolated built-JavaScript export/import safety checks                                                             |
| Node catalog renders                 |                           155/155 | Every public element renders on the server; 154 produce declarative-shadow-DOM output                             |
| Website visitor journeys             |              24/24 (8 per engine) | Landing/docs journeys across three engines, covering 275 requests with zero browser diagnostics                   |
| Package artifact policy              |                             32/32 | All 18 real tarball installs plus 16 runtime and 16 type roots satisfy policy checks                              |
| Packed custom-elements manifests     |                             14/14 | Published CEM contents for every component package                                                                |
| Framework consumers                  |                                 7 | Pinned React, Astro, Next, SvelteKit, Vue, Angular and vanilla consumers install, typecheck and build             |
| Package builds                       |                             18/18 | All publishable/workspace package builds complete                                                                 |
| Documentation                        | 136 pages; 26,043 links/fragments | Generated docs build and local link/fragment integrity; links are checks, not tests                               |
| Stable critical-mode ledger          |                        59/59 rows | Each row has executable recovery/interaction evidence or an explicit API/manual-policy boundary                   |

The Storybook count does not mean only 102 elements have stories. All 155 do.
The 102 are the elements classified as interactive or composite and therefore
required to have executed interaction contracts. The remaining 53 are 29
presentational and 24 helper elements. A separate final Storybook lane executed
the 102 selected interactions; 125 intentionally untagged stories were skipped
by that lane and must not be described as failed tests.

## Tracked PNG footprint

The repository currently tracks **1,214 PNG files totaling 20,961,775 bytes
(19.99 MiB)**. Almost all are visual-regression assets rather than ordinary unit
test output.

| PNG group                        | Files | Approximate size | Current role                                                |
| -------------------------------- | ----: | ---------------: | ----------------------------------------------------------- |
| Catalog visual baselines         | 1,009 |        18.02 MiB | Expected images for the catalog visual-regression suite     |
| Focused component baselines      |   142 |         1.20 MiB | Smaller legacy/focused Playwright screenshot expectations   |
| Candidate and stability evidence |    62 |         0.70 MiB | Retained review candidates/evidence, not accepted baselines |
| Landing social image             |     1 |         0.07 MiB | Product asset, not test data                                |

The accepted baseline set is needed wherever visual regression must work from a
clean clone. Generated actual/diff output should remain ignored and be uploaded
as CI artifacts. Candidate/stability evidence is the best cleanup or artifact-
migration target after its review references are mapped; deleting it now would
remove retained review evidence. Moving accepted baselines to Git LFS is an
option if binary churn becomes expensive, but at roughly 20 MiB it adds workflow
and contributor complexity that should be weighed against the current saving.
Deleting PNGs in a new commit also does not remove their bytes from Git history;
history rewriting is a separate, disruptive operation.

## Marketing-safe wording

Recommended concise claim:

> Fluid DS 0.4.0 includes 2,719 browser-based unit and interaction assertions,
> run across Chromium, Firefox and WebKit for 8,157 passing cross-browser test
> executions. Fresh measured runtime-source coverage is 96.48% for lines and
> statements, 93.75% for functions and 86.45% for branches. All 155 public web
> components have automated unit, accessibility, Storybook, visual-fixture and
> SSR coverage.

Longer copy may additionally state the 657 current accessibility cases, 231
browser SSR/hydration cases, 102 applicable Storybook interaction contracts,
1,904 isolated Node import probes and 155 server renders, provided each is named
as its own category.

Avoid these claims:

- Do not say "8,157 unique tests"; there are 2,719 assertions repeated across
  three engines.
- Do not add 26,043 documentation links, 1,904 import probes, 155 renders and
  browser assertions into a single giant test total.
- Do not claim WCAG certification from automated accessibility tests. Manual
  NVDA, VoiceOver/native Safari, physical iOS/touch and human visual/keyboard
  review remain separate approval boundaries.
- Do not claim every Storybook story has a play test. The applicable-component
  interaction contract is 102/102; all 155 elements have stories.
- Do not present visual-fixture presence as owner visual approval. The owner has
  approved 28/155 components in the sequential review ledger.
- Do not describe registry/package entry points excluded from browser coverage as
  covered lines. Their separate SSR/package gates should be named instead.

## Sources of truth

- [`../quality/component-quality.json`](../quality/component-quality.json):
  generated 155-element coverage and interaction inventory.
- [`../quality/coverage-thresholds.json`](../quality/coverage-thresholds.json):
  enforced per-package coverage floors.
- [`../quality/coverage-boundaries.json`](../quality/coverage-boundaries.json):
  disclosed non-browser execution boundaries.
- [`reviews/component-visual-audit-0.4.0.md`](reviews/component-visual-audit-0.4.0.md):
  owner visual-review status.
- [`handoff-production-readiness-2026-08-27.md`](handoff-production-readiness-2026-08-27.md):
  detailed release-gate evidence and limitations.
- [`plans/production-readiness-plan.md`](plans/production-readiness-plan.md):
  full gate history and remaining human/external approvals.

Regenerate counts after adding or removing tests, components or packages. For a
release claim, record the exact Git commit, toolchain and browser matrix rather
than silently carrying these 0.4.0 figures forward.
