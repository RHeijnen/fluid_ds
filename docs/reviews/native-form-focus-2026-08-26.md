# Native form focus checkpoint, 26 August 2026

## Current checkpoint

Required native form-focus coverage is now **16/16 controls**, including the
date-picker, color-picker, file-input, OTP, radio-group and date-range-picker
repairs plus scheduler. The complete pinned-Linux SSR gate passes **204 cases**
with normal shutdown after the scheduler slice; see the
[scheduler review](scheduler-form-contract-2026-08-27.md),
[date-range-picker review](date-range-picker-form-contract-2026-08-27.md),
[radio-group review](radio-group-form-contract-2026-08-26.md),
[OTP review](otp-form-contract-2026-08-26.md),
[file-input review](file-input-form-contract-2026-08-26.md) and
[color-picker review](color-picker-form-contract-2026-08-26.md) for retained
artifacts and scope. The earlier 96-case checkpoint remains in the
[Linux verification review](linux-verification-2026-08-26.md).
The coordinated all-engine full-workspace checkpoint also passes 6,942 unit
executions across 42 package/engine runs, 18 builds, 1,903 cold imports, 155
server renders, the 136-page docs build and 24,224 local links in 605 seconds.
This does not mean every form control or every documented
form behavior is covered. Pre-hydration host/FormData adoption adapters still
cover only input and checkbox.

There are **no remaining controls in the scoped 16-control required-focus
inventory**. This does not close pre-hydration state adoption, exhaustive form
behavior or manual AT. The seven-row audit below is retained as history; all of
its rows were subsequently addressed by bounded contracts.

## Historical verified extension: nine controls

At this checkpoint, the native form-focus fixture inventory covered nine of sixteen controls with a
public required contract: input, checkbox, switch, textarea, number-input,
typeahead, masked-input, select and time-picker. This is distinct from the
pre-hydration host/FormData adoption adapters, which still cover only input and
checkbox. No blanket base-class delegation or new adoption adapter was added.

The three new controls use per-component `delegatesFocus`, including the emitted
DSD attribute. Select and time-picker attach native validation anchors after the
first render. Masked-input derives its rendered invalid state before rendering;
select/time-picker derive popup active state before rendering. Native validity
and popup positioning remain post-render where their DOM dependencies require it.

Evidence:

- `2026-08-26T14-40-51-206Z-composite-form-focus-before-fix`: failed RED baseline.
  Fifteen reported failures, three cases not completed, and the configured
  300-second suite/teardown timeout. The sixteenth case has a focus-failure
  artifact but did not finish its WebKit worker teardown. Masked-input's Firefox
  trace shows four actual non-focusable invalid-control console errors despite
  passing active-element assertions. No process termination was performed.
- `2026-08-26T14-49-13-608Z-composite-form-focus-after-anchor-fix`: two passed,
  four failed. All functional assertions completed; select/time-picker failed
  the unchanged console gate because of popup-induced reactive updates. One
  select DSD trace writer also reported a truncated ZIP; other traces and the
  report remain retained.
- `2026-08-26T14-50-58-152Z-composite-form-focus-three-engine-final`: 18/18 passed
  across Chromium, Firefox and WebKit, normal exit, 45.6 seconds, stable source.
- `2026-08-26T14-52-07-826Z-composite-form-focus-unit-regressions`: 89/89 unit
  cases passed in Chromium, including three new single-update regressions,
  normal exit and stable source. Its lifecycle artifact is
  `2026-08-26T14-52-09-685Z-6740.json`.

Every new browser case exercises invalid and valid native/Fluid submit activation
by both pointer and keyboard, actual field editing, canonical FormData, reset and
server node identity. Select uses real keyboard and pointer option selection.
Application custom validity is also exercised with native pointer and Enter
submission, a live Dutch language change, error preservation and clearing.
Delegation was sufficient for these custom-error cases in all three engines; a
suspected missing-anchor defect for otherwise-valid values was not reproduced.

At this checkpoint, the strict console classifier had fourteen exact development
warning allowances. None were added for this extension. Full integrated 90-case
SSR and all-engine unit/coverage checkpoints remain separate from these results.

## Historical seven-control focus audit

This was a read-only source audit, not seven reproduced browser failures. All
seven then lacked their own `shadowRootOptions` focus delegation. The correct
target is component-specific, so a base-class switch would be insufficient proof.
The source references and gap descriptions below describe that earlier snapshot,
not the repaired date-picker or the current six-control remainder.

