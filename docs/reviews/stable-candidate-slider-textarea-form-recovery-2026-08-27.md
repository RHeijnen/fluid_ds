# Stable-candidate slider and textarea form recovery — 2026-08-27

## Disposition

This seventh bounded follow-up covers two high-risk form-associated rows from
the 59-element stable-candidate critical-mode ledger:

- `fluid-slider`: dynamic bound normalization across host, native control,
  visible value, and FormData plus disabled-owner state recovery;
- `fluid-textarea`: authored disabled-state preservation through native
  fieldset ownership.

The implementation and three causal tests are present and static validation is
green. Authoritative browser validation is **pending** because the shared Linux
browser container is reserved by the retained 50-run visual-history window.
Neither row receives an additional depth marker from this tranche until that
execution is complete.

## Reproduced gaps and causal changes

Shrinking a slider's bounds below its current value previously produced split
state: the native range thumb silently clamped while the host `value`, visible
label, track calculation, and submitted FormData retained the out-of-range
value. Slider updates now normalize through a temporary native range control
whenever value, minimum, maximum, or step changes. The canonical native result
is adopted by every public surface without emitting user input/change events for
a structural constraint mutation.

Slider and textarea also assigned fieldset-owned disabled state directly to
their public `disabled` property. Re-enabling the fieldset erased an authored
disabled state. Each control now records authored state on entry to owner
disablement and restores it exactly on exit, while an initially enabled control
returns to enabled.

The focused source suites now contain **13 slider tests** and **15 textarea
tests**, matching the runtime denominator of 28 cases per engine. The three new
tests assert public `value`, `max`, `disabled`, native input state, visible value,
FormData, and event silence. They do not inspect private fields.

## Completed static validation

The following checks pass on the host current tree:

```text
node_modules/.bin/tsc.cmd -p packages/components/tsconfig.json --noEmit
node_modules/.bin/eslint.cmd <the four focused slider/textarea runtime/test files>
node_modules/.bin/prettier.cmd --check <the four focused slider/textarea runtime/test files>
git diff --check -- packages/components/src/components/{slider,textarea}
```

## Required retained browser execution

After the visual-history owner explicitly releases the shared Linux container,
sync the final current tree and lockfile into that container, complete the frozen
offline install, and run from `/workspace/packages/components`:

```sh
FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs \
  --config web-test-runner.config.js \
  --files "src/components/{slider,textarea}/*.test.ts"
```

Expected denominator: **28/28 in Chromium, 28/28 in Firefox, and 28/28 in
WebKit** (84 executions), normal exit 0, with a retained supervised lifecycle
record and matching host/container hashes for the four focused runtime/test
files and final root lockfile. If execution fails, this review and ledger must
retain the failure rather than promoting depth.

## Files in this tranche

- `packages/components/src/components/slider/fluid-slider.ts`
- `packages/components/src/components/slider/fluid-slider.test.ts`
- `packages/components/src/components/textarea/fluid-textarea.ts`
- `packages/components/src/components/textarea/fluid-textarea.test.ts`
- `docs/reviews/stable-candidate-critical-mode-ledger-2026-08-27.md`
- `docs/reviews/stable-candidate-slider-textarea-form-recovery-2026-08-27.md`

No dependency or lockfile, visual baseline, manual assistive-technology claim,
commit, push, publish, or deployment belongs to this tranche.
