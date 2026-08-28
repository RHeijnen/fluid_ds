# Fluid quality inventory

`component-quality.json` is a generated snapshot of the production-readiness
coverage for every published `fluid-*` element. It is generated from component
definitions, tests, stories, documentation, the visual-regression suite, and
the SSR gate.

Regenerate it after changing any of those surfaces:

```sh
pnpm quality:report
```

CI runs `pnpm check:quality` and fails when the checked-in report is stale or a
published component is missing a test, story, maturity classification,
required unit accessibility audit, browser accessibility fixture, or SSR
render fixture.

Catalog-wide SSR rendering and dedicated browser accessibility coverage are
blocking. Every element also has a reviewed interaction classification in
`interaction-classification.json`. Interactive and composite elements form the
true interaction denominator; presentational and helper elements do not.

Storybook interaction coverage is protected by a non-decreasing ratchet, and a
stable interactive component cannot omit its interaction contract. The report
publishes required, covered, missing, and percentage values so story presence
cannot be confused with user-flow coverage. It also publishes interaction
coverage against the entire 155-element catalog, so the reviewed applicability
denominator remains visible and auditable. Broader interaction depth and visual
state completeness remain reported until their maturity gates are met.

Exceptions live in `exceptions.json`. An exception requires a component tag,
reason, issue, owner, and review date. Expired or malformed exceptions fail the
quality check.

## Certification baseline

`certification-scope.json` records proposed stable candidates, not public maturity
promotions. `check:quality` also checks that candidates and maturity records refer
to the exact published catalog. Current public labels remain in `maturity.json`.

The source inventory describes fixture attribution, not successful execution or
scenario completeness. The 2026-08-26 audit found 13 browser-accessibility
attributions whose selected story did not actually contain the named element.
See `baselines/2026-08-26.md` and `defects.md` before making coverage claims.
The [Section 2 follow-up](baselines/2026-08-26-section-2.md) records the repair:
155 real catalog audits passed, with separate negative tests protecting fixture
integrity. See [the browser gate guide](../apps/a11y/README.md) for story overrides
and setup actions. This does not certify all states or browser/AT combinations.

Record an existing gate without altering its assertions:

```sh
node scripts/record-readiness-evidence.mjs quality corepack pnpm check:quality
```

Each invocation retains command, timestamps, exit status, environment, source
fingerprints before and after, lockfile hash, and console output in a unique
`quality/evidence/` directory. Raw output is local and ignored by Git; curated
baseline summaries live in `quality/baselines/`. A failed attempt is retained,
not overwritten by a later successful rerun. An interrupted `running` record is
not a pass. Source changes during a run are flagged and disqualify it as an
immutable release-candidate certification result.

The fixture-presence audit uses the built Storybook at port 6010 by default:

```sh
pnpm --filter @fluid-ds/storybook exec http-server storybook-static -p 6010 -a 127.0.0.1 -s -c-1
node scripts/record-readiness-evidence.mjs fixture-presence node scripts/audit-storybook-fixtures.mjs
```
