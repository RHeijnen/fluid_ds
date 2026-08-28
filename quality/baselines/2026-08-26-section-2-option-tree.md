# Section 2: option and tree-item interaction depth

Date: 2026-08-26. Partial implementation, not production certification or owner
sign-off. Work remains on the existing branch without commits or promotions.

## What the gaps mean

A gap is an applicable element without a verified, explicitly attributed
representative interaction contract. It is not necessarily an absent component,
absent unit test, or known runtime defect. A parent story exercising one action
does not automatically cover all its children. For example, the existing tree
story checked expansion but never exercised the recursive selection path.

The inventory stays at 155 elements, of which 103 require interaction contracts.
The remaining 52 are classified as presentational or helpers, not silently
removed from the catalog denominator. Closing these two contracts yields
**71/103 (68.9%)**, **71/155 (45.8%)**, and **32 applicable gaps**. The minimum
source-attribution floor is raised to 71 only after built execution passes.
Neither that floor nor a zero machine-blocker count is production sign-off.

## Implemented and exercised

- `fluid-option`: disabled-first opening, arrow navigation, selected/active
  distinction, pointer selection, disabled non-activation, Escape without a
  value change, form submission value, and exact public-event sequence.
- `fluid-tree-item`: branch expansion, visible-item navigation, disabled
  non-activation, independent focus/selection, pointer/Enter/Space selection,
  typeahead, role/level/leaf semantics, and bubbling event identity/count.
- Fixed recursive tree event dispatch, stale rapid selection, broken native
  Tab entry and nested re-entry, focus after collapse, disabled activation,
  and reconnect child routing. Added and cleaned up tree mutation observation
  and typeahead timers. No new visual styling or contrast claims are made.
- Fixed select opening/hover activating disabled options. Its active-option
  reference now uses `ariaActiveDescendantElement`: an IDREF from a shadow
  button did not resolve its slotted light-DOM option. The core and native
  tests verify the resolved element and clearing it when closed.
- Added nine core regressions and three native Playwright cases; updated tree
  and select documentation. The repository accessibility skill guided native
  focus and accessible-state checks, including a failing native Tab case that
  synthetic key dispatch did not reveal.

The [APG tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) states:
“End nodes do not have the aria-expanded attribute”. The corrected leaf semantics
follow that contract. [MDN documents element reflection](https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaActiveDescendantElement)
and its clearing of the corresponding attribute. The new select implementation
requires that API; cross-browser/assistive-technology certification is still open.

## Execution evidence

Raw paths are under ignored `quality/evidence/`.

| Gate                               | Result                                                                                                        | Evidence directory                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Final built Storybook interactions | 71 passed, 125 non-contract cases excluded by tag, zero retry messages                                        | `2026-08-26T11-33-00-611Z-section2-option-tree-stories-final` |
| Final Chromium browser suite       | 169 passed: 155 catalog audits, six guards, eight native keyboard cases; nine generator tests pass in pretest | `2026-08-26T11-32-47-990Z-section2-option-tree-a11y-final`    |
| Targeted core regressions          | 34 tree/select tests passed after the active-reference fix                                                    | Terminal execution before the final built runs                |

The two final recorded browser runs have unchanged source fingerprints. No
assertions, console errors, or axe rules were suppressed, and no retries were
enabled in the a11y suite. The full workspace verification result is recorded
separately below; these local results do not imply hosted CI success.

Failed evidence is retained, not overwritten:

- `2026-08-26T11-21-05-007Z-section2-option-tree-red`: diagnostic runner did not
  terminate while exercising the old recursive selection path; stopped it and
  its child processes. This is a failed diagnostic, not a passing assertion run.
- `2026-08-26T11-26-04-623Z-section2-option-tree-native`: native Tab entry failed;
  the failed trace/report are archived with the run.
- `2026-08-26T11-28-05-983Z-section2-option-tree-a11y`: 168 passed, one failed.
  Its retained trace identifies a Google Fonts CSS timeout. Source also changed
  during this diagnostic run. CERT-017 remains open for deterministic assets.
- `2026-08-26T11-28-20-003Z-section2-option-tree-interactions-final`: despite the
  filename, this attempt failed initial iframe loading in one suite. It is not
  the final passing interaction evidence.
- `2026-08-26T11-27-48-254Z-section2-option-tree-verify`: full verification stopped
  at lint because the local pnpm patch extraction was being linted as authored
  source. Added an exact ESLint ignore for the already-gitignored extraction
  directory, not for component code or tests.

## Remaining work

Full workspace verification passed:
`2026-08-26T11-32-01-865Z-section2-option-tree-verify-final`. It includes all
workspace typechecks, lint, source/quality/scope/token gates, all 14 package test
suites (1,519 tests, including 1,144 core tests), 18 package builds, the Node SSR
gate, and the 136-page documentation build. It does not include browser hydration
or human AT certification. Source fingerprints changed during this larger run
because generated manifests and readiness notes were updated, so it is local
implementation evidence, not an immutable release-candidate run. Existing docs
chunk-size/highlighter/404 warnings and nested-pnpm warnings remain visible.

The 32 remaining representative gaps consist of nine chart elements, four child
elements (dropdown-item, list-item, nav-item, step), eleven complex data/editing
components, five navigation/layout utilities, and three media components. The
exact list is generated in `quality/component-quality.json`.

Next: remove external font-network dependence (CERT-017), then continue the
remaining child contracts and complex flows. Deeper state/lifecycle coverage,
visual baseline review, browser/AT matrices, SSR/localization, framework,
benchmarking, and later section requirements remain open. No section completion
box is checked by these representative coverage numbers.
