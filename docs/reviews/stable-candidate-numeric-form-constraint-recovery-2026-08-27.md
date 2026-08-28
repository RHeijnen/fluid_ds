# Stable-candidate numeric form and constraint recovery — 2026-08-27

## Disposition

This sixth bounded follow-up covers two high-risk form-associated rows from the
59-element stable-candidate critical-mode ledger:

- `fluid-rating`: dynamic maximum adoption across value, accessibility state,
  and FormData plus disabled-owner focus/state recovery;
- `fluid-number-input`: authored disabled-state preservation through native
  fieldset ownership.

The implementation and three causal source tests are present and static
validation is green. Authoritative browser validation is **pending** because the
shared Linux browser container is reserved by the retained 50-run visual-history
window. Neither row receives an additional depth marker from this tranche until
that execution is complete.

## Reproduced gaps and causal changes

Reducing a rating's `max` below its current value previously left
`aria-valuenow` and the submitted form value above `aria-valuemax`. The rating
now clamps its live value to current maximum/precision constraints during the
same update, synchronizes FormData and ARIA, and remains event-silent because a
constraint mutation is structural rather than user input.

Rating and number input also assigned fieldset-owned disabled state directly to
their public `disabled` property. Re-enabling the fieldset erased an authored
disabled state. Each control now records authored state on entry to owner
disablement and restores it exactly on exit. Rating additionally removes itself
from the tab order and releases focus when it becomes disabled or read-only,
matching native disabled-control focus behavior.

The focused files contain **14 source-attributed number-input tests** and **20
source-attributed rating tests**. Rating's locale and explicit-name matrices
expand those sources to 27 runtime cases, so the combined retained browser
denominator is 41 cases per engine. The three new tests assert public `value`,
`max`, `disabled`, `tabIndex`, focus, ARIA value state, native disabled state,
FormData, and event silence. They do not inspect private fields.

## Completed static validation

The following checks pass on the host current tree:

```text
node_modules/.bin/tsc.cmd -p packages/components/tsconfig.json --noEmit
node_modules/.bin/eslint.cmd <the four focused numeric runtime/test files>
node_modules/.bin/prettier.cmd --check <the four focused numeric runtime/test files>
git diff --check -- packages/components/src/components/{number-input,rating}
```

## Required retained browser execution

After the visual-history owner explicitly releases the shared Linux container,
sync the final current tree and lockfile into that container, complete the frozen
offline install, and run from `/workspace/packages/components`:

```sh
FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs \
  --config web-test-runner.config.js \
  --files "src/components/{number-input,rating}/*.test.ts"
```

Expected denominator: **41/41 in Chromium, 41/41 in Firefox, and 41/41 in
WebKit** (123 executions), normal exit 0, with a retained supervised lifecycle
record and matching host/container hashes for the four focused runtime/test
files and final root lockfile. If execution fails, this review and ledger must
retain the failure rather than promoting depth.

## Files in this tranche

- `packages/components/src/components/number-input/fluid-number-input.ts`
- `packages/components/src/components/number-input/fluid-number-input.test.ts`
- `packages/components/src/components/rating/fluid-rating.ts`
- `packages/components/src/components/rating/fluid-rating.test.ts`
- `docs/reviews/stable-candidate-critical-mode-ledger-2026-08-27.md`
- `docs/reviews/stable-candidate-numeric-form-constraint-recovery-2026-08-27.md`

No dependency or lockfile, visual baseline, manual assistive-technology claim,
commit, push, publish, or deployment belongs to this tranche.
