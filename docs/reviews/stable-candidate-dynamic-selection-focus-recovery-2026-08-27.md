# Stable-candidate dynamic selection and focus recovery — 2026-08-27

## Disposition

This bounded follow-up covers two high-risk rows from the 59-element
stable-candidate critical-mode ledger:

- `fluid-segmented-control`: selection and accessible radio state after the
  selected segment is disabled or removed, after every option becomes disabled,
  and after reconnect;
- `fluid-toolbar`: the single roving tab stop after a managed control is
  dynamically disabled, added, removed, or changed while the toolbar is
  disconnected.

The implementation and five causal tests are present and static validation is
green. Authoritative browser validation is **pending** because the shared Linux
browser container is reserved by the retained 50-run visual-history window.
Neither row receives an `R` marker from this tranche until that execution is
complete.

## Causal changes

`fluid-segmented-control` now observes option membership plus `disabled` and
`value` attribute changes, falls back to the first enabled option without
emitting a user-change event, clears selection when no option is enabled, and
restarts selection and resize observation after reconnect. Disabled segments can
no longer retain `aria-checked="true"` or the roving tab stop.

`fluid-toolbar` now observes membership and disabled-state mutations, rebuilds
its managed-control inventory after reconnect, preserves a still-valid roving tab
stop across unrelated additions, and assigns exactly one enabled fallback when
the prior tab stop becomes unavailable.

The focused source suites now contain **28 tests per engine**:

- segmented control: 12;
- toolbar: 16.

The five added tests assert public `value`, `aria-checked`, `tabIndex`, event, and
reconnect behavior. They do not inspect private fields or shadow-DOM structure.

## Completed static validation

The following checks pass on the host current tree:

```text
node_modules/.bin/tsc.cmd -p packages/components/tsconfig.json --noEmit
node_modules/.bin/eslint.cmd <the four focused runtime/test files>
node_modules/.bin/prettier.cmd --check <the four focused runtime/test files>
git diff --check -- packages/components/src/components/segmented-control packages/components/src/components/toolbar
```

## Required retained browser execution

After the visual-history owner explicitly releases the shared Linux container,
sync the final current tree and lockfile into that container, complete the frozen
offline install, and run from `/workspace/packages/components`:

```sh
FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs \
  --config web-test-runner.config.js \
  --files "src/components/{segmented-control,toolbar}/*.test.ts"
```

Expected denominator: **28/28 in Chromium, 28/28 in Firefox, and 28/28 in
WebKit** (84 executions), normal exit 0, with a retained supervised lifecycle
record and matching host/container hashes for the four focused files and final
root lockfile. If execution fails, this review and the ledger must retain the
failure rather than promoting depth.

## Files in this tranche

- `packages/components/src/components/segmented-control/fluid-segmented-control.ts`
- `packages/components/src/components/segmented-control/fluid-segmented-control.test.ts`
- `packages/components/src/components/toolbar/fluid-toolbar.ts`
- `packages/components/src/components/toolbar/fluid-toolbar.test.ts`
- `docs/reviews/stable-candidate-critical-mode-ledger-2026-08-27.md`
- `docs/reviews/stable-candidate-dynamic-selection-focus-recovery-2026-08-27.md`

No dependency or lockfile, visual baseline, manual assistive-technology claim,
commit, push, publish, or deployment belongs to this tranche.
