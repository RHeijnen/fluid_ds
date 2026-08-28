# Complete automated accessibility regression — 2026-08-27

## Outcome

The current synchronized Linux source passes the complete existing browser
accessibility suite: **642/642**, comprising **214 cases in each of Chromium,
Firefox, and Playwright WebKit**. The run used zero retries and reported no
skipped or flaky cases. It includes 465 catalog axe audits, the 18 stable-
candidate environment executions, three Dialog story lifecycle executions,
and the established keyboard, focus, target-size, form, navigation, media,
editing, parser, spatial, table, and fixture-presence contracts.

Additional disjoint matrices also passed:

- visual fixture, upgraded-host, lifecycle, and real keyboard-focus guards:
  **51/51** across the three engines;
- both stable-candidate reconnect/recovery cohorts: **18/18** across the three
  engines;
- fixture-selection and Dialog story-structure guards: **11/11**.

The fresh Storybook production build and pinned local-font check passed before
the browser run. The preview/test servers exited normally after their runners.

## Retained failure and causal repair

The first complete run retained **639 passed / 3 failed of 642**: the same
parser interaction failed once per engine. The product now exposes grammatical
English accessible text, `1 duplicate removed` and `Import 2 rows`, while the
test still expected the legacy placeholders `1 duplicate(s) removed` and
`Import 2 row(s)`.

Only `apps/a11y/tests/parser-interactions.spec.ts` changed. The assertions now
match the actual English accessible names without accepting both old and new
forms or changing localization. After the first assertion correction, a
focused run retained the second mismatch as **6 passed / 3 failed of 9**. After
the complete correction the focused parser file passed **9/9**, followed by the
fresh **642/642** full rerun.

The raw red and green Playwright JSON are retained alongside
`apps/a11y/evidence/accessibility-regression-summary-2026-08-27.json`.

## Verification and boundaries

- Linux TypeScript checks for `apps/a11y`, `apps/visual-regression`, and
  `apps/ssr-tests`: exit 0.
- Scoped ESLint, Prettier, JSON parsing, and `git diff --check`: exit 0.
- Catalog axe cases reject page exceptions and console errors; the environment,
  Dialog, and recovery matrices additionally reject their configured console
  warnings, failed requests, and HTTP error responses. Existing interaction
  files retain their own diagnostics rather than being presented as a new
  universal network-observer certification.
- Storybook emitted its existing third-party `eval` and large-chunk build
  warnings. These are build diagnostics, not browser-page console failures.
- Playwright WebKit is not native Safari, mobile-device, manual visual, or
  manual assistive-technology certification.
- No localization sources, visual baselines, framework fixtures, workflow or
  security state, manifests, dependency state, lockfile, plan/handoff, or
  defect ledger changed in this tranche.
