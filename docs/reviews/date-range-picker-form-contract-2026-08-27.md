# Date-range-picker native form and SSR contract, 27 August 2026

## Outcome

Date-range-picker now has explicit client-rendered and declarative-shadow-DOM
form contracts across Chromium, Firefox and WebKit. Required native form-focus
coverage advances from 14/16 to 15/16. Scheduler is the final remaining control.

The interaction policy is explicit: invalid typeable fields retain focus on the
text input, while invalid non-typeable fields open the chooser and move focus
into its dialog. Cancel returns focus without committing draft state; Apply is
the only calendar path that commits a complete range.

## Reproduced failures and repairs

- Required submission had no native validation anchor and the host did not
  delegate focus in client or emitted DSD roots. The rendered text input is now
  the anchor; non-typeable focus subsequently follows the documented dialog
  policy.
- `fluid-change` fired before the canonical interval reached
  `ElementInternals`. Event observers now see the same `start/end` value in
  FormData synchronously.
- Restored browser form state had no interval parser. Canonical ISO intervals
  now restore the committed start, end, displayed text and form value together.
- Opening seeded reactive draft/view state from `updated()`, producing a second
  post-update render and Lit warning. Draft preparation now happens before the
  open render; top-layer and focus work remains post-render.

## Passing evidence

- Focused Playwright: 18/18 across three engines and both client/DSD modes.
  Coverage includes native and Fluid submitters by pointer and keyboard,
  typeable/non-typeable focus policy, custom validity, an incomplete calendar
  draft with disabled Apply, Cancel preservation, Apply commit, synchronous
  events/FormData, typed ISO input, valid submission, reset and original dialog,
  calendar and shadow-root identity.
- Focused component tests: 20/20 per engine, 60 executions total, with normal
  lifecycle-supervisor shutdown.
- Integrated pinned-Linux SSR/hydration gate: 186/186 in 4.4 minutes, followed by
  an exact-source 204/204 gate in 5.0 minutes after scheduler joined the inventory.

## Limits

This slice does not certify every locale parser ambiguity, arbitrary min/max
mutation, pre-registration range adoption, history/autocomplete behavior,
visual themes, mobile virtual keyboards or manual assistive-technology behavior.
The final incomplete-draft assertion is included in the later exact-source
204-case integrated gate. This slice does not
replace the coordinated full-workspace checkpoint planned after the complete
native-focus batch.
