# Radio-group native form and SSR contract, 26 August 2026

## Outcome

Radio-group now has explicit client-rendered and declarative-shadow-DOM form
contracts across Chromium, Firefox and WebKit. Required native form-focus
coverage advances from 13/16 to 14/16. Date-range-picker and scheduler remain.

## Reproduced failures and repairs

- Required submission had no validation anchor. Empty groups now focus the first
  enabled radio; custom errors focus the selected radio.
- `fluid-change` fired before `ElementInternals` synchronized the new value.
  Event listeners now observe canonical FormData immediately.
- Disabling or removing a selected light-DOM radio retained a stale group value,
  checked state and form entry. A bounded observer now reconciles option
  membership, `disabled` and `value` changes without emitting synthetic user
  events.
- Fieldset-disabled propagation removed authored disabled state when re-enabled.
  The group now preserves and restores each option's original state.
- When all options are disabled or removed, native required submission could not
  focus any target and logged a browser error. The group host becomes the sole
  fallback tab/validation target only in that impossible-selection state; normal
  groups retain their child roving tab stop.

## Passing evidence

- Focused Playwright: 18/18 across three engines and both client/DSD modes.
  Coverage includes native and Fluid submitters by pointer and keyboard,
  first-disabled focus, custom validity, click, Space and arrows, roving state,
  synchronous events/FormData, selected-option disable/removal, reset, fieldset
  propagation, no-enabled fallback and original server radio/root identity.
- Focused component tests: 19/19 per engine, 57 executions total, with normal
  lifecycle-supervisor shutdown.
- Integrated pinned Linux SSR/hydration gate: 168/168 in 3.9 minutes, normal exit,
  after regenerating the 155-element catalog and 28 isolated form fixtures.

## Limits

This slice does not certify pre-registration radio-group state adoption, every
dynamic asynchronous option-loading policy, visual themes, fluent-locale quality
or manual assistive-technology behavior. It does not replace the coordinated full
workspace checkpoint planned after the native-focus batch.
