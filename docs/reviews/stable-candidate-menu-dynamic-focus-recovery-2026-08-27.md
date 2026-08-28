# Stable-candidate menu dynamic focus recovery — 2026-08-27

## Disposition

This third bounded follow-up covers two high-risk parent/child rows from the
59-element stable-candidate critical-mode ledger:

- `fluid-menu`: roving focus and selection continuity through dynamic disabled
  state, insertion, and reconnect;
- `fluid-menu-item`: public active, disabled, focus, and tab-stop state while
  its parent reconciles those changes.

The implementation and three causal tests are present and static validation is
green. Authoritative browser validation is **pending** because the shared Linux
browser container is reserved by the retained 50-run visual-history window.
Neither row receives an `R` marker from this tranche until that execution is
complete.

## Reproduced gaps and causal changes

Disabling the focused and active item previously left that disabled item marked
active with no valid roving tab stop. The menu now observes item membership and
disabled-state changes. It removes the disabled item from active/tab-stop state,
moves both public active state and focus to an enabled fallback, and retains
exactly one enabled tab stop.

The previous slot-change handler also reset the roving position to the first
item whenever an unrelated item was inserted. Reconciliation now preserves a
still-valid active or tabbable item. On reconnect it adopts child state changed
while disconnected, restores the valid tab stop, and relies on the base
lifecycle to restore item activation listeners. Item discovery is scoped to the
nearest parent menu so nested descendants cannot pollute the outer menu's
managed-item inventory.

The focused source suite now contains **20 tests per engine**. The three added
tests assert public `active`, `disabled`, `aria-disabled`, `tabIndex`, focus, and
`fluid-select` behavior. They do not inspect private fields or shadow-DOM
structure.

## Completed static validation

The following checks pass on the host current tree:

```text
node_modules/.bin/tsc.cmd -p packages/components/tsconfig.json --noEmit
node_modules/.bin/eslint.cmd <the focused menu runtime/test files>
node_modules/.bin/prettier.cmd --check <the focused menu runtime/test files>
git diff --check -- packages/components/src/components/menu
```

## Required retained browser execution

After the visual-history owner explicitly releases the shared Linux container,
sync the final current tree and lockfile into that container, complete the frozen
offline install, and run from `/workspace/packages/components`:

```sh
FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs \
  --config web-test-runner.config.js \
  --files "src/components/menu/*.test.ts"
```

Expected denominator: **20/20 in Chromium, 20/20 in Firefox, and 20/20 in
WebKit** (60 executions), normal exit 0, with a retained supervised lifecycle
record and matching host/container hashes for the focused runtime/test files and
final root lockfile. If execution fails, this review and the ledger must retain
the failure rather than promoting depth.

## Files in this tranche

- `packages/components/src/components/menu/fluid-menu.ts`
- `packages/components/src/components/menu/fluid-menu.test.ts`
- `docs/reviews/stable-candidate-critical-mode-ledger-2026-08-27.md`
- `docs/reviews/stable-candidate-menu-dynamic-focus-recovery-2026-08-27.md`

No dependency or lockfile, visual baseline, manual assistive-technology claim,
commit, push, publish, or deployment belongs to this tranche.
