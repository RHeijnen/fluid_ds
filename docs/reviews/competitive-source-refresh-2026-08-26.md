# Competitive source refresh, 2026-08-26

This is preparation for the next competitive review, not a grade, an executed
competitor benchmark, or a claim that Fluid is production-ready. Official public
documentation was inspected while the current implementation gates were running.
Do not treat marketing claims, contribution guidance and measured runtime results
as interchangeable evidence. Recheck sources and exact package versions before
the final comparison.

## Web Awesome

The current SSR guide labels the feature experimental. It describes DSD and
hydration setup, prioritizes initial layout over full functionality without
JavaScript, documents slot-presence hints, and lists unresolved server-language
and direction inheritance limits. This is materially more than import safety;
Fluid must be compared against actual server-rendered and hydrated behavior.
[Official SSR guide](https://webawesome.com/docs/ssr).

The contribution guide says component tests run in both hydrated and client-only
modes. This is a useful depth target for Fluid's largely client-rendered unit
suite, not proof that every competitor behavior passes in every browser.
[Official testing guidance](https://webawesome.com/docs/resources/contributing).

The localization guide documents regional/base/English fallback and reactive
registration. It also says component-level language overrides must be placed
on the component, not an arbitrary ancestor. Fluid's measured browser ancestor
and shadow-host inheritance is a potentially useful distinction; comparative
superiority still needs equivalent executed fixtures rather than documentation
alone. Neither product's dictionary mechanism implies translated application
content or fluent-language certification.
[Official localization guide](https://webawesome.com/docs/localization).

The changelog records SSR as introduced experimentally in 3.8.0 and a server-only
aggregate entry in 3.9.0, alongside subsequent hydration and serialization fixes.
Its component/feature maturity labels are distinct from catalog size. Avoid
reusing an older review that equated SSR support with guarded browser imports.
[Official changelog](https://webawesome.com/docs/resources/changelog).

## Spectrum Web Components

The language-resolution controller documents DOM and shadow-boundary language
tracking, reactive changes and Intl validation. Its ambient browser fallback
policy differs from Fluid's new deterministic formatter fallback. Policy
differences should be described as tradeoffs unless an actual supported contract
is violated.
[Official language-resolution guide](https://opensource.adobe.com/spectrum-web-components/tools/language-resolution/).

The support policy names recent desktop browser versions and explicitly limits
mobile certification despite responsive layouts. It also defines public APIs
and semantic-versioning commitments. Fluid needs similarly precise, evidenced
boundaries; Windows Playwright WebKit alone is not macOS Safari or mobile-device
certification.
[Official support policy](https://opensource.adobe.com/spectrum-web-components/support-and-compatibility/).

## Final review still required

Use the same observable fixtures for native form submission/focus, retained DSD
nodes, pre-hydration edits, locale changes, framework event payloads and keyboard
behavior. Record versions, operating systems, fixture applicability and failures.
Do not infer a zero or a pass from a feature not documented in this small source
sample. Separate component breadth, implementation capability, executed evidence,
release maturity and human accessibility/translation sign-off. Fluid's remaining
SSR warnings, teardown failures, partial typed events, missing visual approvals
and open localization inventory preclude a whole-product production-ready grade.
