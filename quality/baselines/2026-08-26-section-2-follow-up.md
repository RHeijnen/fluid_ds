# Section 2 follow-up: runner stability and child keyboard behavior

Date: 2026-08-26. Partial implementation, not section sign-off or release approval.
All changes remain uncommitted on the existing branch; maturity labels are unchanged.

## Changes and findings

- Fixed the installed Storybook runner's missing view-mode substitution and
  premature completion on `storyRendered`. The versioned pnpm patch waits for
  `storyFinished` and rejects error completion. The missing substitution alone
  did not eliminate reloads. See `patches/README.md` for the diagnosis and removal
  criteria. CI now runs a dedicated runner regression before the tagged suite.
- Added explicitly attributed `fluid-menu-item`, `fluid-segment`, and `fluid-tab`
  contracts for keyboard/pointer behavior, disabled states, focus, ARIA, and
  exact public-event sequences. The installed user-event misroutes host-focused
  keyboard input through empty shadow-root focus; these stories assert the
  focused host before key dispatch. Five native Playwright cases independently
  verify browser keyboard routing, instead of treating synthetic keys as proof.
- Fixed manual tabs navigating from selection instead of focus, stale roving
  tab stops, activation inside consumer shadow roots, interception of panel-input
  arrow keys, and missing default Tab access to text-only panels. Explicit
  consumer panel tabindex values remain respected.
- Fixed menu navigation starting from hover state rather than actual focus, and
  consumed activation Space contaminating subsequent typeahead. Added six core
  regressions across tabs and menus.
- Corrected tab keyboard documentation. Raised the ineffective-fixture setup
  test's 100 ms timeout to 1,000 ms so a genuine click can finish before the
  expected absent-host failure; the exact negative assertion remains intact.

Repository component-authoring and accessibility guidance informed the native
focus, caret, event, and disabled-state checks. No axe rules were disabled.

## Verified execution

Evidence paths below are under the ignored `quality/evidence/` directory.

| Gate                                      | Result                                                                                                                              | Evidence directory                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Tagged built Storybook contracts          | 69 passed; zero retry messages; 125 non-contract cases excluded by tag                                                              | `2026-08-26T11-13-12-016Z-section2-interactions-verified` |
| Native browser accessibility suite        | 166 passed: 155 catalog audits, six fixture guards, five keyboard regressions; zero retries; nine generator tests passed in pretest | `2026-08-26T11-13-23-964Z-section2-a11y-verified`         |
| Core browser unit suite                   | 1,135 passed in 107 files                                                                                                           | `2026-08-26T11-12-30-984Z-section2-core-unit-final`       |
| Runner regression without automatic retry | Four consecutive stories, zero document navigations, intentional play failure rejected                                              | `2026-08-26T11-15-40-609Z-section2-runner-final`          |
| Documentation build                       | 136 pages built successfully, including the corrected tabs guide                                                                    | `2026-08-26T11-14-14-585Z-section2-docs-build`            |

These five runs have unchanged source fingerprints. The a11y HTML report and
test-results directory are archived beside its log. Environment: Windows,
Node 22.22.2, declared pnpm 9.15.0, Chromium 148.0.7778.96. Nested pnpm invocations
emit a configuration warning on this machine; the frozen Corepack install and
installed-runner regression passed. No dependency installation or Storybook
rebuild ran during the final browser runs.

Core and Storybook builds, the three affected application/package typechecks,
targeted ESLint, and the generated quality/scope gates also passed. Existing docs
build warnings about chunk size, unsupported `cshtml` highlighting, and a missing
404 content entry remain; build success does not close those separate issues.
These remain local implementation checks, not
an immutable release-candidate certification run or proof of hosted CI success.

## Failed attempts retained

- `2026-08-26T11-03-47-095Z-section2-child-interactions`: failed new keyboard
  scenarios before the simulator-routing diagnosis and menu focus correction.
- `2026-08-26T11-09-41-708Z-section2-child-interactions-final`: despite its early
  name, failed one menu contract and is not final passing evidence.
- `2026-08-26T11-03-55-447Z-section2-tabs-browser-a11y`: first exposed the panel
  tab-stop defect. This diagnostic run also overlapped dependency/artifact
  changes and another browser run, producing invalid execution/report collisions
  and timeouts. It is retained as failed, not accepted as certification evidence.

The runner's retry mechanism was not disabled. Genuine failing-story teardown
can still trigger its retry path. The fixed defect is the systematic reload of
otherwise passing consecutive stories; the passing final suite logs none.

## Remaining scope

Representative interaction coverage is **69/103 applicable elements (67.0%)**,
or **69/155 catalog elements (44.5%)**, leaving **34 applicable gaps**. Only three
new child elements gain credit in this slice. The source-attribution floor is
69; a source count alone is not execution proof or exhaustive behavior coverage.

CERT-011 is fixed locally for the diagnosed runner defect. CERT-001 remains
open. Continue option and tree-item contracts, then the remaining complex flows
and stable-cohort lifecycle/error cases. Section 2 exit boxes remain unchecked.
Cross-browser, manual assistive technology, localization, SSR/framework,
benchmarking, and visual-baseline review remain in their approved sections.
