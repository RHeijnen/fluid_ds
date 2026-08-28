# SSR pre-registration state-adoption inventory, 27 August 2026

## Honest baseline

The published catalog contains 22 form-associated custom elements. Fourteen
have a native state surface that a user can edit in declarative shadow DOM
before the element is defined. Only `fluid-input` and `fluid-checkbox` currently
reconcile those edits into host properties, native validity and FormData without
synthetic events.

The initial baseline was therefore **2/14 applicable elements supported
(14.3%)**, or **2/22 across the full form-associated catalog (9.1%)**, with
**12 applicable gaps**. The direct-state tranche added masked-input,
number-input, slider, switch, textarea and typeahead; the composite tranche then
added color-picker, date-picker, date-range-picker, OTP, tag-input and
time-picker. The live matrix is now **14/14 applicable (100%)** with **zero
applicable gaps**. The other eight
entries are not credited: they have no editable native
surface before definition, or expose only a hidden file input whose visible
activation depends on component listeners.

The machine-readable source is
[`quality/ssr-state-adoption.json`](../../quality/ssr-state-adoption.json). Its
guard independently derives all form-associated tags from the 14 canonical
manifests, requires an exact sorted inventory, and prevents unsupported entries
from carrying passing evidence.

## Completed composite contracts

| Contract shape                 | Elements                                                                                  | Adopted behavior                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Parsed display/canonical value | `fluid-date-picker`, `fluid-date-range-picker`, `fluid-time-picker`, `fluid-color-picker` | Preserves display drafts separately from canonical date/time state; color text follows the component's normalization contract. |
| Multiple native fields         | `fluid-otp`                                                                               | Combines and sanitizes captured boxes without inventing auto-advance, input or completion events.                              |
| Draft distinct from form value | `fluid-tag-input`                                                                         | Preserves uncommitted text as reactive draft state while leaving committed tag-array FormData unchanged.                       |

Both tranches are covered by component-package and delayed-registration
Playwright tests that
assert native state, host state, FormData, validity, deep focus/selection where
supported, and zero native or Fluid events during restoration.

## Explicitly unsupported pre-definition edits

`fluid-file-input` and `fluid-signature-pad` contain hidden file inputs, but
their visible activation surfaces require registered event listeners. Radio
group, range slider, rating, select, transfer and scheduler are custom
interactions with no independently editable native control. They remain in the
catalog inventory with concrete rationale and receive no adoption credit.

This boundary concerns user state entered after server HTML arrives but before
definition. It does not waive their ordinary hydrated behavior, form restore
callbacks, native focus contracts, reload behavior or accessibility testing.

## Verification

- Components package: 1,825/1,825 tests pass in each of Chromium, Firefox and
  WebKit after the direct and composite adapter tranches.
- Full hydration spec: 45/45 checks pass across Chromium, Firefox and WebKit.
- Integrated SSR/browser suite: 213/213 checks pass across all three engines in
  5.2 minutes with strict page, console, hydration and server-node gates.
- The first expanded integrated attempt reached 198/213 with no assertion
  failure before the former 300-second suite deadline. It remains a failed
  preflight. The serial 213-case suite now has a 420-second global bound; its
  per-test and server-startup limits remain 60 seconds.
- Exact post-batch full-workspace checkpoint: `FLUID_BROWSERS=all pnpm verify`
  passes 6,978 unit executions across 42 package/engine runs, 18 builds, 1,903
  isolated cold imports, all 155 server renders, a 136-page docs build and
  24,224 checked local links. The SSR renderer itself is held at 100% line,
  branch and function coverage.
