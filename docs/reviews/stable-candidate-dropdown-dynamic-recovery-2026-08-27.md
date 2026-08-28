# Stable-candidate dropdown dynamic recovery — 2026-08-27

## Disposition

This bounded follow-up covers two high-risk, parent/child rows from the
59-element stable-candidate critical-mode ledger:

- `fluid-dropdown`: active-descendant fallback after dynamic item mutation and
  restoration of an intentionally open menu after disconnect/reconnect;
- `fluid-dropdown-item`: removal, disable, and item-to-separator transitions
  while it owns the menu's active state.

The implementation and three causal tests are present and static validation is
green. Authoritative browser validation is **pending** because the shared Linux
browser container is reserved by the retained 50-run visual-history window.
Neither row receives an `R` marker from this tranche until that execution is
complete.

## Reproduced gaps and causal changes

An open dropdown previously retained a disabled or detached item as its active
descendant until another key was pressed. It also left an item marked active
when that item became a separator. The dropdown now observes direct/nested item
membership plus `disabled` and `type` changes, preserves a still-valid active
item, selects the first enabled fallback when necessary, and clears both item
state and element-reflection state when no enabled item remains.

An open dropdown also retained `open=true` across disconnect while its top-layer
menu was removed. Reconnecting did not run Lit's `updated()` hook because the
property had not changed, leaving public state, trigger state, and rendered
state inconsistent. Reconnect now restores the top layer, active descendant,
focus scheduling, positioning lifecycle, and trigger `aria-expanded` without
emitting a second user-facing `fluid-show` or a structural `fluid-hide` event.

The focused source suite now contains **19 tests per engine**. The three added
tests assert public `open`, `active`, `aria-expanded`, top-layer,
`ariaActiveDescendantElement`, and lifecycle-event behavior. They do not use
private implementation fields.

## Completed static validation

The following checks pass on the host current tree:

```text
node_modules/.bin/tsc.cmd -p packages/components/tsconfig.json --noEmit
node_modules/.bin/eslint.cmd <the focused dropdown runtime/test files>
node_modules/.bin/prettier.cmd --check <the focused dropdown runtime/test files>
git diff --check -- packages/components/src/components/dropdown
```

## Required retained browser execution

After the visual-history owner explicitly releases the shared Linux container,
sync the final current tree and lockfile into that container, complete the frozen
offline install, and run from `/workspace/packages/components`:

```sh
FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs \
  --config web-test-runner.config.js \
  --files "src/components/dropdown/*.test.ts"
```

Expected denominator: **19/19 in Chromium, 19/19 in Firefox, and 19/19 in
WebKit** (57 executions), normal exit 0, with a retained supervised lifecycle
record and matching host/container hashes for the focused runtime/test files and
final root lockfile. If execution fails, this review and the ledger must retain
the failure rather than promoting depth.

## Files in this tranche

- `packages/components/src/components/dropdown/fluid-dropdown.ts`
- `packages/components/src/components/dropdown/fluid-dropdown.test.ts`
- `docs/reviews/stable-candidate-critical-mode-ledger-2026-08-27.md`
- `docs/reviews/stable-candidate-dropdown-dynamic-recovery-2026-08-27.md`

No dependency or lockfile, visual baseline, manual assistive-technology claim,
commit, push, publish, or deployment belongs to this tranche.