| Control and source                                             | Intended validation target / concrete gap                                                                                                                                                                                                                 | Next genuine browser proof                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color-picker/fluid-color-picker.ts:186-207`                   | Public focus targets nested `fluid-input`; validity currently has no anchor. The first ordinary button is the color swatch, not the editable hex field.                                                                                                   | Required empty and malformed hex; deep focus on the nested text input, real typing to valid hex, canonical form data, custom error and reset. Do not invoke an OS color dialog just to fake an edit.                                                 |
| `date-picker/fluid-date-picker.ts:259-267`                     | Required validity has no anchor. The native text field, trigger and nested calendar have distinct focus roles.                                                                                                                                            | Invalid submit focuses editable field without opening/stealing focus unexpectedly; real typed ISO commit and calendar selection; submitted ISO distinct from localized display.                                                                      |
| `file-input/fluid-file-input.ts:255-282`                       | Public focus deliberately targets the visible `.dropzone`; the native file input is hidden and removed from the accessibility tree. Validity has no visible anchor.                                                                                       | Required empty/custom-error native submit targets the dropzone, real chooser activation by pointer/keyboard, Playwright file-chooser selection, multipart file names/types/bytes, removal and reset. Never assign a fake nonempty file-input value.  |
| `otp/fluid-otp.ts:236-287`                                     | Public focus targets first empty box, but required validity anchors `list[0]`. Partial values need an explicit intended target. `updated()` also changes reactive invalid state and clamps length.                                                        | Empty and partial OTP, first missing box target, real typing/backspace/paste with complete canonical string, length changes, custom error, reset, preserved box identity.                                                                            |
| `radio/fluid-radio-group.ts:111-150`                           | Public focus chooses checked/first enabled light-DOM radio host. Native validity has no anchor. Radio hosts themselves carry role/tabindex; there is no native inner input.                                                                               | Invalid submit with first option disabled, real arrow/Space selection, roving focus and FormData; option removal/disable and custom errors. Do not assert focus on a nonexistent native input.                                                       |
| `date-range-picker/fluid-date-range-picker.ts:389-455,519-540` | Required validity has no anchor. Input focus opens the popup; non-typeable mode moves focus into its dialog. A naive input-focus assertion conflicts with current interaction policy.                                                                     | Explicit typeable/non-typeable contracts, incomplete range, Apply/Cancel, preserved committed value versus draft, native invalid focus without inaccessible browser errors. Decide policy before changing focus behavior.                            |
| `packages/scheduler/.../fluid-scheduler.ts:175-187,281-317`    | Satellite required control with no public focus override/validity anchor. Choice is a nested calendar day or an available time slot depending on state; loading/readonly/disabled are distinct. Validation and prompt strings are still English literals. | Deterministic availability fixture; no day, selected day without slot, unavailable stored slot, actual calendar/slot choice, native submit and canonical timestamp. Requires separate scheduler/localization work, not a generic core-field fixture. |

The original proposed next focus slice was date-picker, color-picker and file-input, with
their distinct deep targets encoded in the fixture first. OTP/radio need explicit
first-invalid/first-enabled tests; date-range/scheduler need composite policy
decisions. Each slice should preserve original DSD roots/controls and the strict
console gate, and keep any pre-hydration state-restoration work separate.

## Existing fourteen warning allowances: source causes and next tests

The list is an allowance inventory, not proof every warning still occurs in the
latest source. No allowance was removed by this read-only review.

- **Nine chart tags, one shared runtime:**
  `packages/charts/src/components/chart/fluid-chart.ts:187-201,423-465` creates or
  updates Chart.js from `updated()`. Its synchronous `afterUpdate` plugin assigns
  reactive `legendItems`. The eight typed wrappers inherit that path. A genuine
  fix should isolate legend rendering or coordinate DOM-dependent chart setup
  without redundant parent renders, preserving keyboard buttons, visibility,
  consumer legend callbacks, data changes and reconnect. Merely deferring the
  same update to a timer would hide the warning, not remove the extra work.
- **Anchor nav:** `fluid-anchor-nav.ts:206-247` calls `_rebuild()` from `updated()`;
  `_rebuild()` always assigns `_resolved`, including a fresh collected array.
  Separate pre-render data derivation from post-render observer installation;
  test explicit items, heading discovery, reconnect and unchanged-data updates.
- **Input, textarea, number-input:** their `updated()` validity refreshes assign
  reactive `invalid` after reading native input validity (`fluid-input.ts:416-442`,
  `fluid-textarea.ts:258-281`, `fluid-number-input.ts:287-298`). Unlike masked-input,
  this is DOM-dependent validation: blindly moving it before render would read
  stale type/required/pattern/min/max state. Any fix must preserve real native
  validity, edited versus programmatic values, custom errors and SSR adoption.
  Consider a non-reactive validity presentation update or a deliberately
  synchronized native validation controller, with render-count regressions.
- **Rating:** `fluid-rating.ts:175-181,204-208` now uses a native attribute-backed
  `ariaLabel` accessor and the base's guarded default-label writer. This differs
  from the original reactive label path, so its allowance may now be stale.
  First run a fresh isolated strict-warning test over default label, author label,
  labelledby, dynamic locale and reconnect; remove only after actual absence and
  a negative control prove the gate remains sensitive.

These findings do not certify other forms, all locale strings, or the underlying
Windows WebKit shutdown behavior. They identify the next bounded checks without
changing runtime scope during the integrated freeze.
