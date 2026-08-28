# Stable-candidate form and button-group dynamic recovery — 2026-08-27

## Disposition

This ninth bounded follow-up covers two remaining high-risk rows from the
59-element stable-candidate critical-mode ledger:

- `fluid-form`: disabled-fieldset exclusion and nested form-owner isolation for
  validity and submitted values;
- `fluid-button-group`: dynamic direct membership and nested dropdown-trigger
  replacement without stale group styling state.

The implementation and causal tests are present, static validation is green,
and the authoritative combined browser matrix is green: **255/255 in Chromium,
255/255 in Firefox, and 255/255 in WebKit** (765 executions).

## Reproduced gaps and causal changes

The form wrapper's disabled check read only the element's `disabled` property.
For native controls disabled by an ancestor fieldset, that property remains
false even though the control matches `:disabled`. Such controls could therefore
block validation and leak into submitted values. Disabled detection now uses
both the public property and platform disabled-state matching.

The form's light-control query also included named descendants owned by a nested
`fluid-form`. Control discovery is now scoped to the nearest form wrapper, so
outer and inner validity/value contracts remain independent as their child
membership changes.

Button-group restamping previously updated remaining members but left removed
buttons carrying stale `data-fluid-group` attributes. A trigger replaced inside
a slotted dropdown did not generate a top-level slot change, so the replacement
was never fused. The group now observes subtree membership, tracks every stamp
it owns, clears departed/disconnected members, and adopts nested trigger
replacement on the next mutation checkpoint.

The focused source suites now contain **16 form tests** and **9 button-group
tests**, matching the runtime denominator of 25 cases per engine. The four new
tests assert public validity, focus, submitted event values, and owned data
attributes. They do not inspect private fields.

## Completed static validation

The following checks pass on the host current tree:

```text
node_modules/.bin/tsc.cmd -p packages/components/tsconfig.json --noEmit
node_modules/.bin/eslint.cmd <the four focused form/group runtime/test files>
node_modules/.bin/prettier.cmd --check <the four focused form/group runtime/test files>
git diff --check -- packages/components/src/components/{form,button-group}
```

## Aggregate browser matrix

All entries below are static-green and included in the retained all-engine run.

| Cohort                                                     | Component directories          | Cases per engine |
| ---------------------------------------------------------- | ------------------------------ | ---------------: |
| 1                                                          | `segmented-control`, `toolbar` |               28 |
| 2                                                          | `dropdown`                     |               19 |
| 3                                                          | `menu`                         |               20 |
| 4                                                          | `radio`                        |               18 |
| 5                                                          | `checkbox`, `switch`           |               38 |
| 6                                                          | `number-input`, `rating`       |               41 |
| 7                                                          | `slider`, `textarea`           |               28 |
| 8                                                          | `range-slider`, `fieldset`     |               34 |
| 9                                                          | `form`, `button-group`         |               25 |
| Runtime parameter expansion omitted by the source estimate | Cross-cohort                   |                4 |
| **Combined**                                               | **15 component directories**   |          **255** |

The original source-count estimate was 251, but the first authoritative runner
discovered **255 runtime cases per engine** after parameterized locale cases were
expanded. The executed denominator, not the earlier estimate, is authoritative.

## First authoritative execution: retained red

The first current-tree combined run was identically red in every engine:
**247 passed and 8 failed** in Chromium, Firefox, and WebKit. The retained
supervised lifecycle record is
`quality/evidence/wtr-lifecycle/2026-08-27T17-02-53-312Z-45240.json`. It must not
be replaced or treated as passing evidence.

Seven failures shared one ownership defect. Their
`formDisabledCallback(true)` implementations reflected `disabled` onto the
custom-element host. That host attribute became an independent disabled owner,
so removing the ancestor native fieldset's disabled state could not restore the
previous authored state. `FluidElement` now provides one preservation path that
snapshots authored state only when an actual disabled ancestor fieldset exists,
observes that owner, restores the snapshot when ownership ends, and disconnects
cleanly. Checkbox, switch, number-input, rating, slider, textarea, and
range-slider use that shared path.

The eighth failure was an established range-slider form contract: authored
`value-min="200" value-max="800"` was rewritten to `100,100` during the first
update because the new dynamic-bound normalization ran at mount against the
default 0–100 bounds. Initial authored values are again preserved; normalization
still runs atomically for value, bound, and step mutations after mount.

The remediation is static-green on the host (components TypeScript, focused
ESLint, Prettier, and diff-check).

## Authoritative repaired execution: green

Before execution, 69 dirty Components source/test/package files plus the final
root lockfile were synchronized into the Linux readiness container. Host and
container SHA-256 values matched for **69/69 files**, with zero mismatches. The
following command then ran from `/workspace/packages/components`:

```sh
FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs \
  --config web-test-runner.config.js \
  --files "src/components/{segmented-control,toolbar,dropdown,menu,radio,checkbox,switch,number-input,rating,slider,textarea,range-slider,fieldset,form,button-group}/*.test.ts"
```

Result: **255/255 in Chromium, 255/255 in Firefox, and 255/255 in WebKit**
(**765/765 executions**), normal exit 0. The retained supervised lifecycle
record is
`quality/evidence/wtr-lifecycle/2026-08-27T17-17-38-299Z-64556.json` (SHA-256
`7714b726b678b28588cc521acbe575a76a4ed70c7b3363820a079c2affd97d86`). It
records all launchers stopped, server closed, zero remaining sockets/processes,
and verified cleanup. The earlier red record remains retained separately. This
aggregate execution supersedes the pre-execution `pending` wording retained in
the individual cohort reviews.

## Files in this tranche

- `packages/components/src/components/form/fluid-form.ts`
- `packages/components/src/components/form/fluid-form.test.ts`
- `packages/components/src/components/button-group/fluid-button-group.ts`
- `packages/components/src/components/button-group/fluid-button-group.test.ts`
- `docs/reviews/stable-candidate-critical-mode-ledger-2026-08-27.md`
- `docs/reviews/stable-candidate-form-group-dynamic-recovery-2026-08-27.md`

No dependency or lockfile, visual baseline, manual assistive-technology claim,
commit, push, publish, or deployment belongs to this tranche.
