# Stable-candidate toggle form reset recovery — 2026-08-27

## Disposition

This fifth bounded follow-up covers two high-risk form-associated rows from the
59-element stable-candidate critical-mode ledger:

- `fluid-switch`: authored checked-default recovery after user interaction and
  authored disabled-state preservation through fieldset ownership;
- `fluid-checkbox`: authored disabled-state preservation through fieldset
  ownership for both initially disabled and initially enabled controls.

The implementation and three causal source tests are present and static
validation is green. Authoritative browser validation is **pending** because the
shared Linux browser container is reserved by the retained 50-run visual-history
window. Neither row receives an additional depth marker from this tranche until
that execution is complete.

## Reproduced gaps and causal changes

`fluid-switch` reflected live `checked` state back to its host attribute, then
used the current attribute during `form.reset()`. A user toggle therefore
silently redefined the reset default. The switch now records explicit authored
attribute changes while excluding its own property reflection, matching the
already-established checkbox reset model. Reset restores both initially checked
and initially unchecked states, accessible checked state, and FormData without
emitting a user-change event.

Both controls also assigned the fieldset-owned disabled value directly to their
public `disabled` property. Re-enabling a disabled fieldset therefore erased an
authored `disabled` state. Each control now records its authored state on entry
to form-owner disablement and restores that exact state on exit. A control that
was initially enabled still returns to enabled.

The focused files contain **17 source-attributed tests for each row**. Because
the switch locale matrix expands one source test into five runtime cases, the
combined retained browser denominator is 38 cases per engine. The three new
tests assert public `checked`, `disabled`, accessible checked/disabled state,
native shadow-control state, and FormData. They do not inspect private fields.

## Completed static validation

The following checks pass on the host current tree:

```text
node_modules/.bin/tsc.cmd -p packages/components/tsconfig.json --noEmit
node_modules/.bin/eslint.cmd <the four focused toggle runtime/test files>
node_modules/.bin/prettier.cmd --check <the four focused toggle runtime/test files>
git diff --check -- packages/components/src/components/{checkbox,switch}
```

## Required retained browser execution

After the visual-history owner explicitly releases the shared Linux container,
sync the final current tree and lockfile into that container, complete the frozen
offline install, and run from `/workspace/packages/components`:

```sh
FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs \
  --config web-test-runner.config.js \
  --files "src/components/{checkbox,switch}/*.test.ts"
```

Expected denominator: **38/38 in Chromium, 38/38 in Firefox, and 38/38 in
WebKit** (114 executions), normal exit 0, with a retained supervised lifecycle
record and matching host/container hashes for the four focused runtime/test
files and final root lockfile. If execution fails, this review and ledger must
retain the failure rather than promoting depth.

## Files in this tranche

- `packages/components/src/components/checkbox/fluid-checkbox.ts`
- `packages/components/src/components/checkbox/fluid-checkbox.test.ts`
- `packages/components/src/components/switch/fluid-switch.ts`
- `packages/components/src/components/switch/fluid-switch.test.ts`
- `docs/reviews/stable-candidate-critical-mode-ledger-2026-08-27.md`
- `docs/reviews/stable-candidate-toggle-form-reset-recovery-2026-08-27.md`

No dependency or lockfile, visual baseline, manual assistive-technology claim,
commit, push, publish, or deployment belongs to this tranche.
