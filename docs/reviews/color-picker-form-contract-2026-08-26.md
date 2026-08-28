# Color-picker native form and SSR contract, 26 August 2026

Status: focused browser/unit checks, integrated SSR and full workspace verification pass.
This is one bounded task in Section 4, not component maturity or release approval.
Existing changes remain uncommitted.

## Reproduced defects and repairs

- Native submit activation failed to focus the editable hex input in all three
  engines, in client and DSD modes. The picker now delegates focus and anchors
  validation to the actual input inside its nested `fluid-input`, including
  required, pattern and application custom errors. The initial client render waits
  for that nested control before attaching its native validation anchor.
- One text edit exposed both the normalized parent `fluid-input` event and the
  nested child's raw event. The picker now consumes child events and emits one
  normalized parent event. A pending-edit flag commits on change or blur exactly
  once, including WebKit's normalization path, without commits on unchanged blur.
- Disabled state left the native color input and preset buttons enabled. All
  editing controls now receive disabled state, with handler guards too.
- Accepted shorthand hex values such as `#abc` were passed directly to the native
  color input, causing a Chromium console warning. Only the native input's value
  is expanded to six lowercase digits; public values and FormData stay unchanged.

The deep validation anchor is consistent with the
[HTML ElementInternals validation contract](https://html.spec.whatwg.org/multipage/custom-elements.html#dom-elementinternals-setvalidity),
which permits a shadow-including descendant. Cross-engine browser execution, not
that specification alone, is the evidence that this implementation works.

## Executed evidence

Artifacts are retained under `quality/evidence/`; full traces, screenshots and
reports for failed browser runs are also under `quality/evidence/color-picker-2026-08-26/`.

| Record | Result and scope |
| --- | --- |
| `2026-08-26T18-01-30-776Z-color-focus-before-fix` | Six failing required-submit focus contracts: two render modes in three engines. |
| `2026-08-26T18-03-07-196Z-color-events-disabled-before-fix` | Four failing Chromium contracts: duplicate event payloads and enabled native color input while disabled. |
| `2026-08-26T18-04-46-605Z-color-focus-after-fix` | Intermediate result: 14 pass, four fail. Retains the shorthand-color warning and missing WebKit commit event. |
| `2026-08-26T18-06-24-476Z-color-focus-final` | 18/18 pass across Chromium, Firefox and WebKit, zero retries, normal exit and unchanged source. |
| `2026-08-26T18-07-07-540Z-color-picker-unit-regressions` | Invocation failure before tests: pnpm shorthand rejected `--files`. No execution credit. |
| `2026-08-26T18-07-17-869Z-color-picker-unit-regressions-run` | Correct explicit `run test` invocation: 29 cases per engine, 87 passing executions. Normal worker/server/browser shutdown, zero remaining sockets or observed processes, no forced cleanup. |
| `2026-08-26T18-07-40-609Z-color-picker-integrated-ssr` | Full browser SSR gate: 114/114 pass, zero retries, normal exit and unchanged source. |
| `2026-08-26T18-11-13-968Z-color-picker-full-verify` | Full workspace verification passes in 587.853 seconds: 6,897 unit executions across 42 package/engine runs, 18 package builds, 1,903 cold imports, 155 renders and 24,224 local documentation links. Normal exit and unchanged source. |

The final focused browser and unit records use source
`3616a4b39b314a2b50d64b746a69f94aa8680a2cd074c32dca1dd29fa77a1cde`.
Node 22.22.2, pnpm 9.15.0 and the existing pinned Linux container were used.
Host SSR-fixture typechecking and targeted lint also pass.

The integrated SSR run uses that same `3616a4b3...` source and completes in
198.774 seconds. Full verification uses
`11a34c00b760b590c25118e8fd2e2629a6bcf5209ff49410a95b81382865a636`.
Its only differences from the focused snapshot are regenerated core CEM metadata,
the generated quality inventory and this review's initial text. Runtime, tests
and lockfile are unchanged. Lock SHA-256:
`eb82ee9f7c82422aa6604af2f8a6b8ba9fb9465840e7ce109c119c550d3dd7af`.

The full run's 42 unit lifecycle records all pass with normal worker exit, zero
remaining sockets, zero remaining observed processes, no ownership uncertainty
and no forced cleanup. They are retained in `full-unit-lifecycle/` beneath this
slice's evidence directory, alongside earlier records; select records started
at or after `2026-08-26T18:11:13.968Z` for this full run. A final container process
inspection found only init, its intentional keepalive and the inspection itself.
The documentation gate still excludes 574 external/separately built targets.
Measured coverage, built Storybook, packed consumers, full dedicated accessibility
and performance were not rerun in this slice; their earlier evidence is not a new
execution result for the changed source.

## Contract coverage and boundaries

The six new browser scenarios, each run in all three engines, cover:

- Client/DSD invalid submission by native and Fluid buttons using pointer and
  Enter; valid submission carries the actual edited FormData value.
- Required and application custom errors, preserving custom messages across a
  live language change, clearing errors and resetting to the original empty value.
- Retention of the server picker root, swatch, nested input host/root and native
  text input, rather than replacing them with visually identical controls.
- Exact canonical input/change event counts and origins, pointer/Space preset
  activation, unchanged blur and silent reset.
- Disabled editing controls and omission from submitted FormData, re-enabling,
  disconnect/reconnect, invalid hex focus, shorthand recovery and valid submission.
- Browser console/page errors and the existing strict warning classifier. No
  retries, timeout extensions or new warning allowances were introduced.

The three added unit cases cover validation anchors/custom errors, canonical
parent events including invalid edits, and disabled editing guards. An existing
shorthand test now also asserts the native six-digit value and unchanged public value.

This does not certify pre-hydration color state adoption, OS-native color-dialog
automation, native disabled-fieldset inheritance, exhaustive palette keyboard
semantics, theme/contrast baselines or manual assistive-technology use. There is
no read-only API on this component. Existing input/checkbox state-adoption coverage
is unchanged. Remaining required-focus controls are file-input, OTP, radio-group,
date-range-picker and scheduler. Required native-focus coverage is now 11/16.

## Remaining checkpoint work

- [x] Complete the integrated 114-case browser SSR gate.
- [x] Complete full workspace verification after regenerating affected metadata.
- [x] Update the production plan and handoff with verified counts and next task.

The component-authoring and accessibility guidance informed the native-control,
deep-focus, real-event and evidence-boundary requirements. This focused form
contract is not a claim that the whole component-authoring checklist is complete.
