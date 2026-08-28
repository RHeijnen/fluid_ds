# Stable-candidate reconnect and recovery matrix, second cohort — 2026-08-27

## Outcome

A second dedicated browser cohort now covers `fluid-select`/`fluid-option`,
`fluid-dialog`, and `fluid-pagination`. The final matrix passed **9/9**
contracts across Chromium, Firefox, and Playwright WebKit. The focused product
suites passed **64/64 tests in each engine** with supervised runner cleanup.

This is representative critical-depth coverage. It is not exhaustive catalog
coverage, manual assistive-technology testing, native Safari/mobile
certification, or a maturity promotion.

## Executable contracts

`apps/ssr-tests/tests/stable-candidate-recovery-second.spec.ts` uses the
existing recovery fixture and verifies:

- Select starts with an authored selected value and matching FormData/ARIA,
  silently falls back when that option is removed, survives disabled and
  disconnect/reconnect transitions, recovers required validity through real
  pointer interaction, and emits exactly `['gamma', 'alpha']`.
- Dialog opens from its external trigger, honors an authored slotted
  `autofocus` target, closes with focus returned to the trigger, restores an
  already-open native dialog to the modal top layer after reconnect, and emits
  exactly `['show', 'hide', 'show', 'hide']` without reconnect duplicates.
- Pagination advances before and after reconnect, silently clamps page 10 to
  page 3 when its range shrinks, restores the current-page ARIA state and
  disabled next control, expands again, and emits exactly `[9, 10, 4]`.

Each case requires registered definitions, upgraded hosts, and shadow roots.
Page exceptions, console errors, unexpected warnings, failed requests, and
HTTP error responses fail the run.

## Reproduced defects and repairs

The initial run passed Pagination in every engine but failed Select in every
engine: removing the selected option left `value="beta"`, FormData, and
selection state stale. Select now remembers the prior option inventory and
falls back to the first enabled option only when a previously resolvable
selected option disappears. Initial explicitly unmatched authored values are
therefore preserved, and structural recovery emits no user-change event.

The initial Dialog run also showed that removing an open native dialog from the
document drops it from the modal top layer without clearing its native `open`
state. On reconnect, Dialog now clears only that stale native presentation
state and calls `showModal()` again without emitting another public show event.

Browser-native autofocus behavior for slotted dialog content was inconsistent:
WebKit could leave focus outside, while Firefox could choose the built-in close
control instead of the authored target. Dialog now explicitly gives an enabled
authored `[autofocus]` target precedence and otherwise retains a valid native
focus choice or focuses the close control. Native close still returns focus to
the external opener.

All red and green counts are retained in
`apps/ssr-tests/evidence/stable-candidate-recovery-second-2026-08-27.json`.

## Verification

- Recovery matrix: **9/9 passed** across Chromium, Firefox, and WebKit; the
  direct Vite preview used readiness polling and explicit shutdown.
- Select, Option, Dialog, and Pagination focused suites: **64/64 passed in each
  engine**, including causal guards and clean runner lifecycle.
- Components and SSR-test TypeScript: exit 0.
- Scoped ESLint, Prettier, JSON parsing, and `git diff --check`: exit 0.
- No localization, framework fixtures, visual baselines, workflows, security
  state, manifests, dependency state, budgets, plan/handoff files, or lockfiles
  were changed by this tranche.
