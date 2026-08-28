# Stable-candidate reconnect and recovery matrix — 2026-08-27

## Outcome

A dedicated browser fixture now exercises reconnect and recovery depth for a
representative subset of the proposed stable candidates in
`quality/certification-scope.json`:

- forms: `fluid-input`;
- overlays/disclosures: `fluid-details`;
- navigation: `fluid-tabs`, `fluid-tab`, and `fluid-tab-panel`.

The final matrix passed **9/9** contracts across Chromium, Firefox, and
Playwright WebKit. Every contract requires a registered custom-element
constructor, a real upgraded host and a shadow root. Page exceptions, console
errors, unexpected warnings, failed requests, and HTTP error responses fail the
run.

This is representative depth for five stable candidates, not exhaustive
catalog coverage, manual assistive-technology testing, native Safari/mobile
certification, or a maturity promotion.

## Executable contracts

`apps/ssr-tests/recovery.html` and `src/recovery-client.ts` form a small Vite
fixture that imports only the selected definitions. The Playwright contract in
`tests/stable-candidate-recovery.spec.ts` verifies:

- Input retains the authored value, native input identity, FormData value, and
  public state through disconnect/reconnect. Disabled and read-only transitions
  reach the native control. Empty required state becomes invalid, then a real
  focused edit recovers validity and FormData with exactly one `fluid-input`
  and one `fluid-change`, both carrying `{ value: "recovered" }`.
- Details opens from a real keyboard event, reconnects without an extra event,
  remains inert while disabled, and then closes from Space. The exact toggle
  ledger is `[true, false]` and `aria-expanded` follows public state.
- Tabs first changes from alpha to beta, then removes the selected beta
  tab-panel pair and recovers to alpha. A gamma pair is added, the same host is
  disconnected/reconnected, and one ArrowRight moves focus and value to gamma.
  The exact change ledger is `["beta", "alpha", "gamma"]`, guarding duplicate
  reconnect listeners as well as dynamic-child recovery.

No selected candidate exposes a component-owned asynchronous error state, so
the overlay/disclosure case covers open-to-disabled-to-close recovery without
claiming a synthetic error-path certification.

## Reproduced defects and repairs

The first three-engine run passed Input and Details but failed Tabs in every
engine: after removing the selected beta pair, `value` remained stale at
`"beta"`. `syncSelection()` only selected a fallback when `value` was empty. It
now chooses the first available non-disabled tab-panel pair whenever the current
value no longer resolves.

The second run passed functional recovery but failed the clean-console gate in
every engine. Initial Tabs auto-selection assigned `value` from
`firstUpdated()`, causing Lit's change-in-update warning. Initial fallback now
runs from `willUpdate()`; child selection and ARIA synchronization remain in the
existing update flow, and mount still emits no public `fluid-change`.

The failed and passing outcomes are retained in
`apps/ssr-tests/evidence/stable-candidate-recovery-2026-08-27.json` rather than
being replaced by the final green count.

## Verification

- Recovery matrix: **9/9 passed**, three cases in each of Chromium, Firefox,
  and WebKit; direct Vite process exited through explicit cleanup.
- Focused Tabs component suite: **16/16 passed in each engine**, including the
  causal selected-pair removal guard, with clean supervised runner lifecycle.
- Components and SSR-test TypeScript: exit 0.
- Scoped ESLint, Prettier, JSON parsing, and `git diff --check`: exit 0.
- No localization, visual baselines, framework fixtures, workflows, security
  state, manifests, dependency state, budgets, or lockfiles were changed.
