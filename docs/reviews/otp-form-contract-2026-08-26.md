# OTP native form and SSR contract, 26 August 2026

## Outcome

OTP now has explicit client-rendered and declarative-shadow-DOM contracts across
Chromium, Firefox and WebKit. Required native form-focus coverage advances from
12/16 to 13/16. Radio-group, date-range-picker and scheduler remain.

The repair is deliberately component-specific. It does not add a blanket base
class focus policy or claim broader pre-hydration state adoption.

## Reproduced failures and repairs

- The OTP shadow root did not delegate focus, including in emitted DSD. The
  component now opts into `delegatesFocus` and both runtime and server markup are
  asserted.
- Required partial codes always anchored native validation to box 1. Validity now
  targets the first missing box while public `focus()` keeps the same policy.
- `fluid-input` and `fluid-complete` exposed their new value before
  `ElementInternals` updated the form value. FormData is synchronized before either
  public event fires.
- Runtime length clamping and invalid presentation mutated reactive state from
  `updated()`, producing an unallowlisted Lit render-cycle warning. Both values are
  derived before rendering; DOM-dependent validity anchoring remains post-render.

## Passing evidence

- Focused Playwright: 18/18 across three engines, covering client and DSD modes,
  empty and partial invalid submission, pointer/keyboard submitters, custom-error
  preservation through a Dutch locale change, sequential typing, Backspace,
  actual browser clipboard paste, canonical events/FormData, reset, disabled
  exclusion, length shrink, reconnect and original DSD box identity.
- Focused component tests: 30/30 per engine, 90 executions total, with normal
  lifecycle-supervisor shutdown.
- Integrated pinned Linux SSR/hydration gate: 150/150 in 4.1 minutes with normal
  exit after regenerating both the 155-element catalog fixture and 26 isolated
  form-focus fixtures.
- The first Windows integrated attempt used a stale generated catalog fixture and
  is invalid as product evidence. A synchronized rerun reached 140/150 with zero
  assertion failures before the unchanged 300-second aggregate watchdog stopped
  the final ten WebKit cases. That environment result remains a timeout; no retry,
  assertion or warning allowance was added.

## Limits

This slice does not certify pre-registration OTP value/FormData adoption,
browser or password-manager one-time-code autofill, mobile virtual keyboards,
OS clipboard UI, visual themes, fluent-locale quality or manual screen-reader
behavior. It also does not replace a later coordinated full workspace checkpoint.
