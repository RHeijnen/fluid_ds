# Stable-candidate range and fieldset dynamic recovery — 2026-08-27

## Disposition

This eighth bounded follow-up covers two high-risk rows from the 59-element
stable-candidate critical-mode ledger:

- `fluid-range-slider`: dynamic bounds/step adoption across both thumbs, ARIA,
  focus, and FormData plus disabled-owner restoration;
- `fluid-fieldset`: nested and dynamically inserted control adoption while the
  custom fieldset is disabled.

The implementation and three causal source tests are present and static
validation is green. Authoritative browser validation is **pending** because the
shared Linux browser container is reserved by the retained 50-run visual-history
window. Neither row receives an additional depth marker from this tranche until
that execution is complete.

## Reproduced gaps and causal changes

Range-slider bounds previously clamped only the rendered positions and
user-driven movement. A structural bound change could leave submitted values
and `aria-valuenow` outside `aria-valuemin`/`aria-valuemax`. Both thumbs now snap
to current step and bounds, retain their order, synchronize the serialized form
value, and remain event-silent for structural changes after mount. Initial
authored values remain intact for compatibility with the established serialized
form contract, even when they exceed default bounds. The control also
preserves authored disabled state through a native fieldset cycle and releases
thumb focus when disabled.

`fluid-fieldset` previously propagated disabled state only to top-level assigned
elements. Controls nested in a wrapper, or inserted into that wrapper while the
fieldset was already disabled, could remain operable. It now observes subtree
membership and applies its existing marker-based authored-state preservation to
native and `fluid-*` controls scoped to the nearest custom fieldset. Nested
custom fieldsets retain ownership of their own descendants.

The focused source suites now contain **17 range-slider tests** and **12 fieldset
tests**. The range-slider locale matrix expands one source test into six runtime
cases, so the combined retained browser denominator is 34 cases per engine. The
three new tests assert public thumb values, serialized value, `disabled`,
`tabIndex`, focus, ARIA range state, native/custom disabled attributes, FormData,
and event silence. They do not inspect private fields.

## Completed static validation

The following checks pass on the host current tree:

```text
node_modules/.bin/tsc.cmd -p packages/components/tsconfig.json --noEmit
node_modules/.bin/eslint.cmd <the four focused range/fieldset runtime/test files>
node_modules/.bin/prettier.cmd --check <the four focused range/fieldset runtime/test files>
git diff --check -- packages/components/src/components/{range-slider,fieldset}
```

## Required retained browser execution

After the visual-history owner explicitly releases the shared Linux container,
sync the final current tree and lockfile into that container, complete the frozen
offline install, and run from `/workspace/packages/components`:

```sh
FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs \
  --config web-test-runner.config.js \
  --files "src/components/{range-slider,fieldset}/*.test.ts"
```

Expected denominator: **34/34 in Chromium, 34/34 in Firefox, and 34/34 in
WebKit** (102 executions), normal exit 0, with a retained supervised lifecycle
record and matching host/container hashes for the four focused runtime/test
files and final root lockfile. If execution fails, this review and ledger must
retain the failure rather than promoting depth.

## Files in this tranche

- `packages/components/src/components/range-slider/fluid-range-slider.ts`
- `packages/components/src/components/range-slider/fluid-range-slider.test.ts`
- `packages/components/src/components/fieldset/fluid-fieldset.ts`
- `packages/components/src/components/fieldset/fluid-fieldset.test.ts`
- `docs/reviews/stable-candidate-critical-mode-ledger-2026-08-27.md`
- `docs/reviews/stable-candidate-range-fieldset-dynamic-recovery-2026-08-27.md`

No dependency or lockfile, visual baseline, manual assistive-technology claim,
commit, push, publish, or deployment belongs to this tranche.
