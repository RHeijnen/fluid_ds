# Stable-candidate radio dynamic form recovery — 2026-08-27

## Disposition

This fourth bounded follow-up covers two high-risk parent/child rows from the
59-element stable-candidate critical-mode ledger:

- `fluid-radio-group`: selected-option invalidation, reconnect adoption, and
  dynamic option propagation through a disabled form owner;
- `fluid-radio`: public checked, disabled, accessible-disabled, focus, and
  roving-tab-stop state during those parent transitions.

The implementation and three causal tests are present and static validation is
green. Authoritative browser validation is **pending** because the shared Linux
browser container is reserved by the retained 50-run visual-history window.
Neither row receives an `R` marker from this tranche until that execution is
complete.

## Reproduced gaps and causal changes

Disabling the focused selected radio previously cleared the group value but
left focus stranded on the now-disabled option. Reconciliation now moves focus
to the enabled roving fallback while clearing selected/form value and remaining
event-silent for the structural mutation.

The radio observer was disconnected correctly, but reconnect did not reconcile
children changed while detached because Lit had no reactive group-property
change to schedule. Reconnect now immediately adopts current option membership,
clears a value whose selected option was removed, refreshes FormData/validity,
and restores one enabled tab stop.

An option appended while a native disabled fieldset owned the group previously
escaped disabled propagation. Reconciliation now records that new option's
authored disabled state, applies the form-owner disabled state, and restores the
authored state when the fieldset becomes enabled. Radio discovery is also scoped
to the nearest radio group so nested descendants cannot pollute the outer
group's option inventory.

The focused source suite now contains **18 tests per engine**. The three added
tests assert public `value`, `checked`, `disabled`, `aria-disabled`, `tabIndex`,
focus, FormData, and `fluid-change` behavior. They do not inspect private fields
or shadow-DOM structure.

## Completed static validation

The following checks pass on the host current tree:

```text
node_modules/.bin/tsc.cmd -p packages/components/tsconfig.json --noEmit
node_modules/.bin/eslint.cmd <the focused radio runtime/test files>
node_modules/.bin/prettier.cmd --check <the focused radio runtime/test files>
git diff --check -- packages/components/src/components/radio
```

## Required retained browser execution

After the visual-history owner explicitly releases the shared Linux container,
sync the final current tree and lockfile into that container, complete the frozen
offline install, and run from `/workspace/packages/components`:

```sh
FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs \
  --config web-test-runner.config.js \
  --files "src/components/radio/*.test.ts"
```

Expected denominator: **18/18 in Chromium, 18/18 in Firefox, and 18/18 in
WebKit** (54 executions), normal exit 0, with a retained supervised lifecycle
record and matching host/container hashes for the focused runtime/test files and
final root lockfile. If execution fails, this review and the ledger must retain
the failure rather than promoting depth.

## Files in this tranche

- `packages/components/src/components/radio/fluid-radio-group.ts`
- `packages/components/src/components/radio/fluid-radio.test.ts`
- `docs/reviews/stable-candidate-critical-mode-ledger-2026-08-27.md`
- `docs/reviews/stable-candidate-radio-dynamic-form-recovery-2026-08-27.md`

No dependency or lockfile, visual baseline, manual assistive-technology claim,
commit, push, publish, or deployment belongs to this tranche.
