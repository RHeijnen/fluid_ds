# File-input native form and SSR contract, 26 August 2026

Status: focused browser/unit checks, integrated SSR and explicit all-engine full
workspace verification pass. No release or maturity approval.
Existing changes remain uncommitted. This is a bounded Section 4 task.

## Reproduced defects and repairs

- Required native submit did not focus the visible picker in either client or
  DSD mode in Chromium, Firefox or WebKit. Focus delegation and a visible
  validation anchor now cover required and application custom errors.
- Selection/removal events ran before `ElementInternals` held the current
  multipart data. Synchronization now precedes the canonical change event.
- Disabled remove buttons remained enabled, and late native change events could
  modify a disabled picker. Native disabled state and handler guards cover both.
- The visible picker was a custom `div` button. It is now a native non-submit
  button, providing native Enter/Space timing. This follows the
  [W3C APG preference for native button semantics](https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/).
- Removing the last selected file lost keyboard focus. The picker now restores
  focus to a remaining removal control or the visible drop zone, without
  overriding a consumer's deliberate focus change in its event handler.
- The event JSDoc incorrectly called `detail.files` a `FileList`; it now says
  `File[]`, matching the implementation and component documentation.

Intermediate repairs exposed two further problems. Lit queries return null before
the first client render, so an explicit anchor cannot be passed until it exists.
More importantly, the Linux WebKit fallback validation UI installs a user-agent
shadow root on an explicit descendant anchor. That made the entire visible picker
zero pixels tall while it remained focused. The final implementation lets native
validation target the host; `delegatesFocus` sends focus to the first control, the
visible native picker button. The zero-height measurement and failed screenshots
are retained. These failed runs are evidence, not passing gates.

## Evidence and exact scope

Retained artifacts live under `quality/evidence/` and
`quality/evidence/file-input-2026-08-26/`.

| Record                                                  | Result                                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-26T18-28-44-877Z-file-focus-before-fix`        | 18 failures: three scenarios in two modes and three engines, covering missing focus, stale synchronous FormData and enabled disabled-state removal buttons.                                             |
| `2026-08-26T18-30-38-263Z-file-input-unit-before-fix`   | 28 pass and three fail per engine. Space timing, synchronous multipart data and late disabled selection fail in all three engines.                                                                      |
| `2026-08-26T18-31-15-069Z-file-focus-after-initial-fix` | Intermediate: five pass, 13 fail. DSD focus works, but client initialization receives a null anchor, event/removal checks are incomplete and WebKit exposes the zero-height validation-anchor problem.  |
| `2026-08-26T18-33-30-589Z-file-focus-final`             | Intermediate: 16 pass, two WebKit timeouts because the focused picker has zero height.                                                                                                                  |
| `2026-08-26T18-36-04-793Z-file-focus-layout-diagnostic` | Causal diagnostic: two intentional WebKit failures measure host, base and picker as visible CSS boxes with computed height `0px` after validation.                                                      |
| `2026-08-26T18-38-00-063Z-file-focus-native-button`     | Native-button negative control: Chromium/Firefox and all non-validation WebKit scenarios pass, but explicit descendant anchoring still yields two zero-height WebKit failures.                          |
| `2026-08-26T18-39-21-080Z-file-focus-host-anchor`       | Host-anchor control: 18/18 pass in client/DSD modes across all three engines, zero retries, normal exit and unchanged source.                                                                           |
| `2026-08-26T18-40-25-253Z-file-focus-final`             | Final focused source: 18/18 pass, zero retries, normal exit and unchanged source.                                                                                                                       |
| `2026-08-26T18-41-01-973Z-file-input-unit-final`        | 31 cases per engine, 93 passing executions; normal worker/server/browser shutdown and unchanged source.                                                                                                 |
| `2026-08-26T18-41-15-237Z-file-input-integrated-ssr`    | Expanded full browser SSR gate: 132/132 pass, zero retries, normal exit and unchanged source.                                                                                                           |
| `2026-08-26T18-49-10-640Z-file-input-full-verify`       | Standard `pnpm verify` passes in 362.320 seconds, but its default unit matrix is Chromium-only: 2,302 executions across 14 package runs. It is not the all-engine checkpoint.                           |
| `2026-08-26T18-56-08-345Z-file-input-full-verify-all`   | Explicit `FLUID_BROWSERS=all` full verification passes in 635.635 seconds: 6,906 unit executions across 42 package/engine runs, 18 builds, 1,903 cold imports, 155 renders and 24,224 local docs links. |

The focused and unit records use source
`16858b91e732b80d76bce9c82a671b053fa4a863230f9fa24bb46ba17efeb580`.
Lock SHA-256 remains
`eb82ee9f7c82422aa6604af2f8a6b8ba9fb9465840e7ce109c119c550d3dd7af`.
Full all-engine verification uses source
`523234ea1064c9900e657b06ed9538f26a2ae3c8c2b7202ce7bd15c5c207127b`,
with normal exit and unchanged source. Its 42 unit lifecycle records all pass
with closed servers, zero remaining sockets/processes, no ownership uncertainty
and no cleanup actions. The final status/count prose is a documentation-only
delta after that run. The docs gate still excludes 574 external or separately
built targets.

The browser contracts activate the real native file input through pointer,
Enter and Space, then supply files through Playwright's file-chooser API. They
assert Unicode names, MIME types, sizes and actual text/binary bytes, not fake
host values. They cover native and Fluid submit buttons by pointer/Enter,
custom errors across a live locale change, silent reset and same-file reselection,
single replacement, multiple append and same-chooser multi-selection, canonical
event origin/count/data, keyboard removal focus, disabled omission and reconnect.
DSD checks retain the server root, hidden native input and visible drop zone.
Console/page errors and the existing strict warning classifier remain enabled;
no retries, increased deadlines or new allowances are introduced.

Three added unit cases cover synchronous multipart event data, a native selection
arriving after disable and preservation of consumer-directed focus. The existing
Space case now asserts release timing. An old single-replacement test title no
longer falsely claims it also tests multiple append; browser contracts cover that.

## Boundaries still open

This is not OS-native file-dialog UI, actual HTTP multipart transport, manual
assistive-technology, theme/contrast or whole-component certification. File
selection before registration, reload/history restoration and native disabled
fieldset inheritance are not covered. The existing unnamed-control fallback
key `file` is unchanged and still needs an explicit native-parity decision and
regression contract. Localized file-size formatting remains part of the broader
localization audit. There is no read-only API on this component.

The component-authoring and accessibility guidance informed visible validation
focus, keyboard activation, meaningful submitted data and the evidence boundaries.
No owner sign-off or stable promotion is implied.

Live Chromium Storybook inspection after the native-button repair measured the
picker at 420×132 CSS pixels with 24px padding and a 2px dashed border. Keyboard
focus remains on the visible native button, whose measured ring is 2px with a
2px offset; the hidden file input remains at tabindex -1. The screenshot and
measurements validate this one default story, not every theme or state.
